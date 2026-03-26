import { runQuery, toObject } from '../neo4j/driver.js';
import { randomUUID } from 'crypto';
import { Driver, Record as Neo4jRecord } from 'neo4j-driver';
import { GraphQLError } from 'graphql';
import {
  ApolloContext, SearchNode,
  DeleteResult, SearchLineage, LineageNode,
} from '../types/index.js';
import { requireAuth } from '../auth/middleware.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildMatchEdges(driver: Driver, searchId: string, keywords: string[]): Promise<void> {
  await runQuery(driver, `
    MATCH (s:Search {id: $sid})
    MATCH (a:Article)
    WHERE any(kw IN $keywords WHERE toLower(a.headline + ' ' + a.body) CONTAINS toLower(kw))
    MERGE (s)-[:MATCHES {score: 1.0, matchedAt: datetime()}]->(a)
  `, { sid: searchId, keywords });
}

// ---------------------------------------------------------------------------
// Search Queries
// ---------------------------------------------------------------------------

const MAX_KEYWORD_LENGTH = 200;

export const searchQueries = {
  search: async (
    _parent: unknown,
    { id }: { id: string },
    { driver, callerId }: ApolloContext
  ): Promise<SearchNode | null> => {
    requireAuth(callerId);
    const records = await runQuery(driver, 'MATCH (s:Search {id: $id}) RETURN s', { id });
    return records.length ? toObject(records[0].get('s')) as SearchNode : null;
  },

  searches: async (
    _parent: unknown,
    { collectionId, keyword, status }: { collectionId?: string; keyword?: string; status?: string },
    { driver, callerId }: ApolloContext
  ): Promise<SearchNode[]> => {
    requireAuth(callerId);

    if (keyword !== undefined && keyword.length > MAX_KEYWORD_LENGTH) {
      throw new GraphQLError(
        `keyword must not exceed ${MAX_KEYWORD_LENGTH} characters`,
        { extensions: { code: 'BAD_USER_INPUT' } },
      );
    }

    let cypher = 'MATCH (s:Search)';
    const params: Record<string, unknown> = {};
    const conditions: string[] = [];

    if (collectionId) {
      cypher = 'MATCH (col:Collection {id: $colId})-[:CONTAINS]->(s:Search)';
      params.colId = collectionId;
    }
    if (status)  { conditions.push('s.status = $status');   params.status  = status; }
    if (keyword) {
      conditions.push('any(kw IN s.keywords WHERE toLower(kw) CONTAINS toLower($keyword))');
      params.keyword = keyword;
    }
    if (conditions.length) cypher += ` WHERE ${conditions.join(' AND ')}`;
    cypher += ' RETURN s ORDER BY s.updatedAt DESC LIMIT 100';

    const records = await runQuery(driver, cypher, params);
    return records.map(r => toObject(r.get('s')) as SearchNode);
  },

  /**
   * Resolves the full lineage tree for a given search node.
   *
   * Depth convention: ancestor nodes carry a positive depth (distance above
   * the requested node), while descendant nodes carry a negative depth
   * (distance below the requested node). The requested node itself appears
   * at depth 0. This allows callers to distinguish direction without a
   * separate field.
   */
  searchLineage: async (
    _parent: unknown,
    { id }: { id: string },
    { driver, callerId }: ApolloContext
  ): Promise<SearchLineage> => {
    requireAuth(callerId);
    const ancestorRecords = await runQuery(driver, `
      MATCH path = (s:Search {id: $id})-[:DERIVED_FROM*0..15]->(ancestor:Search)
      RETURN ancestor, length(path) AS depth,
             NOT EXISTS { (ancestor)-[:DERIVED_FROM]->(:Search) } AS isRoot
    `, { id });

    const descendantRecords = await runQuery(driver, `
      MATCH path = (s:Search {id: $id})<-[:DERIVED_FROM*1..15]-(descendant:Search)
      RETURN descendant, length(path) AS depth
    `, { id });

    const orphanResult = await runQuery(driver, `
      MATCH (child:Search)-[r:DERIVED_FROM {orphaned: true}]->(ancestor:Search)
      WHERE ancestor.id = $id OR (ancestor)-[:DERIVED_FROM*]->(:Search {id: $id})
      RETURN count(child) AS c
    `, { id });

    const nodes: LineageNode[] = [];
    let maxDepth = 0;
    let root: SearchNode | null = null;

    for (const r of ancestorRecords) {
      const depth = r.get('depth').toNumber();
      const search = toObject(r.get('ancestor')) as SearchNode;
      const nodeIsRoot = r.get('isRoot') as boolean;
      if (depth > maxDepth) maxDepth = depth;
      if (nodeIsRoot && root === null) root = search;
      nodes.push({ search, depth, isRoot: nodeIsRoot });
    }

    for (const r of descendantRecords) {
      const depth = r.get('depth').toNumber();
      const search = toObject(r.get('descendant')) as SearchNode;
      nodes.push({ search, depth: -depth, isRoot: false });
    }

    return {
      root,
      nodes,
      totalNodes: nodes.length,
      maxDepth,
      orphanCount: orphanResult[0]?.get('c').toNumber() ?? 0,
    };
  },
};

