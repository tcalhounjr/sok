import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { getDriver } from './neo4j/driver.js';
import { applySchema } from './neo4j/schema.js';
import { ApolloContext } from './types/index.js';
import { auditLogPlugin } from './plugins/auditLog.js';
import { resolveCallerId } from './auth/middleware.js';
import { startScheduler } from './scheduler.js';
import 'dotenv/config';

const driver = getDriver();

// SOK-7: apply constraints and indexes on every boot (IF NOT EXISTS — safe to repeat)
await applySchema(driver);

// SOK-107/108: keep Neo4j Aura active + refresh article dates weekly
startScheduler(driver);

// Allowed origins — local dev + Vercel production.
// Set CORS_ORIGIN in Railway env vars once you have your Vercel URL.
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:4173',   // Vite preview
  ...(process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) ?? []),
].filter(Boolean) as string[];

// Strict CORS for the GraphQL endpoint: only listed origins are allowed.
// Requests with no origin (e.g. server-side curl) are rejected here.
const graphqlCorsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(new Error('CORS: requests without an origin are not permitted on the GraphQL endpoint'));
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

// Permissive CORS for the health endpoint only: no-origin requests are allowed
// so that Railway health checks, curl, and similar infrastructure tooling work.
const healthCorsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
};

const app = express();
app.use(express.json({ limit: '100kb' }));

// Health check — infrastructure tooling and Railway probes hit this route.
app.get('/health', cors(healthCorsOptions), (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Never expose stack traces in API responses — suppress regardless of NODE_ENV.
// Internal errors are logged server-side by the audit plugin; callers only see
// the message, which must not contain sensitive implementation details.
const required = ['AUTH_SECRET', 'NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`FATAL: required environment variable ${key} is not set`);
    process.exit(1);
  }
}

const server = new ApolloServer<ApolloContext>({
  typeDefs,
  resolvers,
  plugins: [auditLogPlugin],
  includeStacktraceInErrorResponses: false,
  introspection: process.env.NODE_ENV !== 'production',
});
await server.start();

// Cast to any to resolve the dual-@types/express version conflict
// between @apollo/server's bundled types and the express package types.
app.use('/', cors(graphqlCorsOptions), expressMiddleware(server, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: async ({ req }: any): Promise<ApolloContext> => ({
    driver,
    req,
    callerId: await resolveCallerId(req),
  }),
}) as any);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`🚀 Apollo Server ready at http://localhost:${port}/`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
