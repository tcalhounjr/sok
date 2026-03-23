/**
 * Neo4j driver mock factory.
 *
 * Resolvers call runQuery(driver, cypher, params).
 * runQuery calls driver.session() → session.run() → result.records, then session.close().
 *
 * This factory lets individual tests supply ordered record sequences via
 * mockRunQuery.mockResolvedValueOnce(...) without touching neo4j at all.
 */
import { vi } from 'vitest';
import type { Driver } from 'neo4j-driver';

// ---------------------------------------------------------------------------
// Minimal Neo4j Integer shim so resolvers can call .toNumber()
// ---------------------------------------------------------------------------
export function makeInt(n: number) {
  return { toNumber: () => n, low: n, high: 0 };
}

// ---------------------------------------------------------------------------
// Minimal Neo4j Node shim so toObject() can iterate .properties
// ---------------------------------------------------------------------------
export function makeNode(properties: Record<string, unknown>) {
  return { properties } as any;
}

// ---------------------------------------------------------------------------
// Minimal record shim — resolvers call r.get('key')
// ---------------------------------------------------------------------------
export function makeRecord(fields: Record<string, unknown>) {
  return {
    get: (key: string) => fields[key],
  } as any;
}

// ---------------------------------------------------------------------------
// The mock itself: vi.fn() wrapping the session→run→records chain.
// We patch the *module* so resolvers import the mocked version.
// ---------------------------------------------------------------------------

export const mockRunQuery = vi.fn();

export function makeMockDriver(): Driver {
  // The driver object only needs to satisfy the ApolloContext type.
  // runQuery is mocked at the module level in each test file.
  return {} as Driver;
}
