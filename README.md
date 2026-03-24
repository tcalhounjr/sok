# SØK

**Pronounced "surk" — Norwegian for "search."**

SØK is a full-stack media intelligence platform for creating, organizing, and analyzing searches across a corpus of news articles and media sources. Users build persistent search definitions, layer on reusable filters, fork derivative searches, and trace the full lineage of how a query evolved — all connected to live narrative trend dashboards.

The project is a proof-of-concept designed to demonstrate the complete exploration → enrichment → insight workflow that sits at the heart of modern media monitoring products.

---

## Overview

### Problem

Media analysts, communications professionals, and research teams need to monitor how topics, brands, and narratives evolve across sources over time. Existing tools treat search as a one-time action. SØK treats search as a **persistent, composable asset** — a first-class entity in the data model that can be saved, reused, refined, forked, and traced.

### What it works with

- A seeded corpus of news articles tagged with sentiment (POSITIVE / NEUTRAL / NEGATIVE), source metadata (tier, region, language), authors, and topics.
- Keyword-based search definitions that match against article headlines and body text.
- Reusable filter presets layered on top of searches to narrow results by sentiment, source tier, region, language, or date range.
- Graph relationships stored in Neo4j that encode how searches are connected: which searches derive from which, which filters are shared, which articles match, and how topics co-occur.

### Who it is for

The primary user is a media analyst who returns to the same searches daily, refines them without losing earlier versions, monitors how coverage volume and sentiment shift over time, and needs to share specific search configurations.

---

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** (dev server and build)
- **React Router v7** (client-side routing)
- **Apollo Client 3** (GraphQL data layer, cache-and-network fetch policy)
- **Tailwind CSS 3** (utility-first styling)
- **Recharts** (volume and sentiment charts)
- **Lucide React** (icons)

### Backend
- **Node.js** with **TypeScript**
- **Apollo Server 4** on **Express 5** (GraphQL API)
- **Neo4j Driver 5** (graph database client)
- **jose** (JWT verification for mutation auth)

### Database
- **Neo4j** (graph database — stores searches, filters, collections, articles, sources, authors, topics, and all relationships between them)

### Deployment
- **Vercel** — frontend (`client/`)
- **Railway** — backend (`server/`)

---

## Features

### Search Library

The home screen. Displays all saved searches as cards in a two-column grid, with summary statistics at the top (total searches, active collections, new results today). Three tab views are available: All Queries, High Priority (searches with at least one derivative), and Archived.

A sidebar shows pinned collections with their active query counts, a recent intelligence feed, and an API utilization meter.

**Design choice:** The library is the analyst's persistent workspace, not a transient results page. Every search is a saved object that can be returned to, not a query you have to retype.

**Workflow role:** Entry point for all daily work. Navigate here to see what you're tracking and jump into any search.

---

### Search Builder

The create and edit form for a search definition. Broken into three sections:

1. **Identity and Context** — search name, temporal scope (start and end date), and refinement level.
2. **Logical Operators and Keywords** — include terms (Enter or comma to add, displayed as removable tags) and exclude terms.
3. **Topic Taxonomy** — assign the search to one of four categories: Technology, Geopolitics, Economics, or Supply Chain.

A live projection rail on the right sidebar updates as keywords are entered, showing estimated article volume from the seed corpus, a mini bar chart, and the top contributing sources. This projection queries the database against the current keyword set before the search is saved.

The form can be submitted as Draft (saves without activating) or deployed immediately as Active.

**Design choice:** Volume projection runs against the live seed corpus so users can calibrate keyword specificity before committing. The precision alert warns when terms are too broad.

**Workflow role:** Where all searches begin. Also used to edit existing searches — accessed from the Search Detail page.

---

### Search Detail and Filter Editor

The detail view for a saved search. Shows the search name, status badge, and three panels:

- **Base Keywords** — the include terms defined at creation, shown as tagged entries.
- **Refinement Presets** — filter presets currently applied to this search. Each filter shows its type and value and can be removed inline. Presets can also be saved or imported from the Filter Preset Library.
- **Live Preview** — a streaming feed of the most recent articles matched to this search, showing source, publication time, headline, and sentiment indicator.

Two action buttons appear at the top right: **Version History** (navigates to the Lineage Explorer) and **Fork Search** (opens the Fork Modal).

Signal density (total matched articles) and a true match estimate are shown below the filter panel, with a direct link to Narrative Trends.

