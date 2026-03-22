# User Flow & Use Case Map: Media Narrative Tracker

**Version:** 0.2  
**Status:** Active Reference  
**Last Updated:** 2026-03-22  
**Persona:** The Media Analyst — a professional monitoring topic, brand, and narrative coverage across sources over time.

> This document is the canonical reference for how screens connect to one another and how each interaction creates value for the analyst. All build and design decisions should be made with empathy for this user. Design system rules (typography, color, surface hierarchy, component behavior) are governed by `DESIGN.md` and apply universally across every screen described here.

---

## Flow Overview

| Flow | Goal | Screens Involved |
|---|---|---|
| Flow 1 | Exploration & Creation | Search Library (1) → Search Create/Edit (2) |
| Flow 2 | Enrichment & Composable Search | Search Detail (3) → Fork Search Modal (4) → Search Lineage Explorer (5) |
| Flow 3 | Reusability & Scaling | Filter Preset Library (6) → Filter Preset Modal (7) → Collection Management Modal (8) |
| Flow 4 | Insight & Monitoring | Narrative Trends & Insights (9) |

---

## Flow 1: Exploration & Creation

**Goal:** Define a new area of intelligence from scratch.  
**Analyst need:** I have a new topic I need to monitor. I want to create a named, reusable search that I can return to, refine, and share.

---

### Screen 1: Search Library Dashboard

**Role in flow:** Home base. The analyst starts here every session to orient themselves — checking active search health, recent results volume, and navigating to specific collections or searches.

**Key interactions:**
- View all saved searches with keyword tags, filter count, growth signals, and last updated timestamp
- Filter view by: All Queries / High Priority / Archived
- Access Pinned Collections in the right rail for fast navigation to high-priority workstreams
- Monitor Recent Intelligence feed (system updates, anomaly alerts, peer activity)
- Click **"+ New Search"** to enter the creation flow
- Click **"View Analytics"** on any search card to jump directly to Narrative Trends (Flow 4)

**Value delivered:** The analyst has a single command center that tells them what is active, what has changed, and what needs attention — without opening individual searches.

**Connects to:** Search Create/Edit (UC-1), Search Detail (UC-2, via card click), Narrative Trends (UC-5, via View Analytics)

---

### Screen 2: Search Create / Edit Form

**Role in flow:** The base search builder. The analyst defines the logical parameters of a new intelligence stream.

**Key interactions:**
- Set **Search Identifier** (name) and **Temporal Scope** (date range)
- Set **Refinement Level** (e.g., High Precision Mode)
- Define **Include** keywords and **Exclude** exceptions using token-based input
- Toggle **Advanced Syntax** for Boolean/proximity operators
- Select **Topic Taxonomy** category (Technology, Geopolitics, Economics, Supply Chain, etc.)
- Monitor the **Live Projection** panel in real time: estimated volume, top sources preview, precision alerts
- Run **Validation Test** before deploying to catch keyword over-breadth
- **Save as Draft** (persists without deploying) or **Deploy Analysis** (activates the search)

**Value delivered:** The analyst builds a precisely scoped search with immediate feedback on what it will return — reducing the trial-and-error cycle that wastes time in blunt keyword tools.

**Design note:** The Live Projection panel is a real-time feedback loop during construction, not a static form field. It must update reactively as keywords are added or removed. This is the most technically complex interaction in the creation flow.

**Connects to:** Search Library (on save/deploy), Search Detail (on deploy → auto-navigate to results)

---

## Flow 2: Enrichment & Composable Search

**Goal:** Refine a base search into a specific, high-signal derivative without destroying the original context.  
**Analyst need:** My base search returns broad results. I want to isolate a specific angle — a region, a sentiment band, a source tier — as its own named search that I can track independently.

---

### Screen 3: Search Detail & Filter Editor

**Role in flow:** The refinement workspace. The analyst investigates base search results and layers on filters to sharpen the signal.

**Key interactions:**
- View **Base Keywords** with proximity/Boolean logic and exclusion tags
- Apply **Refinement Presets** (sentiment analysis, source tiering) via the filter panel
- Set **Geospatial Focus** with region selection and sparsity threshold
- Monitor **Live Preview** stream (right rail) — real-time article matches with sentiment and match-type labels
- View **Signal Density** and **True Match %** at the bottom of the live preview
- Click **"Fork Search"** to create an isolated derivative of the current configuration
- Click **"Version History"** to review prior states of this search

**Value delivered:** The analyst can see exactly what a filter combination returns — live — before committing to a derivative. This prevents creating noisy forks that require immediate cleanup.

**Connects to:** Fork Search Modal (UC-2), Search Library (via breadcrumb nav), Narrative Trends (UC-5)

---

### Screen 4: Fork Search Modal

