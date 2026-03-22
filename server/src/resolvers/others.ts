import { runQuery, toObject } from '../neo4j/driver.js';
import { randomUUID } from 'crypto';
import {
  ApolloContext, FilterPresetNode, CollectionNode,
  ArticleNode, TopicNode, SourceNode,
  DeleteResult, NarrativeTrends, VolumeProjection,
} from '../types/index.js';

// ---------------------------------------------------------------------------
// Filter Preset
// ---------------------------------------------------------------------------

export const filterPresetQueries = {
  filterPreset: async (_: unknown, { id }: { id: string }, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (f:FilterPreset {id: $id}) RETURN f', { id });
    return records.length ? toObject(records[0].get('f')) as FilterPresetNode : null;
  },

  filterPresets: async (_: unknown, __: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (f:FilterPreset) RETURN f ORDER BY f.name');
    return records.map(r => toObject(r.get('f')) as FilterPresetNode);
  },
};

export const filterPresetMutations = {
  createFilterPreset: async (
    _: unknown,
    { input }: { input: { name: string; type: string; value: string }},
    { driver }: ApolloContext
  ) => {
    const id = randomUUID();
    const records = await runQuery(driver,
      'CREATE (f:FilterPreset {id: $id, name: $name, type: $type, value: $value}) RETURN f',
      { id, ...input });
    return toObject(records[0].get('f')) as FilterPresetNode;
  },

  updateFilterPreset: async (
    _: unknown,
    { id, input }: { id: string; input: { name?: string; type?: string; value?: string }},
    { driver }: ApolloContext
  ) => {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };
    if (input.name)  { setClauses.push('f.name = $name');   params.name  = input.name; }
    if (input.type)  { setClauses.push('f.type = $type');   params.type  = input.type; }
    if (input.value) { setClauses.push('f.value = $value'); params.value = input.value; }
    const records = await runQuery(driver,
      `MATCH (f:FilterPreset {id: $id}) SET ${setClauses.join(', ')} RETURN f`, params);
    return toObject(records[0].get('f')) as FilterPresetNode;
  },

  deleteFilterPreset: async (
    _: unknown, { id }: { id: string }, { driver }: ApolloContext
  ): Promise<DeleteResult> => {
    await runQuery(driver, 'MATCH (f:FilterPreset {id: $id}) DETACH DELETE f', { id });
    return { id, success: true, message: 'FilterPreset deleted and removed from all searches.' };
  },

  applyFilterToSearch: async (
    _: unknown,
    { filterId, searchId }: { filterId: string; searchId: string },
    { driver }: ApolloContext
  ) => {
    await runQuery(driver, `
      MATCH (s:Search {id: $searchId}) MATCH (f:FilterPreset {id: $filterId})
      MERGE (s)-[:HAS_FILTER {appliedAt: datetime()}]->(f)
    `, { searchId, filterId });
    const records = await runQuery(driver, 'MATCH (s:Search {id: $id}) RETURN s', { id: searchId });
    return toObject(records[0].get('s'));
  },

  removeFilterFromSearch: async (
    _: unknown,
    { filterId, searchId }: { filterId: string; searchId: string },
    { driver }: ApolloContext
  ) => {
    await runQuery(driver, `
      MATCH (s:Search {id: $searchId})-[r:HAS_FILTER]->(f:FilterPreset {id: $filterId}) DELETE r
    `, { searchId, filterId });
    const records = await runQuery(driver, 'MATCH (s:Search {id: $id}) RETURN s', { id: searchId });
    return toObject(records[0].get('s'));
  },
};

export const filterPresetFieldResolvers = {
  searches: async (parent: FilterPresetNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (s:Search)-[:HAS_FILTER]->(f:FilterPreset {id: $id}) RETURN s', { id: parent.id });
    return records.map(r => toObject(r.get('s')));
  },
};

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export const collectionQueries = {
  collection: async (_: unknown, { id }: { id: string }, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (c:Collection {id: $id}) RETURN c', { id });
    return records.length ? toObject(records[0].get('c')) as CollectionNode : null;
  },

  collections: async (_: unknown, __: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (c:Collection) RETURN c ORDER BY c.name');
    return records.map(r => toObject(r.get('c')) as CollectionNode);
  },
};