**Design choice:** The filter editor lives on the detail page, not in the builder. Filters are a refinement step applied after a search is created — they are layered on top of the base query, not baked into it. This keeps the base search clean and makes the filter relationship explicit.

**Workflow role:** The daily working view. Analysts return here to check results, apply or remove filters, and navigate to trends.

---

### Fork Search

Accessible from the Search Detail page via the Fork Search button. Opens a modal that creates a new derivative search from one or more parent searches.

The fork inherits the parent's keywords (or a union of keywords from multiple parents) and all applied filter presets. The inherited configuration is shown read-only in the modal so the analyst can confirm what carries over. The derivative name defaults to `{parent name} (Derivative)` and can be edited before submission.

Up to 10 parent searches can be specified. Additional parents beyond the primary are selected from a search picker within the modal. When forked, the new search node is linked to its parents in Neo4j via `DERIVED_FROM` relationships.

**Design choice:** The fork model uses a directed acyclic graph (DAG) rather than a simple parent-child reference. This allows a derivative to merge logic from multiple parent searches — modelling the real-world case where an analyst synthesizes two separate search streams into a single focused derivative. The `ForkSearchInput` type uses `parentIds: [ID!]!` rather than a single `parentId` to make multi-parent forks a first-class operation.

**Workflow role:** Forking is the primary mechanism for search evolution. Instead of modifying an existing search and losing its history, analysts fork it, make changes to the derivative, and preserve the original. This is the core of the composable search model.

---

### Lineage Explorer

Accessed from the Search Detail page via the Version History button. Displays the full ancestry and derivative tree of a search as a vertical DAG visualization.

Nodes are rendered in rows grouped by depth. Ancestors (positive depth) appear above the focal node; descendants (negative depth) appear below. Each node card shows the search name, status, and keyword summary. Clicking a node opens a Node Inspector panel on the right with full details.

A LineageStats panel at the bottom shows total nodes, maximum depth, and orphan count (nodes whose parent was deleted — the `DERIVED_FROM` relationship is marked `orphaned: true` rather than deleted outright).

**Design choice:** The depth convention uses positive integers for ancestors and negative integers for descendants, relative to the requested node at depth 0. This allows the UI to determine direction from a single signed integer without an additional `direction` field. The orphan count is surfaced explicitly because it is operationally meaningful — an orphaned derivative has lost the provenance context that justified its existence.

**Workflow role:** Auditing and discovery. Analysts use this to understand where a search came from, what has been derived from it, and whether any derivative branches have been orphaned by upstream deletions.

---

### Narrative Trends

Accessed from the Search Detail page via the View Narrative Trends button. Shows the full analytics view for a single search across a selectable time window (L7D, L30D, L90D).

Four visualization panels are shown:

- **Volume Chart** — daily article count over the selected period, with sentiment breakdown per day (positive/neutral/negative stacked or overlaid).
- **Sentiment Breakdown** — overall positive/neutral/negative percentages for the period, with total article count and optional period-over-period shift.
- **Topic Cloud** — the top topics co-occurring across matched articles, ranked by frequency.
- **Source Rankings** — the top publishing sources contributing to this search's results, shown with article counts and share percentages.

A Recent Narrative Shifts panel at the bottom shows annotated events (emergent topics, sentiment shifts, anomalies).

All analytics are computed live from Neo4j via Cypher aggregation queries — no pre-computed caches.

**Design choice:** The interval selector (L7D / L30D / L90D) triggers a fresh query against the database rather than slicing a cached dataset. This was a deliberate PoC choice to demonstrate live graph aggregation: sentiment breakdowns, top sources, and topic distributions are all derived from the `MATCHES`, `PUBLISHED_BY`, and `TAGGED_WITH` relationships in the graph at query time.

**Workflow role:** The insight destination. After building and refining a search, analysts come here to read the narrative — how volume is trending, which sources are driving coverage, and how sentiment is distributed.

---

### Filter Preset Library

The global library of reusable filter presets. Accessible from the navigation. Presets are sorted by usage (number of searches they are applied to), with the most-active preset displayed in a featured card at the top and the rest in a three-column grid.

Five filter types are supported:

