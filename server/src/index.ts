import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { getDriver } from './neo4j/driver.js';
import { applySchema } from './neo4j/schema.js';
import { Driver } from 'neo4j-driver';
import 'dotenv/config';

export interface ApolloContext {
  driver: Driver;
}

const driver = getDriver();

// SOK-7: apply constraints and indexes on every boot (IF NOT EXISTS — safe to repeat)
await applySchema(driver);

// Allowed origins — local dev + Vercel production.
// Set CORS_ORIGIN in Railway env vars once you have your Vercel URL.
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:4173',   // Vite preview
  process.env.CORS_ORIGIN,   // Vercel production URL
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

const app = express();
app.use(express.json());

const server = new ApolloServer<ApolloContext>({ typeDefs, resolvers });
await server.start();

// Cast to any to resolve the dual-@types/express version conflict
// between @apollo/server's bundled types and the express package types.
app.use('/', cors(corsOptions), expressMiddleware(server, {
  context: async (): Promise<ApolloContext> => ({ driver }),
}) as any);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`🚀 Apollo Server ready at http://localhost:${port}/`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
