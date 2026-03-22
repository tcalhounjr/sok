# Product Requirements Document
## Media Narrative Tracker
### Portfolio Project — Showcasing Search, Graph, and Analytics Platform Engineering

**Version:** 0.3
**Status:** Active
**Last Updated:** 2026-03-22

---

## 1. Overview

### Core Concept

A full-stack media intelligence platform that allows users to create, save, organize, and reuse searches across a corpus of news articles and media sources. Users build base searches, layer on filters to produce derivative searches, and connect those searches to downstream narrative dashboards — demonstrating the full exploration → enrichment → insight workflow that sits at the heart of modern media monitoring products like Meltwater.

### Why This Problem

Media analysts, communications professionals, and research teams constantly need to:
- Monitor how topics, brands, and narratives evolve over time across sources
- Reuse search logic without rebuilding from scratch
- Share and fork searches across teams
- Move from raw search results to actionable narrative insights in a single workflow

Existing tools treat search as a one-time action. This platform treats search as a **persistent, composable asset** — a first-class entity in the data model.

### Portfolio Signal

This project is explicitly designed to demonstrate the skills described in the Meltwater Staff PM role:
- **Core Search & Asset Services** — search creation, persistence, organization, reuse
- **Search Filtering & Metadata** — layered filters, reusable filter patterns
- **Cross-Product Workflows** — saved searches feeding narrative dashboards and monitoring

---

## 2. Goals

### PoC Goals

- Demonstrate full CRUD on search assets with a working Neo4j graph backend
- Show composable search: users fork a base search, add filters, and save a derivative
- Surface results in a narrative trend view that updates based on the active search
- Expose a clean GraphQL API via Apollo that other surfaces could consume
- Make the graph model legible — the relationships between searches, filters, topics, and sources should be visible and meaningful

### Success Criteria

| Criterion | Target |
|---|---|
| Search CRUD roundtrip | Create, read, update, delete a search with all metadata intact |
| Search forking | Derivative search inherits parent filters and can add its own |
| Filter reusability | A filter defined once can be applied to multiple searches |
| Downstream connection | At least one saved search drives a live narrative trend chart |
| Graph traversal | Neo4j query returns: search → filters → results → sources → topics in a single traversal |
| Apollo API coverage | All core entities exposed via GraphQL with full CRUD mutations |

### Out of Scope (PoC)

- Real-time news ingestion pipeline (use seeded static dataset)
- User authentication and multi-tenancy
- Team sharing and permissions model
- Mobile experience
- NLP or ML-based entity extraction (use pre-tagged seed data)
- Billing or usage limits

---

## 3. Users & Use Cases

### Primary User (PoC)

**The Media Analyst** — a professional responsible for monitoring how a topic, brand, or narrative is covered across news sources over time. They need to:
- Build and save searches that they return to daily
- Refine those searches without losing the original version
- See how coverage volume and sentiment shift over time
- Share specific search configurations with colleagues

### Core Use Cases

**UC-1: Create a Base Search**
A user defines a search with keywords, topic tags, and a date range. The search is saved as a named asset with a unique ID, owner, and creation timestamp.

**UC-2: Fork and Extend a Search**
A user takes an existing saved search and creates a derivative by adding filters (source tier, sentiment, region, language). The derivative maintains a `DERIVED_FROM` relationship to the parent in the graph. Changes to filters on the derivative do not affect the parent.

**UC-3: Organize Searches into Collections**
A user groups related searches into a named collection (e.g., "Tesla Brand Monitoring Q2"). Collections are graph nodes with `CONTAINS` relationships to individual searches.

**UC-4: Apply Reusable Filters**
A user creates a filter preset (e.g., "Tier 1 US Sources Only") and applies it to multiple searches. The filter is a graph node with `APPLIED_TO` relationships — updating the filter definition propagates to all connected searches.

**UC-5: View Narrative Trends**
A user selects a saved search and navigates to a trends view showing: coverage volume over time, top sources, top co-occurring topics, and sentiment distribution. The view is computed from the search's current filter state.

**UC-6: Update a Search**
A user renames a search, changes its keyword set, or updates its date range. Version history is preserved as graph metadata.

