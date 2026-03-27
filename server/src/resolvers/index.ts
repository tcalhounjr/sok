import { searchQueries, searchMutations, searchFieldResolvers } from './search.js';
import {
  filterPresetQueries, filterPresetMutations, filterPresetFieldResolvers,
  collectionQueries, collectionMutations, collectionFieldResolvers,
  articleQueries, articleFieldResolvers,
  sourceQueries,
  topicQueries, topicFieldResolvers,
  narrativeTrendsQuery,
  volumeProjectionQuery,
} from './others.js';

export const resolvers = {
  Query: {
    ...searchQueries,
    ...filterPresetQueries,
    ...collectionQueries,
    ...sourceQueries,
    ...articleQueries,
    ...topicQueries,
    ...narrativeTrendsQuery,
    ...volumeProjectionQuery,
  },
  Mutation: {
    ...searchMutations,
    ...filterPresetMutations,
    ...collectionMutations,
  },
  Search:       searchFieldResolvers,
  FilterPreset: filterPresetFieldResolvers,
  Collection:   collectionFieldResolvers,
  Article:      articleFieldResolvers,
  Topic:        topicFieldResolvers,
};
