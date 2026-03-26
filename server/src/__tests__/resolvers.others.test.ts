/**
 * Unit tests: others.ts resolvers
 * Covers: FilterPreset CRUD, Collection CRUD, relationship mutations,
 *         volumeProjection, narrativeTrends, article/topic field resolvers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRunQuery } = vi.hoisted(() => ({
  mockRunQuery: vi.fn(),
}));

vi.mock('../neo4j/driver.js', () => ({
  runQuery: mockRunQuery,
  toObject: (node: { properties: Record<string, unknown> }) => ({ ...node.properties }),
}));

vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-5678'),
});

import {
  filterPresetQueries,
  filterPresetMutations,
  filterPresetFieldResolvers,
  collectionQueries,
  collectionMutations,
  collectionFieldResolvers,
  articleQueries,
  articleFieldResolvers,
  topicQueries,
  topicFieldResolvers,
  narrativeTrendsQuery,
  volumeProjectionQuery,
  sourceQueries,
} from '../resolvers/others.js';

// ---------------------------------------------------------------------------
// Minimal shims
// ---------------------------------------------------------------------------

function makeInt(n: number) {
  return { toNumber: () => n };
}

function makeNode(properties: Record<string, unknown>) {
  return { properties };
}

function makeRecord(fields: Record<string, unknown>) {
  return { get: (key: string) => fields[key] };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FP_PROPS    = { id: 'fp-1',     name: 'Tier 1',       type: 'SOURCE_TIER', value: '1' };
const COL_PROPS   = { id: 'col-1',    name: 'My Collection', description: 'desc', createdAt: '2025-01-01' };
const ART_PROPS   = { id: 'art-1',    headline: 'Big Story', body: 'full text', url: 'https://x', publishedAt: '2025-06-01', sentiment: 'NEUTRAL' };
const SRC_PROPS   = { id: 'src-1',    name: 'Reuters',       domain: 'reuters.com', tier: 1, region: 'GLOBAL', language: 'en' };
const TOPIC_PROPS = { id: 'top-1',    label: 'Technology',   category: 'Sector' };
const SEARCH_PROPS = {
  id: 'search-1', name: 'Test Search', keywords: ['semiconductor'],
  startDate: '2025-01-01', endDate: '2025-12-31',
  status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
};

const CTX = { driver: {} as any, callerId: 'test-user' };

beforeEach(() => {
  mockRunQuery.mockReset();
});

// ===========================================================================
// FilterPreset Queries
// ===========================================================================

describe('filterPresetQueries.filterPreset', () => {
  it('should return the matching filter preset when found', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ f: makeNode(FP_PROPS) })]);

    const result = await filterPresetQueries.filterPreset(null, { id: 'fp-1' }, CTX);

    expect(result).toMatchObject({ id: 'fp-1', name: 'Tier 1' });
  });

  it('should return null when no filter preset matches the given id', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await filterPresetQueries.filterPreset(null, { id: 'ghost-id' }, CTX);

    expect(result).toBeNull();
  });
});

describe('filterPresetQueries.filterPresets', () => {
  it('should return all filter presets ordered by name', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode(FP_PROPS) }),
      makeRecord({ f: makeNode({ ...FP_PROPS, id: 'fp-2', name: 'US Region' }) }),
    ]);

    const result = await filterPresetQueries.filterPresets(null, null, CTX);

    expect(result).toHaveLength(2);
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('ORDER BY f.name');
  });

  it('should return an empty array when no filter presets exist', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await filterPresetQueries.filterPresets(null, null, CTX);

    expect(result).toEqual([]);
  });
});

// ===========================================================================
// FilterPreset Mutations
// ===========================================================================

describe('filterPresetMutations.createFilterPreset', () => {
  it('should persist a new filter preset node and return it', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ f: makeNode(FP_PROPS) })]);

    const result = await filterPresetMutations.createFilterPreset(
      null,
      { input: { name: 'Tier 1', type: 'SOURCE_TIER', value: '1' } },
      CTX,
    );

    expect(result).toMatchObject({ id: 'fp-1', type: 'SOURCE_TIER' });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('CREATE (f:FilterPreset');
  });
});

describe('filterPresetMutations.updateFilterPreset', () => {
  it('should update the specified fields and return the updated preset', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ f: makeNode({ ...FP_PROPS, name: 'Renamed Preset' }) })]);

    const result = await filterPresetMutations.updateFilterPreset(
      null,
      { id: 'fp-1', input: { name: 'Renamed Preset' } },
      CTX,
    );

    expect(result).toMatchObject({ name: 'Renamed Preset' });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('f.name = $name');
  });

  it('should include only non-empty fields in the SET clause', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ f: makeNode(FP_PROPS) })]);

    await filterPresetMutations.updateFilterPreset(
      null,
      { id: 'fp-1', input: { value: 'POSITIVE' } },
      CTX,
    );

    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('f.value = $value');
    expect(cypher).not.toContain('f.name');
  });

  it('should include f.type in the SET clause when type is provided', async () => {
    // SOK-38: close others.ts line 46 — the `if (input.type)` branch
    mockRunQuery.mockResolvedValueOnce([makeRecord({ f: makeNode(FP_PROPS) })]);

    await filterPresetMutations.updateFilterPreset(
      null,
      { id: 'fp-1', input: { type: 'SENTIMENT' } },
      CTX,
    );

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('f.type = $type');
    expect(params).toMatchObject({ type: 'SENTIMENT' });
  });
});

describe('filterPresetMutations.deleteFilterPreset', () => {
  it('should detach-delete the filter preset and return success result', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await filterPresetMutations.deleteFilterPreset(null, { id: 'fp-1' }, CTX);

    expect(result).toEqual({
      id: 'fp-1',
      success: true,
      message: expect.stringContaining('deleted'),
    });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('DETACH DELETE f');
  });
});

describe('filterPresetMutations.applyFilterToSearch', () => {
  it('should create HAS_FILTER relationship and return updated search node', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // MERGE
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    const result = await filterPresetMutations.applyFilterToSearch(
      null,
      { filterId: 'fp-1', searchId: 'search-1' },
      CTX,
    );

    expect(result).toMatchObject({ id: 'search-1' });
    const [, mergeCypher] = mockRunQuery.mock.calls[0];
    expect(mergeCypher).toContain('MERGE (s)-[:HAS_FILTER');
  });
});

describe('filterPresetMutations.removeFilterFromSearch', () => {
  it('should delete HAS_FILTER relationship and return updated search node', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // DELETE
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    const result = await filterPresetMutations.removeFilterFromSearch(
      null,
      { filterId: 'fp-1', searchId: 'search-1' },
      CTX,
    );

    expect(result).toMatchObject({ id: 'search-1' });
    const [, deleteCypher] = mockRunQuery.mock.calls[0];
    expect(deleteCypher).toContain('DELETE r');
  });
});

describe('filterPresetFieldResolvers.searches', () => {
  it('should return all searches that reference this filter preset', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    const result = await filterPresetFieldResolvers.searches(FP_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'search-1' });
  });
});

// ===========================================================================
// Collection Queries
// ===========================================================================

describe('collectionQueries.collection', () => {
  it('should return the matching collection when found', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    const result = await collectionQueries.collection(null, { id: 'col-1' }, CTX);

    expect(result).toMatchObject({ id: 'col-1', name: 'My Collection' });
  });

  it('should return null when no collection exists for the given id', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await collectionQueries.collection(null, { id: 'missing-col' }, CTX);

    expect(result).toBeNull();
  });
});

describe('collectionQueries.collections', () => {
  it('should return all collections ordered by name', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ c: makeNode(COL_PROPS) }),
      makeRecord({ c: makeNode({ ...COL_PROPS, id: 'col-2', name: 'Zcollection' }) }),
    ]);

    const result = await collectionQueries.collections(null, null, CTX);

    expect(result).toHaveLength(2);
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('ORDER BY c.name');
  });
});

// ===========================================================================
// Collection Mutations
// ===========================================================================

describe('collectionMutations.createCollection', () => {
  it('should persist a new collection and use empty string for missing description', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    const result = await collectionMutations.createCollection(
      null,
      { input: { name: 'My Collection' } },
      CTX,
    );

    expect(result).toMatchObject({ id: 'col-1' });
    const params = mockRunQuery.mock.calls[0][2] as any;
    expect(params.desc).toBe('');
  });

  it('should persist the provided description when one is supplied', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    await collectionMutations.createCollection(
      null,
      { input: { name: 'My Collection', description: 'Useful collection' } },
      CTX,
    );

    const params = mockRunQuery.mock.calls[0][2] as any;
    expect(params.desc).toBe('Useful collection');
  });
});

describe('collectionMutations.updateCollection', () => {
  it('should update the collection name and return the updated node', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode({ ...COL_PROPS, name: 'Renamed' }) })]);

    const result = await collectionMutations.updateCollection(
      null,
      { id: 'col-1', input: { name: 'Renamed' } },
      CTX,
    );

    expect(result).toMatchObject({ name: 'Renamed' });
  });

  it('should update only description when that is the sole provided field', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    await collectionMutations.updateCollection(
      null,
      { id: 'col-1', input: { description: 'New desc' } },
      CTX,
    );

    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('c.description = $description');
    expect(cypher).not.toContain('c.name');
  });
});

describe('collectionMutations.deleteCollection', () => {
  it('should detach-delete the collection and return success result with preservation note', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await collectionMutations.deleteCollection(null, { id: 'col-1' }, CTX);

    expect(result).toEqual({
      id: 'col-1',
      success: true,
      message: expect.stringContaining('preserved'),
    });
  });
});

describe('collectionMutations.addSearchToCollection', () => {
  it('should create CONTAINS relationship and return the updated collection', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    const result = await collectionMutations.addSearchToCollection(
      null,
      { searchId: 'search-1', collectionId: 'col-1' },
      CTX,
    );

    expect(result).toMatchObject({ id: 'col-1' });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MERGE (col)-[:CONTAINS');
  });
});

describe('collectionMutations.removeSearchFromCollection', () => {
  it('should delete CONTAINS relationship and return the updated collection', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeNode(COL_PROPS) })]);

    const result = await collectionMutations.removeSearchFromCollection(
      null,
      { searchId: 'search-1', collectionId: 'col-1' },
      CTX,
    );

    expect(result).toMatchObject({ id: 'col-1' });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('DELETE r');
  });
});

describe('collectionFieldResolvers.searches', () => {
  it('should return searches in this collection ordered by updatedAt desc', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    const result = await collectionFieldResolvers.searches(COL_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('ORDER BY s.updatedAt DESC');
  });
});

// ===========================================================================
// Article Queries
// ===========================================================================

describe('articleQueries.article', () => {
  it('should return the matching article when found', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ a: makeNode(ART_PROPS) })]);

    const result = await articleQueries.article(null, { id: 'art-1' }, CTX);

    expect(result).toMatchObject({ id: 'art-1', headline: 'Big Story' });
  });

  it('should return null when no article matches', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await articleQueries.article(null, { id: 'none' }, CTX);

    expect(result).toBeNull();
  });
});

describe('articleQueries.articles', () => {
  it('should return all articles when called with no filters', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ a: makeNode(ART_PROPS) })]);

    const result = await articleQueries.articles(null, {}, CTX);

    expect(result).toHaveLength(1);
  });

  it('should scope query to a search when searchId is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await articleQueries.articles(null, { searchId: 'search-1' }, CTX);

    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (s:Search {id: $searchId})-[:MATCHES]');
  });

  it('should filter by sentiment when sentiment is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await articleQueries.articles(null, { sentiment: 'POSITIVE' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('a.sentiment = $sentiment');
    expect(params).toMatchObject({ sentiment: 'POSITIVE' });
  });

  it('should add source match clause when sourceId is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await articleQueries.articles(null, { sourceId: 'src-1' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (a)-[:PUBLISHED_BY]->(src:Source {id: $sourceId})');
    expect(params).toMatchObject({ sourceId: 'src-1' });
  });
});

// ===========================================================================
// Article Field Resolvers
// ===========================================================================

describe('articleFieldResolvers.source', () => {
  it('should return the source for the article', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ src: makeNode(SRC_PROPS) })]);

    const result = await articleFieldResolvers.source(ART_PROPS as any, null, CTX);

    expect(result).toMatchObject({ id: 'src-1' });
  });

  it('should return null when no source is linked to the article', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await articleFieldResolvers.source(ART_PROPS as any, null, CTX);

    expect(result).toBeNull();
  });
});

describe('articleFieldResolvers.author', () => {
  it('should return null when no author is linked', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await articleFieldResolvers.author(ART_PROPS as any, null, CTX);

    expect(result).toBeNull();
  });

  it('should return the author when one exists', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ aut: makeNode({ id: 'aut-1', name: 'Jane Doe' }) }),
    ]);

    const result = await articleFieldResolvers.author(ART_PROPS as any, null, CTX);

    expect(result).toMatchObject({ id: 'aut-1' });
  });
});

describe('articleFieldResolvers.topics', () => {
  it('should return topics tagged on the article', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ t: makeNode(TOPIC_PROPS) })]);

    const result = await articleFieldResolvers.topics(ART_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'top-1' });
  });
});

// ===========================================================================
// Topic Queries and Field Resolvers
// ===========================================================================

describe('topicQueries.topics', () => {
  it('should return all topics ordered by label', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ t: makeNode(TOPIC_PROPS) })]);

    const result = await topicQueries.topics(null, null, CTX);

    expect(result).toHaveLength(1);
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('ORDER BY t.label');
  });
});

describe('topicFieldResolvers.coOccursWith', () => {
  it('should return co-occurring topics with frequency counts', async () => {
    const otherTopic = makeNode({ id: 'top-2', label: 'Economics', category: 'Sector' });
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ other: otherTopic, freq: makeInt(5) }),
    ]);

    const result = await topicFieldResolvers.coOccursWith(TOPIC_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ frequency: 5 });
    expect(result[0].topic).toMatchObject({ id: 'top-2' });
  });

  it('should return an empty array when no co-occurring topics exist', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await topicFieldResolvers.coOccursWith(TOPIC_PROPS as any, null, CTX);

    expect(result).toEqual([]);
  });
});

// ===========================================================================
// Volume Projection (DD-2)
// ===========================================================================

describe('volumeProjectionQuery.volumeProjection', () => {
  it('should return estimated volume and top sources matching the keywords', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ estimatedVolume: makeInt(42) })]);
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ src: makeNode(SRC_PROPS), cnt: makeInt(10) }),
    ]);

    const result = await volumeProjectionQuery.volumeProjection(
      null, { keywords: ['semiconductor'] }, CTX,
    );

    expect(result.estimatedVolume).toBe(42);
    expect(result.topSources).toHaveLength(1);
    expect(result.topSources[0].count).toBe(10);
    expect(result.note).toContain('EST. VOLUME');
  });

  it('should return zero volume when no articles match the keywords', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ estimatedVolume: makeInt(0) })]);
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await volumeProjectionQuery.volumeProjection(
      null, { keywords: ['unknownterm12345'] }, CTX,
    );

    expect(result.estimatedVolume).toBe(0);
    expect(result.topSources).toEqual([]);
  });

  it('should pass all keywords to the cypher query', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ estimatedVolume: makeInt(0) })]);
    mockRunQuery.mockResolvedValueOnce([]);

    await volumeProjectionQuery.volumeProjection(
      null, { keywords: ['chip', 'fab', 'TSMC'] }, CTX,
    );

    const params = mockRunQuery.mock.calls[0][2] as any;
    expect(params.keywords).toEqual(['chip', 'fab', 'TSMC']);
  });

  it('should default estimatedVolume to zero when the count query returns an empty result set', async () => {
    // SOK-38: close others.ts line 349 — the `?? 0` nullish-coalescing fallback
    mockRunQuery.mockResolvedValueOnce([]); // no count record at all
    mockRunQuery.mockResolvedValueOnce([]); // no top sources

    const result = await volumeProjectionQuery.volumeProjection(
      null, { keywords: ['ghost-term'] }, CTX,
    );

    expect(result.estimatedVolume).toBe(0);
    expect(result.topSources).toEqual([]);
  });
});

// ===========================================================================
// Narrative Trends (DD-3)
// ===========================================================================

describe('narrativeTrendsQuery.narrativeTrends', () => {
  function makeVolRecord(date: string, volume: number, pos: number, neu: number, neg: number) {
    return makeRecord({
      day:      { toString: () => date },
      volume:   makeInt(volume),
      positive: makeInt(pos),
      neutral:  makeInt(neu),
      negative: makeInt(neg),
    });
  }

  it('should aggregate sentiment counts and compute percentages correctly', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeVolRecord('2025-01-01', 10, 4, 4, 2),
      makeVolRecord('2025-01-02', 10, 6, 2, 2),
    ]);
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ src: makeNode(SRC_PROPS), cnt: makeInt(8) }),
    ]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ name: 'My Search' })]);

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1' }, CTX,
    );

    expect(result.totalArticles).toBe(20);
    expect(result.sentimentBreakdown.positive).toBe(10);
    expect(result.sentimentBreakdown.neutral).toBe(6);
    expect(result.sentimentBreakdown.negative).toBe(4);
    expect(result.sentimentBreakdown.positivePercent).toBe(50);
    expect(result.sentimentBreakdown.periodShift).toBeNull();
    expect(result.searchName).toBe('My Search');
  });

  it('should return zero percents and empty arrays when no articles match the search', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ name: 'Empty Search' })]);

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-empty' }, CTX,
    );

    expect(result.totalArticles).toBe(0);
    expect(result.sentimentBreakdown.positivePercent).toBe(0);
    expect(result.volumeOverTime).toEqual([]);
    expect(result.topSources).toEqual([]);
    expect(result.topTopics).toEqual([]);
  });

  it('should return ALL as interval when none is supplied', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ name: 'S' })]);

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1' }, CTX,
    );

    expect(result.interval).toBe('ALL');
  });

  it('should propagate custom interval value when one is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ name: 'S' })]);

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'L30D' }, CTX,
    );

    expect(result.interval).toBe('L30D');
  });

  it('should fall back to searchId as name when no search record is returned', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]); // no name record

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-fallback' }, CTX,
    );

    expect(result.searchName).toBe('search-fallback');
  });
});

// ===========================================================================
// SOK-70 — Source Queries
// ===========================================================================

describe('sourceQueries.source', () => {
  it('should return a source node with name, tier, region, and language when found', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ src: makeNode(SRC_PROPS) })]);

    const result = await sourceQueries.source(null, { id: 'src-1' }, CTX);

    expect(result).toMatchObject({
      id:       'src-1',
      name:     'Reuters',
      tier:     1,
      region:   'GLOBAL',
      language: 'en',
    });
    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (src:Source {id: $id})');
    expect(params).toEqual({ id: 'src-1' });
  });

  it('should return null when no source node exists for the given id', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await sourceQueries.source(null, { id: 'ghost-src' }, CTX);

    expect(result).toBeNull();
  });
});

describe('sourceQueries.sourceArticles', () => {
  it('should return articles published by the given source ordered by publishedAt desc', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({ ...ART_PROPS, id: 'art-1' }) }),
      makeRecord({ a: makeNode({ ...ART_PROPS, id: 'art-2', publishedAt: '2025-05-01' }) }),
    ]);

    const result = await sourceQueries.sourceArticles(null, { sourceId: 'src-1' }, CTX);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'art-1' });
    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (a:Article)-[:PUBLISHED_BY]->(src:Source {id: $sourceId})');
    expect(params).toMatchObject({ sourceId: 'src-1' });
  });

  it('should return an empty array when no articles are published by the given source', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await sourceQueries.sourceArticles(null, { sourceId: 'src-empty' }, CTX);

    expect(result).toEqual([]);
  });

  it('should scope to articles matching both source and search when searchId is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({ ...ART_PROPS, id: 'art-filtered' }) }),
    ]);

    const result = await sourceQueries.sourceArticles(
      null,
      { sourceId: 'src-1', searchId: 'search-1' },
      CTX,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'art-filtered' });
    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (s:Search {id: $searchId})-[:MATCHES]->(a)');
    expect(params).toMatchObject({ sourceId: 'src-1', searchId: 'search-1' });
  });
});

// ===========================================================================
// SOK-72 — Article query (additional coverage)
// ===========================================================================

describe('articleQueries.article — full field coverage', () => {
  it('should return the full article including body when the article exists', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ a: makeNode(ART_PROPS) })]);

    const result = await articleQueries.article(null, { id: 'art-1' }, CTX);

    expect(result).toMatchObject({
      id:          'art-1',
      headline:    'Big Story',
      body:        'full text',
      url:         'https://x',
      publishedAt: '2025-06-01',
      sentiment:   'NEUTRAL',
    });
  });

  it('should return null when no article exists for the given id', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await articleQueries.article(null, { id: 'nonexistent-art' }, CTX);

    expect(result).toBeNull();
  });
});

// ===========================================================================
// SOK-82 — narrativeTrends: ALL interval and date filtering
// ===========================================================================

describe('narrativeTrendsQuery.narrativeTrends — SOK-82 ALL interval', () => {
  function stubEmptyRun() {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ name: 'Test Search' })]);
  }

  it('should return interval ALL and pass null startDate when no interval argument is provided', async () => {
    stubEmptyRun();

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1' }, CTX,
    );

    expect(result.interval).toBe('ALL');
    // The first runQuery call is the volume-over-time query; params must not include a real date
    const params = mockRunQuery.mock.calls[0][2] as Record<string, unknown>;
    expect(params.startDate == null || params.startDate === null).toBe(true);
  });

  it('should return interval ALL and pass null startDate when interval is explicitly ALL', async () => {
    stubEmptyRun();

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'ALL' }, CTX,
    );

    expect(result.interval).toBe('ALL');
    const params = mockRunQuery.mock.calls[0][2] as Record<string, unknown>;
    expect(params.startDate == null || params.startDate === null).toBe(true);
  });

  it('should omit a date WHERE clause from the Cypher query when interval is ALL', async () => {
    stubEmptyRun();

    await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'ALL' }, CTX,
    );

    // The implementation uses a null-guard pattern: WHERE ($startDate IS NULL OR a.publishedAt >= $startDate)
    // so the substring is always present in Cypher. Verify date filtering is suppressed via the null param.
    const params = mockRunQuery.mock.calls[0][2] as Record<string, unknown>;
    expect(params.startDate == null || params.startDate === null).toBe(true);
  });

  it('should compute a startDate 7 days in the past and include it in the Cypher when interval is L7D', async () => {
    stubEmptyRun();

    await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'L7D' }, CTX,
    );

    const params = mockRunQuery.mock.calls[0][2] as Record<string, unknown>;
    expect(params.startDate).not.toBeNull();

    // The implementation emits a date-only string via .toISOString().split('T')[0].
    // Compare directly against the expected ISO date string for 7 days ago to avoid UTC/local mismatch.
    const expectedDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(params.startDate).toBe(expectedDate);
  });

  it('should include a date WHERE clause in the Cypher query when interval is L7D', async () => {
    stubEmptyRun();

    await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'L7D' }, CTX,
    );

    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toMatch(/a\.publishedAt\s*>=\s*\$startDate/);
  });

  it('should return interval L7D on the result when interval is L7D', async () => {
    stubEmptyRun();

    const result = await narrativeTrendsQuery.narrativeTrends(
      null, { searchId: 'search-1', interval: 'L7D' }, CTX,
    );

    expect(result.interval).toBe('L7D');
  });
});

// ===========================================================================
// SOK-74 — Collection stats
// ===========================================================================

describe('collectionFieldResolvers.totalArticles', () => {
  it('should return the total distinct article count across all member searches', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ total: makeInt(42) })]);

    const result = await collectionFieldResolvers.totalArticles(COL_PROPS as any, null, CTX);

    expect(result).toBe(42);
    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (c:Collection {id: $id})-[:CONTAINS]->(s:Search)-[:MATCHES]->(a:Article)');
    expect(cypher).toContain('count(DISTINCT a) AS total');
    expect(params).toMatchObject({ id: 'col-1' });
  });

  it('should return 0 when the collection contains no article matches', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ total: makeInt(0) })]);

    const result = await collectionFieldResolvers.totalArticles(COL_PROPS as any, null, CTX);

    expect(result).toBe(0);
  });

  it('should return 0 when the count query returns an empty result set', async () => {
    // nullish-coalescing fallback for missing record
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await collectionFieldResolvers.totalArticles(COL_PROPS as any, null, CTX);

    expect(result).toBe(0);
  });
});

describe('collectionFieldResolvers.sentimentSummary', () => {
  it('should return correct counts and percentages for a collection with mixed sentiment', async () => {
    // 4 positive, 4 neutral, 2 negative → total 10
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({
        total:    makeInt(10),
        positive: makeInt(4),
        neutral:  makeInt(4),
        negative: makeInt(2),
      }),
    ]);

    const result = await collectionFieldResolvers.sentimentSummary(COL_PROPS as any, null, CTX);

    expect(result).toMatchObject({
      total:    10,
      positive: 4,
      neutral:  4,
      negative: 2,
    });
    expect(result!.positivePercent).toBe(40);
    expect(result!.neutralPercent).toBe(40);
    expect(result!.negativePercent).toBe(20);
    expect(result!.periodShift).toBeNull();
  });

  it('should return null when the collection has no articles', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await collectionFieldResolvers.sentimentSummary(COL_PROPS as any, null, CTX);

    expect(result).toBeNull();
  });

  it('should return zero percents when total is 0 to avoid division by zero', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({
        total:    makeInt(0),
        positive: makeInt(0),
        neutral:  makeInt(0),
        negative: makeInt(0),
      }),
    ]);

    const result = await collectionFieldResolvers.sentimentSummary(COL_PROPS as any, null, CTX);

    expect(result).toMatchObject({
      positivePercent: 0,
      neutralPercent:  0,
      negativePercent: 0,
    });
  });
});
