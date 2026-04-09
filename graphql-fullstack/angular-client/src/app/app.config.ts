import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClientOptions, InMemoryCache, split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import { routes } from './app.routes';

function apolloFactory(httpLink: HttpLink): ApolloClientOptions<unknown> {
  const http = httpLink.create({ uri: 'http://localhost:4000/graphql' });

  const authLink = setContext((_, { headers }) => ({
    headers: { ...headers, authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
  }));

  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors?.some((e) => e.extensions?.['code'] === 'UNAUTHENTICATED')) {
      localStorage.removeItem('token');
    }
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: 'ws://localhost:4000/graphql',
      connectionParams: () => ({ authorization: localStorage.getItem('token') ?? '' }),
    })
  );

  const splitLink = split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    from([errorLink, authLink, http])
  );

  return {
    link: splitLink,
    cache: new InMemoryCache(),
    defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(ApolloModule),
    {
      provide: APOLLO_OPTIONS,
      useFactory: apolloFactory,
      deps: [HttpLink],
    },
  ],
};
