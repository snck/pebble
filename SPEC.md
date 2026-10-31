# Spending Awareness App — Spec

## Purpose

A personal expense logger for **awareness without anxiety**. The user wants to notice where their money goes, and adjust mid-month if needed, without watching a running total climb.

### Design principles (apply to every screen)

1. **No running totals on the main screen.** Individual expense amounts are fine; sums are not.
2. **Feedback is about the habit, not the amount.** The weekly calendar shows *whether* a day was logged, never how much was spent.
3. **Proportions over totals.** The report shows each category's *share* of spending. No grand total anywhere in the app.
4. **No guilt mechanics.** No streaks, no red "missed" markers, no warnings.
5. **Logging must be fast.** Adding an expense should take under 5 seconds.

---

## Data model

All dates are local calendar dates stored as `YYYY-MM-DD` strings (avoid timezone bugs).

```ts
Expense {
  id: string            // uuid
  amount: number        // integer, in minor units (e.g. cents/satang)
  categoryId: string
  date: string          // YYYY-MM-DD
  note?: string
  createdAt: number
  updatedAt: number
}

Category {
  id: string
  name: string
  emoji?: string
  isFixed: boolean      // fixed costs are excluded from the report by default
  order: number
  archived: boolean     // archive instead of delete so old expenses keep their category
}

NoSpendDay {
  date: string          // YYYY-MM-DD, primary key
}

Settings {
  currency: string      // ISO code, default from browser locale via Intl
}
```

### Starter categories

Food & drinks, Transport, Shopping, Entertainment, Health, Bills & utilities (fixed), Housing (fixed), Other. User can rename, reorder, add, archive, and toggle `isFixed`.

---

## Screens

A bottom tab bar switches between screens (Week, Report; Settings joins in milestone 4). Each screen has its own URL hash so the back gesture works and the installed app reopens where it was. Each screen keeps its place (selected day, month, fixed-cost toggle) while switching tabs.

### 1. Main screen — This week

**Week calendar strip (top, sticky)**
- 7 days, week starts **Monday**.
- Each day shows weekday + date and one of these states:
  - **Logged**: has ≥1 expense (filled dot)
  - **No-spend**: marked as no-spend day (distinct icon, e.g. leaf or check, positive feel)
  - **Unlogged past day**: neutral, empty. *Not* red, not a warning.
  - **Today**: highlighted ring, combined with one of the states above
  - **Future**: dimmed, not tappable
  - **Selected**: filled highlight, combined with any of the states above
- The strip is a day filter: exactly one day is always selected, and the list below shows only that day. Today is selected when the app opens.
- Tapping a day selects it.
- Prev/next arrows to move between weeks, keeping the same weekday selected (moved back to today if it would be in the future). Cannot go past the current week.
- Swipe gestures (touch only) as a faster alternative to precise taps and reaching the arrows:
  - Swipe the day content left/right for the next/previous day, crossing week boundaries. Cannot go past today.
  - Swipe the strip left/right for the next/previous week, same as the arrows.

**Expense list (below)**
- Shows the selected day only: a heading (e.g. "Today · Oct 31") and that day's expenses, newest first.
- Each expense row: category (emoji + name), note if present, amount.
- **No daily or weekly totals anywhere.**
- A day with no expenses shows an empty state that fills the space below the strip, with "Mark as no-spend day" as its main action. Adding an expense is done with the floating add button, so the empty state has no add button of its own.
- A no-spend day shows a small positive message in the same space, and an option to unmark it. Adding an expense with the add button also unmarks it.
- After saving an expense (or undoing a delete), its date becomes the selected day.

**Add button**
- Floating action button, always visible on this screen (above the tab bar).

### 2. Add / edit expense sheet

- Opens as a bottom sheet.
- Field order: **amount** (autofocused, numeric keypad) → **category** (one-tap chips) → **date** (defaults to the selected day) → **note** (optional).
- Save is a single tap. Sheet closes and the list shows the new entry.
- Edit: tap an expense row to open the same sheet pre-filled.
- Delete: from the edit sheet, with an **undo toast** (not a confirm dialog, which adds friction).

