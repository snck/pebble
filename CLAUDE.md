# Pebble

A personal spending-awareness app. The user logs expenses to notice where their money goes, **without the anxiety of watching a total climb**. The full spec is in `SPEC.md`. Read it before starting any milestone.

## Design principles (non-negotiable)

These exist because the app's whole purpose is to reduce spending anxiety. Never work around them, even if a feature seems to call for it. If a request conflicts with them, stop and ask.

1. **No sums on the main screen.** No daily, weekly, or running totals. Individual expense amounts are fine.
2. **No grand total anywhere in the app.** The report shows each category's *share* (percentages), not totals.
3. **The calendar shows habit, not money.** Day states reflect whether a day was logged, never how much was spent.
4. **No guilt mechanics.** No streaks, no red or warning styles for unlogged days, no "you missed a day" messages.
5. **Logging must be fast.** Adding an expense should take under 5 seconds. Don't add steps, required fields, or confirmation dialogs to the add flow.

## Stack

- Vite + React + TypeScript (strict mode)
- Dexie (IndexedDB) for storage, no backend
- vite-plugin-pwa for home-screen install
- Vitest for unit tests

## Conventions

- **Dates** are local calendar dates stored as `YYYY-MM-DD` strings. Never store dates as `Date` objects or UTC timestamps in the data model. Keep all date logic in one module.
- **Weeks start on Monday.**
- **Amounts** are integers in minor units (e.g. 12.50 → 1250). Format for display only, with `Intl.NumberFormat` and the currency setting.
- **Mobile-first.** Design for a phone held in one hand; desktop just needs to not break.
- Keep data access in a small repository layer so components don't call Dexie directly.
- Unit-test the date/week logic, no-spend rules, and report percentage calculations.

## How to work

- Build **one milestone at a time**, in the order listed in `SPEC.md`. Propose a short plan before writing code for each milestone.
- Don't build anything listed under "Out of scope" in the spec.
- Before saying a milestone is done, run the typecheck, tests, and build, and fix any failures.
- After each milestone, list anything in the spec that was ambiguous and the choice you made.

## Commands

- `npm run dev`: start the Vite dev server
- `npm run dev -- --host`: expose the dev server on the LAN, for testing on a real phone (plain HTTP, so code must not rely on secure-context-only APIs like `crypto.randomUUID`)
- `npm run typecheck`: TypeScript project build (`tsc -b`, no emit)
- `npm test`: run Vitest once (`npm run test:watch` for watch mode). Tests run with `TZ=Europe/London` so date logic hits DST transitions
- `npm run lint`: oxlint
- `npm run build`: typecheck + production build (outputs `dist/` with the PWA service worker)
- `npm run preview`: serve the production build locally

Before calling a milestone done: `npm run typecheck && npm test && npm run build`.
