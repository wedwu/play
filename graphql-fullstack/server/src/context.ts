/**
 * Per-request GraphQL context.
 *
 * Apollo Server calls `buildContext` once per operation (query, mutation, or
 * subscription). The returned object is injected as the third argument into
 * every resolver in the tree for that operation.
 *
 * Design decisions:
 * - DataLoaders are created fresh per request so their cache is scoped to a
 *   single operation. Sharing loaders across requests would serve stale data.
 * - The single `pubsub` instance IS shared across requests so that mutations
 *   and subscription listeners can communicate through it.
 * - Auth is extracted once here rather than in every resolver, keeping
 *   resolver bodies focused on business logic.
 */
import { Request } from 'express';
import { verifyToken, extractTokenFromHeader } from './utils/auth';
import { UserAPI } from './datasources/UserAPI';
import { ProjectAPI } from './datasources/ProjectAPI';
import { TaskAPI, CommentAPI, TagAPI } from './datasources/TaskAPI';
import { createLoaders, Loaders } from './loaders';
import { PubSub } from 'graphql-subscriptions';
import { Role } from './types';

/** Singleton PubSub — shared so mutations can publish to subscription listeners. */
export const pubsub = new PubSub();

export interface Context {
  userId?: string;
  userRole?: Role;
  dataSources: {
    users: UserAPI;
    projects: ProjectAPI;
    tasks: TaskAPI;
    comments: CommentAPI;
    tags: TagAPI;
  };
  loaders: Loaders;
  pubsub: typeof pubsub;
}

/**
 * Build the GraphQL context for a single request.
 *
 * - Extracts and verifies the JWT from the `Authorization` header.
 * - On invalid/missing token, `userId` and `userRole` are undefined — resolvers
 *   that require auth will throw via `requireAuth()`.
 * - Instantiates fresh DataSource and DataLoader instances so caches never
 *   leak between requests.
 */
export function buildContext({ req }: { req: Request }): Context {
  const token = extractTokenFromHeader(req.headers.authorization);

  let userId: string | undefined;
  let userRole: Role | undefined;

  if (token) {
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
      userRole = payload.role;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  return {
    userId,
    userRole,
    dataSources: {
      users: new UserAPI(),
      projects: new ProjectAPI(),
      tasks: new TaskAPI(),
      comments: new CommentAPI(),
      tags: new TagAPI(),
    },
    loaders: createLoaders(),
    pubsub,
  };
}
