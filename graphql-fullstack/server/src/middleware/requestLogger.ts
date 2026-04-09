/**
 * requestLogger — Apollo Server plugin that logs every GraphQL operation.
 *
 * Captures:
 *   - Operation name and type (query / mutation / subscription)
 *   - Authenticated user ID (if present)
 *   - Duration in milliseconds
 *   - Any GraphQL or network errors
 *
 * Plugs into Apollo's request lifecycle hooks so timing is accurate from the
 * moment the server receives the parsed document to when the response is sent.
 */
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Context } from '../context';

type PluginContext = Context;

function timestamp(): string {
  return new Date().toISOString();
}

function formatDuration(startMs: number): string {
  const ms = Date.now() - startMs;
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

export function requestLoggerPlugin(): ApolloServerPlugin<PluginContext> {
  return {
    async requestDidStart(requestContext): Promise<GraphQLRequestListener<PluginContext>> {
      const startedAt = Date.now();
      const { request, contextValue } = requestContext;
      const operationName = request.operationName ?? '(anonymous)';
      const userId = contextValue?.userId ?? 'unauthenticated';

      return {
        async didResolveOperation({ operation }) {
          const opType = operation?.operation ?? 'unknown';
          console.log(
            `[${timestamp()}] ▶ ${opType.toUpperCase()} ${operationName} | user=${userId}`
          );
        },

        async didEncounterErrors({ errors }) {
          for (const err of errors) {
            const code = err.extensions?.code ?? 'INTERNAL';
            console.error(
              `[${timestamp()}] ✖ ${operationName} | code=${code} | ${err.message}`
            );
          }
        },

        async willSendResponse() {
          console.log(
            `[${timestamp()}] ◀ ${operationName} completed in ${formatDuration(startedAt)}`
          );
        },
      };
    },
  };
}
