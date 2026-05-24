---
name: Void Clarity
theme: dark-first
colors:
  # ── Backgrounds (no borders — depth through tone alone) ──────────────────
  bg-base:              '#0C0C14'   # near-black with faint purple undertone
  bg-surface:           '#121220'   # primary card / sheet surface
  bg-surface-raised:    '#1A1A2C'   # elevated panels, bottom sheets
  bg-surface-overlay:   '#1F1F32'   # modals, top-layer sheets
  bg-glass:             'rgba(255,255,255,0.05)'  # glassmorphism fill
  bg-glass-raised:      'rgba(255,255,255,0.08)'  # slightly more opaque glass

  # ── Primary — Electric Violet ─────────────────────────────────────────────
  primary:              '#A855F7'   # electric violet — brand, CTAs
  primary-glow:         'rgba(168,85,247,0.25)'   # ambient glow for buttons
  primary-dim:          '#7C3AED'   # pressed / active states
  on-primary:           '#FFFFFF'

  # ── Accent — Electric Cyan ────────────────────────────────────────────────
  accent:               '#22D3EE'   # electric cyan — interactive affordances, data highlights
  accent-glow:          'rgba(34,211,238,0.20)'
  on-accent:            '#0C0C14'

  # ── Accent Secondary — Fuchsia ────────────────────────────────────────────
  accent-fuchsia:       '#E879F9'   # special highlights, success nudges, badges
  on-accent-fuchsia:    '#0C0C14'

  # ── Text ──────────────────────────────────────────────────────────────────
  text-primary:         '#F0EEFF'   # near-white with subtle violet cast
  text-secondary:       '#A8A8C8'   # secondary / muted labels
  text-tertiary:        '#5A5A78'   # placeholder, disabled, timestamps
  text-inverse:         '#0C0C14'

  # ── Semantic ──────────────────────────────────────────────────────────────
  success:              '#34D399'   # emerald green
  success-surface:      'rgba(52,211,153,0.12)'
  warning:              '#FBBF24'   # amber
  warning-surface:      'rgba(251,191,36,0.12)'
  error:                '#F87171'   # soft red — no harsh #FF0000
  error-surface:        'rgba(248,113,113,0.12)'
  info:                 '#22D3EE'   # reuse accent for info states

  # ── Deprecated (do not use) ───────────────────────────────────────────────
  # All border/outline tokens from the previous system are removed.
  # Depth is achieved exclusively through tonal layers and ambient glow.

typography:
  # ── Display ───────────────────────────────────────────────────────────────
  display:
    fontFamily: Space Grotesk
    fontSize: 48px            # desktop
    fontSizeMobile: 32px      # mobile-first: clamp(32px, 5vw, 48px)
    fontWeight: '800'
    lineHeight: 1.05
    letterSpacing: -0.03em
    color: text-primary

  # ── Headlines ─────────────────────────────────────────────────────────────
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontSizeMobile: 22px
    fontWeight: '700'
    lineHeight: 1.2
    letterSpacing: -0.02em

  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontSizeMobile: 18px
    fontWeight: '600'
    lineHeight: 1.25
    letterSpacing: -0.015em

  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 1.3
    letterSpacing: -0.01em

  # ── Body ──────────────────────────────────────────────────────────────────
  body-lg:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 1.65
    letterSpacing: 0.01em    # slight positive tracking improves legibility on dark

  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 1.6
    letterSpacing: 0.01em

  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 1.5
    letterSpacing: 0.01em

  # ── Labels & UI Text ──────────────────────────────────────────────────────
  label-md:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 1.2
    letterSpacing: 0.02em

  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 1.2
    letterSpacing: 0.06em    # wider tracking for small caps / status labels
    textTransform: uppercase

  # ── Numeric / Mono (amounts, totals) ─────────────────────────────────────
  numeric-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 1.0
    letterSpacing: -0.02em
    fontVariantNumeric: tabular-nums

  numeric-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 1.1
    letterSpacing: -0.01em
    fontVariantNumeric: tabular-nums

  numeric-sm:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 1.2
    fontVariantNumeric: tabular-nums

rounded:
  sm:   0.375rem    # 6px  — chips, badges, small tags
  DEFAULT: 0.75rem  # 12px — inputs, small cards
  md:   1rem        # 16px — standard cards
  lg:   1.25rem     # 20px — primary cards, bottom sheets
  xl:   1.75rem     # 28px — feature panels, modals
  full: 9999px      # pill — avatar rings, progress indicators

