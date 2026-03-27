# søk — Demo Scenario Guide

## Scenario: Semiconductor Intelligence — Full Search Lifecycle

This scenario walks through the complete CRUD lifecycle of a søk search: creating a broad signal, narrowing it via fork, organizing it into a collection, analyzing narrative trends, exploring lineage, and cleaning up. It demonstrates every major surface in the application.

---

### Step 1 — Create a broad semiconductor search

1. From the **Dashboard** (home screen), click **+ New Search** in the top-right corner.
2. In the **Search Name** field, enter: `Semiconductor Industry — Broad`
3. In the **Keywords** section, add the following terms one at a time:
   - `semiconductor`
   - `chip`
   - `fab`
4. Leave filters unset — this is an intentionally wide signal to capture the full landscape.
5. Click **Save Search**.

You are taken to the **Search Detail** page for your new search. The Live Preview panel on the right will populate with matched articles. Note the article count in the Signal Density stat.

---

### Step 2 — Fork the search to narrow scope

1. From the Search Detail page, click **Fork Search** (top-right, primary button).
2. The Fork Modal opens showing the parent search name and its inherited keywords.
3. Change the **Search Name** to: `Semiconductor — Supply Chain Risk`
4. In the **Keywords** field, keep the inherited terms and add:
   - `supply chain`
   - `shortage`
   - `export control`
5. Optionally assign the fork to a collection — leave blank for now, you'll do that in the next step.
6. Click **Fork** to create the child search.

You land on the Search Detail page for the forked search. Its article count will be smaller than the parent — it is scoped to articles matching the supply chain angle.

---

### Step 3 — Create a collection and add both searches

1. Click **Collections** in the left sidebar navigation.
2. Click **+ New Collection** and name it: `Semiconductors`
3. Click **Save**.

Now add the parent search:

4. In the left sidebar, click **Search Library**.
5. Find `Semiconductor Industry — Broad` in the grid. Click the card to open its Search Detail.
6. Click **Edit** (top-right, secondary button).
7. In the **Collection** field, select `Semiconductors` from the dropdown.
8. Click **Save**.

Repeat for the child search:

9. Navigate back to **Search Library**.
10. Open `Semiconductor — Supply Chain Risk` and follow the same steps to assign it to `Semiconductors`.

Both searches now appear under the Semiconductors collection in the **Collections** view.

---

### Step 4 — View narrative trends on the child search

1. Open `Semiconductor — Supply Chain Risk` from the Search Library.
2. In the center panel, click **View Narrative Trends**.
3. You are on the **Narrative Trends** page for the child search.

Explore the time filters in the top-right corner of the page:

- Click **L7D** — the volume chart, sentiment breakdown, top sources, and top topics all update to show only the last 7 days of coverage.
- Click **L30D** — broadens the window to 30 days. Notice whether new sources or topics appear.
- Click **L90D** — the full trailing quarter. This is usually the richest view for spotting longer-term sentiment shifts.
- Click **ALL** — removes the date constraint entirely and shows the full dataset.

Observe the **Recent Narrative Shifts** section at the bottom. If anomalies, sentiment shifts, or emergent topics have been detected, they will appear as cards here.

---

### Step 5 — View the search lineage

1. From the Narrative Trends page, click **LINEAGE** in the left sidebar.
2. You are taken to the **Lineage Explorer** for `Semiconductor — Supply Chain Risk`.
3. The DAG visualization shows the parent search (`Semiconductor Industry — Broad`) above and the child search as the focal node.
4. Click the parent node — the **Node Inspector** panel on the right shows its name, keywords, and applied filters.
5. Click the child node — note that the Node Inspector shows the additional supply chain keywords and any filter presets you may have applied.

The depth indicator at the top confirms this is a generation-1 fork from the root.

---

### Step 6 — Use breadcrumbs to return and update filters

1. At the top of the page, locate the **breadcrumb bar**. It shows the navigation path you have taken, ending at the current page.
2. Click the `Semiconductor — Supply Chain Risk` crumb to return to that search's **Search Detail** page.
3. In the **Refinement Presets** panel (center column), click **+ Apply Filter**.
4. A dropdown appears listing available filter presets. Select one — for example, a **SENTIMENT** or **SOURCE_TIER** preset if one exists in your library.
5. The filter is applied immediately and the panel updates to show the new preset. The article count in Signal Density may change to reflect the narrowed result set.

If you have not yet created any filter presets, you can do so from the **Filter Preset Library** (left sidebar) before completing this step.

---

### Step 7 — Revisit narrative trends and drill into a source

1. From the Search Detail page, click **View Narrative Trends** again (center panel, secondary button).
2. Select a time interval — **L30D** is a good choice to ensure sources have enough coverage to rank.
3. In the **Top Sources** card, find the source ranked first and click its name.
4. You are taken to the **Source Detail** page, scoped to this search — the articles shown are only those published by this source that matched `Semiconductor — Supply Chain Risk`.
5. Review the **Sentiment Breakdown** bar at the top to see whether this source skews positive, negative, or neutral on the supply chain topic.
6. Use **Next** and **Previous** to page through the article list if there are more than 20 results.
7. Click **Back** to return to the Narrative Trends page.

---

### Step 8 — Return to the Dashboard and delete the parent search

1. Click **søk** in the top-left corner (or click **Dashboard** in the top navigation) to return to the home screen.
2. In the search grid, locate the card for `Semiconductor Industry — Broad`.
3. Hover over the card — a **⋮** (overflow) button appears in the top-right corner of the card.
4. Click **⋮** and select **Delete** from the dropdown menu.
5. A confirmation dialog asks you to confirm the deletion. Click **Delete** to confirm.

The card is removed from the grid. Note that the forked child search (`Semiconductor — Supply Chain Risk`) is unaffected — forks are independent searches and persist after their parent is deleted. The lineage graph for the child will show the parent as a historical ancestor node even after deletion.

---

## What this scenario covers

| Capability | Where demonstrated |
|---|---|
| Create search | Step 1 |
| Read / Search Detail | Steps 1, 6, 7 |
| Update search (assign collection, add filter) | Steps 3, 6 |
| Delete search | Step 8 |
| Fork (DAG derivation) | Step 2 |
| Collections | Step 3 |
| Narrative trends + time filters | Step 4 |
| Lineage explorer | Step 5 |
| Breadcrumb navigation | Step 6 |
| Filter preset application | Step 6 |
| Source drill-down (scoped) | Step 7 |
| Article pagination | Step 7 |