// ---------------------------------------------------------------------------
// Search Mutations
// ---------------------------------------------------------------------------

export const searchMutations = {
  createSearch: async (
    _parent: unknown,
    { input }: { input: {
      name: string; keywords: string[]; startDate?: string;
      endDate?: string; status?: string; collectionId?: string;
    }},
    { driver, callerId }: ApolloContext
  ): Promise<SearchNode> => {
    requireAuth(callerId);
    const id = randomUUID();
    const now = new Date().toISOString();

    const records = await runQuery(driver, `
      CREATE (s:Search {
        id: $id, name: $name, keywords: $keywords,
        startDate: date($startDate), endDate: date($endDate),
        status: $status, createdAt: datetime($now), updatedAt: datetime($now)
      }) RETURN s
    `, {
      id, name: input.name, keywords: input.keywords,
      startDate: input.startDate ?? `${new Date().getFullYear()}-01-01`,
      endDate:   input.endDate   ?? `${new Date().getFullYear()}-12-31`,
      status:    input.status    ?? 'ACTIVE',
      now,
    });

    const search = toObject(records[0].get('s')) as SearchNode;

    if (input.collectionId) {
      await runQuery(driver, `
        MATCH (col:Collection {id: $colId}) MATCH (s:Search {id: $id})
        MERGE (col)-[:CONTAINS {addedAt: datetime()}]->(s)
      `, { colId: input.collectionId, id });
    }

    await buildMatchEdges(driver, id, input.keywords);
    return search;
  },

  updateSearch: async (
    _parent: unknown,
    { id, input }: { id: string; input: {
      name?: string; keywords?: string[]; startDate?: string;
      endDate?: string; status?: string;
    }},
    { driver, callerId }: ApolloContext
  ): Promise<SearchNode> => {
    requireAuth(callerId);
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id, now: new Date().toISOString() };

    if (input.name      !== undefined) { setClauses.push('s.name = $name');                 params.name      = input.name; }
    if (input.keywords  !== undefined) { setClauses.push('s.keywords = $keywords');         params.keywords  = input.keywords; }
    if (input.startDate !== undefined) { setClauses.push('s.startDate = date($startDate)'); params.startDate = input.startDate; }
    if (input.endDate   !== undefined) { setClauses.push('s.endDate = date($endDate)');     params.endDate   = input.endDate; }
    if (input.status    !== undefined) { setClauses.push('s.status = $status');             params.status    = input.status; }
    setClauses.push('s.updatedAt = datetime($now)');

    const records = await runQuery(driver,
      `MATCH (s:Search {id: $id}) SET ${setClauses.join(', ')} RETURN s`, params);

    if (records.length === 0) {
      throw new GraphQLError(`Search with id '${id}' not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (input.keywords !== undefined) {
      await runQuery(driver, 'MATCH (s:Search {id: $id})-[r:MATCHES]->() DELETE r', { id });
      await buildMatchEdges(driver, id, input.keywords);
    }

    return toObject(records[0].get('s')) as SearchNode;
  },

  deleteSearch: async (
    _parent: unknown,
    { id }: { id: string },
    { driver, callerId }: ApolloContext
  ): Promise<DeleteResult> => {
    requireAuth(callerId);
    await runQuery(driver, `
      MATCH (s:Search {id: $id})
      OPTIONAL MATCH (child:Search)-[r:DERIVED_FROM]->(s)
      SET r.orphaned = true
      WITH s
      DETACH DELETE s
    `, { id });
    return { id, success: true, message: 'Search deleted. Derivative relationships marked orphaned.' };
  },

  forkSearch: async (
    _parent: unknown,
    { input }: { input: {
      parentIds: string[]; name: string;
      keywords?: string[]; collectionId?: string;
    }},
    { driver, callerId }: ApolloContext
  ): Promise<SearchNode> => {
    requireAuth(callerId);
    const { parentIds, name, keywords: overrideKeywords, collectionId } = input;

    if (parentIds.length === 0) {
      throw new Error('parentIds must not be empty');
    }

    const MAX_PARENT_IDS = 10;
    if (parentIds.length > MAX_PARENT_IDS) {
      throw new Error(`parentIds must not exceed ${MAX_PARENT_IDS} entries`);
    }

    const parentCheck = await runQuery(driver,
      'MATCH (s:Search) WHERE s.id IN $ids RETURN count(s) AS c', { ids: parentIds });
    if (parentCheck[0].get('c').toNumber() !== parentIds.length) {
      throw new Error('One or more parent IDs not found');
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const currentYear = new Date().getFullYear();
    const defaultStartDate = `${currentYear}-01-01`;
    const defaultEndDate   = `${currentYear}-12-31`;

    let keywords = overrideKeywords ?? [];
    const parentRecords = await runQuery(driver,
      'MATCH (s:Search) WHERE s.id IN $ids RETURN s', { ids: parentIds });
    if (keywords.length === 0) {
      const allKws = new Set<string>();
      for (const r of parentRecords) {
        for (const kw of (r.get('s').properties.keywords as string[])) allKws.add(kw);
      }
      keywords = [...allKws];
    }

    const fp = toObject(parentRecords[0].get('s')) as SearchNode;

    await runQuery(driver, `
      CREATE (s:Search {
        id: $id, name: $name, keywords: $keywords,
        startDate: date($startDate), endDate: date($endDate),
        status: 'ACTIVE', createdAt: datetime($now), updatedAt: datetime($now)
      })
    `, { id, name, keywords, startDate: fp.startDate ?? defaultStartDate, endDate: fp.endDate ?? defaultEndDate, now });

    for (const parentId of parentIds) {
      await runQuery(driver, `
        MATCH (child:Search {id: $childId}) MATCH (parent:Search {id: $parentId})
        MERGE (child)-[:DERIVED_FROM {createdAt: datetime(), orphaned: false}]->(parent)
      `, { childId: id, parentId });
    }

    await runQuery(driver, `
      MATCH (parent:Search) WHERE parent.id IN $parentIds
      MATCH (parent)-[:HAS_FILTER]->(f:FilterPreset)
      MATCH (child:Search {id: $childId})
      MERGE (child)-[:HAS_FILTER {appliedAt: datetime()}]->(f)
    `, { parentIds, childId: id });

    if (collectionId) {
      await runQuery(driver, `
        MATCH (col:Collection {id: $colId}) MATCH (s:Search {id: $id})
        MERGE (col)-[:CONTAINS {addedAt: datetime()}]->(s)
      `, { colId: collectionId, id });
    }

    await buildMatchEdges(driver, id, keywords);

    const records = await runQuery(driver, 'MATCH (s:Search {id: $id}) RETURN s', { id });
    return toObject(records[0].get('s')) as SearchNode;
  },
};

// ---------------------------------------------------------------------------
// Search field resolvers
// ---------------------------------------------------------------------------

export const searchFieldResolvers = {
  filters: async (parent: SearchNode, _args: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (s:Search {id: $id})-[:HAS_FILTER]->(f:FilterPreset) RETURN f',
      { id: parent.id });
    return records.map(r => toObject(r.get('f')));
  },

  collection: async (parent: SearchNode, _args: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (col:Collection)-[:CONTAINS]->(s:Search {id: $id}) RETURN col',
      { id: parent.id });
    return records.length ? toObject(records[0].get('col')) : null;
  },

  parents: async (parent: SearchNode, _args: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (s:Search {id: $id})-[:DERIVED_FROM]->(p:Search) RETURN p',
      { id: parent.id });
    return records.map(r => toObject(r.get('p')));
  },

  derivatives: async (parent: SearchNode, _args: unknown, { driver }: ApolloContext) => {
    const records = await runQuery(driver,
      'MATCH (d:Search)-[:DERIVED_FROM]->(s:Search {id: $id}) RETURN d',
      { id: parent.id });
    return records.map(r => toObject(r.get('d')));
  },

  articles: async (
    parent: SearchNode,
    { offset = 0 }: { offset?: number },
    { driver }: ApolloContext
  ) => {
    // Fetch all FilterPreset nodes attached to this search via HAS_FILTER edges.
    const filterRecords = await runQuery(driver,
      'MATCH (s:Search {id: $id})-[:HAS_FILTER]->(f:FilterPreset) RETURN f',
      { id: parent.id });

    const filters = filterRecords.map(r => toObject(r.get('f')) as { type: string; value: string });

    // Base query — join source node so SOURCE_TIER / REGION / LANGUAGE filters can reference it.
    let cypher = `
      MATCH (s:Search {id: $id})-[:MATCHES]->(a:Article)
      MATCH (a)-[:PUBLISHED_BY]->(src:Source)
    `;

    const whereClauses: string[] = [];
    const params: Record<string, unknown> = { id: parent.id, offset };

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      switch (filter.type) {
        case 'SENTIMENT': {
          const p = `sentimentValue_${i}`;
          whereClauses.push(`a.sentiment = $${p}`);
          params[p] = filter.value;
          break;
        }
        case 'SOURCE_TIER': {
          const p = `tierValue_${i}`;
          whereClauses.push(`src.tier = toInteger($${p})`);
          params[p] = filter.value;
          break;
        }
        case 'REGION': {
          const p = `regionValue_${i}`;
          whereClauses.push(`src.region = $${p}`);
          params[p] = filter.value;
          break;
        }
        case 'LANGUAGE': {
          const p = `languageValue_${i}`;
          whereClauses.push(`a.language = $${p}`);
          params[p] = filter.value;
          break;
        }
        case 'DATE_RANGE': {
          // Value format: "startDate,endDate" (YYYY-MM-DD,YYYY-MM-DD)
          const parts = filter.value.split(',');
          if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
            console.warn('[filter] Skipping malformed DATE_RANGE filter value:', filter.value);
            break;
          }
          const ps = `dateRangeStart_${i}`;
          const pe = `dateRangeEnd_${i}`;
          whereClauses.push(`a.publishedAt >= $${ps} AND a.publishedAt <= $${pe}`);
          params[ps] = parts[0].trim();
          params[pe] = parts[1].trim();
          break;
        }
      }
    }

    if (whereClauses.length > 0) {
      cypher += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    cypher += ' RETURN a ORDER BY a.publishedAt DESC SKIP toInteger($offset) LIMIT 200';

    const records = await runQuery(driver, cypher, params);
    return records.map(r => toObject(r.get('a')));
  },
};