spacing:
  base: 8px
  xs:   4px
  sm:   12px
  md:   16px
  lg:   24px
  xl:   32px
  2xl:  48px
  3xl:  64px
  container-max: 1280px
  gutter: 20px
  margin-mobile: 16px

---

## Platform Context

**Talli** is a mobile-first bill-splitting PWA. Its primary use context is intensely social — used on a phone immediately after a meal, concert, or shared trip. The environment is noisy, low-attention, often dimly lit. Users need to complete the primary flow (add people → scan receipt → assign items → settle) in under 2 minutes.

The default is **dark mode**. It is not a toggle — it is the product. Dark reduces eye strain in restaurant lighting, conserves battery, and allows neon accents to sing at their full perceptual weight. A system-responsive light adaptation may be considered in the future but is explicitly out of scope.

Design priorities (in order):
1. **One-handed mobile reachability** — primary actions live in the bottom 60% of the viewport
2. **Low cognitive overhead** — visual complexity is zero; clarity is structural, not decorative
3. **Speed** — every extra tap or second is a failure
4. **Touch-first** — bottom sheets over dialogs, swipe gestures over buttons, 48×48px minimum tap targets

---

## Brand & Style

The personality is **bold, precise, and effortless**. It targets mobile-native users in their 20s–40s who resent friction. The UI should feel like a premium consumer app — closer to Revolut or Vercel's dark dashboard than a fintech form.

The visual style is **Dark Minimalist with Intentional Contrast**: deep dark surfaces, no borders, hierarchy achieved through tonal stepping and precisely placed neon accents. The UI does not decorate; it directs. Every visual element must earn its place by serving task completion.

Motion is **functional only** — it confirms state changes (swipe-to-assign, step completion) and provides orientation (bottom sheet sliding in). No idle animations. No decorative parallax or looping effects.

---

## Colors

### Philosophy: Borderless Depth

All visual separation is achieved through **tonal surface layers** and **ambient glow**, never through borders or outlines. The surface stack (`bg-base → bg-surface → bg-surface-raised → bg-surface-overlay`) provides four levels of implicit z-depth. Cards "float" because they are lighter than their parent — no stroke required.

### Dark Background Stack

| Token               | Value       | Purpose                              |
|---------------------|-------------|--------------------------------------|
| `bg-base`           | `#0C0C14`   | Page canvas, behind everything       |
| `bg-surface`        | `#121220`   | Default card, list row surface       |
| `bg-surface-raised` | `#1A1A2C`   | Elevated panels, bottom sheets       |
| `bg-surface-overlay`| `#1F1F32`   | Modals, command palettes             |
| `bg-glass`          | `rgba(255,255,255,0.05)` | Frosted glass surfaces   |
| `bg-glass-raised`   | `rgba(255,255,255,0.08)` | Glass on glass, subtle lift  |

### Neon Accents

Two saturated accent colors operate on the dark field. They are never used simultaneously on the same component — one per surface, one per hierarchy level.

- **Electric Violet** (`#A855F7`) — primary brand color, CTA buttons, active states, progress indicators. Emits a soft `rgba(168,85,247,0.25)` ambient glow on hover/active.
- **Electric Cyan** (`#22D3EE`) — interactive affordances, links, data highlights, secondary actions. Emits a `rgba(34,211,238,0.20)` glow.
- **Fuchsia** (`#E879F9`) — sparingly: success nudges, special badges, celebratory moments (e.g., "All settled!").

### Text Hierarchy

On dark surfaces, slight optical positive tracking (`+0.01em`) improves legibility. All text targets WCAG AA minimum; primary body text targets AAA (`#F0EEFF` on `#0C0C14` = ~17:1 contrast).

| Role               | Token            | Contrast on bg-base |
|--------------------|------------------|---------------------|
| Primary text       | `#F0EEFF`        | ~17:1 ✅ AAA        |
| Secondary text     | `#A8A8C8`        | ~7.5:1 ✅ AA        |
| Muted / disabled   | `#5A5A78`        | ~3.5:1 (decorative only) |

---

## Typography

### Font Strategy: Geometric + Humanist

The dual-font approach is retained but updated:

