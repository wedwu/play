/**
 * @rateLimit directive — per-user, per-field rate limiting.
 *
 * Usage in schema:
 *   directive @rateLimit(max: Int!, window: Int!) on FIELD_DEFINITION
 *
 * Arguments:
 *   max    — maximum calls allowed within the window
 *   window — window duration in seconds
 *
 * Examples:
 *   type Mutation {
 *     # A user can create at most 20 tasks per minute
 *     createTask(input: CreateTaskInput!): Task! @rateLimit(max: 20, window: 60)
 *
 *     # A user can add at most 30 comments per minute
 *     addComment(taskId: ID!, content: String!): Comment! @rateLimit(max: 30, window: 60)
 *   }
 *
 * How it differs from the HTTP rate limiter in rateLimiter.ts:
 *   - The HTTP limiter is per-IP and applies to every request before Apollo
 *     parses it. It protects against volumetric attacks from anonymous clients.
 *   - This directive is per-authenticated-user and per-field. It lets you set
 *     different budgets for different operations based on their cost, and it
 *     identifies users by ID rather than IP (so it works correctly behind
 *     proxies and for users on shared networks).
 *
 * Storage:
 *   Uses an in-process Map keyed by `${userId}:${typeName}.${fieldName}`.
 *   For multi-instance deployments, replace with a Redis-backed store.
 */
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils';
import { GraphQLError } from 'graphql';
import { Context } from '../context';

const DIRECTIVE_NAME = 'rateLimit';

interface Bucket {
  count: number;
  resetAt: number;
}

// Module-level store — persists for the lifetime of the process.
// Keyed by `${userId}:${typeName}.${fieldName}`.
const store = new Map<string, Bucket>();

// Prune expired buckets every 5 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}, 5 * 60_000).unref(); // unref so this timer doesn't keep the process alive

export const rateLimitDirectiveTypeDefs = /* GraphQL */ `
  directive @rateLimit(
    """Maximum number of calls allowed within the window."""
    max: Int!
    """Window duration in seconds."""
    window: Int!
  ) on FIELD_DEFINITION
`;

export function applyRateLimitDirective(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typeName, schema) => {
      const directive = getDirective(schema, fieldConfig, DIRECTIVE_NAME)?.[0];
      if (!directive) return fieldConfig;

      const max: number = directive['max'];
      const windowMs: number = directive['window'] * 1000;
      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        resolve(source, args, context: Context, info) {
          // Unauthenticated requests fall through — the @auth directive or
          // resolver-level guard handles rejection for protected fields.
          const userId = context.userId ?? `anon:${context}`;
          const key = `${userId}:${typeName}.${fieldName}`;
          const now = Date.now();

          const bucket = store.get(key);

          if (!bucket || bucket.resetAt <= now) {
            store.set(key, { count: 1, resetAt: now + windowMs });
          } else if (bucket.count >= max) {
            const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
            throw new GraphQLError(
              `Rate limit exceeded for '${fieldName}'. Try again in ${retryAfterSec}s.`,
              {
                extensions: {
                  code: 'RATE_LIMITED',
                  field: fieldName,
                  retryAfter: retryAfterSec,
                },
              }
            );
          } else {
            bucket.count++;
          }

          return resolve(source, args, context, info);
        },
      };
    },
  });
}
