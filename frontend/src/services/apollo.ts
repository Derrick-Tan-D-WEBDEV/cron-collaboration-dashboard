import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: process.env.NODE_ENV === "development" ? "http://localhost:5001/graphql" : "/graphql",
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});