- **Space Grotesk** — headlines, display, numeric amounts. Its geometric apertures and slightly condensed rhythm suit bold, data-rich contexts. Used at heavy weights (600–800) to maximise impact.
- **DM Sans** — all body text, labels, UI copy. Chosen over Inter for its slightly warmer stroke contrast and optical clarity at small sizes on dark surfaces. Renders cleanly on low-DPI mobile screens.

Both fonts are variable-weight. Load a single variable font file each via `font-display: swap` for performance.

### Scale

The scale is a **fluid type** approach: display and headline sizes use `clamp()` to reduce gracefully on mobile without separate breakpoint overrides. Body text is fixed — 15–17px is optimal for reading on OLED mobile.

```css
/* Example fluid clamp values */
--type-display:      clamp(2rem, 5vw, 3rem);     /* 32px → 48px */
--type-headline-lg:  clamp(1.375rem, 3.5vw, 1.75rem);  /* 22px → 28px */
--type-headline-md:  clamp(1.125rem, 2.5vw, 1.375rem); /* 18px → 22px */
```

### Tracking Notes

- **Headlines / Display**: Tighten tracking aggressively (`-0.02em` to `-0.03em`) — Space Grotesk at large weights pairs naturally with close letter spacing.
- **Body text on dark**: Apply `+0.01em` tracking — dark backgrounds reduce apparent character separation; slight positive spacing compensates.
- **Label-sm (uppercase)**: `+0.06em` — wide tracking is mandatory for legibility at 11px uppercase.
- **Numeric amounts**: Always `font-variant-numeric: tabular-nums` — financial figures must never reflow.

### Component Typography Conventions

The abstract scale above maps to these concrete sizes for the specific UI contexts in Talli. Use these as the single source of truth — never pick arbitrary sizes between these steps.

| Context | Size | Weight | Font | Tailwind |
|---|---|---|---|---|
| Section card title | 13px | 600 | DM Sans | `text-[13px] font-semibold font-body` |
| Section card description | 12px | 400 | DM Sans | `text-xs font-body text-muted-foreground` |
| List row primary label | 14px | 600 | Space Grotesk | `text-sm font-semibold font-headline` |
| List row secondary detail | 12px | 400 | DM Sans | `text-xs font-body text-muted-foreground` |
| Amount — focal / prominent | 16px | 700 | Space Grotesk | `text-base font-bold font-headline tabular-nums` |
| Amount — inline / secondary | 13px | 500 | Space Grotesk | `text-[13px] font-medium font-headline tabular-nums` |
| Amount — grand total | 15px | 700 | Space Grotesk | `text-[15px] font-bold font-headline tabular-nums` |
| Status badge / tag | 10px | 600 | DM Sans | `text-[10px] font-semibold font-body uppercase tracking-[0.06em]` |
| Empty-state heading | 13px | 600 | DM Sans | `text-[13px] font-semibold font-body` |
| Empty-state body | 12px | 400 | DM Sans | `text-xs font-body text-muted-foreground` |

**Rationale:** The 14 → 12px two-level row system (primary → secondary) creates clear hierarchy without needing font-weight alone. Amounts at 16px sit one step above the 14px label, making the money the unambiguous focal point in any financial row. The 4px gap between steps (16 → 12) ensures the hierarchy reads clearly on OLED mobile in low-light conditions.

### Card Header Convention

All section card headers follow a single compact pattern to ensure visual rhythm across the settle step:

```tsx
<CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
    <Icon className="w-3.5 h-3.5 text-primary" />
  </div>
  <div>
    <CardTitle className="text-[13px] font-semibold font-body">Title</CardTitle>
    <CardDescription className="text-xs">One-line description.</CardDescription>
  </div>
</CardHeader>
```

Rules:
- Icon container: `h-7 w-7 rounded-md bg-primary/10` — tonal, not filled
- Icon size: `w-3.5 h-3.5` (14px) — never 32px raw icons
- Title: `text-[13px] font-semibold font-body` — DM Sans, not Space Grotesk
- Description: `text-xs font-body text-muted-foreground`
- No `CardContent` top padding when the content is a list (set `pt-0` or `px-3 pb-3`)

---

## Layout & Spacing

The layout follows a **fluid-first** philosophy. On mobile (the default), a single column with 16px side margins. On tablet, a centred 640px max-width column. On desktop, a 1280px container with a two-column or card-grid layout.

