// =============================================================================
// Media Narrative Tracker — Neo4j Seed Script
// =============================================================================
// Usage:
//   node seed.js
//
// Requires env vars:
//   NEO4J_URI      e.g. neo4j+s://xxxx.databases.neo4j.io
//   NEO4J_USER     e.g. neo4j
//   NEO4J_PASSWORD your AuraDB password
//
// What this script does:
//   1. Wipes all existing nodes and relationships (idempotent re-runs)
//   2. Creates constraints and indexes
//   3. Ingests sources, authors, topics from articles.json
//   4. Ingests articles with PUBLISHED_BY, WRITTEN_BY, TAGGED_WITH relationships
//   5. Creates CO_OCCURS_WITH edges between topics that share articles
//   6. Seeds 3 demo SearchCOLLECTIONS
//   7. Seeds 5 demo Searches with keywords and date ranges
//   8. Seeds 4 demo FilterPresets
//   9. Wires HAS_FILTER and CONTAINS relationships
//  10. Seeds 2 derivative searches with DERIVED_FROM (multi-parent DAG example)
//  11. Creates MATCHES relationships between searches and articles
// =============================================================================

import neo4j from 'neo4j-driver';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, 'articles.json'), 'utf8'));

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function run(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result;
  } finally {
    await session.close();
  }
}