| Type | What it filters |
|---|---|
| `SENTIMENT` | Narrows results to POSITIVE, NEUTRAL, or NEGATIVE articles |
| `SOURCE_TIER` | Restricts to sources of a specific tier (1 = highest authority) |
| `REGION` | Limits to sources from a specific geographic region |
| `LANGUAGE` | Restricts to sources publishing in a specific language |
| `DATE_RANGE` | Applies a fixed temporal window |

Presets can be created and edited via a modal form. Once created, a preset can be applied to any number of searches from the Search Detail page without duplicating the filter definition.

**Design choice:** Filters are a separate entity in the graph, connected to searches via `HAS_FILTER` relationships. This means a filter defined once can be reused across dozens of searches and updated in one place. When a search is forked, all parent filter relationships are automatically inherited by the derivative.

**Workflow role:** Curation tooling. Analysts define filter logic once — "only Tier 1 English sources in North America" — and reuse that preset across all relevant searches rather than re-entering the same constraints repeatedly.

---

### Collection Management

A workspace for grouping related searches into named collections. The left sidebar lists all collections; selecting one opens the collection in the main panel showing all member searches as cards.

Searches can be added to the active collection via a quick-add bar that accepts either a search ID or a name substring (partial match). Searches can be removed from a collection without deleting them. Deleting a collection removes the grouping but preserves all member searches.

New collections can be created directly from this screen.

**Design choice:** Collections are organizational containers only — they create `CONTAINS` relationships in Neo4j between collection nodes and search nodes, but they do not own or constrain the searches they contain. A search can exist without a collection, and removing it from a collection does not affect the search itself.

**Workflow role:** Organizational layer for analysts managing multiple workstreams. A collection might represent a client account, a topic area, or a project sprint.

---

## How to Use Each Feature

### 1. Search Library (home)

1. Open the application — the Search Library is the default view.
2. The three stat cards at the top show total searches, active collections, and searches updated in the last 24 hours.
3. Use the tab bar to filter: **All Queries** shows everything, **High Priority** shows searches that have at least one derivative, **Archived** shows deactivated searches.
4. Click any search card to open its detail view.
5. Click the **Refresh All** button to refetch the latest data from the server.
6. The right sidebar shows up to three pinned collections — click any to jump directly to that collection in the Collection Management screen.

---

### 2. Search Builder (create a new search)

1. From the Search Library, click **New Search** or navigate to `/search/new`.
2. In the **Identity and Context** section, enter a name for the search and set the temporal scope (start and end date).
3. In the **Logical Operators and Keywords** section, type a term in the INCLUDE field and press Enter or comma to add it as a tag. Add as many terms as needed. Use the EXCLUDE field to add terms that should disqualify an article.
4. In the **Topic Taxonomy** section, select the category that best describes the search.
5. Watch the right sidebar — as you type keywords, the **Live Projection** panel updates with an estimated article count from the corpus and the top contributing sources.
6. When the configuration looks right, click **Deploy Analysis** to save and activate the search immediately, or **Save as Draft** to save without activating.
7. After deploying, you are taken directly to the Search Detail page for the new search.

**To edit an existing search:** From the Search Detail page, there is no dedicated edit button in the current build — navigate to `/search/{id}/edit` directly. The form loads with all existing values pre-filled.

---

### 3. Search Detail and Filter Editor

1. Click a search card in the Search Library to open its detail view.
2. The three-column panel shows base keywords (left), refinement presets and signal stats (center), and a live article preview (right).
3. To remove a filter preset, click the X button on any filter in the Refinement Presets panel. The removal takes effect immediately.
4. To apply an existing filter preset to this search, use the **Import** button in the Refinement Presets panel (this invokes `applyFilterToSearch` via the Filter Preset Library workflow — see section 6 for creating presets first).
5. Click **View Narrative Trends** to go to the analytics view for this search.
6. Click **Version History** to see the lineage tree.
7. Click **Fork Search** to create a derivative.

---

### 4. Fork Search

1. From a Search Detail page, click **Fork Search**.
2. The modal shows the primary parent (the current search) with its inherited keywords and filters in a read-only panel.
3. Edit the derivative name (defaults to `{parent name} (Derivative)`).
4. Optionally, click **Add another parent** to include up to 9 additional parent searches. A search picker appears — type to filter, click a result to add it. Additional parents contribute their keywords to the fork (union of all parent keyword sets).
5. Review the inherited configuration in the locked panel.
6. Click **Fork and Create**. You are navigated to the new derivative's Search Detail page.

