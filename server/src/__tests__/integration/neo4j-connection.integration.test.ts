/**
 * Integration test: Neo4j real Cypher query (SOK-54)
 *
 * Runs a live Cypher query against the Neo4j AuraDB instance.
 * All three required secrets must be present — if any are missing the test
 * fails immediately with a clear error naming each missing variable.
 * Silent skip is never permitted per SOK-54 mandate.
 *
 * Uses: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD (read from .env.local via dotenv)
 *
 * Rules:
 *   - Never creates real billable resources — queries are read-only.
 *   - Never uses production credentials for write operations.
 *   - Driver is closed after the suite completes.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import neo4j, { Driver } from 'neo4j-driver';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// .env.local lives at the monorepo root, one directory above the server package.
// process.cwd() is the server/ directory when vitest is invoked via npm test there.
dotenvConfig({ path: resolve(process.cwd(), '../.env.local') });

// ---------------------------------------------------------------------------
// Secret validation — fail loudly, never silently skip
// ---------------------------------------------------------------------------

const REQUIRED_SECRETS = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'] as const;

function assertSecrets(): void {
  const missing = REQUIRED_SECRETS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[integration] Missing required secret(s): ${missing.join(', ')}. ` +
        'Set these environment variables in .env.local before running integration tests.',
    );
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

let driver: Driver;

describe('Integration: Neo4j real Cypher query', () => {
  beforeAll(() => {
    // Validate secrets before attempting any connection.
    // This throws — which vitest surfaces as a suite-level failure — rather
    // than silently skipping or producing a misleading connection error.
    assertSecrets();

    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!),
    );
  });

  afterAll(async () => {
    if (driver) await driver.close();
  });

  it('should establish a connection and verify connectivity with the Neo4j server', async () => {
    await expect(driver.verifyConnectivity()).resolves.not.toThrow();
  });

  it('should execute a read-only Cypher query and return a result set without error', async () => {
    const session = driver.session();
    try {
      const result = await session.run('RETURN 1 AS n');
      expect(result.records).toHaveLength(1);
      const value = result.records[0].get('n');
      // Neo4j integers are returned as Integer objects; .toNumber() or .low works
      const num = neo4j.isInt(value) ? value.toNumber() : Number(value);
      expect(num).toBe(1);
    } finally {
      await session.close();
    }
  });

  it('should be able to query node labels present in the database without error', async () => {
    const session = driver.session();
    try {
      // CALL db.labels() lists all labels — safe read-only system procedure
      const result = await session.run('CALL db.labels() YIELD label RETURN label LIMIT 20');
      // The result may be empty in a fresh database — what matters is no error is thrown
      expect(Array.isArray(result.records)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it('should return zero or more Search nodes with the expected schema properties', async () => {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (s:Search) RETURN s LIMIT 5',
      );
      // A fresh or seeded database may have zero Search nodes — both are valid
      expect(Array.isArray(result.records)).toBe(true);

      for (const record of result.records) {
        const node = record.get('s');
        const props = node.properties as Record<string, unknown>;
        // Every Search node must carry at minimum an id and name field
        expect(typeof props.id).toBe('string');
        expect(typeof props.name).toBe('string');
      }
    } finally {
      await session.close();
    }
  });
});
