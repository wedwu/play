/**
 * @auth directive — declarative field-level authentication and authorization.
 *
 * Usage in schema:
 *   directive @auth(requires: Role = MEMBER) on FIELD_DEFINITION | OBJECT
 *
 * Examples:
 *   type Query {
 *     users: [User!]! @auth(requires: ADMIN)   # ADMIN only
 *     me: User                                  # no directive = public
 *     projects: ProjectConnection! @auth        # defaults to MEMBER
 *   }
 *
 * How it works:
 *   mapSchema walks every field in the built schema. When it finds a field
 *   annotated with @auth it wraps the existing resolver (or defaultFieldResolver)
 *   with an auth check that runs before the original logic. The original resolver
 *   is only called if the check passes — otherwise a GraphQLError is thrown.
 *
 * This keeps individual resolvers clean: they can assume ctx.userId is present
 * and ctx.userRole meets the requirement without repeating guard calls.
 */
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils';
import { GraphQLError } from 'graphql';
import { Context } from '../context';
import { Role } from '../types';

const DIRECTIVE_NAME = 'auth';

const ROLE_RANK: Record<Role, number> = {
  [Role.ADMIN]: 3,
  [Role.MEMBER]: 2,
  [Role.VIEWER]: 1,
};

export const authDirectiveTypeDefs = /* GraphQL */ `
  directive @auth(
    """Minimum role required to access this field. Defaults to MEMBER."""
    requires: Role = MEMBER
  ) on FIELD_DEFINITION | OBJECT
`;

export function applyAuthDirective(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName, schema) => {
      // Check for @auth on the field itself
      let directive = getDirective(schema, fieldConfig, DIRECTIVE_NAME)?.[0];

      // Fall back to @auth on the parent type
      if (!directive) {
        const type = schema.getType(typeName);
        if (type) {
          directive = getDirective(schema, type, DIRECTIVE_NAME)?.[0];
        }
      }

      if (!directive) return fieldConfig;

      const requires: Role = (directive['requires'] as Role) ?? Role.MEMBER;
      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        resolve(source, args, context: Context, info) {
          const { userId, userRole } = context;

          if (!userId) {
            throw new GraphQLError(
              `Field '${info.fieldName}' requires authentication.`,
              { extensions: { code: 'UNAUTHENTICATED' } }
            );
          }

          if (!userRole || ROLE_RANK[userRole] < ROLE_RANK[requires]) {
            throw new GraphQLError(
              `Field '${info.fieldName}' requires role ${requires}. You have ${userRole ?? 'none'}.`,
              { extensions: { code: 'FORBIDDEN', requires, actual: userRole } }
            );
          }

          return resolve(source, args, context, info);
        },
      };
    },
  });
}
