# Talli — Step 1 Setup Page: UX/UI Redesign Spec

**Document type:** Product & UX Design Specification  
**Scope:** Step 1 (Setup) of the Talli bill-splitting flow  
**Platform target:** Mobile-first progressive web app (PWA), responsive to desktop  
**Status:** Approved for implementation

---

## 1. Context & Problem Statement

### What Step 1 does today

Step 1 is the foundation of every Talli session. Its job is to collect three things before the user can proceed to item assignment:

1. **Who is splitting** — a list of participant names
2. **What was spent** — one or more receipts (uploaded via AI scan, or entered manually)
3. **Payer assignment** — who paid for each receipt

Every feature on the page exists to support one of those three jobs. The problem is that the page presents *all* of them simultaneously, at full complexity, with no guidance about what to do first or what is optional.

### The specific complexity problem

For a first-time user opening Talli after a meal, the page presents:

- A participants form alongside a receipts card (two unrelated jobs competing for attention)
- Inside each receipt card: an accordion for **Receipt-Wide Discounts**, another for **Service Charge / Tip**, inline AI suggestion banners with four action buttons each, per-receipt currency selectors, exchange rate inputs, and AI confidence scores
- Below all of that: a full item grid with sort, search, and edit controls
- At the very top: Import Session and Reset Session buttons (meaningless to a first-time user)

The language compounds the problem. "Receipt-Wide Discounts" is data-model vocabulary, not user vocabulary. A user who has just come back from a restaurant thinks in terms of: *"there was a 10% service charge on the bill"*, not *"I need to add a receipt-level discount with a negative service charge modifier"*.

### What a real user journey looks like

The primary persona is someone at a restaurant table, or immediately after, with friends:

1. They open Talli on their phone
2. They type in the names of the people splitting
3. They take a photo of the receipt
4. They wait a few seconds for the AI to extract items
5. They check the items look right, fix any errors
6. They tap "Assign Items" to proceed

In the primary journey, discounts and service charges are either **already extracted by the AI** (and just need confirmation) or are **not relevant at all** (a simple equal split of a clean receipt). The complexity of manually managing discounts, exchange rates, and service charges should be available but not visible by default.

---

## 2. Design Principles for This Redesign

### 2.1 Progressive disclosure
Show the minimum required to complete the core task. Surface advanced options only when they are needed or when the user asks for them. The primary flow should be completable in under 60 seconds for a straightforward receipt.

### 2.2 Task sequencing, not data layout
Organise the page around what the user needs to *do*, not around the data structures the app manages. The user's mental model is: *add people → add receipt → check items → continue*. The layout should mirror that sequence.

### 2.3 Mobile-first interaction
Every primary action must be reachable with one thumb, on a phone held in portrait orientation. Dense desktop layouts (side-by-side cards, multi-column grids) are enhancements for wider screens, not the baseline.

### 2.4 Smart defaults, optional precision
Most sessions involve a single currency, a service charge already captured by AI, and no manual discounts. Default to the simple path; make the complex path discoverable but not prominent.

### 2.5 User vocabulary, not data vocabulary
Labels must describe what the user cares about, not how the data is structured. "Receipt-Wide Discounts" → **"Discounts on the whole bill"**. "Service Charge" stays but is grouped with tips and framed as **"Service & Tips"**.

### 2.6 Immediate feedback, no blocking alerts
Errors and missing information should be indicated inline and contextually, not via red banner alerts that block the whole page. The "Assign Items" button should be clearly gated with a visible checklist, not a tooltip over a disabled button.

---

## 3. Current State Feature Inventory

All features listed below must remain accessible in the redesign. None are removed.

| Feature | Current location | Current discoverability |
|---|---|---|
| Add participant by name | Participants card | Good |
| Remove participant | Avatar hover (mobile: always visible) | Poor on desktop |
| Upload & AI-scan receipt | Button inside Receipts card | Good |
| Add receipt manually | Button inside Receipts card | Fair |
| Assign payer per receipt | Dropdown inside ReceiptCard | Poor (hidden unless expanded) |
| Set receipt currency | Dropdown inside ReceiptCard | Poor |
| Set exchange rate | Input inside ReceiptCard (conditional) | Very poor |
| Add receipt-wide discount (manual) | Accordion inside ReceiptCard | Poor |
| Review AI discount suggestion | Inline panel inside accordion | Very poor |
| Apply / reassign / ignore AI discount | 4-button panel inside accordion | Very poor |
| Add service charge (fixed amount) | Accordion inside ReceiptCard | Poor |
| Add service charge (percentage) | Accordion inside ReceiptCard | Poor |
| View AI confidence score | Badge/tooltip in ReceiptCard header | Fair |
| Edit item name/cost/quantity | Item grid card → edit dialog | Good |
| Delete item | Item grid card → edit dialog | Good |
| Add item manually | Button in item grid header | Fair |
| Search items | Input in item grid header | Good |
| Sort items | Dropdown in item grid header | Good |
| Set global settlement currency | Dropdown in receipts header | Poor |
| Import session (JSON) | Button at page top | Poor |
| Reset session | Button at page top (destructive) | Over-prominent |
| View receipt image | Icon button in ReceiptCard header | Good |