**Role in flow:** The explicit branching gesture. The analyst creates a versioned, isolated instance of the current search with a new name and intent.

**Key interactions:**
- View **Parent Intelligence Feed** name (read-only reference, cannot be changed)
- Enter **Derivative Search Name** (required)
- Review **Inherited Intelligence Logic** — keywords, active constraints displayed as read-only (configuration locked at fork time)
- Read the isolation notice: future changes to the parent will not propagate to this derivative
- Click **"Fork and Create"** to persist the new search node with a `DERIVED_FROM` relationship to the parent in Neo4j

**Value delivered:** The analyst gets the confidence of knowing exactly what logic they are inheriting and that their derivative is independent — enabling parallel investigation of different angles off the same base without contamination.

**Design note:** The "Configuration Locked (Read-only)" label on inherited logic is a critical trust signal. It communicates immutability at fork time clearly, without requiring the analyst to understand the graph model underneath.

**Connects to:** Search Detail (of the new derivative, on create), Search Lineage Explorer (UC-3)

---

### Screen 5: Search Lineage Explorer

**Role in flow:** The provenance map. The analyst visualizes the full ancestry and derivative tree of any search — understanding where an insight came from and what has been built from it.

**Key interactions:**
- View the full DAG (Directed Acyclic Graph) of search relationships — root searches at top, derivatives branching downward
- Each node displays: UUID, search name, keywords/tags, derivative version label, and status (Active/Closed)
- Click any node to open the **Node Inspector** panel (right side): inherited filters, performance metrics (relevance %, node depth)
- From Node Inspector: **Execute Search** (navigate to that search's detail view) or **Fork & Modify** (open Fork Modal from this node)
- View graph-level stats at bottom: Total Nodes, Avg Branching factor, Max Depth, Orphan Query count

**Value delivered:** The analyst can audit the full intellectual history of their intelligence work — understanding which derivative came from which base, what filters were applied at each branch, and which searches are orphaned or closed. This is also the primary showcase of the Neo4j graph model for portfolio purposes.

**Design note:** Labeled "NEO4J RELATIONSHIP MODEL" in the screen header — this is intentional portfolio signaling. The lineage explorer makes the graph visible to non-technical stakeholders and to the hiring panel.

**Connects to:** Search Detail (via Execute Search), Fork Modal (via Fork & Modify), Search Library (via nav)

---

## Flow 3: Reusability & Scaling

**Goal:** Apply consistent filter logic across multiple searches efficiently.  
**Analyst need:** I have a source list and a sentiment band I use on every search in my portfolio. I want to define these once and apply them everywhere — and update them in one place when the logic needs to change.

---

### Screen 6: Filter Preset Library

**Role in flow:** The reusable logic catalog. The analyst manages named filter presets that can be applied across many searches simultaneously.

**Key interactions:**
- View all filter presets as cards: name, description, usage count, filter type tag (Source List, Sentiment, Geofence, Temporal, Social)
- "Most Active" badge surfaces the highest-reuse preset at the top
- Click **"Create Preset"** to open the Filter Preset Modal (UC-4)
- Click the **edit (pencil)** icon on any card to modify a preset
- Click the **share** icon to make a preset available to other workspace members
- Click **"+ New Filter Template"** card (empty state) as an alternate creation entry point
- View **Organization Defaults** section (below fold) for workspace-level presets set by admins

**Value delivered:** The analyst sees all filter logic as a shared, reusable asset library — not something buried inside individual searches. Usage counts create social proof: high-use presets signal validated, trusted methodology.

**Connects to:** Filter Preset Modal (UC-4), Search Detail (presets can be applied from either direction)

---

### Screen 7: Filter Preset Modal (Filter Preset Engine)

**Role in flow:** The filter definition workspace. The analyst creates or edits a named filter preset with specific logic and previews its impact before saving.

**Key interactions:**
- Enter **Preset Name**
- Select **Filter Type** (Source Tier, Sentiment, Region, Language, Date Range) from dropdown
- Select **Target Operator** (Include Exactly, Exclude, Must Contain, etc.)
- Add or remove **Selected Values** as dismissible tags (e.g., "Tier 1: Premium Publishers", "US: East Coast Hubs")
- View **Impact Preview** — how many active searches this preset will be synchronized with and projected data reduction %
- Click **"Save Preset Logic"** to persist and propagate to all connected searches
- Click **"Discard Preset"** to delete (with impact warning)

**Value delivered:** The analyst can see the downstream impact of their filter logic *before* saving — how many searches it touches, how much it narrows the data volume. This prevents accidentally applying a too-aggressive filter across a large search portfolio.

**Design note:** The "Impact Preview" panel (12 Searches, 42.8% data reduction) is the critical value moment in this modal. It transforms filter management from a blind configuration task into a deliberate, informed decision.

**Connects to:** Filter Preset Library (on save/discard), Search Detail (filters reflect immediately on connected searches)

---

### Screen 8: Collection Management Modal

**Role in flow:** The organizational layer. The analyst groups related searches (base + derivatives) into a named collection for project management, stakeholder reporting, or team handoff.

**Key interactions:**
- View the **Collections** sidebar — all workspace collections with search counts
- Select an active collection to manage it in the right panel
- **Quick-Add Search** by ID or keyword to add an existing search to the collection
- View existing member searches as cards showing: ID, name, description, result count, last updated, status indicator (active/critical/live feed)
- Click **"+ Link Existing Search"** (empty card slot) to add another search
- Collaborate via avatar stack — see which workspace members are co-editing
- Click **"Save Collection State"** to persist changes or **"Discard Changes"** to revert

**Value delivered:** The analyst can organize their search portfolio into logical project groups — making it easy to share a coherent intelligence package with stakeholders rather than a flat list of unrelated searches.

**Connects to:** Search Library (collections surface in pinned rail), Search Detail (via search cards inside collection)

---

## Flow 4: Insight & Monitoring

**Goal:** Move from matched articles to narrative signals.  
**Analyst need:** I don't just want to know what articles matched my search. I want to know how the narrative is *shifting* — where volume is spiking, whether sentiment is moving, which topics are co-occurring, and what has changed since yesterday.

---

### Screen 9: Narrative Trends & Insights

**Role in flow:** The final output. The analyst interprets the intelligence produced by their search configuration — identifying emerging trends, anomalies, and narrative shifts that inform decisions.

**Key interactions:**
- Toggle between **Current Search** and **Parent Narrative** views to compare derivative vs. base coverage
- Select time window (e.g., L7D — last 7 days)
- Read **Coverage Volume Over Time** bar chart: active volume vs. baseline forecast by day
- Read **Sentiment Breakdown**: Positive / Neutral / Negative % with period-over-period shift indicator
- Explore **Top Co-occurring Topics** tag cloud — sized by frequency, clickable to filter
- Review **Top Sources** ranked by article hit count with "View All" option
- Scan **Recent Narrative Shifts** cards at bottom: categorized as Emergent Topic (live), Sentiment Shift, or Anomaly Detected — each with timestamp and brief description

**Value delivered:** The analyst gets a complete narrative intelligence picture in a single view — volume, sentiment, source authority, topic co-occurrence, and anomaly signals — without needing to run separate queries or export to another tool. This is the end-state proof that the search → filter → insight workflow delivers real analytical value.

**Design note:** The "Recent Narrative Shifts" section at the bottom is the highest-value UX addition beyond standard analytics. It surfaces *change signals* (not just state), which is what media analysts actually act on. This section should be treated as a first-class feature, not an afterthought.

**Connects to:** Search Detail (via "Current Search" toggle → back to filter editor), Search Library (via nav)

---

## Screen–Use Case Cross-Reference

| Use Case | Primary Screen (Step) | Supporting Screens |
|---|---|---|
| UC-1: Create a Base Search | Search Create/Edit (2) | Search Library — entry point (1) |
| UC-2: Fork and Extend a Search | Fork Search Modal (4) | Search Detail — trigger (3), Lineage Explorer — result (5) |
| UC-3: Organize Searches into Collections | Collection Management Modal (8) | Search Library — collections rail (1) |
| UC-4: Apply Reusable Filters | Filter Preset Modal (7) | Filter Preset Library (6), Search Detail (3) |
| UC-5: View Narrative Trends | Narrative Trends & Insights (9) | Search Library — View Analytics shortcut (1) |
| UC-6: Update a Search | Search Create/Edit — edit mode (2) | Search Detail — Version History (3) |
| UC-7: Delete a Search | Search Library — card action menu (1) | Collection Management Modal — orphaned state (8) |

---

## Design Empathy Principles (Per `DESIGN.md`)

These principles govern every interaction decision across all screens:

- **Search is a persistent object, not a one-time action.** The library is home, not a search bar.
- **Forking is a first-class gesture.** One click from any search, never buried.
- **Filter reuse is visible.** Preset names appear on cards — not anonymous tag counts.
- **Lineage is always surfaced.** Derived searches show their parent. Parents show derivative count.
- **Live feedback reduces cognitive load.** Volume projections and impact previews answer "what will this do?" before the analyst commits.
- **Anomaly signals over static state.** Analysts act on change, not snapshots. Surface shifts, not just current values.
- **No line borders.** Depth through tonal surface stacking per the No-Line Rule.
- **One primary action per screen.** Tonal hierarchy guides the eye — no competing CTAs.
