import { Driver } from 'neo4j-driver';
import cron from 'node-cron';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// shiftArticleDates — mirrors seed/seed.js logic (SOK-82)
// Shifts all publishedAt dates so the newest lands ~3 days ago.
// ---------------------------------------------------------------------------
interface RawArticle {
  id: string;
  publishedAt: string;
  [key: string]: unknown;
}

function shiftArticleDates(articles: RawArticle[]): RawArticle[] {
  const maxMs = Math.max(...articles.map(a => new Date(a.publishedAt).getTime()));
  const targetMs = Date.now() - 3 * 86_400_000;
  const deltaMs = targetMs - maxMs;
  return articles.map(a => ({
    ...a,
    publishedAt: new Date(new Date(a.publishedAt).getTime() + deltaMs)
      .toISOString()
      .split('T')[0],
  }));
}

// ---------------------------------------------------------------------------
// Keep-alive — open a session, run RETURN 1, close.
// Prevents Neo4j Aura from pausing after ~3 days of inactivity.
// ---------------------------------------------------------------------------
async function keepAlive(driver: Driver): Promise<void> {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('[scheduler] Keep-alive ping sent');
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// refreshArticleDates — update only Article.publishedAt in Neo4j.
// Reads the original articles.json, re-shifts dates, and patches each node.
// No nodes or relationships are deleted — user-created data is preserved.
// ---------------------------------------------------------------------------
async function refreshArticleDates(driver: Driver): Promise<void> {
  const articlesPath = join(__dirname, '../../seed/articles.json');
  const rawData = JSON.parse(readFileSync(articlesPath, 'utf8')) as { articles: RawArticle[] };
  const articles = shiftArticleDates(rawData.articles);

  const session = driver.session();
  try {
    for (const article of articles) {
      await session.run(
        'MATCH (a:Article {id: $id}) SET a.publishedAt = date($publishedAt)',
        { id: article.id, publishedAt: article.publishedAt },
      );
    }
    console.log(`[scheduler] Article dates refreshed (${articles.length} articles)`);
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// startScheduler — register both cron jobs against the shared driver.
// Called once at server startup from index.ts.
// ---------------------------------------------------------------------------
export function startScheduler(driver: Driver): void {
  // Keep-alive: every 4 hours
  cron.schedule('0 */4 * * *', () => {
    keepAlive(driver).catch(err =>
      console.error('[scheduler] Keep-alive failed:', err),
    );
  }, { timezone: 'UTC' });

  // Weekly article date refresh: every Sunday at 02:00 UTC
  cron.schedule('0 2 * * 0', () => {
    refreshArticleDates(driver).catch(err =>
      console.error('[scheduler] Date refresh failed:', err),
    );
  }, { timezone: 'UTC' });

  console.log('[scheduler] Jobs registered: keep-alive (every 4h), date refresh (weekly Sun 02:00 UTC)');
}