**No-spend rules**
- Adding an expense to a no-spend day automatically removes the no-spend mark.
- Future days cannot be marked as no-spend.

### 3. Report screen — Where is my money going?

- Month selector (default: current month; can go back to past months).
- **Horizontal bars**, one per category, sorted largest share first, labeled with percentage. Bar length is the share of 100%.
- Percentages are whole numbers that always add up to 100% (largest-remainder rounding). A non-zero share that rounds to 0 shows as "<1%".
- **No grand total.** Category amounts are not shown on the bars.
- Fixed categories are **excluded by default**. A toggle "Include fixed costs" adds them back in.
- Show entry count under the chart: "Based on N expenses", so a lopsided chart early in the month reads as early data. The count covers only what the chart includes (so it changes with the fixed-cost toggle).
- **vs last month**: when the previous month has data, show the change in share per category in percentage points (e.g. "45% · up from 32%"). Hide when there's no previous-month data.
  - Compares the displayed (rounded) percentages, under the same fixed-cost setting: "up from 32%", "down from 50%", "same as last month", or "new this month" for a category with no spending last month.
  - Shown in muted text, never red/green or arrows: a share going up is information, not a warning.
- Tapping a category opens a read-only bottom sheet listing that month's expenses in that category, newest first (individual amounts OK, no sum).
- Previous/next month by arrows or by swiping; cannot go past the current month. The fixed-cost toggle starts off each time the app opens.
- Empty month: a friendly empty state, no chart. A month with only fixed costs (while they're hidden) shows a hint to turn on "Include fixed costs".

### 4. Settings

- Manage categories (rename, emoji, reorder, add, archive, toggle fixed).
  - Tap a category to edit it in a sheet (name, single emoji, fixed toggle, archive). "+ Add category" uses the same sheet.
  - Names are trimmed, required, and unique among active categories (case-insensitive).
  - Reorder mode shows up/down buttons on each row.
  - Archived categories are listed under a collapsed "Archived (n)" section with Restore (restored to the end of the list). The last active category can't be archived.
  - Fixed is a category property, so changing it applies to all months' reports.
- Currency: searchable list of currencies known to the browser. Amounts aren't converted; they keep the numbers the user typed, so when the new currency has a different number of decimals the stored minor units are rescaled (moving to a currency without decimals rounds).
- **Export / import** all data as JSON (backup, since data lives on the device).
  - Export: `pebble-backup-YYYY-MM-DD.json` with an app marker, format version, timestamp and all data. Opens the share sheet on phones, downloads elsewhere.
  - Import: the whole file is validated before anything is written; a bad file changes nothing and says why. A valid file **replaces** all data after a confirm sheet (the app's only confirm; it can't be undone) that offers "Export current data first".

---

## Tech

- **Vite + React + TypeScript**
- **IndexedDB via Dexie** for local storage (no backend, works offline, data stays on device)
- **PWA** (vite-plugin-pwa) so it installs to the phone's home screen
- Mobile-first layout; must feel good one-handed on a phone
- Format amounts with `Intl.NumberFormat` using the currency setting
- Static hosting (Vercel, Netlify, or GitHub Pages). Deployed on Netlify (`netlify.toml`); the build uses relative URLs and hash routing, so it also works from a subfolder with no rewrites.
- App updates install in the background and take effect the next time the app is opened, so an update never reloads the page mid-entry.

Trade-off: local-only storage means data doesn't sync between devices. Export/import covers backup. Sync (e.g. Supabase) is out of scope for v1.

---

## Build milestones

1. **Core logging**: data layer, add/edit/delete sheet, this-week list grouped by date, week navigation.
2. **Calendar strip**: day states, day selection as a list filter, no-spend marking and its rules.
3. **Report**: proportional bars, fixed-cost toggle, entry count, category drill-down, month selector.
4. **Polish & ship**: settings/categories, last-month comparison, export/import, PWA install, deploy.

Test on a real phone at the end of milestone 1. Entry speed is the thing most likely to make or break the habit.

## Out of scope (v1)

Budgets or spending limits, streaks, notifications, multi-device sync, credit card import, multiple currencies per expense.
