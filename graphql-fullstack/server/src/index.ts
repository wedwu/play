import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { buildContext } from './context';
import { seedDatabase } from './datasources/db';

const PORT = process.env.PORT ?? 4000;

async function bootstrap() {
  await seedDatabase();
  console.log('Database seeded');

  const app = express();
  const httpServer = http.createServer(app);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  const wsCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract auth from WebSocket connection params
        const token = (ctx.connectionParams?.authorization as string | undefined)
          ?.replace('Bearer ', '');
        return buildContext({ req: { headers: { authorization: token ? `Bearer ${token}` : '' } } } as any);
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formattedError, error) => {
      // Hide internal errors in production
      if (process.env.NODE_ENV === 'production' && !formattedError.extensions?.code) {
        return { message: 'Internal server error' };
      }
      return formattedError;
    },
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: ['http://localhost:5173', 'http://localhost:4200'] }),
    bodyParser.json(),
    expressMiddleware(server, { context: buildContext })
  );

  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`
  ┌─────────────────────────────────────────────┐
  │   TaskFlow GraphQL Server                   │
  │                                             │
  │   GraphQL:  http://localhost:${PORT}/graphql   │
  │   Health:   http://localhost:${PORT}/health    │
  │   WS:       ws://localhost:${PORT}/graphql     │
  │                                             │
  │   Seed users:                               │
  │     admin@taskflow.dev / admin123           │
  │     bob@taskflow.dev   / member123          │
  │     carol@taskflow.dev / member123          │
  └─────────────────────────────────────────────┘
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