---

## 4. Redesigned Information Architecture

### 4.1 Page-level structure

The page is reorganised into three **visually distinct, vertically sequenced sections**. On mobile, users scroll through them in order. On desktop, sections 1 and 2 sit side-by-side, with section 3 below.

```
┌─────────────────────────────────────────┐
│  SECTION 1: Who's splitting?            │
│  (Participants — compact, top-of-page)  │
├─────────────────────────────────────────┤
│  SECTION 2: What are we splitting?      │
│  (Receipts — primary content area)      │
├─────────────────────────────────────────┤
│  SECTION 3: Review items                │
│  (Item grid — collapsed by default)     │
└─────────────────────────────────────────┘
     [  ← Back  ]         [ Assign Items → ]
                    (footer)
```

The footer "Assign Items" button is replaced with a **readiness checklist** — a small status row just above the button showing ✓/✗ for each required condition. This replaces the hidden tooltip on a disabled button.

### 4.2 Utility actions demoted

**Import Session** and **Reset Session** are moved out of the primary page flow into a **session overflow menu** — a `⋯` icon button in the page header or app navbar. They are not removed, but they are no longer the first thing a user sees.

---

## 5. Multi-Phase Redesign Plan

---

### Phase 1 — Receipt Card: Surface Simplification
*The highest-impact change. Reduces cognitive load immediately upon scanning a receipt.*

#### 5.1.1 Goal
Transform the ReceiptCard from a dense settings panel into a clean summary card with contextual detail on demand.

#### 5.1.2 Default (collapsed) state — new design

After a receipt is scanned or added, the card shows exactly this at a glance:

```
┌──────────────────────────────────────────┐
│  📄 [Receipt Name]              [⌄] [🖼] │
│  Paid by: [Select payer ▼]               │
│                                          │
│  Subtotal           £24.50               │
│  Service & tips     £2.45  ← chip        │
│  Discounts          -£3.00 ← chip        │
│  ─────────────────────────               │
│  Total              £23.95               │
│                                          │
│  [+ Add discount or tip]  [Edit details] │
└──────────────────────────────────────────┘
```

**Key changes from current:**

- **Payer selector is always visible** — it is no longer hidden inside the collapsible body. A missing payer shows a destructive ring and inline label "Payer required to continue". No AlertCircle tooltip needed.
- **Summary chip row replaces accordion triggers** — Service & tips and Discounts appear as read-only chips when they have non-zero values. They are tappable to expand/edit inline or open a bottom sheet.
- **"Add discount or tip" is a single ghost button** — replaces two separate accordions. Tapping it opens the **Bill Adjustments Sheet** (see 5.1.3).
- **"Edit details" is a secondary text link** — opens the **Receipt Details Sheet** (see 5.1.4) for advanced options (currency, exchange rate, receipt name edit).
- **AI confidence** — shown as a small `✦ 94%` badge in the header row, only when confidence < 85%. Tap it to see what it means. Hidden above 85% to reduce noise.
- **AI suggestions** — when pending, a single **"✦ Review AI suggestions"** banner replaces all the inline suggestion panels (see Phase 3).

#### 5.1.3 Bill Adjustments Sheet (bottom sheet on mobile, dialog on desktop)

This replaces both accordions (Discounts and Service Charge). It opens from the "Add discount or tip" button, or by tapping an existing chip.

```
┌──── Bill Adjustments ────────────────┐
│                                      │
│  Service & Tips                      │
│  ○ None                              │
│  ● Fixed amount    [£] [2.45    ]    │
│  ○ Percentage      [%] [        ]    │
│                                      │
│  ─────────────────────────           │
│                                      │
│  Discounts on this bill              │
│  [Summer deal]        [-£3.00] [✕]   │
│  + Add a discount                    │
│                                      │
│  ─────────────────────────           │
│  Effective total        £23.95       │
│                                      │
│           [ Done ]                   │
└──────────────────────────────────────┘
```

