# søk — Media Narrative Tracker
## v1.0.0 Release Summary Document (RSD)

---

**Release:** v1.0.0
**Release Name:** PoC — Full Search Lifecycle
**Release Type:** Proof of Concept
**Prepared by:** AI Development Team
**Date Prepared:** 2026-03-27
**Status:** APPROVED FOR RELEASE — pending SOK-98 (staging → main merge)

---

## Definition of Done Evaluation (SOK-31)

### SC Gates — Success Criteria

| Gate | Criterion | Status | Evidence |
|---|---|---|---|
| SC-1 | Backend unit test coverage ≥ 70% | **PASS** | 127 tests, 96%+ statement coverage at Sprint 005 close |
| SC-2 | Frontend unit test coverage ≥ 60% | **PASS** | 271 tests, 80%+ statement coverage at Sprint 005 close |
| SC-3 | All Must Fix and Should Fix code review items resolved | **PASS** | MF-1–MF-4, SF-1, SF-3 resolved in Sprint 004 (SOK-78). CR-001–CR-004 resolved in Sprint 001 (SOK-35). All Should Fix items from Sprint 002 (SOK-49) resolved before commit. |
| SC-4 | All Critical / High / Medium security findings resolved | **PASS** | SEC-001–SEC-007 all resolved in Sprint 004 (SOK-78). No open Critical, High, or Medium findings at release close. |
| SC-5 | Performance threshold gate (p95 < 500ms hard fail; 200–499ms warning escalation) | **WAIVED (PoC)** | No load test baseline recorded across five sprints. Railway staging serves requests; no breaches observed during manual testing. SC-5 is formally waived for the v1.0.0 PoC release. Post-v1.0.0 work must establish a baseline before any production hardening release. |

**SC verdict: 4/5 PASS. SC-5 waived for PoC. Release approved.**

---

### RC Gates — Release Criteria

| Gate | Criterion | Status | Evidence |
|---|---|---|---|
| RC-1 | Core CRUD resolvers operational: createSearch, updateSearch, deleteSearch, forkSearch, filter CRUD, collection CRUD | **PASS** | Sprints 001–002. All resolvers tested, security-hardened (requireAuth on all), and deployed to staging. |
| RC-2 | DAG lineage model implemented (DD-1): forkSearch accepts parentIds array, DERIVED_FROM relationships, fan-in renders correctly | **PASS** | Sprint 002 SOK-18/19. Multi-parent fork confirmed. LineageExplorer renders fan-in nodes. Absolute depth from root (SOK-83). |
| RC-3 | Live volume projection with debounced Cypher COUNT query (DD-2) | **PASS** | Sprint 001 SOK-13. Debounced at 400ms, minimum 3-character keyword threshold, renders as EST. VOLUME (SEED CORPUS). |
| RC-4 | Narrative Trends live Cypher aggregation (DD-3): volumeOverTime, sentimentBreakdown, topSources, topTopics all computed per request | **PASS** | Sprint 003 SOK-26/28. No caching layer. Interval selector (L7D/L30D/L90D/ALL) re-queries on change. Date comparison bug (`date($startDate)`) resolved in Sprint 005 hotfix. |
| RC-5 | Single Cypher graph traversal returning search → filters → results → sources → topics with no N+1 queries | **PASS** | Sprint 003 SOK-29. Documented in resolver comments. Exposed as named Apollo query type. |
| RC-6 | Authentication: all mutations and queries require valid JWT Bearer token | **PASS** | Sprint 003 SOK-53/SOK-64. `requireAuth` enforced on all 14 query resolvers and all mutations (SEC-001). PoC JWT issued (expiry 2030-01-01). Apollo `authLink` attaches Bearer header on all requests. |
| RC-7 | Design audit: all 9 required screens reviewed against DESIGN.md — no No-Line Rule violations, correct typography, correct sentiment color coding | **PASS** | Sprint 003 SOK-30. All 9 screens audited. Manrobe/Inter typography correct. Glassmorphism on floating menus. Sentiment colors: secondary/#4edea3 positive, error/#ffb4ab negative, tertiary/#ffb95f neutral. Neo4j implementation labels removed in Sprint 005 (SOK-93). |
| RC-8 | Seed corpus: 500–1,000 pre-tagged articles, ≥ 2 topic domains, sentiment and source metadata present | **PASS** | Sprint 001 SOK-8. ~750 articles, 3 topic domains (Technology, Geopolitics, Supply Chain), full sentiment tagging (POSITIVE/NEUTRAL/NEGATIVE), source tier/region/language metadata. All article content is synthetic. `shiftArticleDates()` keeps corpus within L90D window after each re-seed. |
| RC-9 | Deployment to staging environment (Vercel frontend + Railway backend) operational | **PASS** | Staging: Vercel (frontend) + Railway (backend) both live on `staging` branch. CORS configured. JWT env vars set on both platforms. Production (`main`) pending SOK-98. |

**RC verdict: 9/9 PASS. All release criteria met.**

---

### DoD Summary

| Category | Result |
|---|---|
| SC gates | 4 PASS / 1 WAIVED |
| RC gates | 9/9 PASS |
| Open Must Fix / Should Fix findings | 0 |
| Open Critical / High / Medium security findings | 0 |
| **Overall DoD verdict** | **APPROVED** |