export const collectionMutations = {
  createCollection: async (
    _: unknown,
    { input }: { input: { name: string; description?: string }},
    { driver }: ApolloContext
  ) => {
    const id = randomUUID();
    const records = await runQuery(driver,
      'CREATE (c:Collection {id: $id, name: $name, description: $desc, createdAt: datetime()}) RETURN c',
      { id, name: input.name, desc: input.description ?? '' });
    return toObject(records[0].get('c')) as CollectionNode;
  },

  updateCollection: async (
    _: unknown,
    { id, input }: { id: string; input: { name?: string; description?: string }},
    { driver }: ApolloContext
  ) => {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };
    if (input.name)        { setClauses.push('c.name = $name');               params.name        = input.name; }
    if (input.description) { setClauses.push('c.description = $description'); params.description = input.description; }
    const records = await runQuery(driver,
      `MATCH (c:Collection {id: $id}) SET ${setClauses.join(', ')} RETURN c`, params);
    return toObject(records[0].get('c')) as CollectionNode;
  },

  deleteCollection: async (
    _: unknown, { id }: { id: string }, { driver }: ApolloContext
  ): Promise<DeleteResult> => {
    await runQuery(driver, 'MATCH (c:Collection {id: $id}) DETACH DELETE c', { id });
    return { id, success: true, message: 'Collection deleted. Member searches preserved.' };
  },

  addSearchToCollection: async (
    _: unknown,
    { searchId, collectionId }: { searchId: string; collectionId: string },
    { driver }: ApolloContext
  ) => {
    await runQuery(driver, `
      MATCH (col:Collection {id: $colId}) MATCH (s:Search {id: $srchId})
      MERGE (col)-[:CONTAINS {addedAt: datetime()}]->(s)
    `, { colId: collectionId, srchId: searchId });
    const records = await runQuery(driver, 'MATCH (c:Collection {id: $id}) RETURN c', { id: collectionId });
    return toObject(records[0].get('c')) as CollectionNode;
  },

  removeSearchFromCollection: async (
    _: unknown,
    { searchId, collectionId }: { searchId: string; collectionId: string },
    { driver }: ApolloContext
  ) => {
    await runQuery(driver, `
      MATCH (col:Collection {id: $colId})-[r:CONTAINS]->(s:Search {id: $srchId}) DELETE r
    `, { colId: collectionId, srchId: searchId });
    const records = await runQuery(driver, 'MATCH (c:Collection {id: $id}) RETURN c', { id: collectionId });
    return toObject(records[0].get('c')) as CollectionNode;
  },
};

export const collectionFieldResolvers = {
  searches: async (parent: CollectionNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (c:Collection {id: $id})-[:CONTAINS]->(s:Search) RETURN s ORDER BY s.updatedAt DESC',
      { id: parent.id });
    return records.map(r => toObject(r.get('s')));
  },
};

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const articleQueries = {
  article: async (_: unknown, { id }: { id: string }, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (a:Article {id: $id}) RETURN a', { id });
    return records.length ? toObject(records[0].get('a')) as ArticleNode : null;
  },

  articles: async (
    _: unknown,
    { searchId, sentiment, sourceId }: { searchId?: string; sentiment?: string; sourceId?: string },
    { driver }: ApolloContext
  ) => {
    let cypher = searchId
      ? 'MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)'
      : 'MATCH (a:Article)';
    const params: Record<string, unknown> = {};
    if (searchId) params.searchId = searchId;

    const conditions: string[] = [];
    if (sentiment) { conditions.push('a.sentiment = $sentiment'); params.sentiment = sentiment; }
    if (sourceId)  {
      cypher += ' MATCH (a)-[:PUBLISHED_BY]->(src:Source {id: $sourceId})';
      params.sourceId = sourceId;
    }
    if (conditions.length) cypher += ` WHERE ${conditions.join(' AND ')}`;
    cypher += ' RETURN a ORDER BY a.publishedAt DESC';

    const records = await runQuery(driver, cypher, params);
    return records.map(r => toObject(r.get('a')) as ArticleNode);
  },
};

export const articleFieldResolvers = {
  source: async (parent: ArticleNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (a:Article {id: $id})-[:PUBLISHED_BY]->(src:Source) RETURN src', { id: parent.id });
    return records.length ? toObject(records[0].get('src')) as SourceNode : null;
  },

  author: async (parent: ArticleNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (a:Article {id: $id})-[:WRITTEN_BY]->(aut:Author) RETURN aut', { id: parent.id });
    return records.length ? toObject(records[0].get('aut')) : null;
  },

  topics: async (parent: ArticleNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (a:Article {id: $id})-[:TAGGED_WITH]->(t:Topic) RETURN t', { id: parent.id });
    return records.map(r => toObject(r.get('t')) as TopicNode);
  },
};

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export const topicQueries = {
  topics: async (_: unknown, __: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (t:Topic) RETURN t ORDER BY t.label');
    return records.map(r => toObject(r.get('t')) as TopicNode);
  },
};

export const topicFieldResolvers = {
  coOccursWith: async (parent: TopicNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, `
      MATCH (t:Topic {id: $id})-[r:CO_OCCURS_WITH]-(other:Topic)
      RETURN other, r.frequency AS freq ORDER BY freq DESC LIMIT 10
    `, { id: parent.id });
    return records.map(r => ({
      topic: toObject(r.get('other')) as TopicNode,
      frequency: r.get('freq').toNumber(),
    }));
  },
};