**UC-7: Delete a Search**
A user deletes a search. Derivative searches that were forked from it are preserved but their `DERIVED_FROM` relationship is marked as `orphaned`.

---

## 4. Data Model (Neo4j Graph Schema)

### Node Types

| Node Label | Key Properties |
|---|---|
| `Search` | `id`, `name`, `keywords[]`, `createdAt`, `updatedAt`, `status` |
| `FilterPreset` | `id`, `name`, `type` (sentiment/source/region/language/date), `value` |
| `Collection` | `id`, `name`, `description`, `createdAt` |
| `Article` | `id`, `headline`, `url`, `publishedAt`, `body`, `sentiment` |
| `Source` | `id`, `name`, `domain`, `tier`, `region`, `language` |
| `Topic` | `id`, `label`, `category` |
| `Author` | `id`, `name`, `byline` |

### Relationship Types

| Relationship | From | To | Properties |
|---|---|---|---|
| `DERIVED_FROM` | `Search` | `Search` | `createdAt`, `orphaned` |
| `HAS_FILTER` | `Search` | `FilterPreset` | `appliedAt` |
| `CONTAINS` | `Collection` | `Search` | `addedAt` |
| `MATCHES` | `Search` | `Article` | `score`, `matchedAt` |
| `PUBLISHED_BY` | `Article` | `Source` | — |
| `TAGGED_WITH` | `Article` | `Topic` | `weight` |
| `WRITTEN_BY` | `Article` | `Author` | — |
| `CO_OCCURS_WITH` | `Topic` | `Topic` | `frequency`, `searchId` |

### Key Graph Traversals

```
// Get full search context: filters + results + sources + topics
MATCH (s:Search {id: $id})
OPTIONAL MATCH (s)-[:HAS_FILTER]->(f:FilterPreset)
OPTIONAL MATCH (s)-[:MATCHES]->(a:Article)-[:PUBLISHED_BY]->(src:Source)
OPTIONAL MATCH (a)-[:TAGGED_WITH]->(t:Topic)
RETURN s, collect(f), collect(a), collect(src), collect(t)

// Get lineage: all ancestors and descendants of a search
MATCH path = (s:Search {id: $id})-[:DERIVED_FROM*]->(:Search)
RETURN path

// Get filter reuse: all searches using a given filter preset
MATCH (f:FilterPreset {id: $id})<-[:HAS_FILTER]-(s:Search)
RETURN s
```

---

## 5. GraphQL API (Apollo)

### Core Types

```graphql
type Search {
  id: ID!
  name: String!
  keywords: [String!]!
  filters: [FilterPreset!]!
  collection: Collection
  derivedFrom: Search
  derivatives: [Search!]!
  articles: [Article!]!
  createdAt: String!
  updatedAt: String!
}

type FilterPreset {
  id: ID!
  name: String!
  type: FilterType!
  value: String!
  appliedTo: [Search!]!
}

type Collection {
  id: ID!
  name: String!
  description: String
  searches: [Search!]!
  createdAt: String!
}

type Article {
  id: ID!
  headline: String!
  url: String!
  publishedAt: String!
  sentiment: Sentiment!
  source: Source!
  topics: [Topic!]!
  author: Author
}

enum FilterType {
  SENTIMENT
  SOURCE_TIER
  REGION
  LANGUAGE
  DATE_RANGE
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}
```

### Queries

```graphql
type Query {
  search(id: ID!): Search
  searches(collectionId: ID, keyword: String): [Search!]!
  searchLineage(id: ID!): SearchLineage!
  collection(id: ID!): Collection
  collections: [Collection!]!
  filterPreset(id: ID!): FilterPreset
  filterPresets: [FilterPreset!]!
  narrativeTrends(searchId: ID!, interval: String!): NarrativeTrends!
}
```

### Mutations

