import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// VITE_API_URL — Railway production URL (set in Vercel/Railway env vars).
// Falls back to VITE_GRAPHQL_URL for local dev, then the default dev server.
const graphqlUri =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_GRAPHQL_URL ??
  'http://localhost:4000';

const httpLink = new HttpLink({
  uri: graphqlUri,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Search:       { keyFields: ['id'] },
      FilterPreset: { keyFields: ['id'] },
      Collection:   { keyFields: ['id'] },
      Article:      { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