**Design decisions:**

- **Service charge type** uses 3 radio options: None / Fixed amount / Percentage. "None" is the default, replacing the current default of fixed £0 which looks like a setting that needs filling in.
- **Percentage service charge** shows a live preview: *"12.5% of £24.50 = £3.06"* beneath the input as the user types.
- **Discounts** are listed as rows with name, amount, and a delete button. "Add a discount" adds a new editable row inline (no separate button needed to confirm — it saves on blur/Done).
- **Effective total** at the bottom updates live as values change, giving the user immediate feedback.
- The sheet has a single **Done** button which closes it. No separate save/cancel because changes are applied immediately (same as existing accordion behaviour).

#### 5.1.4 Receipt Details Sheet (bottom sheet on mobile, dialog on desktop)

Opens from "Edit details" link. Contains infrequently-used options:

- Receipt name (text input)
- Currency (select — defaults to global currency)
- Exchange rate (appears only if currency differs from global) — with a human-readable label: *"1 USD = [1.26] GBP"*
- Delete receipt (destructive, at bottom with confirmation)

Separating these options into a sheet means the primary card surface is clean for the 95% of cases where the user never needs to change them.

#### 5.1.5 Failed receipt state

Current: generic error message with a "Delete Attempt" button only.

New: error message + categorised suggestion + two buttons:

- **Try Again** (if imageDataUri stored — uses reprocessReceiptFromUri)
- **Enter manually instead** (converts the failed receipt to a manual receipt, preserving the receipt name)

The "Enter manually" path is new — it gives the user a recovery path that doesn't require re-uploading, reducing friction when the AI fails on a low-quality image.

---

### Phase 2 — Page Structure: Progressive Disclosure
*Reduces the overwhelming first impression by sequencing the tasks and collapsing non-critical sections.*

#### 5.2.1 Section 1: Participants

**Current problem:** The participants card sits at the same visual weight as the receipts card, in a side-by-side grid. On mobile, it stacks above receipts and takes significant vertical space.

**Redesigned behaviour:**

- On initial load (0 participants), the section shows a single prominent input with large placeholder text: *"Start by adding who's splitting…"* — a single text field + add button, full width.
- Once participants are added, the section collapses to a compact **avatar strip** — a row of avatar chips showing initials. Tapping the strip expands it back to the editable list.
- The collapsed strip shows: `[AB] [CD] [EF]  + Add` — the + Add chip is always visible and always tappable.
- On desktop, the side-by-side layout is retained but the participants panel has a `max-h` that prevents it from growing tall when there are many participants.

**Why this matters on mobile:** The current participants card can consume 300–400px before the user even sees the receipts section. The collapsed avatar strip is ~56px, freeing the viewport for the receipt — the more complex task.

#### 5.2.2 Section 2: Receipts

The receipts section becomes the **primary content area** of the page.

**Empty state redesign:**

Current: a dashed box with "No receipts uploaded yet."

New: a **two-option CTA card** centred on the screen:

```
┌───────────────────────────────────────┐
│                                       │
│    📷                                 │
│    Scan your receipt                  │
│    Let AI extract everything for you  │
│                                       │
│    [ Upload & Scan ]  ← primary CTA   │
│                                       │
│    ──────── or ────────               │
│                                       │
│    Enter manually →  ← text link      │
│                                       │
└───────────────────────────────────────┘
```

This empty state guides the user clearly to the recommended action (AI scan) without requiring them to understand both options upfront.

**Receipt limit indicator:**

Current: a red Alert component that appears at the top when limit is reached.

New: receipt limit is shown as a subtle counter in the receipts section header: *"Receipts (2/3)"*. When the limit is reached, the Add button becomes disabled and shows a tooltip *"3 receipt maximum"* — no full-width alert needed.

**Currency placement:**

Current: *"Settle in: [GBP ▼]"* appears in the receipts header, without context.

New: The global settlement currency is moved to the **session header** — a small chip reading *"Settling in GBP ▼"* in the page title area. It's tappable to change. This makes it clear it's a session-level setting, not a receipt-level one. Per-receipt currency override remains inside the Receipt Details Sheet.

#### 5.2.3 Section 3: Item Review (collapsed by default)

**Current problem:** The full item grid is always visible, adding 400–800px of content below the receipts. On mobile, users must scroll through it every time even if they have nothing to edit.

