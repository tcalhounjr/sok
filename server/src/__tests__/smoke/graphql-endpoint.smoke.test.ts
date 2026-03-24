/**
 * Smoke test: GraphQL endpoint introspection (SOK-54)
 *
 * Hits the live staging API with a GraphQL introspection query and asserts
 * that the server responds with a valid schema shape.
 *
 * Rules:
 *   - Skips automatically when STAGING_URL is not set.
 *   - Never mutates state — read-only introspection only.
 *   - All URLs and credentials come from environment variables.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const STAGING_URL = process.env.STAGING_URL;

const INTROSPECTION_QUERY = JSON.stringify({
  query: `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        types { name kind }
      }
    }
  `,
});

describe('Smoke: GraphQL endpoint introspection', () => {
  beforeAll(() => {
    if (!STAGING_URL) {
      console.warn(
        '[smoke] STAGING_URL is not set — skipping all smoke tests in this file.',
      );
    }
  });

  it('should return HTTP 200 for a GraphQL introspection query', async () => {
    if (!STAGING_URL) return;

    const res = await fetch(STAGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: INTROSPECTION_QUERY,
    });

    expect(res.status).toBe(200);
  });

  it('should return a response body that is valid JSON with a data key', async () => {
    if (!STAGING_URL) return;

    const res = await fetch(STAGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: INTROSPECTION_QUERY,
    });

    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('data');
    expect(body.errors).toBeUndefined();
  });

  it('should expose a __schema object with a queryType', async () => {
    if (!STAGING_URL) return;

    const res = await fetch(STAGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: INTROSPECTION_QUERY,
    });

    const body = await res.json() as { data: { __schema: { queryType: { name: string }; mutationType: { name: string } } } };
    expect(body.data.__schema.queryType.name).toBe('Query');
  });

  it('should expose a mutationType in the schema', async () => {
    if (!STAGING_URL) return;

    const res = await fetch(STAGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: INTROSPECTION_QUERY,
    });

    const body = await res.json() as { data: { __schema: { mutationType: { name: string } } } };
    expect(body.data.__schema.mutationType.name).toBe('Mutation');
  });

  it('should list at least one named type in the schema types array', async () => {
    if (!STAGING_URL) return;

    const res = await fetch(STAGING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: INTROSPECTION_QUERY,
    });

    const body = await res.json() as { data: { __schema: { types: Array<{ name: string; kind: string }> } } };
    const types = body.data.__schema.types;
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);

    // The Search type must be present — it is the primary domain type
    const searchType = types.find(t => t.name === 'Search');
    expect(searchType).toBeDefined();
    expect(searchType?.kind).toBe('OBJECT');
  });
});