An **8px base grid** governs all spacing. Common token usage:
- Component internal padding: `md` (16px) or `lg` (24px)
- Gap between cards in a list: `sm` (12px)
- Section vertical rhythm: `xl` (32px) or `2xl` (48px)
- Bottom safe area (above navigation): min 80px to ensure content clears the thumb zone nav bar

The bottom of the screen is the most valuable space. Primary actions (Pay Now, Assign, Confirm) live in a **sticky bottom bar** with `pb-[env(safe-area-inset-bottom)]` to respect iOS/Android notch geometry.

---

## Depth & Glassmorphism

Visual hierarchy has three tools, in order of preference:

### 1. Tonal Layers (Primary)
Cards are always `bg-surface` or `bg-surface-raised` on a `bg-base` page. The ~8–10% luminance step between layers creates clear visual planes without a single border.

### 2. Ambient Glow (Secondary — use sparingly)
Active/focused interactive elements emit a low-opacity radial glow matching the nearest accent color. This provides spatial orientation without visual noise.

```css
/* Example: focused primary button */
box-shadow: 0 0 24px 4px rgba(168, 85, 247, 0.25);
```

### 3. Glassmorphism (For overlays only)
Bottom sheets, modals, and contextual popovers use glass surfaces. Implementation must be kept simple and performant:

```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
/* No border. No outline. */
```

**Rules for glassmorphism:**
- Only one level of backdrop blur active at a time per page (performance constraint)
- Use only for overlay surfaces — never for scrolling list cards (blur on scroll = jank)
- Content behind the glass must have sufficient luminance contrast; test on both dark and slightly lighter backgrounds

### What is explicitly forbidden
- Borders (1px strokes, outline: solid, ring effects for decoration)
- Dividers / `<hr>` as visual separators
- Shadows with visible hard edges
- Any element that looks "outlined" rather than "lifted"

---

## Shapes

Rounded shape language is **generous but purposeful**. Larger rounding signals higher-level containers; smaller rounding signals atoms.

| Context                        | Radius Token | Value  |
|--------------------------------|--------------|--------|
| Chips, tags, small badges      | `sm`         | 6px    |
| Inputs, toggles, small buttons | `DEFAULT`    | 12px   |
| Standard cards, list items     | `md`         | 16px   |
| Primary cards, main containers | `lg`         | 20px   |
| Modals, feature panels         | `xl`         | 28px   |
| Avatar frames, pill buttons    | `full`       | 9999px |

Avoid mixing rounding levels within a single component. A card (20px) containing a button (12px) is correct. A card (20px) containing a tag (20px) is not.

---

## Motion & Animation

### Principles

- **Functional only** — every animation must communicate state change, not decorate
- **Fast by default** — mobile users are impatient; transitions should be `200ms` or less unless entering a new screen (max `350ms`)
- **Ease curves** — use `ease-out` for elements entering the screen (feels responsive); `ease-in` for elements leaving (feels clean)

### Approved Animations

| Pattern              | Duration | Easing       | Use case                            |
|----------------------|----------|--------------|-------------------------------------|
| Bottom sheet in      | 320ms    | ease-out     | Panels sliding up from bottom       |
| Bottom sheet out     | 240ms    | ease-in      | Dismissal                           |
| Item swipe-assign    | 200ms    | ease-out     | Swipe gesture confirmation          |
| Button press scale   | 80ms     | ease-out     | Tactile press feedback (`scale 0.97`)|
| Skeleton shimmer     | 1400ms   | linear loop  | Loading states only                 |
| Accordion expand     | 200ms    | ease-out     | Collapsible sections                |

### What is forbidden
- Parallax scrolling effects
- Looping idle animations (breathing glows, spinning logos)
- `backdrop-filter` transitions (triggers GPU compositing on scroll)
- Any animation on list rows during scroll

---

## Components

### Buttons

**Primary** — Electric Violet fill, white text, `lg` rounded (20px for standalone CTAs). On press: scale to 0.97, darken fill to `primary-dim`. On focus: violet ambient glow ring. No border.

**Secondary** — `bg-surface-raised` fill, `text-primary` text. No border; differentiated from primary through surface tone alone. On press: shift to `bg-surface-overlay`.

**Ghost / Text** — Transparent fill. Accent-colored label only. Reserve for low-priority inline actions.

**Destructive** — `error-surface` fill with `error`-colored label. No red stroke.