**Redesigned behaviour:**

- The item section is **collapsed by default** after a receipt is scanned.
- The collapsed state shows a summary chip: *"12 items extracted — review ▼"*
- Tapping the chip expands the full item grid with the existing search/sort/edit functionality.
- The chip shows an amber dot if any items have been manually added or edited, to indicate the list has been customised.
- After the user expands and reviews items, collapsing it shows *"12 items — all reviewed ✓"*.
- If AI confidence is below 85%, the chip is amber and shows *"12 items — please review !"* with the chip highlighted to draw attention.

This change makes the page feel dramatically shorter and more focused on the primary task (getting receipts in) while keeping item review fully accessible.

#### 5.2.4 Readiness footer (replaces disabled button + tooltip)

Current: "Assign Items" button is disabled with a tooltip explaining why.

New: A **readiness strip** sits just above the "Assign Items" button in the sticky footer:

```
┌─────────────────────────────────────────────┐
│  ✓ 3 people added                            │
│  ✓ 1 receipt scanned                         │
│  ✗ Payer not set for "Dinner Receipt"         │
├─────────────────────────────────────────────┤
│  [ ← Back ]              [ Assign Items → ]  │
└─────────────────────────────────────────────┘
```

The strip is:
- **Collapsed** when all conditions are met (saves space, shows only the button)
- **Expanded** when any condition fails, showing exactly what's missing
- Each failing condition is a tappable link that scrolls to and highlights the relevant section

This replaces the current invisible tooltip with a visible, actionable explanation — reducing support friction for new users who don't know why the button won't respond.

---

### Phase 3 — AI Suggestion Flow: Single Decision Point
*Removes the most cognitively complex part of the current setup page.*

#### 5.3.1 Current problem

When the AI identifies a discount that likely belongs to a specific item (e.g., a "Happy Hour" discount that reduces the price of a beer), the current flow:

1. Shows a badge `AI Suggestions Pending` on the ReceiptCard when collapsed
2. Auto-expands the Discounts accordion
3. Shows a complex inline panel with: the suggestion text, a conflict alert (if applicable), an Apply button, a Reassign dropdown (DropDrawer with sub-menu), a "Make Receipt-Wide" button, and a Remove button
4. This repeats for each suggestion

For a user who has just taken a photo of a receipt, this is the last thing they expect to engage with. They have no context for what "reassigning a discount to another item" means.

#### 5.3.2 Redesigned AI suggestion flow

**Step A: Non-intrusive notification**

All AI suggestions are consolidated into a single **suggestion banner** inside the receipt card, replacing all inline panels:

```
  ✦ AI found 2 discount suggestions
  [ Review suggestions ]
```

The banner is styled in the primary brand colour (not destructive red), framing suggestions as *helpful*, not as *errors requiring attention*.

**Step B: Focused Suggestion Review Sheet**

Tapping "Review suggestions" opens a **Suggestion Review Sheet** — a bottom sheet (mobile) or dialog (desktop) that walks through each suggestion one at a time:

```
┌──── Discount Suggestions (1 of 2) ──────────┐
│                                              │
│  ✦  AI Suggestion                   92% ✦   │
│                                              │
│  "Happy Hour" discount                       │
│   -£2.00                                     │
│                                              │
│  Suggested for:                              │
│  ┌────────────────────────────┐              │
│  │  🍺 Corona Beer   £4.50   │              │
│  └────────────────────────────┘              │
│                                              │
│  Does this look right?                       │
│                                              │
│  [ ✓ Yes, apply ]                            │
│  [ ✗ No — different item ▼ ]  (dropdown)     │
│  [ Apply to whole bill instead ]             │
│  [ Remove this discount ]                    │
│                                              │
│  ───────────────────────────                 │
│  Skip for now                                │
└──────────────────────────────────────────────┘
```

**Design decisions:**
- **One decision at a time** — the user focuses on a single suggestion, not a list
- **Natural language framing** — "Does this look right?" replaces technical action labels
- **"Different item"** expands to show other items from the same receipt (replacing the current nested DropDrawer)
- **"Apply to whole bill"** replaces "Make Receipt-Wide" (same action, plain language)
- **"Skip for now"** always available — suggestions can be reviewed later, they don't block progression
- **Progress indicator** — "1 of 2" at the top so users know how many decisions remain
- Conflict warning (discount > item cost) is shown inline with plain text: *"Note: this discount is larger than the item cost"* — not a red Alert component

**Step C: Resolution tracking**