```graphql
type Mutation {
  createSearch(input: CreateSearchInput!): Search!
  updateSearch(id: ID!, input: UpdateSearchInput!): Search!
  deleteSearch(id: ID!): DeleteResult!
  forkSearch(id: ID!, name: String!): Search!

  createFilterPreset(input: CreateFilterPresetInput!): FilterPreset!
  updateFilterPreset(id: ID!, input: UpdateFilterPresetInput!): FilterPreset!
  deleteFilterPreset(id: ID!): DeleteResult!
  applyFilterToSearch(filterId: ID!, searchId: ID!): Search!
  removeFilterFromSearch(filterId: ID!, searchId: ID!): Search!

  createCollection(input: CreateCollectionInput!): Collection!
  updateCollection(id: ID!, input: UpdateCollectionInput!): Collection!
  deleteCollection(id: ID!): DeleteResult!
  addSearchToCollection(searchId: ID!, collectionId: ID!): Collection!
  removeSearchFromCollection(searchId: ID!, collectionId: ID!): Collection!
}
```

---

## 6. Feature Requirements

### 6.1 Search Management

- Users can create a search with: name, keyword list, optional date range, optional topic tags
- Searches are persisted as Neo4j nodes with full metadata
- Users can edit any field on a search after creation
- Users can delete a search; derivatives are preserved with `orphaned: true` on their `DERIVED_FROM` relationship
- Searches display a lineage indicator if they are derived from another search

### 6.2 Search Forking

- Any saved search can be forked from the search detail view
- The fork inherits all keywords and filters from the parent at the moment of forking
- Forked searches are independent — changes to either do not propagate to the other
- The UI surfaces the parent search name and a link to the lineage view
- Lineage view shows full ancestor/descendant tree for any search

### 6.3 Filter Presets

- Users can define named filter presets of the following types: Sentiment, Source Tier, Region, Language, Date Range
- Presets can be applied to multiple searches simultaneously
- Searches display all currently applied filter presets
- Updating a filter preset reflects immediately on all searches it is applied to
- Filter presets can be removed from a search without deletion
- Users can view which searches a given preset is applied to

### 6.4 Collections

- Users can create named collections to group related searches
- A search can belong to at most one collection (PoC scope)
- Collections display count of searches and last updated timestamp
- Collections can be renamed or deleted; deleting a collection does not delete its searches

### 6.5 Narrative Trends View

- Activated from any saved search
- Displays: coverage volume over time (bar chart by day/week), sentiment breakdown (stacked or donut), top 5 sources by article count, top 10 co-occurring topics
- Trend view is computed from the search's current keyword + filter state
- Users can switch between parent and derivative searches and see the trends update

### 6.6 Seed Data

- PoC ships with a static seeded dataset of ~500–1,000 pre-tagged articles
- Articles cover 2–3 topic domains (e.g., EV policy, AI regulation, social media legislation) to allow meaningful filter differentiation
- Articles have pre-assigned sentiment, source tier, region, language, and topic tags

---

## 7. User Experience

### Design System

All screens are governed by **`DESIGN.md`** (located at the project root). `DESIGN.md` is the single source of truth for color tokens, surface hierarchy, typography, elevation, component behavior, and the No-Line Rule. Every build and design decision must be consistent with it. Do not make component-level styling decisions that contradict `DESIGN.md`.

---

### Screen Reference

Each screen entry below includes:
- **Screenshot** — the target visual for the fully built screen
- **Layout reference** — the HTML file showing component structure and layout at full fidelity
- **Use cases satisfied** — cross-reference to Section 3
- **Flow** — cross-reference to `user_flow_use_case_map.md`

---

#### Search Library Dashboard
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/search-library-dashboard-screen.png` |
| Layout reference | `søk/screens/search-library-dashboard-screen.html` |

**Purpose:** Home base. Displays all saved searches with keyword tags, filter count, growth signals, and last updated timestamp. Right rail surfaces pinned collections and a recent intelligence feed.

**Use cases:** UC-1 (entry point), UC-6 (edit via card menu), UC-7 (delete via card menu)

**Flow:** Flow 1, Step 1

---

#### Search Create / Edit
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/search-create-edit-screen.png` |
| Layout reference | `søk/screens/search-create-edit-screen.html` |

**Purpose:** Base search builder. Analyst defines keywords, exclusions, date range, refinement level, and topic taxonomy. Live Projection panel provides real-time estimated volume feedback (DD-2).