// ---------------------------------------------------------------------------
// Narrative Trends — DD-3: live Cypher aggregation
// ---------------------------------------------------------------------------

export const narrativeTrendsQuery = {
  narrativeTrends: async (
    _: unknown,
    { searchId, interval = 'day' }: { searchId: string; interval?: string },
    { driver }: ApolloContext
  ): Promise<NarrativeTrends> => {
    const volRecords = await runQuery(driver, `
      MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)
      WITH a, date(a.publishedAt) AS day
      RETURN day,
             count(a) AS volume,
             sum(CASE WHEN a.sentiment = 'POSITIVE' THEN 1 ELSE 0 END) AS positive,
             sum(CASE WHEN a.sentiment = 'NEUTRAL'  THEN 1 ELSE 0 END) AS neutral,
             sum(CASE WHEN a.sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) AS negative
      ORDER BY day ASC
    `, { searchId });

    const volumeOverTime = volRecords.map(r => ({
      date:     r.get('day').toString(),
      volume:   r.get('volume').toNumber(),
      positive: r.get('positive').toNumber(),
      neutral:  r.get('neutral').toNumber(),
      negative: r.get('negative').toNumber(),
    }));

    const totalArticles = volumeOverTime.reduce((s, d) => s + d.volume, 0);
    const totPos = volumeOverTime.reduce((s, d) => s + d.positive, 0);
    const totNeu = volumeOverTime.reduce((s, d) => s + d.neutral,  0);
    const totNeg = volumeOverTime.reduce((s, d) => s + d.negative, 0);

    const srcRecords = await runQuery(driver, `
      MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)-[:PUBLISHED_BY]->(src:Source)
      RETURN src, count(a) AS cnt ORDER BY cnt DESC LIMIT 10
    `, { searchId });

    const topSources = srcRecords.map(r => ({
      source: toObject(r.get('src')) as SourceNode,
      count:  r.get('cnt').toNumber(),
    }));

    const topicRecords = await runQuery(driver, `
      MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)-[:TAGGED_WITH]->(t:Topic)
      RETURN t, count(a) AS cnt ORDER BY cnt DESC LIMIT 10
    `, { searchId });

    const topTopics = topicRecords.map(r => ({
      topic: toObject(r.get('t')) as TopicNode,
      count: r.get('cnt').toNumber(),
    }));

    const searchRec = await runQuery(driver,
      'MATCH (s:Search {id: $id}) RETURN s.name AS name', { id: searchId });
    const searchName = (searchRec[0]?.get('name') as string) ?? searchId;

    return {
      searchId, searchName, interval, volumeOverTime,
      sentimentBreakdown: {
        positive: totPos, neutral: totNeu, negative: totNeg,
        total: totalArticles,
        positivePercent: totalArticles ? parseFloat(((totPos / totalArticles) * 100).toFixed(1)) : 0,
        neutralPercent:  totalArticles ? parseFloat(((totNeu / totalArticles) * 100).toFixed(1)) : 0,
        negativePercent: totalArticles ? parseFloat(((totNeg / totalArticles) * 100).toFixed(1)) : 0,
        periodShift: null,
      },
      topSources, topTopics, totalArticles,
    };
  },
};

// ---------------------------------------------------------------------------
// Volume Projection — DD-2
// ---------------------------------------------------------------------------

export const volumeProjectionQuery = {
  volumeProjection: async (
    _: unknown,
    { keywords }: { keywords: string[] },
    { driver }: ApolloContext
  ): Promise<VolumeProjection> => {
    const countRecords = await runQuery(driver, `
      MATCH (a:Article)
      WHERE any(kw IN $keywords
            WHERE toLower(a.headline) CONTAINS toLower(kw)
               OR toLower(a.body)     CONTAINS toLower(kw))
      RETURN count(a) AS estimatedVolume
    `, { keywords });

    const estimatedVolume = countRecords[0]?.get('estimatedVolume').toNumber() ?? 0;

    const srcRecords = await runQuery(driver, `
      MATCH (a:Article)-[:PUBLISHED_BY]->(src:Source)
      WHERE any(kw IN $keywords
            WHERE toLower(a.headline) CONTAINS toLower(kw)
               OR toLower(a.body)     CONTAINS toLower(kw))
      RETURN src, count(a) AS cnt ORDER BY cnt DESC LIMIT 5
    `, { keywords });

    const topSources = srcRecords.map(r => ({
      source: toObject(r.get('src')) as SourceNode,
      count:  r.get('cnt').toNumber(),
    }));

    return {
      estimatedVolume,
      topSources,
      note: 'EST. VOLUME (SEED CORPUS) — projection based on keyword match against headline + body. Filters not applied at projection time.',
    };
  },
};
