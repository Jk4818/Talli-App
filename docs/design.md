---
name: Luminous Clarity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#4e4355'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#807286'
  outline-variant: '#d1c1d7'
  surface-tint: '#9000de'
  primary: '#8000c6'
  on-primary: '#ffffff'
  primary-container: '#a020f0'
  on-primary-container: '#f9e8ff'
  inverse-primary: '#e3b5ff'
  secondary: '#006399'
  on-secondary: '#ffffff'
  secondary-container: '#38adfe'
  on-secondary-container: '#003f63'
  tertiary: '#7a4700'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c5c00'
  on-tertiary-container: '#ffe9d8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f3daff'
  primary-fixed-dim: '#e3b5ff'
  on-primary-fixed: '#2f004c'
  on-primary-fixed-variant: '#6e00ab'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#95ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004a75'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Platform Context

**Talli** is a mobile-first bill-splitting progressive web app (PWA). Its primary use context is social — used on a phone immediately after a meal, event, or shared purchase, often in low-attention environments (a noisy restaurant, standing outside, splitting a cab). The primary platform is a handheld smartphone in portrait orientation. Desktop and tablet are secondary, used primarily for reviewing sessions or accessing shared reports.

Design decisions must prioritise:
- **One-handed mobile use** — primary actions reachable in the bottom 60% of the screen
- **Low cognitive load** — users are in a social context and cannot focus deeply on the interface
- **Speed to completion** — the primary flow (add people → scan receipt → assign items) should take under 2 minutes for a standard restaurant bill
- **Touch-first interactions** — bottom sheets over modals, large tap targets (min 44×44px), swipe gestures over buttons wherever native

The app is not a financial tool or enterprise application. Tone and visual language should feel like a well-designed consumer app, not a productivity suite.

## Brand & Style

The brand personality is precise, forward-thinking, and intellectually accessible. It targets modern professionals and socially active users (20s–40s) who want friction removed from shared expenses. The UI evokes organised intelligence and calm control — not clinical, but sharp and trustworthy.

The design style is **Modern / Consumer**, utilising a light, card-based mobile architecture. It leans into clean execution with generous touch targets, clear hierarchy, and a "Digital First" aesthetic appropriate for a consumer PWA. The interface prioritises task completion speed on mobile without sacrificing legibility or visual polish. Progressive disclosure is used to manage information density — surfaces start simple and reveal complexity on demand.

## Colors

The color strategy uses a saturated purple primary to establish authority and brand recognition. A vibrant blue accent is reserved strictly for interactive affordances and key data highlights, ensuring high discoverability.

The background is a soft, desaturated purple wash, which reduces the harshness of pure white while maintaining a professional, airy feel. Surface colors for cards should remain pure white (#FFFFFF) to provide maximum contrast against the tinted background. Status colors (success, error, warning) should be used sparingly, leaning on the secondary blue for neutral informational states.

## Typography

The system utilizes a dual-font strategy. **Space Grotesk** is used for headlines to provide a technical, modern edge with its unique geometric apertures. **Inter** handles all body and UI text, ensuring maximum legibility across all resolutions.

Tracking is slightly tightened on display sizes to enhance the "tight" modern feel, while label-sm uses uppercase tracking for structural clarity in data-heavy views. Hierarchy is achieved through weight variance rather than extreme size shifts.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop, centered within a 1280px container, and a **Fluid Grid** on mobile devices. A 12-column system is used for desktop and tablet, collapsing to 4 columns on mobile.

Spacing is built on an 8px rhythmic scale. Cards and primary containers should use `lg` (24px) padding to maintain an open, premium feel. Gutters between cards are fixed at 24px on desktop to allow the background color to act as a clear separator. For mobile, margins reduce to 16px to maximize screen real estate.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** combined with **Ambient Shadows**. 

The base background uses the light purple tint. Cards sit on the primary level with a pure white surface and a very soft, diffused shadow (0px 4px 20px, 4% opacity of the primary purple) to give them a "floating" appearance. 

Interactive elements like buttons or active states use a slightly deeper shadow (0px 8px 24px, 12% opacity) on hover to communicate tactility. Navigation rails and headers use a subtle 1px border (#E5D5F0) instead of shadows to maintain a clean, structured perimeter.

## Shapes

The design system employs a **Rounded** shape language to soften the technical nature of the typography.

- **Base components** (inputs, small buttons): 0.5rem (8px).
- **Cards and Containers**: 1rem (16px).
- **Feature elements** (promo cards, modals): 1.5rem (24px).

Avoid pill shapes for primary buttons to maintain the professional tone; reserve full-round corners only for tags and badges.

## Components

### Buttons
Primary buttons use the saturated purple background with white text. Secondary buttons use a ghost style with a 1px border of the accent blue. Interactive highlights for links use the blue accent color.

### Cards
White surfaces with 16px corner radius. Use a 1px internal stroke of a lighter purple (#EBDCF5) to define edges against the tinted background.

### Input Fields
Soft white backgrounds with 8px corner radius. Focus states are indicated by a 2px blue accent border and a subtle glow. Labels use `label-md` in a dark neutral.

### Chips & Badges
Small, 12px font size with high-contrast backgrounds for status (e.g., light blue background with dark blue text). Used for categorization and data tags.

### Icons
Use minimalist, thin-stroke icons (2px stroke width) from the Lucide set. Icons should be sized at 20px or 24px and inherit the color of the text they accompany, except when used as standalone interactive triggers where they use the blue accent.

### Lists
Clean, borderless lists with 12px vertical spacing. Use subtle background highlights on hover (#F8F4FB) to indicate interactivity.