**Use cases:** UC-1 (create), UC-6 (edit)

**Flow:** Flow 1, Step 2

---

#### Search Detail & Filter Editor
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/search-detail-filter--editor-screen.png` |
| Layout reference | `søk/screens/search-detail-filter--editor-screen.html` |

**Purpose:** Refinement workspace. Analyst reviews base search results, applies filter presets, monitors a live article preview stream, and triggers the fork flow.

**Use cases:** UC-2 (trigger fork), UC-4 (apply filters), UC-5 (link to trends)

**Flow:** Flow 2, Step 3

---

#### Search Lineage Explorer
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/search-lineage-explorer.png` |
| Layout reference | `søk/screens/search-lineage-explorer.html` |

**Purpose:** DAG visualization of the full search ancestry and derivative tree. Node Inspector panel surfaces inherited filters and performance metrics. Labeled "NEO4J RELATIONSHIP MODEL" — explicit portfolio signal.

**Use cases:** UC-2 (post-fork result), UC-3 (provenance audit)

**Flow:** Flow 2, Step 5

---

#### Narrative Trends & Insights
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/narrative-tracker-screen.png` |
| Layout reference | `søk/screens/narrative-tracker-screen.html` |

**Purpose:** Final analytical output. Coverage volume over time, sentiment breakdown, top co-occurring topics, top sources, and Recent Narrative Shifts (emergent topics, sentiment shifts, anomalies).

**Use cases:** UC-5

**Flow:** Flow 4, Step 9

---

#### Filter Preset Library
| Asset | Path |
|---|---|
| Screenshot | `søk/screens/filter-preset-screen.png` |
| Layout reference | `søk/screens/filter-preset-screen.html` |

**Purpose:** Reusable filter logic catalog. Displays all presets as cards with type tag and usage count. Entry point for creating and editing presets.

**Use cases:** UC-4

**Flow:** Flow 3, Step 6

---

#### Fork Search Modal
| Asset | Path |
|---|---|
| Screenshot | `søk/modals/fork-search-modal-screen.png` |
| Layout reference | `søk/modals/fork-search-modal-screen.html` |

**Purpose:** Explicit branching gesture. Displays parent search name and inherited logic (read-only). Analyst names the derivative and confirms the fork. Isolation notice clarifies that future parent changes will not propagate.

**Use cases:** UC-2

**Flow:** Flow 2, Step 4

---

#### Filter Preset Modal
| Asset | Path |
|---|---|
| Screenshot | `søk/modals/filter-preset-modal-screen.png` |
| Layout reference | `søk/modals/filter-preset-modal-screen.html` |

**Purpose:** Filter definition workspace. Analyst names the preset, selects type and operator, adds values, and previews downstream impact (searches affected, projected data reduction) before saving.

**Use cases:** UC-4

**Flow:** Flow 3, Step 7

---

#### Collection Management Modal
| Asset | Path |
|---|---|
| Screenshot | `søk/modals/collection-management-modal-screen.png` |
| Layout reference | `søk/modals/collection-management-modal-screen.html` |

**Purpose:** Organizational layer. Analyst manages named collections, adds or links searches, and saves collection state. Collaborator avatar stack surfaces co-editing presence.

**Use cases:** UC-3

**Flow:** Flow 3, Step 8

---

### UX Principles

- **Search is a persistent object, not an action.** The library is the home screen, not a search bar.
- **Forking is a first-class gesture.** It should be one click from any search, not buried in a menu.
- **Filter reuse is visible.** Users should see filter preset names on search cards — not anonymous tag counts.
- **Lineage is always surfaced.** Any derived search shows its parent. Any parent shows its derivative count.
- **Live feedback reduces cognitive load.** Volume projections and impact previews answer "what will this do?" before the analyst commits.
- **Anomaly signals over static state.** Analysts act on change, not snapshots. Surface shifts, not just current values.

---

## 8. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Graph Database | Neo4j (AuraDB free tier) | Native graph traversal for lineage, filter reuse, and topic co-occurrence |
| API Layer | Apollo Server + GraphQL | Type-safe, self-documenting, matches the JD signal |
| Backend Runtime | Node.js (TypeScript) | Natural fit with Apollo; strong Neo4j driver support |
| Neo4j Driver | `neo4j-driver` (official) | Direct Cypher execution from Node |
| Frontend | React + TypeScript | Component-based, strong Apollo Client support |
| Apollo Client | Apollo Client 3 | Cache, query, mutation management |
| Charts | Recharts | Lightweight, composable, React-native |
| Styling | Tailwind CSS | Fast, consistent utility-first styling |
| Seed Data | Static JSON → Cypher seed script | Avoids live news API dependency for PoC |
| Hosting | Vercel (frontend) + Railway (API) | Free tier, fast deploy |

---

## 9. Phased Roadmap

### Phase 1 — Core CRUD & Graph Model (PoC)
- Neo4j schema setup + seed data script
- Apollo Server with full Search, FilterPreset, Collection mutations
- Search fork mutation with `DERIVED_FROM` relationship
- React frontend: Search Library, Search Detail, Create/Edit, Fork Modal
- Filter Preset Library

### Phase 2 — Trends & Lineage
- Narrative Trends view wired to live Cypher aggregation queries
- Lineage tree visualization (D3 or React Flow)
- Filter preset usage view (which searches use this preset)
- Collection management UI

### Phase 3 — Polish & Portfolio Presentation
- Graph explorer view (visualize the Neo4j graph directly in UI)
- README with architecture walkthrough and design decisions
- Recorded demo video showing the exploration → insight workflow
- Write-up mapping each feature to the Meltwater JD competencies

---

## 10. Design Decisions

Resolved decisions that are now locked for the PoC build. These should not be reopened without a documented rationale.

---

### DD-1: Lineage Model — DAG, Not Tree

**Decision:** A derivative search can inherit from multiple parent searches.

**Rationale:** Tree lineage (single parent) is a degenerate case of a DAG and would artificially constrain a core use case. A search like "Lithium Supply — Negative Sentiment, APAC" is legitimately the child of both a base topic search and a regional filter search. Enforcing single-parent would force analysts to duplicate logic or flatten relationships that are genuinely multi-dimensional. Neo4j's native graph model handles DAG traversal without additional complexity — `DERIVED_FROM*` Cypher traversals are DAG-compatible by default.

**Impact on data model:** `DERIVED_FROM` is a many-to-many relationship between `Search` nodes. The fork mutation must accept an array of `parentIds` (minimum one). The lineage explorer renders a DAG, not a tree — nodes may have multiple incoming edges.

**Closed:** 2026-03-22

---

### DD-2: Live Volume Projection — Debounced Cypher Count Against Seed Corpus

**Decision:** The Live Projection panel on the Search Create/Edit screen runs a debounced Cypher query against the seeded article corpus to estimate result volume in real time as the analyst types.

**Rationale:** A true volume estimate requires a live news index, which is out of scope for the PoC. However, a static "no preview available" state would undermine the core UX principle that search construction gives immediate feedback. The PoC solution: debounce keyword input at 400ms, then run a lightweight Cypher `COUNT` query matching articles by keyword overlap against the seed corpus. This produces a real, meaningful number (not a mock) while remaining entirely within the PoC's data boundary.

**Implementation spec:**
```cypher
// Fired on debounced keyword change — returns estimated match count
MATCH (a:Article)
WHERE any(keyword IN $keywords WHERE toLower(a.headline) CONTAINS toLower(keyword)
       OR toLower(a.body) CONTAINS toLower(keyword))