After the sheet is closed (with or without resolving all suggestions), the banner updates:

- All resolved: banner disappears
- Some resolved: *"✦ 1 remaining suggestion — review"*
- None resolved: *"✦ 2 discount suggestions — review"*

The SuggestionResolverDialog already implements the core resolution logic. The sheet is a visual redesign of that component, not a new feature.

---

### Phase 4 — Advanced & Power User Features
*Ensures that expert users retain access to all capabilities without cluttering the primary flow.*

#### 5.4.1 Multi-currency receipts

**Current:** Currency selector appears inside every ReceiptCard with no explanation of when to use it.

**Redesigned:**

- All receipts default to the global settlement currency.
- The per-receipt currency selector moves to the **Receipt Details Sheet** (Phase 1).
- When a receipt uses a different currency, the ReceiptCard header shows a currency badge: *"🇯🇵 JPY"* — immediately obvious, tappable to open the Details Sheet.
- Exchange rate input: shown inside the Details Sheet, below the currency selector, only when the receipt currency ≠ global currency. A helper text: *"How many GBP does 1 JPY equal?"* replaces the current unlabelled input.

#### 5.4.2 Session import / export

**Current:** Import Session button always visible at page top. Export is on the summary page.

**Redesigned:**

- Both Import and Export are moved to the **session overflow menu** (⋯) in the page/app header.
- The menu also contains: Reset Session (with same confirmation dialog).
- This cleans up the page top entirely for first-time users while keeping power user features accessible in one consistent location.

#### 5.4.3 Item list editor

The item grid (ItemListEditor) retains all its current functionality:
- Search and sort
- Click-to-edit (ItemEditDialog — already redesigned as mobile bottom sheet)
- Add item manually
- AI suggestion badges per item

The only change from Phase 2 is that the grid is **collapsed by default** and expanded by tapping the summary chip. When expanded, it occupies the same full-width space it does today.

#### 5.4.4 Manual receipt entry

**Existing flow:** "Add Manually" creates a blank receipt with default name and no items. The user must then add items via the Item List Editor.

**Improvement (Phase 4):** The blank manual receipt card auto-expands on creation and immediately focuses on the receipt name input. A contextual help text: *"Give this receipt a name, then add items below."* — the arrow between receipt name and item list guides the user to the next step without requiring documentation.

---

## 6. Component Behaviour Reference

### 6.1 ReceiptCard states

| State | Visual treatment |
|---|---|
| Processing (AI scanning) | Shimmer/skeleton on card body; staged progress label in header |
| Processed, complete | Clean summary view; no visual noise |
| Processed, payer missing | Payer row shows destructive ring + inline label |
| Processed, AI suggestions pending | Single `✦ N suggestions` banner |
| Processed, low confidence (<85%) | Amber confidence chip in header; item review chip is amber |
| Failed scan | Error card with two recovery actions |
| Manual (empty) | Auto-expanded on create, name field focused |

### 6.2 Readiness conditions (for footer checklist)

The "Assign Items" button is enabled only when all of:

1. ✓ At least 1 participant added
2. ✓ At least 1 receipt is in `processed` status (or manual)
3. ✓ Every receipt has a payer assigned
4. ✓ No receipt has a negative total (conflict)
5. ✓ No items are "orphaned" (linked to a deleted receipt)
6. ✓ No receipts are still processing

When condition 4 or 5 fails, the failing receipt card is highlighted with a destructive border and auto-scrolled into view (on mobile).

### 6.3 Participant strip transitions

| Count | Treatment |
|---|---|
| 0 | Full input shown with onboarding prompt |
| 1–3 | Avatar strip (compact, ~56px) + "+ Add" chip |
| 4+ | Avatar strip with overflow: `[AB] [CD] [EF] +2 more  + Add` |
| Expanded (any count) | Full editable list with remove buttons |

### 6.4 Item review chip states

| Condition | Chip appearance |
|---|---|
| No items yet | Hidden |
| Items present, unreviewed | *"12 items extracted — review ▼"* (neutral) |
| Low AI confidence | *"12 items — please review !"* (amber, attention) |
| Expanded by user | Collapse button: *"▲ Collapse item list"* |
| User has made edits | Dot indicator: *"12 items ● — reviewed ▼"* |

---

## 7. Interaction Patterns

### 7.1 Bottom sheets (mobile) / dialogs (desktop)

All secondary interactions — Bill Adjustments, Receipt Details, Suggestion Review, item editing — use the established responsive pattern: Vaul Drawer on mobile (slides up, draggable), Dialog on desktop (centred, fixed width max 500px).