// -----------------------------------------------------------------------------
// Helper: match articles by keyword overlap (used to build MATCHES edges)
// Mirrors DD-2: checks headline + body for any keyword match
// -----------------------------------------------------------------------------
function articleMatchesSearch(article, keywords) {
  const text = (article.headline + ' ' + article.body).toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ---------------------------------------------------------------------------
  // 1. Wipe
  // ---------------------------------------------------------------------------
  console.log('🧹 Wiping existing data...');
  await run('MATCH (n) DETACH DELETE n');
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 2. Constraints & indexes
  // ---------------------------------------------------------------------------
  console.log('📐 Creating constraints and indexes...');
  const constraints = [
    'CREATE CONSTRAINT search_id IF NOT EXISTS FOR (s:Search) REQUIRE s.id IS UNIQUE',
    'CREATE CONSTRAINT filter_id IF NOT EXISTS FOR (f:FilterPreset) REQUIRE f.id IS UNIQUE',
    'CREATE CONSTRAINT collection_id IF NOT EXISTS FOR (c:Collection) REQUIRE c.id IS UNIQUE',
    'CREATE CONSTRAINT article_id IF NOT EXISTS FOR (a:Article) REQUIRE a.id IS UNIQUE',
    'CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE',
    'CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE',
    'CREATE CONSTRAINT author_id IF NOT EXISTS FOR (a:Author) REQUIRE a.id IS UNIQUE',
    'CREATE INDEX search_name      IF NOT EXISTS FOR (s:Search)  ON (s.name)',
    'CREATE INDEX search_status    IF NOT EXISTS FOR (s:Search)  ON (s.status)',
    'CREATE INDEX article_published IF NOT EXISTS FOR (a:Article) ON (a.publishedAt)',
    'CREATE INDEX article_sentiment IF NOT EXISTS FOR (a:Article) ON (a.sentiment)',
    'CREATE INDEX source_name   IF NOT EXISTS FOR (s:Source) ON (s.name)',
    'CREATE INDEX source_tier   IF NOT EXISTS FOR (s:Source) ON (s.tier)',
    'CREATE INDEX source_region IF NOT EXISTS FOR (s:Source) ON (s.region)',
  ];
  for (const c of constraints) {
    await run(c);
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 3. Sources
  // ---------------------------------------------------------------------------
  console.log(`📰 Seeding ${data.sources.length} sources...`);
  for (const s of data.sources) {
    await run(
      `MERGE (src:Source {id: $id})
       SET src.name = $name, src.domain = $domain,
           src.tier = $tier, src.region = $region, src.language = $language`,
      s
    );
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 4. Authors
  // ---------------------------------------------------------------------------
  console.log(`✍️  Seeding ${data.authors.length} authors...`);
  for (const a of data.authors) {
    await run(
      `MERGE (aut:Author {id: $id})
       SET aut.name = $name, aut.byline = $byline`,
      a
    );
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 5. Topics
  // ---------------------------------------------------------------------------
  console.log(`🏷️  Seeding ${data.topics.length} topics...`);
  for (const t of data.topics) {
    await run(
      `MERGE (top:Topic {id: $id})
       SET top.label = $label, top.category = $category`,
      t
    );
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 6. Articles + relationships
  // ---------------------------------------------------------------------------
  console.log(`📄 Seeding ${data.articles.length} articles...`);
  for (const a of data.articles) {
    await run(
      `MERGE (art:Article {id: $id})
       SET art.headline = $headline,
           art.body     = $body,
           art.url      = $url,
           art.publishedAt = date($publishedAt),
           art.sentiment   = $sentiment
       WITH art
       MATCH (src:Source {id: $sourceId})
       MERGE (art)-[:PUBLISHED_BY]->(src)
       WITH art
       MATCH (aut:Author {id: $authorId})
       MERGE (art)-[:WRITTEN_BY]->(aut)`,
      {
        id: a.id,
        headline: a.headline,
        body: a.body,
        url: a.url,
        publishedAt: a.publishedAt,
        sentiment: a.sentiment,
        sourceId: a.sourceId,
        authorId: a.authorId,
      }
    );
    // Topic edges
    for (const topicId of a.topicIds) {
      await run(
        `MATCH (art:Article {id: $articleId})
         MATCH (top:Topic {id: $topicId})
         MERGE (art)-[:TAGGED_WITH]->(top)`,
        { articleId: a.id, topicId }
      );
    }
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 7. CO_OCCURS_WITH edges between topics sharing articles
  // ---------------------------------------------------------------------------
  console.log('🔗 Building CO_OCCURS_WITH topic edges...');
  await run(`
    MATCH (t1:Topic)<-[:TAGGED_WITH]-(a:Article)-[:TAGGED_WITH]->(t2:Topic)
    WHERE id(t1) < id(t2)
    WITH t1, t2, count(a) AS freq
    MERGE (t1)-[r:CO_OCCURS_WITH]-(t2)
    SET r.frequency = freq
  `);
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 8. Collections
  // ---------------------------------------------------------------------------
  console.log('📁 Seeding collections...');
  const collections = [
    {
      id: 'col-001',
      name: 'EV & Clean Energy Intelligence',
      description: 'All searches covering electric vehicle policy, battery technology, and energy transition narratives.',
    },
    {
      id: 'col-002',
      name: 'Semiconductor & Supply Chain',
      description: 'Searches monitoring chip industry developments, export controls, and materials supply chain fragility.',
    },
    {
      id: 'col-003',
      name: 'AI Regulation Watch',
      description: 'Tracking legislative and regulatory developments in AI governance across the US, EU, and Asia.',
    },
  ];
  for (const c of collections) {
    await run(
      `MERGE (col:Collection {id: $id})
       SET col.name = $name, col.description = $description,
           col.createdAt = datetime()`,
      c
    );
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 9. Filter Presets
  // ---------------------------------------------------------------------------
  console.log('🎛️  Seeding filter presets...');
  const presets = [
    { id: 'fp-001', name: 'Tier 1 Sources Only',     type: 'SOURCE_TIER', value: '1'        },
    { id: 'fp-002', name: 'Negative Sentiment Only',  type: 'SENTIMENT',   value: 'NEGATIVE'  },
    { id: 'fp-003', name: 'APAC Region Focus',        type: 'REGION',      value: 'APAC'      },
    { id: 'fp-004', name: 'US Region Focus',          type: 'REGION',      value: 'US'        },
    { id: 'fp-005', name: 'EU Region Focus',          type: 'REGION',      value: 'EU'        },
    { id: 'fp-006', name: 'English Language Only',    type: 'LANGUAGE',    value: 'en'        },
    { id: 'fp-007', name: 'Positive Sentiment Only',  type: 'SENTIMENT',   value: 'POSITIVE'  },
    { id: 'fp-008', name: 'Oct 14–17 Window',         type: 'DATE_RANGE',  value: '2025-10-14,2025-10-17' },
  ];
  for (const p of presets) {
    await run(
      `MERGE (fp:FilterPreset {id: $id})
       SET fp.name = $name, fp.type = $type, fp.value = $value`,
      p
    );
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 10. Base Searches
  // ---------------------------------------------------------------------------
  console.log('🔍 Seeding base searches...');
  const searches = [
    {
      id: 'srch-001',
      name: 'Global EV Policy',
      keywords: ['EV', 'electric vehicle', 'zero emission', 'EV policy', 'battery'],
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      status: 'active',
      collectionId: 'col-001',
      filterIds: [],
    },
    {
      id: 'srch-002',
      name: 'Semiconductor Supply Chain Fragility',
      keywords: ['semiconductor', 'chip', 'TSMC', 'lithography', 'foundry', 'supply chain'],
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      status: 'active',
      collectionId: 'col-002',
      filterIds: ['fp-001'],
    },
    {
      id: 'srch-003',
      name: 'AI Regulation Global',
      keywords: ['AI regulation', 'AI Act', 'artificial intelligence', 'AI governance', 'FTC'],
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      status: 'active',
      collectionId: 'col-003',
      filterIds: ['fp-001', 'fp-006'],
    },
    {
      id: 'srch-004',
      name: 'Critical Minerals & Lithium',
      keywords: ['lithium', 'rare earth', 'critical mineral', 'gallium', 'germanium'],
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      status: 'active',
      collectionId: 'col-002',
      filterIds: [],
    },
    {
      id: 'srch-005',
      name: 'Battery Technology Breakthroughs',
      keywords: ['solid state battery', 'battery technology', 'electrolyte', 'energy density'],
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      status: 'active',
      collectionId: 'col-001',
      filterIds: ['fp-007'],
    },
  ];

  for (const s of searches) {
    await run(
      `MERGE (srch:Search {id: $id})
       SET srch.name = $name,
           srch.keywords = $keywords,
           srch.startDate = date($startDate),
           srch.endDate   = date($endDate),
           srch.status    = $status,
           srch.createdAt = datetime(),
           srch.updatedAt = datetime()`,
      {
        id: s.id, name: s.name, keywords: s.keywords,
        startDate: s.startDate, endDate: s.endDate, status: s.status,
      }
    );
    // CONTAINS
    await run(
      `MATCH (col:Collection {id: $colId})
       MATCH (srch:Search {id: $srchId})
       MERGE (col)-[:CONTAINS {addedAt: datetime()}]->(srch)`,
      { colId: s.collectionId, srchId: s.id }
    );
    // HAS_FILTER
    for (const fpId of s.filterIds) {
      await run(
        `MATCH (srch:Search {id: $srchId})
         MATCH (fp:FilterPreset {id: $fpId})
         MERGE (srch)-[:HAS_FILTER {appliedAt: datetime()}]->(fp)`,
        { srchId: s.id, fpId }
      );
    }
    // MATCHES — keyword match against seed corpus
    for (const article of data.articles) {
      if (articleMatchesSearch(article, s.keywords)) {
        await run(
          `MATCH (srch:Search {id: $srchId})
           MATCH (art:Article {id: $artId})
           MERGE (srch)-[:MATCHES {score: 1.0, matchedAt: datetime()}]->(art)`,
          { srchId: s.id, artId: article.id }
        );
      }
    }
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // 11. Derivative Searches (DAG demo — multi-parent fork)
  // ---------------------------------------------------------------------------
  console.log('🌿 Seeding derivative searches (DAG)...');

  // Derivative 1: single parent — EV Policy filtered to negative sentiment + APAC
  const deriv1 = {
    id: 'srch-006',
    name: 'EV Policy — Negative Sentiment, APAC',
    keywords: ['EV', 'electric vehicle', 'EV policy', 'battery'],
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    status: 'active',
    parentIds: ['srch-001'],
    filterIds: ['fp-002', 'fp-003'],
    collectionId: 'col-001',
  };

  // Derivative 2: multi-parent fork — inherits from both Semiconductor search
  // AND Critical Minerals search to study their intersection
  const deriv2 = {
    id: 'srch-007',
    name: 'Semiconductor–Minerals Nexus (Multi-Parent)',
    keywords: ['semiconductor', 'lithium', 'rare earth', 'gallium', 'supply chain', 'export'],
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    status: 'active',
    parentIds: ['srch-002', 'srch-004'],   // ← two parents — DAG demonstration
    filterIds: ['fp-001', 'fp-002'],
    collectionId: 'col-002',
  };

  for (const d of [deriv1, deriv2]) {
    await run(
      `MERGE (srch:Search {id: $id})
       SET srch.name = $name,
           srch.keywords = $keywords,
           srch.startDate = date($startDate),
           srch.endDate   = date($endDate),
           srch.status    = $status,
           srch.createdAt = datetime(),
           srch.updatedAt = datetime()`,
      {
        id: d.id, name: d.name, keywords: d.keywords,
        startDate: d.startDate, endDate: d.endDate, status: d.status,
      }
    );
    // DERIVED_FROM — one edge per parent (DAG)
    for (const parentId of d.parentIds) {
      await run(
        `MATCH (child:Search {id: $childId})
         MATCH (parent:Search {id: $parentId})
         MERGE (child)-[:DERIVED_FROM {createdAt: datetime(), orphaned: false}]->(parent)`,
        { childId: d.id, parentId }
      );
    }
    // Collection
    await run(
      `MATCH (col:Collection {id: $colId})
       MATCH (srch:Search {id: $srchId})
       MERGE (col)-[:CONTAINS {addedAt: datetime()}]->(srch)`,
      { colId: d.collectionId, srchId: d.id }
    );
    // Filters
    for (const fpId of d.filterIds) {
      await run(
        `MATCH (srch:Search {id: $srchId})
         MATCH (fp:FilterPreset {id: $fpId})
         MERGE (srch)-[:HAS_FILTER {appliedAt: datetime()}]->(fp)`,
        { srchId: d.id, fpId }
      );
    }
    // Matches
    for (const article of data.articles) {
      if (articleMatchesSearch(article, d.keywords)) {
        await run(
          `MATCH (srch:Search {id: $srchId})
           MATCH (art:Article {id: $artId})
           MERGE (srch)-[:MATCHES {score: 1.0, matchedAt: datetime()}]->(art)`,
          { srchId: d.id, artId: article.id }
        );
      }
    }
  }
  console.log('   Done.\n');

  // ---------------------------------------------------------------------------
  // Done — summary
  // ---------------------------------------------------------------------------
  const counts = await run(`
    MATCH (s:Search)    WITH count(s) AS searches
    MATCH (a:Article)   WITH searches, count(a) AS articles
    MATCH (f:FilterPreset) WITH searches, articles, count(f) AS presets
    MATCH (c:Collection)   WITH searches, articles, presets, count(c) AS collections
    MATCH ()-[r:MATCHES]->() WITH searches, articles, presets, collections, count(r) AS matches
    RETURN searches, articles, presets, collections, matches
  `);
  const row = counts.records[0];
  console.log('✅ Seed complete!\n');
  console.log('   Searches:    ', row.get('searches').toNumber());
  console.log('   Articles:    ', row.get('articles').toNumber());
  console.log('   FilterPresets:', row.get('presets').toNumber());
  console.log('   Collections: ', row.get('collections').toNumber());
  console.log('   MATCHES edges:', row.get('matches').toNumber());
  console.log('');
}

seed()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => driver.close());
