export const typeDefs = `#graphql

  enum FilterType {
    SENTIMENT
    SOURCE_TIER
    REGION
    LANGUAGE
    DATE_RANGE
  }

  enum NarrativeInterval {
    L7D
    L30D
    L90D
  }

  enum Sentiment {
    POSITIVE
    NEUTRAL
    NEGATIVE
  }

  enum SearchStatus {
    ACTIVE
    ARCHIVED
    DRAFT
  }

  type Search {
    id: ID!
    name: String!
    keywords: [String!]!
    startDate: String
    endDate: String
    status: SearchStatus!
    createdAt: String!
    updatedAt: String!
    filters: [FilterPreset!]!
    collection: Collection
    parents: [Search!]!
    derivatives: [Search!]!
    articles(offset: Int): [Article!]!
  }

  type FilterPreset {
    id: ID!
    name: String!
    type: FilterType!
    value: String!
    searches: [Search!]!
  }

  type Collection {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    searches: [Search!]!
    totalArticles: Int!
    sentimentSummary: SentimentBreakdown
  }

  type Article {
    id: ID!
    headline: String!
    body: String!
    url: String!
    publishedAt: String!
    sentiment: Sentiment!
    source: Source!
    author: Author
    topics: [Topic!]!
  }

  type Source {
    id: ID!
    name: String!
    domain: String!
    tier: Int!
    region: String!
    language: String!
  }

  type Author {
    id: ID!
    name: String!
    byline: String
  }

  type Topic {
    id: ID!
    label: String!
    category: String!
    coOccursWith: [TopicCoOccurrence!]!
  }

  type TopicCoOccurrence {
    topic: Topic!
    frequency: Int!
  }

  type LineageNode {
    search: Search!
    """
    Distance from the requested node. Positive values indicate ancestors
    (how many hops above); negative values indicate descendants (how many
    hops below). The requested node itself has depth 0.
    """
    depth: Int!
    isRoot: Boolean!
  }

  type SearchLineage {
    root: Search
    nodes: [LineageNode!]!
    totalNodes: Int!
    maxDepth: Int!
    orphanCount: Int!
  }

  type DailyVolume {
    date: String!
    volume: Int!
    positive: Int!
    neutral: Int!
    negative: Int!
  }

  type SentimentBreakdown {
    positive: Int!
    neutral: Int!
    negative: Int!
    total: Int!
    positivePercent: Float!
    neutralPercent: Float!
    negativePercent: Float!
    periodShift: Float
  }

  type TopSourceCount {
    source: Source!
    count: Int!
  }

  type TopTopicCount {
    topic: Topic!
    count: Int!
  }

  type NarrativeShift {
    type: String!
    title: String!
    body: String!
    timestamp: String!
    live: Boolean!
  }

  type NarrativeTrends {
    searchId: ID!
    searchName: String!
    interval: String!
    volumeOverTime: [DailyVolume!]!
    sentimentBreakdown: SentimentBreakdown!
    topSources: [TopSourceCount!]!
    topTopics: [TopTopicCount!]!
    totalArticles: Int!
    narrativeShifts: [NarrativeShift!]!
  }

  type VolumeProjection {
    estimatedVolume: Int!
    topSources: [TopSourceCount!]!
    note: String!
  }

  type DeleteResult {
    id: ID!
    success: Boolean!
    message: String
  }

  input CreateSearchInput {
    name: String!
    keywords: [String!]!
    startDate: String
    endDate: String
    status: SearchStatus
    collectionId: ID
  }

  input UpdateSearchInput {
    name: String
    keywords: [String!]
    startDate: String
    endDate: String
    status: SearchStatus
  }

  input ForkSearchInput {
    parentIds: [ID!]!
    name: String!
    keywords: [String!]
    collectionId: ID
  }

  input CreateFilterPresetInput {
    name: String!
    type: FilterType!
    value: String!
  }

  input UpdateFilterPresetInput {
    name: String
    type: FilterType
    value: String
  }

  input CreateCollectionInput {
    name: String!
    description: String
  }

  input UpdateCollectionInput {
    name: String
    description: String
  }

  type Query {
    search(id: ID!): Search
    searches(collectionId: ID, keyword: String, status: SearchStatus): [Search!]!
    searchLineage(id: ID!): SearchLineage!
    filterPreset(id: ID!): FilterPreset
    filterPresets: [FilterPreset!]!
    collection(id: ID!): Collection
    collections: [Collection!]!
    source(id: ID!): Source
    sourceArticles(sourceId: ID!, searchId: ID, limit: Int, offset: Int): [Article!]!
    article(id: ID!): Article
    articles(searchId: ID, sentiment: Sentiment, sourceId: ID): [Article!]!
    topics: [Topic!]!
    narrativeTrends(searchId: ID!, interval: NarrativeInterval): NarrativeTrends!
    volumeProjection(keywords: [String!]!): VolumeProjection!
  }

  type Mutation {
    createSearch(input: CreateSearchInput!): Search!
    updateSearch(id: ID!, input: UpdateSearchInput!): Search!
    deleteSearch(id: ID!): DeleteResult!
    """
    DD-4: Signature deviates from PRD Section 5 (positional parentId + name args).
    Uses ForkSearchInput instead to support multi-parent DAG forks (DD-1).
    A single-parent fork is expressed as parentIds: [id].
    """
    forkSearch(input: ForkSearchInput!): Search!
    createFilterPreset(input: CreateFilterPresetInput!): FilterPreset!
    updateFilterPreset(id: ID!, input: UpdateFilterPresetInput!): FilterPreset!
    deleteFilterPreset(id: ID!): DeleteResult!
    applyFilterToSearch(filterId: ID!, searchId: ID!): Search!
    removeFilterFromSearch(filterId: ID!, searchId: ID!): Search!
    createCollection(input: CreateCollectionInput!): Collection!
    updateCollection(id: ID!, input: UpdateCollectionInput!): Collection!
    deleteCollection(id: ID!): DeleteResult!
    addSearchToCollection(searchId: ID!, collectionId: ID!): Collection!
    removeSearchFromCollection(searchId: ID!, collectionId: ID!): Collection!
  }
`;
