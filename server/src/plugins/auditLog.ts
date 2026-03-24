/**
 * SEC-007: Apollo audit-log plugin.
 *
 * Logs every mutation to the audit trail as a structured JSON object.
 * Queries are skipped entirely — they carry no write-side security risk.
 *
 * What is logged:
 *   - operationName   — GraphQL operation name (null when absent)
 *   - operationType   — "query" | "mutation" | "subscription"
 *   - ip              — originating IP (x-forwarded-for → socket.remoteAddress)
 *   - hasErrors       — true when the response contains at least one error
 *   - variableKeys    — names of variables passed (never their values)
 *   - timestamp       — ISO 8601 UTC timestamp at the point willSendResponse fires
 *
 * Variable values are intentionally omitted: they may contain sensitive keyword
 * data that must not appear in logs.
 */

import { ApolloServerPlugin, GraphQLRequestContextWillSendResponse } from '@apollo/server';
import { ApolloContext } from '../types/index.js';

/** Derive the operation type string from the parsed document. */
function resolveOperationType(
  requestContext: GraphQLRequestContextWillSendResponse<ApolloContext>,
): string {
  const doc = requestContext.document;
  if (!doc) return 'unknown';

  const firstDef = doc.definitions[0];
  if (firstDef && firstDef.kind === 'OperationDefinition') {
    return firstDef.operation;
  }
  return 'unknown';
}

/** Extract the originating IP from the Express request. */
function resolveIp(requestContext: GraphQLRequestContextWillSendResponse<ApolloContext>): string {
  const req = requestContext.contextValue?.req;
  if (!req) return 'unknown';

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; the first entry is the client.
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }

  return req.socket?.remoteAddress ?? 'unknown';
}

export const auditLogPlugin: ApolloServerPlugin<ApolloContext> = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext) {
        const operationType = resolveOperationType(requestContext);

        // Only mutations go into the audit trail.
        // Queries are skipped — they have no write-side impact.
        if (operationType !== 'mutation') return;

        const operationName = requestContext.request.operationName ?? null;
        const variables = requestContext.request.variables ?? {};
        const variableKeys = Object.keys(variables);
        const hasErrors =
          Array.isArray(requestContext.response.body) ||
          (requestContext.response.body.kind === 'single' &&
            Array.isArray(requestContext.response.body.singleResult.errors) &&
            (requestContext.response.body.singleResult.errors?.length ?? 0) > 0);

        const entry = {
          audit: true,
          timestamp: new Date().toISOString(),
          operationName,
          operationType,
          ip: resolveIp(requestContext),
          hasErrors,
          variableKeys,
        };

        console.log(JSON.stringify(entry));
      },
    };
  },
};
