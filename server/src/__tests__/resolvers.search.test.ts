/**
 * Unit tests: search.ts resolvers
 * Neo4j I/O is fully mocked — no live database required.
 *
 * Pattern: vi.hoisted() creates the mock fn before module import, then
 * vi.mock() factory closes over it so the resolver module sees the same fn.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mockRunQuery so the vi.mock factory can capture it before imports
// ---------------------------------------------------------------------------
const { mockRunQuery } = vi.hoisted(() => ({
  mockRunQuery: vi.fn(),
}));

vi.mock('../neo4j/driver.js', () => ({
  runQuery: mockRunQuery,
  toObject: (node: { properties: Record<string, unknown> }) => ({ ...node.properties }),
}));

vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-1234'),
});

import {
  searchQueries,
  searchMutations,
  searchFieldResolvers,
} from '../resolvers/search.js';

// ---------------------------------------------------------------------------
// Minimal Neo4j shims
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

const SEARCH_PROPS = {
  id: 'search-1',
  name: 'Test Search',
  keywords: ['semiconductor', 'TSMC'],
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// Session mock — supports driver.session().executeWrite() used by forkSearch
// DERIVED_FROM UNWIND write path.
const mockSessionClose    = vi.fn().mockResolvedValue(undefined);
const mockExecuteWrite    = vi.fn().mockResolvedValue(undefined);
const mockSession         = { executeWrite: mockExecuteWrite, close: mockSessionClose };
const mockDriverSession   = vi.fn().mockReturnValue(mockSession);

const CTX = {
  driver:   { session: mockDriverSession } as any,
  callerId: 'test-user',
};

beforeEach(() => {
  mockRunQuery.mockReset();
  mockDriverSession.mockReturnValue(mockSession);
  mockExecuteWrite.mockReset().mockImplementation(async (fn: (tx: any) => Promise<void>) => {
    const tx = { run: vi.fn().mockResolvedValue({ records: [] }) };
    await fn(tx);
  });
  mockSessionClose.mockReset().mockResolvedValue(undefined);
});

// ===========================================================================
// searchQueries.search
// ===========================================================================

describe('searchQueries.search', () => {
  it('should return the matching search when one exists in the database', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    const result = await searchQueries.search(null, { id: 'search-1' }, CTX);

    expect(result).toMatchObject({ id: 'search-1', name: 'Test Search' });
    expect(mockRunQuery).toHaveBeenCalledOnce();
    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (s:Search {id: $id})');
    expect(params).toEqual({ id: 'search-1' });
  });

  it('should return null when no search exists for the given id', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await searchQueries.search(null, { id: 'missing-id' }, CTX);

    expect(result).toBeNull();
  });
});

// ===========================================================================
// searchQueries.searches
// ===========================================================================

describe('searchQueries.searches', () => {
  it('should return all searches when called with no filters', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ s: makeNode(SEARCH_PROPS) }),
      makeRecord({ s: makeNode({ ...SEARCH_PROPS, id: 'search-2', name: 'Second Search' }) }),
    ]);

    const result = await searchQueries.searches(null, {}, CTX);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'search-1' });
  });

  it('should include a WHERE clause filtering by status when status is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await searchQueries.searches(null, { status: 'archived' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('s.status = $status');
    expect(params).toMatchObject({ status: 'archived' });
  });

  it('should use collection-scoped cypher when collectionId is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await searchQueries.searches(null, { collectionId: 'col-1' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('MATCH (col:Collection {id: $colId})-[:CONTAINS]');
    expect(params).toMatchObject({ colId: 'col-1' });
  });

  it('should include keyword filter clause when keyword is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await searchQueries.searches(null, { keyword: 'TSMC' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('any(kw IN s.keywords');
    expect(params).toMatchObject({ keyword: 'TSMC' });
  });

  it('should return an empty array when no searches match the filters', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await searchQueries.searches(null, { status: 'draft' }, CTX);

    expect(result).toEqual([]);
  });

  it('should apply both status and keyword conditions when both are provided', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchQueries.searches(null, { status: 'active', keyword: 'chip' }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('s.status = $status');
    expect(cypher).toContain('any(kw IN s.keywords');
    expect(params).toMatchObject({ status: 'active', keyword: 'chip' });
  });
});

// ===========================================================================
// searchQueries.searchLineage
// ===========================================================================

describe('searchQueries.searchLineage', () => {
  it('should return root and lineage nodes for a search that has ancestors', async () => {
    const rootNode = makeNode({ ...SEARCH_PROPS, id: 'root-search' });
    const selfNode = makeNode({ ...SEARCH_PROPS, id: 'search-1' });

    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ ancestor: selfNode,  depth: makeInt(0) }),
      makeRecord({ ancestor: rootNode,  depth: makeInt(1) }),
    ]);
    mockRunQuery.mockResolvedValueOnce([]); // descendants
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(0) })]); // orphan count

    const result = await searchQueries.searchLineage(null, { id: 'search-1' }, CTX);

    expect(result.totalNodes).toBe(2);
    expect(result.maxDepth).toBe(1);
    expect(result.orphanCount).toBe(0);
    expect(result.nodes.some(n => n.search.id === 'root-search')).toBe(true);
  });

  it('should assign negative depth to descendant nodes', async () => {
    const selfNode  = makeNode({ ...SEARCH_PROPS, id: 'search-1' });
    const childNode = makeNode({ ...SEARCH_PROPS, id: 'child-search' });

    mockRunQuery.mockResolvedValueOnce([makeRecord({ ancestor: selfNode, depth: makeInt(0) })]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ descendant: childNode, depth: makeInt(1) })]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(0) })]);

    const result = await searchQueries.searchLineage(null, { id: 'search-1' }, CTX);

    const childLineageNode = result.nodes.find(n => n.search.id === 'child-search');
    expect(childLineageNode?.depth).toBe(-1);
  });

  it('should report orphan count accurately when orphaned relationships exist', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(3) })]);

    const result = await searchQueries.searchLineage(null, { id: 'any-id' }, CTX);

    expect(result.orphanCount).toBe(3);
  });

  it('should return empty lineage when no ancestors or descendants exist', async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([]);
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(0) })]);

    const result = await searchQueries.searchLineage(null, { id: 'lone-search' }, CTX);

    expect(result.totalNodes).toBe(0);
    expect(result.root).toBeNull();
    expect(result.maxDepth).toBe(0);
  });
});

// ===========================================================================
// searchMutations.createSearch
// ===========================================================================

describe('searchMutations.createSearch', () => {
  it('should create a search node and return it with the generated id', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode({ ...SEARCH_PROPS, id: 'test-uuid-1234' }) })]);
    mockRunQuery.mockResolvedValueOnce([]); // buildMatchEdges: articles query

    const result = await searchMutations.createSearch(
      null,
      { input: { name: 'Test Search', keywords: ['semiconductor'] } },
      CTX,
    );

    expect(result).toMatchObject({ id: 'test-uuid-1234', name: 'Test Search' });
    expect(mockRunQuery.mock.calls[0][1]).toContain('CREATE (s:Search');
  });

  it('should use default dates and ACTIVE status when none are provided in input', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);
    mockRunQuery.mockResolvedValueOnce([]); // buildMatchEdges

    await searchMutations.createSearch(
      null,
      { input: { name: 'Defaults Test', keywords: ['foo'] } },
      CTX,
    );

    const params = mockRunQuery.mock.calls[0][2] as any;
    const year = new Date().getFullYear();
    expect(params.startDate).toBe(`${year}-01-01`);
    expect(params.endDate).toBe(`${year}-12-31`);
    expect(params.status).toBe('ACTIVE');
  });

  it('should link the new search to a collection when collectionId is supplied', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);
    mockRunQuery.mockResolvedValueOnce([]); // MERGE collection
    mockRunQuery.mockResolvedValueOnce([]); // buildMatchEdges: articles query

    await searchMutations.createSearch(
      null,
      { input: { name: 'In Collection', keywords: ['foo'], collectionId: 'col-1' } },
      CTX,
    );

    const collectionCallCypher = mockRunQuery.mock.calls[1][1] as string;
    expect(collectionCallCypher).toContain('MERGE (col)-[:CONTAINS');
  });

  it('should create MATCHES edges for articles whose text contains the keyword', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);
    // buildMatchEdges: fetch all articles — one matches
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({ id: 'art-1', headline: 'Semiconductor news', body: 'body text' }) }),
    ]);
    // MERGE matching article
    mockRunQuery.mockResolvedValueOnce([]);

    await searchMutations.createSearch(
      null,
      { input: { name: 'Match Test', keywords: ['semiconductor'] } },
      CTX,
    );

    const allCyphers = mockRunQuery.mock.calls.map((c: any[]) => c[1] as string);
    expect(allCyphers.some(c => c.includes('MERGE (s)-[:MATCHES'))).toBe(true);
  });
});

// ===========================================================================
// searchMutations.updateSearch
// ===========================================================================

describe('searchMutations.updateSearch', () => {
  it('should update name and return the updated search node', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode({ ...SEARCH_PROPS, name: 'Updated Name' }) })]);

    const result = await searchMutations.updateSearch(
      null,
      { id: 'search-1', input: { name: 'Updated Name' } },
      CTX,
    );

    expect(result).toMatchObject({ name: 'Updated Name' });
    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('s.name = $name');
  });

  it('should always append updatedAt to the SET clause regardless of which fields are updated', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchMutations.updateSearch(
      null,
      { id: 'search-1', input: { status: 'archived' } },
      CTX,
    );

    const [, cypher] = mockRunQuery.mock.calls[0];
    expect(cypher).toContain('s.updatedAt = datetime($now)');
  });

  it('should delete existing MATCHES edges and rebuild them when keywords are updated', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);
    mockRunQuery.mockResolvedValueOnce([]); // DELETE MATCHES
    mockRunQuery.mockResolvedValueOnce([]); // buildMatchEdges: no articles

    await searchMutations.updateSearch(
      null,
      { id: 'search-1', input: { keywords: ['new-keyword'] } },
      CTX,
    );

    const deleteCypher = mockRunQuery.mock.calls[1][1] as string;
    expect(deleteCypher).toContain('DELETE r');
  });

  it('should not rebuild MATCHES edges when keywords are not part of the update', async () => {
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchMutations.updateSearch(
      null,
      { id: 'search-1', input: { name: 'Just Name Change' } },
      CTX,
    );

    expect(mockRunQuery).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// searchMutations.deleteSearch
// ===========================================================================

describe('searchMutations.deleteSearch', () => {
  it('should mark derivative relationships orphaned and delete the search node in a single query', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // combined SET+DELETE query

    const result = await searchMutations.deleteSearch(null, { id: 'search-1' }, CTX);

    expect(result).toEqual({
      id: 'search-1',
      success: true,
      message: expect.stringContaining('orphaned'),
    });
    expect(mockRunQuery).toHaveBeenCalledOnce();
    expect(mockRunQuery.mock.calls[0][1]).toContain('SET r.orphaned = true');
  });

  it('should return success:true even when no derivative relationships exist', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // combined query, no children

    const result = await searchMutations.deleteSearch(null, { id: 'leaf-search' }, CTX);

    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// searchMutations.forkSearch
// ===========================================================================

describe('searchMutations.forkSearch', () => {
  it('should create a new search inheriting keywords from parents when no override is given', async () => {
    const parentNode = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['chip', 'fab'] });

    // 1. parentCheck validation query
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(1) })]);
    // 2. Fetch all parent nodes (keywords + dates sourced from same query result)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: parentNode })]);
    // 3. CREATE forked search
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. DERIVED_FROM → driver.session().executeWrite() — NOT a runQuery call
    // 5. MERGE inherited filter presets
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. buildMatchEdges: no articles
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. Final MATCH to return node
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode({ ...SEARCH_PROPS, id: 'test-uuid-1234' }) })]);

    const result = await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1'], name: 'Forked Search' } },
      CTX,
    );

    expect(result).toMatchObject({ id: 'test-uuid-1234' });
    const createCypher = mockRunQuery.mock.calls[2][1] as string;
    expect(createCypher).toContain("status: 'ACTIVE'");
  });

  it('should use override keywords instead of parent keywords when provided', async () => {
    const parentNode = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['old-kw'] });

    // 1. parentCheck validation query
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(1) })]);
    // 2. Fetch parent nodes (override path: keywords not extracted, but fp.startDate still read)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: parentNode })]);
    // 3. CREATE
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. DERIVED_FROM → driver.session().executeWrite() — NOT a runQuery call
    // 5. inherit filters
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. buildMatchEdges
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. final MATCH
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1'], name: 'Forked', keywords: ['override-kw'] } },
      CTX,
    );

    const createParams = mockRunQuery.mock.calls[2][2] as any;
    expect(createParams.keywords).toEqual(['override-kw']);
  });

  it('should create DERIVED_FROM edges to every parent in parentIds', async () => {
    const p1 = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['a'] });
    const p2 = makeNode({ ...SEARCH_PROPS, id: 'parent-2', keywords: ['b'] });

    // 1. parentCheck validation query
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(2) })]);
    // 2. Fetch all parent nodes (keywords + dates from same query result)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: p1 }), makeRecord({ s: p2 })]);
    // 3. CREATE
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. DERIVED_FROM — driver.session().executeWrite() UNWIND batch, NOT runQuery
    // 5. inherit filters
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. buildMatchEdges
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. final MATCH
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1', 'parent-2'], name: 'Multi-parent Fork' } },
      CTX,
    );

    // DERIVED_FROM is now written via driver.session().executeWrite() in a single UNWIND batch
    expect(mockExecuteWrite).toHaveBeenCalledOnce();
    const txFn = mockExecuteWrite.mock.calls[0][0];
    const fakeTx = { run: vi.fn().mockResolvedValue({ records: [] }) };
    await txFn(fakeTx);
    const derivedCypher = fakeTx.run.mock.calls[0][0] as string;
    expect(derivedCypher).toContain('DERIVED_FROM');
    const derivedParams = fakeTx.run.mock.calls[0][1] as any;
    expect(derivedParams.parentIds).toEqual(expect.arrayContaining(['parent-1', 'parent-2']));
  });

  it('should link the forked search to a collection when collectionId is provided', async () => {
    // SOK-38: close search.ts line 277 — collectionId branch inside forkSearch
    const parentNode = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['chip'] });

    // 1. parentCheck validation query
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(1) })]);
    // 2. Fetch all parent nodes (keywords + dates from same query result)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: parentNode })]);
    // 3. CREATE forked search
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. DERIVED_FROM — driver.session().executeWrite() UNWIND batch, NOT runQuery
    // 5. MERGE inherited filter presets
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. MERGE collection CONTAINS — triggered by collectionId
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. buildMatchEdges
    mockRunQuery.mockResolvedValueOnce([]);
    // 8. Final MATCH to return node
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode({ ...SEARCH_PROPS, id: 'test-uuid-1234' }) })]);

    await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1'], name: 'Forked Into Collection', collectionId: 'col-42' } },
      CTX,
    );

    const containsCypher = mockRunQuery.mock.calls
      .find((c: any[]) => (c[1] as string).includes('MERGE (col)-[:CONTAINS'));
    expect(containsCypher).toBeDefined();
    expect(containsCypher![2]).toMatchObject({ colId: 'col-42' });
  });

  it('should throw an error immediately when parentIds is empty', async () => {
    await expect(
      searchMutations.forkSearch(null, { input: { parentIds: [], name: 'Bad Fork' } }, CTX),
    ).rejects.toThrow('parentIds must not be empty');

    // No database queries should have been issued
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it('should throw an error when parentIds exceeds the maximum allowed length', async () => {
    const tooManyIds = Array.from({ length: 11 }, (_, i) => `parent-${i}`);

    await expect(
      searchMutations.forkSearch(null, { input: { parentIds: tooManyIds, name: 'Oversized Fork' } }, CTX),
    ).rejects.toThrow('parentIds must not exceed 10 entries');

    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it('should throw an error when one or more parent IDs do not exist in the database', async () => {
    // parentCheck returns count 0 — none of the IDs matched
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(0) })]);

    await expect(
      searchMutations.forkSearch(null, { input: { parentIds: ['ghost-id'], name: 'Orphan Fork' } }, CTX),
    ).rejects.toThrow('One or more parent IDs not found');
  });

  it('should throw when the parent records query returns an empty result set', async () => {
    // parentCheck passes (count matches), but the subsequent MATCH for all parent nodes
    // returns no records — parentRecords[0] is undefined, causing a TypeError on .get('s').
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(1) })]); // parentCheck
    mockRunQuery.mockResolvedValueOnce([]); // parentRecords returns empty

    await expect(
      searchMutations.forkSearch(
        null,
        { input: { parentIds: ['parent-1'], name: 'Missing Parent Fork', keywords: ['chip'] } },
        CTX,
      ),
    ).rejects.toThrow();
  });
});

// ===========================================================================
// searchFieldResolvers
// ===========================================================================

describe('searchFieldResolvers.filters', () => {
  it('should return filters attached to the parent search', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-1', name: 'Tier 1', type: 'SOURCE_TIER', value: '1' }) }),
    ]);

    const result = await searchFieldResolvers.filters(SEARCH_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'fp-1' });
  });

  it('should return an empty array when the search has no attached filters', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await searchFieldResolvers.filters(SEARCH_PROPS as any, null, CTX);

    expect(result).toEqual([]);
  });
});

describe('searchFieldResolvers.collection', () => {
  it('should return the collection that contains this search', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ col: makeNode({ id: 'col-1', name: 'My Collection', createdAt: '2025-01-01' }) }),
    ]);

    const result = await searchFieldResolvers.collection(SEARCH_PROPS as any, null, CTX);

    expect(result).toMatchObject({ id: 'col-1' });
  });

  it('should return null when the search belongs to no collection', async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    const result = await searchFieldResolvers.collection(SEARCH_PROPS as any, null, CTX);

    expect(result).toBeNull();
  });
});

describe('searchFieldResolvers.parents', () => {
  it('should return all parent searches connected via DERIVED_FROM', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ p: makeNode({ ...SEARCH_PROPS, id: 'parent-1' }) }),
    ]);

    const result = await searchFieldResolvers.parents(SEARCH_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'parent-1' });
  });
});

describe('searchFieldResolvers.derivatives', () => {
  it('should return searches derived from the parent search', async () => {
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ d: makeNode({ ...SEARCH_PROPS, id: 'child-1' }) }),
    ]);

    const result = await searchFieldResolvers.derivatives(SEARCH_PROPS as any, null, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'child-1' });
  });
});

describe('searchFieldResolvers.articles', () => {
  it('should return articles matched by the search ordered by publishedAt desc', async () => {
    // First call: fetch HAS_FILTER presets (none for this search)
    mockRunQuery.mockResolvedValueOnce([]);
    // Second call: the articles query
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-1', headline: 'Test', body: 'body',
        url: 'http://x.com', publishedAt: '2025-06-01', sentiment: 'POSITIVE',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'art-1' });
  });

  it('should apply filter WHERE clauses when HAS_FILTER presets are present', async () => {
    // First call: fetch HAS_FILTER presets — one SENTIMENT filter
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-1', type: 'SENTIMENT', value: 'POSITIVE' }) }),
    ]);
    // Second call: the filtered articles query
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-2', headline: 'Positive story', body: 'body',
        url: 'http://x.com', publishedAt: '2025-06-02', sentiment: 'POSITIVE',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('a.sentiment = $sentimentValue_0');
    expect(params).toMatchObject({ sentimentValue_0: 'POSITIVE' });
  });

  it('should apply SKIP $offset when offset is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // no filters
    mockRunQuery.mockResolvedValueOnce([]); // articles query

    await searchFieldResolvers.articles(SEARCH_PROPS as any, { offset: 20 }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('SKIP $offset');
    expect(params).toMatchObject({ offset: 20 });
  });

  // ===========================================================================
  // SOK-68 — Filter preset query execution
  // ===========================================================================

  it('should return only POSITIVE articles when SENTIMENT=POSITIVE HAS_FILTER edge exists', async () => {
    // Call 1: HAS_FILTER fetch returns SENTIMENT POSITIVE preset
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-1', type: 'SENTIMENT', value: 'POSITIVE' }) }),
    ]);
    // Call 2: articles query returns one matching article
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-pos', headline: 'Good news', body: 'body',
        url: 'http://x.com', publishedAt: '2025-06-10', sentiment: 'POSITIVE',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'art-pos', sentiment: 'POSITIVE' });
    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('a.sentiment = $sentimentValue_0');
    expect(params).toMatchObject({ sentimentValue_0: 'POSITIVE' });
  });

  it('should apply src.tier filter when SOURCE_TIER=1 HAS_FILTER edge exists', async () => {
    // Call 1: HAS_FILTER fetch returns SOURCE_TIER preset with value '1'
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-2', type: 'SOURCE_TIER', value: '1' }) }),
    ]);
    // Call 2: articles query — returns tier-1 article
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-t1', headline: 'Tier-1 story', body: 'body',
        url: 'http://reuters.com', publishedAt: '2025-06-11', sentiment: 'NEUTRAL',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('src.tier = toInteger($tierValue_0)');
    expect(params).toMatchObject({ tierValue_0: '1' });
  });

  it('should apply src.region filter when REGION=north-america HAS_FILTER edge exists', async () => {
    // Call 1: HAS_FILTER fetch returns REGION preset
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-3', type: 'REGION', value: 'north-america' }) }),
    ]);
    // Call 2: articles query
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-na', headline: 'US story', body: 'body',
        url: 'http://nytimes.com', publishedAt: '2025-06-12', sentiment: 'NEUTRAL',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('src.region = $regionValue_0');
    expect(params).toMatchObject({ regionValue_0: 'north-america' });
  });

  it('should apply AND logic combining all WHERE clauses when multiple filters are active', async () => {
    // Call 1: HAS_FILTER fetch returns two presets — SENTIMENT and SOURCE_TIER
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ f: makeNode({ id: 'fp-1', type: 'SENTIMENT',   value: 'POSITIVE' }) }),
      makeRecord({ f: makeNode({ id: 'fp-2', type: 'SOURCE_TIER', value: '1'        }) }),
    ]);
    // Call 2: articles query — both clauses applied
    mockRunQuery.mockResolvedValueOnce([]);

    await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    const [, cypher] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('a.sentiment = $sentimentValue_0');
    expect(cypher).toContain('src.tier = toInteger($tierValue_1)');
    // Both clauses joined by AND
    expect(cypher).toMatch(/a\.sentiment.*AND.*src\.tier|src\.tier.*AND.*a\.sentiment/s);
  });

  it('should return all matched articles and omit WHERE clause when no HAS_FILTER presets exist', async () => {
    // Call 1: no filter presets on this search
    mockRunQuery.mockResolvedValueOnce([]);
    // Call 2: articles query — no WHERE filter applied
    mockRunQuery.mockResolvedValueOnce([
      makeRecord({ a: makeNode({
        id: 'art-any', headline: 'Any story', body: 'body',
        url: 'http://x.com', publishedAt: '2025-06-01', sentiment: 'NEUTRAL',
      }) }),
    ]);

    const result = await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    expect(result).toHaveLength(1);
    const [, cypher] = mockRunQuery.mock.calls[1];
    expect(cypher).not.toContain('WHERE');
  });

  // ===========================================================================
  // SOK-73 — Pagination
  // ===========================================================================

  it('should default offset to 0 and include LIMIT 200 when no offset is provided', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // no filters
    mockRunQuery.mockResolvedValueOnce([]); // articles query

    await searchFieldResolvers.articles(SEARCH_PROPS as any, {}, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('LIMIT 200');
    expect(cypher).toContain('SKIP $offset');
    expect(params).toMatchObject({ offset: 0 });
  });

  it('should pass offset=200 as SKIP parameter when fetching the second page', async () => {
    mockRunQuery.mockResolvedValueOnce([]); // no filters
    mockRunQuery.mockResolvedValueOnce([]); // articles query

    await searchFieldResolvers.articles(SEARCH_PROPS as any, { offset: 200 }, CTX);

    const [, cypher, params] = mockRunQuery.mock.calls[1];
    expect(cypher).toContain('SKIP $offset');
    expect(params).toMatchObject({ offset: 200 });
  });
});

// ===========================================================================
// SOK-76 — Fork filter inheritance
// ===========================================================================

describe('searchMutations.forkSearch — filter inheritance', () => {
  it('should create HAS_FILTER edges on the derivative from the single parent', async () => {
    const parentNode = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['chip'] });

    // 1. parentCheck validation
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(1) })]);
    // 2. Fetch parent records (keywords + first-parent dates)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: parentNode })]);
    // 3. CREATE forked search
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. MERGE DERIVED_FROM
    mockRunQuery.mockResolvedValueOnce([]);
    // 5. MERGE inherited HAS_FILTER — the call under test
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. buildMatchEdges
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. Final MATCH to return node
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode({ ...SEARCH_PROPS, id: 'test-uuid-1234' }) })]);

    await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1'], name: 'Filtered Fork', keywords: ['chip'] } },
      CTX,
    );

    // The filter-inheritance call must include the MERGE HAS_FILTER Cypher
    const filterInheritCall = mockRunQuery.mock.calls.find(
      (c: any[]) => (c[1] as string).includes('HAS_FILTER') && (c[1] as string).includes('MERGE'),
    );
    expect(filterInheritCall).toBeDefined();
    expect(filterInheritCall![2]).toMatchObject({ parentIds: ['parent-1'] });
  });

  it('should merge HAS_FILTER edges from all parents when multiple parents are provided', async () => {
    const p1 = makeNode({ ...SEARCH_PROPS, id: 'parent-1', keywords: ['chip'] });
    const p2 = makeNode({ ...SEARCH_PROPS, id: 'parent-2', keywords: ['fab']  });

    // 1. parentCheck — both parents found
    mockRunQuery.mockResolvedValueOnce([makeRecord({ c: makeInt(2) })]);
    // 2. Fetch parent records (keywords from both, first-parent dates)
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: p1 }), makeRecord({ s: p2 })]);
    // 3. CREATE forked search
    mockRunQuery.mockResolvedValueOnce([]);
    // 4. DERIVED_FROM parent-1
    mockRunQuery.mockResolvedValueOnce([]);
    // 5. DERIVED_FROM parent-2
    mockRunQuery.mockResolvedValueOnce([]);
    // 6. MERGE inherited HAS_FILTER — all parents
    mockRunQuery.mockResolvedValueOnce([]);
    // 7. buildMatchEdges
    mockRunQuery.mockResolvedValueOnce([]);
    // 8. Final MATCH
    mockRunQuery.mockResolvedValueOnce([makeRecord({ s: makeNode(SEARCH_PROPS) })]);

    await searchMutations.forkSearch(
      null,
      { input: { parentIds: ['parent-1', 'parent-2'], name: 'Multi-parent Filtered Fork' } },
      CTX,
    );

    // The filter-inheritance call must pass both parent IDs so all their filters are merged
    const filterInheritCall = mockRunQuery.mock.calls.find(
      (c: any[]) => (c[1] as string).includes('HAS_FILTER') && (c[1] as string).includes('MERGE'),
    );
    expect(filterInheritCall).toBeDefined();
    const inheritParams = filterInheritCall![2] as any;
    expect(inheritParams.parentIds).toEqual(expect.arrayContaining(['parent-1', 'parent-2']));
    expect(inheritParams.parentIds).toHaveLength(2);
  });
});
