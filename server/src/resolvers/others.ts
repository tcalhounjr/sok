import { runQuery, toObject } from '../neo4j/driver.js';
import { randomUUID } from 'crypto';
import {
  ApolloContext, FilterPresetNode, CollectionNode,
  ArticleNode, TopicNode, SourceNode,
  DeleteResult, NarrativeTrends, NarrativeShift, VolumeProjection,
} from '../types/index.js';
import { requireAuth } from '../auth/middleware.js';

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
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
    const id = randomUUID();
    const records = await runQuery(driver,
      'CREATE (f:FilterPreset {id: $id, name: $name, type: $type, value: $value}) RETURN f',
      { id, ...input });
    return toObject(records[0].get('f')) as FilterPresetNode;
  },

  updateFilterPreset: async (
    _: unknown,
    { id, input }: { id: string; input: { name?: string; type?: string; value?: string }},
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };
    if (input.name  !== undefined) { setClauses.push('f.name = $name');   params.name  = input.name; }
    if (input.type  !== undefined) { setClauses.push('f.type = $type');   params.type  = input.type; }
    if (input.value !== undefined) { setClauses.push('f.value = $value'); params.value = input.value; }
    if (setClauses.length === 0) {
      throw new Error('At least one field must be provided to update');
    }
    const records = await runQuery(driver,
      `MATCH (f:FilterPreset {id: $id}) SET ${setClauses.join(', ')} RETURN f`, params);
    return toObject(records[0].get('f')) as FilterPresetNode;
  },

  deleteFilterPreset: async (
    _: unknown, { id }: { id: string }, { driver, callerId }: ApolloContext
  ): Promise<DeleteResult> => {
    requireAuth(callerId);
    await runQuery(driver, 'MATCH (f:FilterPreset {id: $id}) DETACH DELETE f', { id });
    return { id, success: true, message: 'FilterPreset deleted and removed from all searches.' };
  },

  applyFilterToSearch: async (
    _: unknown,
    { filterId, searchId }: { filterId: string; searchId: string },
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
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
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
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
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
    const id = randomUUID();
    const records = await runQuery(driver,
      'CREATE (c:Collection {id: $id, name: $name, description: $desc, createdAt: datetime()}) RETURN c',
      { id, name: input.name, desc: input.description ?? '' });
    return toObject(records[0].get('c')) as CollectionNode;
  },

  updateCollection: async (
    _: unknown,
    { id, input }: { id: string; input: { name?: string; description?: string }},
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };
    if (input.name        !== undefined) { setClauses.push('c.name = $name');               params.name        = input.name; }
    if (input.description !== undefined) { setClauses.push('c.description = $description'); params.description = input.description; }
    if (setClauses.length === 0) {
      throw new Error('At least one field must be provided to update');
    }
    const records = await runQuery(driver,
      `MATCH (c:Collection {id: $id}) SET ${setClauses.join(', ')} RETURN c`, params);
    return toObject(records[0].get('c')) as CollectionNode;
  },

  deleteCollection: async (
    _: unknown, { id }: { id: string }, { driver, callerId }: ApolloContext
  ): Promise<DeleteResult> => {
    requireAuth(callerId);
    await runQuery(driver, 'MATCH (c:Collection {id: $id}) DETACH DELETE c', { id });
    return { id, success: true, message: 'Collection deleted. Member searches preserved.' };
  },

  addSearchToCollection: async (
    _: unknown,
    { searchId, collectionId }: { searchId: string; collectionId: string },
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
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
    { driver, callerId }: ApolloContext
  ) => {
    requireAuth(callerId);
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

  /**
   * Traverses CONTAINS -> searches -> MATCHES -> articles to compute total
   * article count and sentiment breakdown for this collection.
   */
  totalArticles: async (parent: CollectionNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, `
      MATCH (c:Collection {id: $id})-[:CONTAINS]->(s:Search)-[:MATCHES]->(a:Article)
      RETURN count(DISTINCT a) AS total
    `, { id: parent.id });
    return records[0]?.get('total').toNumber() ?? 0;
  },

  /**
   * Computes sentiment breakdown across all articles in all searches in this collection.
   */
  sentimentSummary: async (parent: CollectionNode, _: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver, `
      MATCH (c:Collection {id: $id})-[:CONTAINS]->(s:Search)-[:MATCHES]->(a:Article)
      WITH DISTINCT a
      RETURN
        count(a) AS total,
        sum(CASE WHEN a.sentiment = 'POSITIVE' THEN 1 ELSE 0 END) AS positive,
        sum(CASE WHEN a.sentiment = 'NEUTRAL'  THEN 1 ELSE 0 END) AS neutral,
        sum(CASE WHEN a.sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) AS negative
    `, { id: parent.id });

    if (!records.length) return null;

    const total    = records[0].get('total').toNumber();
    const positive = records[0].get('positive').toNumber();
    const neutral  = records[0].get('neutral').toNumber();
    const negative = records[0].get('negative').toNumber();

    return {
      total,
      positive,
      neutral,
      negative,
      positivePercent: total ? parseFloat(((positive / total) * 100).toFixed(1)) : 0,
      neutralPercent:  total ? parseFloat(((neutral  / total) * 100).toFixed(1)) : 0,
      negativePercent: total ? parseFloat(((negative / total) * 100).toFixed(1)) : 0,
      periodShift: null,
    };
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
// Sources (SOK-70)
// ---------------------------------------------------------------------------

