# Design System Specification: The Analytical Lens

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

In an era of information fatigue, this design system does not simply display data; it curates insight. We move beyond the "SaaS Dashboard" trope by adopting a high-end editorial approach. The system balances high-density information with an authoritative, calm aesthetic. 

By leveraging **intentional asymmetry** and **tonal layering**, we break the rigid "box-in-a-box" grid. We treat the interface like a premium financial broadsheet—where the most critical data points command the eye through scale and white space, rather than neon colors or heavy borders. The experience should feel like a bespoke physical instrument: precise, weighted, and unfailingly reliable.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a nocturnal, "Command Center" aesthetic. We use deep navies and slates to reduce eye strain for analysts during long sessions, while using vibrant accents sparingly to signal sentiment and urgency.

### Surface Hierarchy & Nesting
We strictly adhere to a **"No-Line" Rule**. Designers are prohibited from using 1px solid borders to section off the UI. Instead, depth is achieved through background shifts:
- **Base Layer:** `surface` (#0b1326) for the main application background.
- **Sectioning:** Use `surface_container_low` (#131b2e) for sidebar or secondary navigation zones.
- **Content Cards:** Use `surface_container` (#171f33) or `surface_container_high` (#222a3d) to lift active data modules.
- **Floating Elements:** Use `surface_bright` (#31394d) for popovers or modals to create maximum contrast against the dark base.

### The Glass & Gradient Rule
To prevent the UI from feeling "flat" or "stock," apply **Glassmorphism** to floating menus and tooltips. Use a semi-transparent `surface_container_highest` with a `20px` backdrop blur. 
- **Signature Accent:** Main Action Buttons and Hero data points should utilize a subtle linear gradient transitioning from `primary` (#bcc7de) to `primary_container` (#0c1829) at a 135-degree angle. This adds a "metallic" sheen that feels premium and engineered.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance human insight with technical precision.

*   **Display & Headlines (Manrope):** Our "Command" typeface. Used for high-level metrics and section headers. Its geometric but slightly softened terminals provide an authoritative yet modern tone.
    *   *Headline-lg:* 2rem — Reserved for page titles and primary insights.
*   **Body & Labels (Inter):** Our "Workhorse." Chosen for its exceptional legibility in high-density data tables and analytical reports.
    *   *Body-md:* 0.875rem — The standard for all analytical descriptions.
    *   *Label-sm:* 0.6875rem — Used for metadata and overlines, always in `uppercase` with `0.05em` letter spacing to maintain an "archival" feel.

---

## 4. Elevation & Depth

### The Layering Principle
Forget shadows as a primary tool. Depth is a result of **Tonal Stacking**. 
1. Place a `surface_container_low` card on a `surface` background.
2. Nest a `surface_container_high` search bar within that card.
This creates a natural, "physical" recession without the visual clutter of drop shadows.

### Ambient Shadows
Where floating is necessary (Modals/Dropdowns), use **Ambient Shadows**:
- **Blur:** 32px to 64px.
- **Color:** `on_surface` (#dae2fd) at **4-6% opacity**. 
- **Offset:** Shift the Y-axis by 8px to mimic a top-down light source.

### The "Ghost Border" Fallback
If contrast is required for accessibility (e.g., in a high-density table), use a **Ghost Border**: `outline_variant` (#45464d) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Component Guidelines

### Buttons (The Precision Tools)
- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `md` (0.375rem) corner radius.
- **Secondary:** Transparent fill with a `Ghost Border`. Text in `primary`.
- **States:** On hover, the `surface_bright` layer should increase in opacity by 10%.

### Cards & Data Modules
- **Rule:** Forbid divider lines.
- **Separation:** Use `Spacing Scale 8` (1.75rem) of vertical white space or a shift from `surface_container` to `surface_container_low`. 
- **Header:** Use `label-md` in `on_tertiary_container` for category tags to provide a "taped-on" archival aesthetic.

### Data Visualization Accents
- **Positive Sentiment:** `secondary` (#4edea3) - The "Emerald" indicator.
- **Negative Sentiment:** `error` (#ffb4ab) - The "Crimson" indicator.
- **Neutral/Warning:** `tertiary` (#ffb95f) - The "Amber" indicator.
*Note: Always use these against `surface_container_highest` to ensure the vibrancy pops against the slate background.*

### Specialized Components
- **The "Pulse" Identifier:** For real-time media feeds, use a small 4px circle using `secondary` with a slow 2s opacity pulse.
- **Monospaced Technicals:** Use a monospaced font (system default) for "Media IDs" or "Source URLs" at `label-sm` size to distinguish raw data from analyzed insight.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize "breathing room" (Scale 10+) between major data clusters.
- **Do** use `surface_variant` for inactive states or "empty" chart backgrounds.
- **Do** lean into asymmetry; allow a sidebar to be significantly narrower than standard to emphasize the "Density" of the main stage.

### Don’t
- **Don’t** use pure black (#000000) or pure white (#FFFFFF). Use the provided `surface` and `on_surface` tokens to maintain the "Slate & Navy" sophistication.
- **Don’t** use sharp 90-degree corners. Even for "precise" layouts, the `sm` (0.125rem) radius makes the platform feel engineered rather than aggressive.
- **Don’t** use more than one "Primary" action per screen. The system relies on tonal hierarchy to guide the analyst's eye.