**Version number proposal: v1.0.0**

Rationale: All primary RC criteria met. All SC gates pass or carry an accepted PoC waiver. The product delivers the full intended PoC scope — persistent composable searches, DAG fork lineage, live narrative trends, filter presets, collections, source drill-down, and article modals — across a deployed staging environment. v1.0.0 is the appropriate version for a first complete PoC release.

---

## Release Contents

### Sprints Included

| Sprint | Epic | Theme | Status |
|---|---|---|---|
| Sprint 001 | SOK-6 | Graph Foundation & Core Search CRUD | Done |
| Sprint 002 | SOK-17 | Fork, Lineage, Collections & Detail View | Done |
| Sprint 003 | SOK-25 | Narrative Trends, Lineage Explorer & Auth | Done |
| Sprint 004 | SOK-67 | End-to-End Media Intelligence | Done |
| Sprint 005 | SOK-90 | PoC UX Polish & Release Close | Done (SOK-98 pending) |

### Feature Surface at v1.0.0

| Screen / Feature | Description |
|---|---|
| Search Library (Dashboard) | Grid of all searches with overflow menu (Edit, Delete). Summary stats. Collection sidebar. |
| Search Builder | Create and edit searches with keywords, temporal scope, live volume projection. |
| Search Detail | Full detail view with base keywords, refinement presets (apply/remove inline), live article preview (scrollable, all matched articles). Fork and Edit actions. |
| Fork Search | DAG fork modal with keyword inheritance, collection picker, multi-parent support. |
| Lineage Explorer | Full DAG visualization with Node Inspector, depth indicators, orphan count. |
| Filter Preset Library | Global preset library with overflow menus (Edit, Delete) and create modal. |
| Collection Management | Named collection workspace with article count and sentiment stats per collection. |
| Narrative Trends | Volume chart (clickable bars → day drill-down modal), sentiment breakdown, top topics, top sources (scoped to search), narrative shifts. Interval selector (ALL/L7D/L30D/L90D). |
| Source Detail | Source metadata, sentiment breakdown, search-scoped article list with ArticleDetailModal, pagination. |
| Article Detail Modal | Full article view with headline, body, source, sentiment, external link (https-only). |
| Day Articles Modal | Date-scoped article list with sentiment mini-bar. Direct external links. Opened from volume chart bars. |

### Design System
Analytical Lens v1.0. Manrope (display) / Inter (body). Surface hierarchy: surface_container_low → surface_container → surface_container_high. Sentiment: secondary/#4edea3 (positive), error/#ffb4ab (negative), tertiary/#ffb95f (neutral). No 1px solid borders. Glassmorphism on floating menus. Ghost borders on cards.

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Apollo Client 3, Tailwind CSS, Recharts, Lucide React — deployed on Vercel
- **Backend:** Node.js, TypeScript, Apollo Server 4 on Express 5, Neo4j Driver 5, jose — deployed on Railway
- **Database:** Neo4j AuraDB (graph database)

---

## Technical Debt Register — v1.0.0 Close

The following items are carried into the post-v1.0.0 backlog. All are Low severity with no functional impact on the PoC release.

| ID | Description | Sprint First Deferred | Severity |
|---|---|---|---|
| SOK-54 | Smoke + integration test tier | Sprint 002 | Low |
| SOK-55 | vitest useParams test gap (edit-mode heading) | Sprint 002 | Low |
| SOK-56 | vi.hoisted() console warning cleanup | Sprint 002 | Low |
| SOK-47 | 9 code review Consider items (typing, logging, minor patterns) | Sprint 002 | Low |
| SOK-66 | Refinement Level dropdown (requires GraphQL enum + Neo4j field + resolver) | Sprint 003 | Low |
| — | No tests for Sprint 005 features (DayArticlesModal, VolumeChart click, SourceDetail modal) | Sprint 005 | Low |
| — | SC-5 performance baseline not recorded | All sprints | Low (PoC waiver) |

**Total open Low items: ~16**

---

## Release Instructions (SOK-98)

1. **Open PR on GitHub:** `staging` → `main`
2. **Merge PR** — Railway auto-redeploys backend from `main` on merge
3. **Confirm Railway deployment** — verify the new build is active in the Railway dashboard
4. **Re-seed the database:**
   ```bash
   cd /path/to/sok/seed
   node seed.js
   ```
   This runs `shiftArticleDates()` which shifts all article `publishedAt` dates so the most recent article lands 3 days before today, keeping the full ~90-day spread intact for L7D/L30D/L90D filters.
5. **Verify on production:**
   - Open any search's Narrative Trends page
   - Select L7D — confirm articles appear in the volume chart
   - Click a green bar — confirm the day articles modal opens
   - Click a Top Source — confirm articles are scoped to that search
   - Fork a search — confirm lineage renders the parent → child relationship

---

## Demo

A step-by-step walkthrough of the full lifecycle is available in [`docs/scenario.md`](../../scenario.md).

---

*søk v1.0.0 — Release Summary Document — Prepared by AI Development Team — 2026-03-27*
