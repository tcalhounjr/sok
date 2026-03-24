/**
 * SOK-53: JWT authentication helpers.
 *
 * Strategy (PoC):
 *   - Tokens are signed HS256 JWTs with a single hardcoded secret (AUTH_SECRET).
 *   - The Bearer token is read from the Authorization header on every request.
 *   - A valid token yields a callerId (the `sub` claim).
 *   - An absent or invalid token yields callerId = null; the request is not
 *     rejected here — rejection happens in requireAuth(), called at the start
 *     of every mutation resolver.
 *   - Queries are intentionally left open so the GraphQL playground remains
 *     usable without a token during development.
 *
 * Upgrade path: swap the hardcoded secret for an asymmetric key pair and wire
 * in a proper user store when multi-tenancy is introduced.
 */

import { jwtVerify } from 'jose';
import { GraphQLError } from 'graphql';
import type { Request } from 'express';

const BEARER_PREFIX = 'Bearer ';
const JWT_ALG = 'HS256';

/**
 * Returns the raw Bearer token string from the Authorization header,
 * or null if the header is absent or not a Bearer token.
 */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
}

/**
 * Verifies the Bearer token on the incoming request and returns the
 * caller's subject (`sub` claim) if the token is valid, or null otherwise.
 *
 * Never throws — an invalid or missing token silently yields null so that
 * unauthenticated query traffic is handled gracefully.
 */
export async function resolveCallerId(req: Request): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn('[auth] AUTH_SECRET is not set — all requests treated as unauthenticated');
    return null;
  }

  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretBytes, { algorithms: [JWT_ALG], requiredClaims: ['exp'] });
    const sub = payload.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    // Invalid signature, expired token, malformed JWT, etc.
    // Return null — requireAuth() will surface the rejection to the caller.
    return null;
  }
}

/**
 * Guard for mutation resolvers.
 *
 * Throws a GraphQL-friendly error when callerId is null (unauthenticated).
 * Call this at the top of every mutation resolver before touching the driver.
 *
 * @example
 *   const { driver, callerId } = context;
 *   requireAuth(callerId);
 *   // ... proceed with mutation
 */
export function requireAuth(callerId: string | null): asserts callerId is string {
  if (!callerId) {
    throw new GraphQLError('A valid Bearer token is required to perform mutations', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}