Note: the fork creates an isolated search node. Future changes to the original search do not propagate to the derivative.

---

### 5. Lineage Explorer

1. From a Search Detail page, click **Version History**.
2. The explorer renders the full DAG tree for the current search. Ancestor searches appear in rows above; the focal search appears at depth 0; derivative searches appear in rows below.
3. Click any node card to open the **Node Inspector** panel on the right, which shows the search's name, status, keyword list, and depth in the tree.
4. The **Lineage Stats** panel at the bottom shows total node count, maximum depth, and the number of orphaned derivatives (searches whose parent was deleted).
5. To explore a different branch, navigate to that search's detail page and open its lineage from there.

---

### 6. Narrative Trends

1. From a Search Detail page, click **View Narrative Trends**.
2. The page loads showing data for the last 7 days by default.
3. Use the interval selector (L7D / L30D / L90D) at the top right to change the analysis window. Each selection triggers a fresh query.
4. The **Volume Chart** shows daily article counts with sentiment breakdown.
5. The **Sentiment Breakdown** panel shows the percentage split for the period.
6. The **Topic Cloud** shows the most frequently co-occurring topics across matched articles.
7. The **Source Rankings** panel shows which publishing sources are contributing the most articles to this search.
8. The **Recent Narrative Shifts** panel at the bottom highlights emergent topics, sentiment transitions, and coverage anomalies.

---

### 7. Filter Preset Library

1. Navigate to **Presets** from the main navigation (or go to `/presets`).
2. The most-used preset is featured at the top. The remaining presets are displayed in a grid.
3. To create a new preset, click **Create Preset**. A modal opens with fields for name, type (SENTIMENT / SOURCE_TIER / REGION / LANGUAGE / DATE_RANGE), and value.
4. To edit an existing preset, click the edit icon on the featured preset card or the overflow menu on a grid card.
5. Once a preset exists, apply it to a search from that search's detail page using the Import button in the Refinement Presets panel.

---

### 8. Collection Management

1. Navigate to **Collections** from the main navigation (or go to `/collections`).
2. The left sidebar lists all existing collections. Click any collection to open it.
3. The main panel shows all searches in the active collection as cards.
4. To add a search to the collection, type a search name (partial match is supported) or a search ID into the **Quick-Add Search** field and press Enter or click **Add**.
5. To remove a search from the collection, use the remove option on the search card within the collection view.
6. To create a new collection, click **New Collection** in the sidebar, enter a name, and confirm.
7. Deleting a collection removes the grouping only — all member searches are preserved.

---

## Local Development Setup

### Prerequisites

- Node.js 20 or later
- A running Neo4j instance (Neo4j AuraDB free tier works; local Neo4j Desktop also works)
- npm

### Environment Variables

**Server** (`server/.env`):

```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
AUTH_SECRET=any-long-random-string-for-jwt-signing
CORS_ORIGIN=http://localhost:5173
PORT=4000
```

**Client** (`client/.env.local`):

```
VITE_API_URL=http://localhost:4000
```

`VITE_API_URL` is optional for local development — the client falls back to `http://localhost:4000` automatically if neither `VITE_API_URL` nor `VITE_GRAPHQL_URL` is set.

### Install and Run

**Server:**

```bash
cd server
npm install
npm run dev
```

The server starts on `http://localhost:4000`. The GraphQL playground is available at that URL in development (introspection is disabled in production).

**Client:**

```bash
cd client
npm install
npm run dev
```

The client starts on `http://localhost:5173`.

### Seed the Database

The seed script populates Neo4j with a static corpus of articles, sources, authors, and topics, along with sample searches, filter presets, and collections.

```bash
cd server
npm run seed
```

The seed command runs `node ../seed/seed.js` from the server directory. The seed script reads the same `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` environment variables as the server — ensure `server/.env` is present before running.

### Run Tests

**Client:**

```bash
cd client
npm test
```

**Server:**

```bash
cd server
npm test
```

Both test suites use Vitest with coverage.

### Authentication Note

All GraphQL mutations require a valid HS256 JWT Bearer token. The token must be signed with the value of `AUTH_SECRET` and must include an `exp` claim. Queries are intentionally open during development so the GraphQL playground remains usable without a token. To mint a token for local development, sign a payload of `{ sub: "dev-user", exp: <unix timestamp> }` with the same secret set in `AUTH_SECRET`.