export const sourceQueries = {
  /**
   * Fetches a single Source node by id, including tier, region, language, name.
   */
  source: async (_: unknown, { id }: { id: string }, { driver }: ApolloContext) => {
    const records = await runQuery(driver, 'MATCH (src:Source {id: $id}) RETURN src', { id });
    return records.length ? toObject(records[0].get('src')) as SourceNode : null;
  },

  /**
   * Fetches articles PUBLISHED_BY the given source. Optionally filters to
   * articles that also MATCH a specific search. Supports limit and offset for
   * pagination.
   */
  sourceArticles: async (
    _: unknown,
    { sourceId, searchId, limit = 20, offset = 0 }: {
      sourceId: string; searchId?: string; limit?: number; offset?: number;
    },
    { driver }: ApolloContext
  ) => {
    let cypher: string;
    const params: Record<string, unknown> = { sourceId, limit, offset };

    if (searchId) {
      cypher = `
        MATCH (a:Article)-[:PUBLISHED_BY]->(src:Source {id: $sourceId})
        MATCH (s:Search {id: $searchId})-[:MATCHES]->(a)
        RETURN a ORDER BY a.publishedAt DESC SKIP $offset LIMIT $limit
      `;
      params.searchId = searchId;
    } else {
      cypher = `
        MATCH (a:Article)-[:PUBLISHED_BY]->(src:Source {id: $sourceId})
        RETURN a ORDER BY a.publishedAt DESC SKIP $offset LIMIT $limit
      `;
    }

    const records = await runQuery(driver, cypher, params);
    return records.map(r => toObject(r.get('a')) as ArticleNode);
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
    { driver, callerId }: ApolloContext
  ): Promise<NarrativeTrends> => {
    requireAuth(callerId);
    const now = new Date();
    const startDate = interval === 'L7D'  ? new Date(now.getTime() - 7  * 86400000).toISOString().split('T')[0]
                    : interval === 'L30D' ? new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
                    : interval === 'L90D' ? new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0]
                    : null;

    const volRecords = await runQuery(driver, `
      MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)
      WHERE ($startDate IS NULL OR a.publishedAt >= $startDate)
      WITH a, date(a.publishedAt) AS day
      RETURN day,
             count(a) AS volume,
             sum(CASE WHEN a.sentiment = 'POSITIVE' THEN 1 ELSE 0 END) AS positive,
             sum(CASE WHEN a.sentiment = 'NEUTRAL'  THEN 1 ELSE 0 END) AS neutral,
             sum(CASE WHEN a.sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) AS negative
      ORDER BY day ASC
    `, { searchId, startDate });

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

    // -----------------------------------------------------------------------
    // SOK-69: Narrative shifts — detect anomalies, emergent topics, sentiment
    // shifts across the volume timeline.
    // -----------------------------------------------------------------------
    const narrativeShifts: NarrativeShift[] = [];

    if (volumeOverTime.length >= 2) {
      // --- ANOMALY: days where article count > 2x the average daily count ---
      const avgVolume = totalArticles / volumeOverTime.length;
      const anomalyDays = volumeOverTime.filter(d => d.volume > 2 * avgVolume);
      if (anomalyDays.length > 0) {
        // Use the most recent anomaly day.
        const mostRecent = anomalyDays[anomalyDays.length - 1];
        narrativeShifts.push({
          type:      'ANOMALY',
          title:     'Volume spike detected',
          body:      `Article volume on ${mostRecent.date} (${mostRecent.volume}) exceeded 2x the average daily volume (${avgVolume.toFixed(1)}).`,
          timestamp: mostRecent.date,
          live:      true,
        });
      }

      // --- SENTIMENT SHIFT: ratio change > 20 pp vs prior equal-length window ---
      const midpoint = Math.floor(volumeOverTime.length / 2);
      const firstHalf  = volumeOverTime.slice(0, midpoint);
      const secondHalf = volumeOverTime.slice(midpoint);

      const sumPos  = (days: typeof volumeOverTime) => days.reduce((s, d) => s + d.positive, 0);
      const sumTot  = (days: typeof volumeOverTime) => days.reduce((s, d) => s + d.volume,   0);

      const firstTotal  = sumTot(firstHalf);
      const secondTotal = sumTot(secondHalf);

      if (firstTotal > 0 && secondTotal > 0) {
        const firstPosPct  = (sumPos(firstHalf)  / firstTotal)  * 100;
        const secondPosPct = (sumPos(secondHalf) / secondTotal) * 100;
        const shift = secondPosPct - firstPosPct;

        if (Math.abs(shift) > 20) {
          narrativeShifts.push({
            type:      'SENTIMENT SHIFT',
            title:     shift > 0 ? 'Positive sentiment rising' : 'Negative sentiment rising',
            body:      `Positive sentiment changed by ${shift.toFixed(1)} percentage points vs the prior equal-length window.`,
            timestamp: secondHalf[secondHalf.length - 1].date,
            live:      true,
          });
        }
      }
    }

    // --- EMERGENT TOPIC: topics appearing in last 25% of interval but not first 25% ---
    if (volumeOverTime.length >= 4) {
      const totalDays   = volumeOverTime.length;
      const cutFirst    = Math.ceil(totalDays * 0.25);
      const cutLast     = Math.floor(totalDays * 0.75);

      const firstQuarterDates = volumeOverTime.slice(0, cutFirst).map(d => d.date);
      const lastQuarterDates  = volumeOverTime.slice(cutLast).map(d => d.date);

      if (firstQuarterDates.length > 0 && lastQuarterDates.length > 0) {
        const firstStartDate = firstQuarterDates[0];
        const firstEndDate   = firstQuarterDates[firstQuarterDates.length - 1];
        const lastStartDate  = lastQuarterDates[0];
        const lastEndDate    = lastQuarterDates[lastQuarterDates.length - 1];

        const firstTopicRecords = await runQuery(driver, `
          MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)-[:TAGGED_WITH]->(t:Topic)
          WHERE a.publishedAt >= $startDate AND a.publishedAt <= $endDate
          RETURN t.label AS label, count(a) AS cnt
        `, { searchId, startDate: firstStartDate, endDate: firstEndDate });

        const lastTopicRecords = await runQuery(driver, `
          MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)-[:TAGGED_WITH]->(t:Topic)
          WHERE a.publishedAt >= $startDate AND a.publishedAt <= $endDate
          RETURN t.label AS label, count(a) AS cnt
        `, { searchId, startDate: lastStartDate, endDate: lastEndDate });

        const firstLabels = new Set(firstTopicRecords.map(r => r.get('label') as string));
        const emergent    = lastTopicRecords.filter(r => !firstLabels.has(r.get('label') as string));

        if (emergent.length > 0) {
          const topEmergent = emergent[0].get('label') as string;
          narrativeShifts.push({
            type:      'EMERGENT TOPIC',
            title:     `New topic emerging: ${topEmergent}`,
            body:      `"${topEmergent}" appears in the most recent 25% of the interval but was absent in the earliest 25%.`,
            timestamp: lastEndDate,
            live:      true,
          });
        }
      }
    }

    // Return up to 3 most significant shifts (already ordered: anomaly, sentiment, emergent).
    const MAX_SHIFTS = 3;

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
      narrativeShifts: narrativeShifts.slice(0, MAX_SHIFTS),
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
    { driver, callerId }: ApolloContext
  ): Promise<VolumeProjection> => {
    requireAuth(callerId);
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