All sheets use:
- A drag handle at top (mobile only)
- Scrollable content area (ScrollArea component)
- Sticky action footer (Done / Save / Close)
- No nested sheets unless unavoidable (suggestion reassignment being the one exception)

### 7.2 Touch targets

All interactive elements in the primary flow must meet WCAG 2.5.5 minimum 44×44px touch target. Specifically:
- Payer selector: full-width, min-height 44px
- Participant remove button (mobile): always visible, 44×44px
- Receipt card collapse trigger: full-width header row
- Chip summary rows: min-height 44px

### 7.3 Inline editing patterns

- Receipt name: tap to edit inline (same as current `onBlur` pattern)
- Participant name: tap avatar chip in expanded list → inline rename field
- Item name/cost: opens ItemEditDialog bottom sheet (already implemented)
- Discount name/amount in Bill Adjustments Sheet: inline editable rows, save on blur

### 7.4 Animations

- Avatar strip expand/collapse: height transition (Framer Motion, 200ms ease)
- Item review chip expand: slide-down with fade (Framer Motion, 250ms)
- Sheet open/close: Vaul's built-in spring animation on mobile; Dialog fade on desktop
- Progress stages in receipt scan: text cross-fade (150ms)
- Readiness strip expand/collapse: height + opacity (200ms)

---

## 8. Language & Copy Guidelines

### Terminology replacements

| Current label | Replacement | Reason |
|---|---|---|
| Receipt-Wide Discounts | Discounts on this bill | Plain language; "receipt-wide" is internal jargon |
| Service Charge / Tip | Service & Tips | Friendlier; covers both concepts |
| Add Discount | Add a discount | Conversational |
| Payer | Paid by | Natural sentence framing |
| Import Session | Resume previous session | Describes the user goal |
| Reset Session | Start over | Clear consequence |
| AI Confidence: 94% | ✦ 94% confidence | Icon shorthand reduces label verbosity |
| Scan Unsuccessful | Couldn't read this receipt | Human, non-technical |
| Make Receipt-Wide | Apply to whole bill | What the user actually wants |
| Orphaned items | Items with missing receipt | Descriptive, not technical |

### Tone

Copy should be:
- **Direct** — tell the user what to do, not what the system does
- **Friendly but not flippant** — avoid excessive emoji or cute error messages that obscure the problem
- **Informative on errors** — every error state must answer: what happened, and what can the user do?

---

## 9. What Does Not Change

The following are **explicitly preserved** in the redesign:

- All Redux state management and data model (unchanged)
- AI receipt scanning pipeline (Gemini / Genkit)
- The 3-receipt session limit
- Item grid with all edit capabilities (search, sort, add, delete, edit)
- Session export/import (moved to overflow menu, functionality unchanged)
- Percentage and fixed service charge types
- Per-receipt currency with exchange rate
- All validation logic for conflicts, orphaned items, and payer requirements
- The 3-step outer flow (Setup → Assign → Summary)

---

## 10. Success Metrics (Product KPIs)

These are the outcomes the redesign should move:

| Metric | Hypothesis |
|---|---|
| Time to reach Step 2 (median, mobile) | Decrease by ≥25% for first-time users |
| Payer-not-set error rate | Decrease by ≥50% (payer always visible) |
| AI suggestion resolution rate | Increase (clearer focused flow) |
| Session reset rate | Decrease (fewer users giving up on complex UI) |
| Manual receipt additions without items | Decrease (better guided empty state) |
| Support queries about discounts/service charge | Decrease (plain language + contextual help) |

---

## 11. Open Decisions

The following require product/design sign-off before implementation begins:

1. **Participant rename** — Phase 4 proposes tap-to-rename in the avatar strip. Current flow requires delete + re-add. Confirm this is desired.

2. **"Enter manually instead" on failed scan** — This converts a failed scan to a manual receipt. Confirm the conversion behaviour is acceptable (retains receipt name, starts with 0 items).

3. **Item review chip — default collapsed** — Collapsing the item list by default means AI errors in extraction are less immediately visible. The amber chip mitigates this, but confirm acceptable trade-off.

4. **Session overflow menu location** — Spec places Import/Reset in a `⋯` menu. Confirm whether this lives in the app navbar or in the page header.

5. **Readiness footer — expanded vs collapsed** — The strip shows all conditions when any fails. Confirm: should it show *all* conditions (✓ and ✗) or only the failing ones?
