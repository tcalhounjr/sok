/**
 * SOK-7: Neo4j schema constraints and indexes.
 *
 * applySchema() is called once at server startup. All DDL statements use
 * IF NOT EXISTS so the function is safe to call on every boot — it is a
 * no-op when the constraints and indexes already exist.
 */

import { Driver } from 'neo4j-driver';

const CONSTRAINT_DDL: string[] = [
  'CREATE CONSTRAINT search_id     IF NOT EXISTS FOR (n:Search)       REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT filterpreset_id IF NOT EXISTS FOR (n:FilterPreset) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT collection_id IF NOT EXISTS FOR (n:Collection)   REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT article_id    IF NOT EXISTS FOR (n:Article)      REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT source_id     IF NOT EXISTS FOR (n:Source)       REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT topic_id      IF NOT EXISTS FOR (n:Topic)        REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT author_id     IF NOT EXISTS FOR (n:Author)       REQUIRE n.id IS UNIQUE',
];

const INDEX_DDL: string[] = [
  'CREATE INDEX search_name      IF NOT EXISTS FOR (n:Search)  ON (n.name)',
  'CREATE INDEX search_status    IF NOT EXISTS FOR (n:Search)  ON (n.status)',
  'CREATE INDEX article_published_at IF NOT EXISTS FOR (n:Article) ON (n.publishedAt)',
  'CREATE INDEX article_sentiment IF NOT EXISTS FOR (n:Article) ON (n.sentiment)',
  'CREATE INDEX source_name      IF NOT EXISTS FOR (n:Source)  ON (n.name)',
];

/**
 * Apply all uniqueness constraints and indexes required by the data model.
 * Safe to call on every startup — each statement uses IF NOT EXISTS.
 */
export async function applySchema(driver: Driver): Promise<void> {
  const session = driver.session();
  try {
    for (const ddl of [...CONSTRAINT_DDL, ...INDEX_DDL]) {
      await session.run(ddl);
    }
    console.log(`Schema: applied ${CONSTRAINT_DDL.length} constraints and ${INDEX_DDL.length} indexes.`);
  } finally {
    await session.close();
  }
}