RETURN count(a) AS estimatedVolume
```

**Constraints:**
- Debounce delay: 400ms after last keystroke
- Minimum keyword length to trigger: 3 characters
- Query runs against headline + body fields only (no entity graph traversal at projection time)
- Result labeled "EST. VOLUME (SEED CORPUS)" in UI to be transparent about PoC data scope
- Does not apply active filters during projection — keyword match only

**Closed:** 2026-03-22

---

### DD-3: Narrative Trends — Live Cypher Aggregation, Not Pre-aggregated

**Decision:** The Narrative Trends view executes Cypher aggregation queries live on each page load against the seed corpus. No pre-aggregation or caching layer for the PoC.

**Rationale:** The seed corpus is bounded (~500–1,000 articles). Cypher aggregation at this scale returns in under 100ms — pre-aggregation would add architectural complexity (cache invalidation, stale data risk) with no performance benefit at PoC data volume. Live queries also mean the trends view *always* reflects the current filter state of the search without any sync lag.

**Revisit trigger:** If corpus grows beyond ~50,000 articles or query latency exceeds 500ms in testing, introduce a materialized view or Redis cache layer.

**Closed:** 2026-03-22

---

## 11. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| 1 | Should a search belong to multiple collections in Phase 1, or enforce single-collection constraint? | PM | Medium |
| 2 | What is the right date range UX — fixed presets (Last 30 days) or custom picker? | PM | Medium |
| 3 | Should filter presets be globally scoped or per-collection in Phase 2 multi-user context? | PM | Low |
| 5 | Should deleting a filter preset remove it from all searches silently, or require confirmation with impact count? | PM | High |

---

## 12. Appendix

### A. Graph Model Diagram (Conceptual)

```
(Collection)
    |
  CONTAINS
    |
