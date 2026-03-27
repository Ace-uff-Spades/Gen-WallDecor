# GenWallDecor — Figma Wireframes Design Spec

> Created: 2026-03-27
> Purpose: Mid-fidelity wireframes of the current UI as a redesign foundation

---

## Goal

Create mid-fidelity wireframes of all 5 existing GenWallDecor pages in Figma using the Figma MCP server. The wireframes capture the current UI structure faithfully so the team can annotate and plan redesign improvements.

---

## Figma File Structure

- **One Figma page** with all frames on a single canvas
- **Four labeled sections** grouping screens by feature area
- **Frame size:** 1440×900px (desktop)
- **Fidelity:** Mid-fi — realistic layout, typography hierarchy, real labels, gray image placeholders, app color scheme applied

### Section 1 — Onboarding

**Frame: Landing Page**

- Navbar: logo left, "History" link + "Sign In" button right
- Hero section: H1 "Design Your Perfect Wall", subtext, "Start Creating" CTA button (primary teal)
- "How It Works" section: section heading, 3 step cards side-by-side (secondary purple background)
  - Each card: emoji icon, "Step N" label (primary teal), title, description
- Bottom CTA section: rounded card (secondary purple), heading, subtext, "Get Started" button

---

### Section 2 — Creation Flow

**Frame: Create — Step 1 (Choose Your Style)**

- Navbar
- Step indicator: 3 steps, step 1 active (teal fill), steps 2–3 inactive
- Heading: "Choose Your Style"
- 3-column grid of style cards: each has style name, description, selected state = teal border
- Footer: "Next" button (disabled until a style is selected)

**Frame: Create — Step 2 (Visual Preferences)**

- Navbar
- Step indicator: step 2 active
- Heading: "Visual Preferences"
- Color scheme: multi-select chip row (selected chips use secondary purple with teal border)
- Frame material: segmented selector or radio group
- Footer: "Back" + "Next" buttons

**Frame: Create — Step 3 (Room Context)**

- Navbar
- Step indicator: step 3 active
- Heading: "Room Context"
- Room type: dropdown selector
- Optional wall dimensions: two side-by-side number inputs (width × height)
- Footer: "Back" + "Generate" buttons (primary teal)

**Frame: Generate / Review Descriptions**

- Navbar
- Heading: "Review Your Descriptions", style name subtext
- 4–6 description cards stacked vertically: title, description text, medium/dimensions/placement metadata; each card has a "Regenerate this piece" link below
- Feedback panel: bordered card, "Want different descriptions?" label, textarea, "Regenerate All" secondary button
- Generate Images CTA: large primary teal button, centered

---

### Section 3 — Result

**Frame: Wall View**

- Navbar
- Heading: "Your Wall — [Style]"
- 16:9 wall render image placeholder (gray fill) with 4–6 interactive dot overlays at piece positions (matching piece count); one dot shown open with a popover (title + shopping links)
- Regeneration controls bar: "Regenerate Selected (N)" primary button, "Update Wall Render" secondary button, "Finalize Wall" green button, "N regenerations used" counter
- "Individual Pieces" subheading
- Piece gallery: thumbnail grid (left, 2–4 col) + sticky details panel (right, 288px wide)
  - Each thumbnail: image placeholder, title below, selection checkbox overlay top-left, version nav arrows bottom (‹ 1/2 ›); grid is 4 columns at 1440px
  - Details panel: "DETAILS" label, piece title, description, medium/dimensions/placement, shopping/download links
- "Retry with Changes" button (secondary) at bottom

---

### Section 4 — Discovery

**Frame: History**

- Navbar
- Heading: "Your Generations", "Your most recent wall designs" subtext
- 3-column card grid: each card has 16:9 wall render placeholder, style name, date below
- Empty state variant (shown as annotation): centered "No generations yet" + "Create Your First Wall" CTA

---

## Color Scheme

Applied from the actual app theme:

| Token | Hex | Usage in wireframes |
|-------|-----|---------------------|
| Primary | `#1b998b` | Primary buttons, active step indicator, selected borders, "Step N" labels |
| Background | `#f8f1ff` | Page background fill |
| Secondary | `#decdf5` | Card fills, step cards, section backgrounds, secondary buttons |
| Text Darker | `#534d56` | Headings, bold text |
| Text Dark | `#656176` | Body text, labels, metadata |
| Image placeholder | `#e0e0e0` | Gray fill for image areas |
| White | `#ffffff` | Card backgrounds, navbar |

---

## Conventions

- Image areas: gray rectangle fill (#e0e0e0), no actual images
- Real labels and button text throughout (not "Lorem ipsum")
- Typography hierarchy: H1 (bold, 36px) / H2 (bold, 24px) / body (14–16px) / label (12px, uppercase)
- Interactive states shown where meaningful: selected style card (teal border), disabled Next button (reduced opacity), open dot popover
- No Figma components or variants — flat frames only (redesign will define components separately)
