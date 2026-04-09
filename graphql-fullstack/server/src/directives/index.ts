/**
 * Directive barrel — exports type definitions and the single `applyDirectives`
 * function that chains all directive transforms onto the schema.
 *
 * Order matters:
 *   1. sanitize — normalizes input args before any logic runs
 *   2. auth     — rejects unauthorized requests early
 *   3. rateLimit — counts only requests that passed auth (avoids inflating
 *                  the rate counter for unauthenticated calls that would fail
 *                  anyway at the auth check)
 */
import { GraphQLSchema } from 'graphql';
import { authDirectiveTypeDefs, applyAuthDirective } from './auth.directive';
import { rateLimitDirectiveTypeDefs, applyRateLimitDirective } from './rateLimit.directive';
import { sanitizeDirectiveTypeDefs, applySanitizeDirective } from './sanitize.directive';

export { authDirectiveTypeDefs, rateLimitDirectiveTypeDefs, sanitizeDirectiveTypeDefs };

export function applyDirectives(schema: GraphQLSchema): GraphQLSchema {
  return [applySanitizeDirective, applyAuthDirective, applyRateLimitDirective].reduce(
    (s, transform) => transform(s),
    schema
  );
}