All buttons: minimum 48px height on mobile (touch target), `md` padding horizontal.

### Cards

`bg-surface` on `bg-base`. Corner radius `lg` (20px) for primary feature cards, `md` (16px) for list-density cards. No stroke. Internal padding `lg` (24px) for feature cards, `md` (16px) for list rows. Hover/press state shifts surface to `bg-surface-raised`.

For **glass cards** (bottom sheets, overlays): `bg-glass`, `backdrop-filter: blur(16px)`, corner radius `xl` (28px) on top corners only for sheets that partially cover the screen.

### Input Fields

Dark surface: `bg-surface-raised`. Rounded `DEFAULT` (12px). No border at rest. Focus state indicated by an Electric Cyan ambient glow (`box-shadow: 0 0 0 3px rgba(34,211,238,0.25)`) — not a border-color change. Placeholder text in `text-tertiary`. Input text in `text-primary`. Label floats above in `label-md`/`text-secondary`.

Error state: `error-surface` background tint + error-color label beneath. No red border ring.

### Bottom Sheets

The primary overlay pattern for all secondary flows. Enter from bottom, exit down. Glass surface (`bg-glass`). `backdrop-filter: blur(16px)`. Top corners rounded `xl` (28px). A 32px drag handle (4px height, `bg-surface-overlay`, `full` radius) at the top. No title border separator — use vertical spacing only.

### Chips & Badges

Two types:

- **Status badges** — `label-sm` (11px uppercase, +0.06em tracking). `success-surface` / `error-surface` / `warning-surface` background. Text matches semantic color. Full pill radius. No stroke.
- **Selection chips** — `bg-surface-raised` at rest; Electric Violet fill (`primary`) when selected. `body-sm` text. `sm` radius (6px).

### Icons

Lucide icon set, **2px stroke width**, 20px (inline UI) or 24px (standalone triggers). Color inherits from surrounding text (`currentColor`) in most contexts. Standalone interactive icons use the accent color (`accent`). Never use a border or filled background on an icon unless it is a featured action icon (e.g., primary scan button).

### Lists & Rows

Clean, **zero-divider** lists. Rows separated by vertical spacing only (`sm` gap = 12px between rows). A row's pressed/swiped state shifts its surface to `bg-surface-raised`. Swipeable rows use a colored reveal behind them (Electric Violet for assign, error-surface for remove).

### Navigation Bar (Bottom)

Fixed, bottom-anchored. `bg-glass` surface with `backdrop-filter: blur(20px)` to let content scroll behind it. Height: 64px + `env(safe-area-inset-bottom)`. Icons only (or icon + label for active item). Active tab uses Electric Violet icon + label; inactive uses `text-tertiary`.

### Skeleton / Loading States

`bg-surface-raised` shapes with a subtle shimmer animation (linear gradient scan, `1400ms` loop). Match exactly the geometry of the content they represent. Never use spinner icons in place of inline content skeletons.

---

## Accessibility

- All interactive text targets **WCAG AA** minimum contrast (4.5:1). Primary text targets AAA.
- Touch targets: minimum **48×48px** on mobile regardless of visual size. Use padding to extend tap area without affecting layout.
- Focus states: every focusable element must have a visible focus indicator — the ambient glow ring serves this purpose. It must be visible at 3:1 contrast minimum against the adjacent background.
- No information conveyed by color alone — status badges combine color + uppercase label; error states combine tint + text message.
- Reduce-motion: all transitions and animations must respect `prefers-reduced-motion: reduce` by falling back to instant state changes.

---

## Do / Don't Summary

| ✅ Do                                          | ❌ Don't                                        |
|------------------------------------------------|------------------------------------------------|
| Use tonal layers to establish depth            | Use borders or outlines to separate elements   |
| Use neon accents sparingly and purposefully    | Apply accent colors to large filled areas      |
| Keep glassmorphism to overlay layers only      | Apply backdrop-blur to scrolling content       |
| Use Space Grotesk bold for all key numbers     | Mix more than two font families                |
| Animate state changes only                     | Add idle or looping decorative animations      |
| Ensure 48px tap targets on all interactive els | Use small touch targets relying on precision   |
| Test on OLED dark in low ambient light         | Design primarily on bright monitors            |
| Use `tabular-nums` for all financial figures   | Allow currency amounts to reflow or jump       |