(Search) <--DERIVED_FROM-- (Search)
    |                           |
    |                    DERIVED_FROM (multiple parents allowed — DAG)
    |                           |
    |                        (Search)
 HAS_FILTER
    |
(FilterPreset)

(Search) --MATCHES--> (Article) --PUBLISHED_BY--> (Source)
                          |
                     TAGGED_WITH
                          |
                       (Topic) --CO_OCCURS_WITH--> (Topic)
```

**Note:** `DERIVED_FROM` is many-to-many. A child search may have multiple parent nodes. Lineage traversal must handle fan-in at any depth.

### B. Sample Cypher — Fork a Search (Multi-Parent DAG)

```cypher
// parentIds is an array — minimum one, supports multiple for DAG
UNWIND $parentIds AS parentId
MATCH (parent:Search {id: parentId})
WITH collect(parent) AS parents

CREATE (child:Search {
  id: randomUUID(),
  name: $name,
  keywords: $keywords,      // caller provides merged/overridden keywords
  createdAt: datetime(),
  updatedAt: datetime(),
  status: 'active'
})

// Create DERIVED_FROM edge to each parent
WITH child, parents
UNWIND parents AS parent
CREATE (child)-[:DERIVED_FROM {createdAt: datetime(), orphaned: false}]->(parent)

// Inherit filter presets from all parents (deduplicated by filter node identity)
WITH child, parents
UNWIND parents AS parent
MATCH (parent)-[:HAS_FILTER]->(f:FilterPreset)
MERGE (child)-[:HAS_FILTER {appliedAt: datetime()}]->(f)

RETURN child
```

### C. Sample Cypher — Narrative Trends Aggregation

```cypher
MATCH (s:Search {id: $searchId})-[:MATCHES]->(a:Article)
WHERE a.publishedAt >= $startDate AND a.publishedAt <= $endDate
WITH a, date(a.publishedAt) AS day
RETURN day, count(a) AS volume, 
       sum(CASE WHEN a.sentiment = 'POSITIVE' THEN 1 ELSE 0 END) AS positive,
       sum(CASE WHEN a.sentiment = 'NEUTRAL' THEN 1 ELSE 0 END) AS neutral,
       sum(CASE WHEN a.sentiment = 'NEGATIVE' THEN 1 ELSE 0 END) AS negative
ORDER BY day ASC
```

### D. Seed Data Schema (JSON)

```json
{
  "articles": [
    {
      "id": "a1",
      "headline": "Senate Moves to Restrict EV Tax Credits",
      "url": "https://example.com/ev-tax-credits",
      "publishedAt": "2026-01-15",
      "sentiment": "NEGATIVE",
      "source": { "name": "Reuters", "domain": "reuters.com", "tier": 1, "region": "US", "language": "en" },
      "topics": ["EV Policy", "Legislation", "Automotive"],
      "author": "Jane Smith"
    }
  ]
}
```
