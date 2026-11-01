# Pebble

A personal spending-awareness app: log your expenses to notice where your money goes, **without the anxiety of watching a total climb**.

Pebble is a small installable web app. It runs entirely in your browser and keeps your data on your device: no account, no server, no tracking.

## What it does

- **Fast logging.** Tap +, type an amount, tap a category, save. The number pad opens straight away.
- **A week at a glance, without the totals.** The calendar strip shows *whether* you logged each day, never how much you spent. Days with nothing spent can be marked as no-spend days.
- **"Where is my money going?"** A monthly report shows each category's *share* of your spending as percentages, with a note on how each share moved since last month. Fixed costs like rent and bills are left out unless you include them.
- **Your categories, your currency.** Add, rename, reorder and archive categories, and pick any currency.
- **Backups.** Export everything to a JSON file and import it on another device.
- **Works offline** and installs to your phone's home screen.

### Design principles

These shape every screen, and changes shouldn't work around them:

1. No sums on the main screen: no daily, weekly or running totals.
2. No grand total anywhere. The report shows proportions only.
3. The calendar shows habit, not money.
4. No guilt mechanics: no streaks, no red "missed day" markers, no warnings.
5. Logging must take under 5 seconds: no extra steps, required fields or confirm dialogs in the add flow.

The full product spec is in [SPEC.md](SPEC.md).

## Run it locally

You need [Node.js](https://nodejs.org/) **22.12 or later** (24 LTS recommended) and npm.

```sh
git clone https://github.com/snck/pebble.git
cd pebble
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Try it on your phone

```sh
npm run dev -- --host
```

Open the "Network" URL on a phone connected to the same Wi-Fi. This is plain HTTP, so it's good for trying the app but can't be installed to the home screen; installing needs HTTPS (see [Deploy your own copy](#deploy-your-own-copy)).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production into `dist/` |
| `npm run preview` | Serve the production build locally. Use this to test offline mode and installing, which the dev server doesn't include |
| `npm test` | Run the unit tests once (`npm run test:watch` to keep watching) |
| `npm run typecheck` | Check types without building |
| `npm run lint` | Lint with oxlint |

## Deploy your own copy

Pebble builds to static files, so it can be hosted anywhere that serves a folder over HTTPS. There's no backend to set up. Each person's data stays in their own browser, so one deployment can be shared by many people without them seeing each other's data.

### Netlify (what this repo is set up for)

1. Fork this repository on GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and pick your fork.
3. The settings come from [`netlify.toml`](netlify.toml) (build `npm run build`, publish `dist`, Node 24), so just deploy.

Every push to your default branch then deploys automatically.

### Any other static host

Run `npm run build` and upload the contents of `dist/`. The build uses relative URLs and hash-based routing (`#/report`), so it works at a domain root or in a subfolder (such as GitHub Pages' `username.github.io/pebble/`) with no redirect rules.

## Install it on your phone

Open your deployed site (HTTPS) and:

- **iPhone / iPad (Safari):** tap the Share button, then **Add to Home Screen**.
- **Android (Chrome):** tap the menu, then **Install app** (or **Add to Home screen**).

Installed, Pebble opens full screen and works without a connection. When you deploy a new version, it downloads in the background and takes effect the next time the app is opened, so an update never interrupts you mid-entry.

## Your data

- Everything is stored in your browser's IndexedDB on that device. Nothing is sent anywhere. There's no sync between devices.
- Clearing your browser's site data, or uninstalling the app, deletes it. **Export a backup now and then** (Settings → Your data → Export backup) and keep the file somewhere safe.
- To move to a new phone, export on the old one and import on the new one. Importing replaces everything on that device, after a confirmation.

## How it's built

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript (strict)
- [Dexie](https://dexie.org/) over IndexedDB for storage
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for offline support and installing
- [Vitest](https://vitest.dev/) for unit tests
- Plain CSS with custom properties, with light and dark themes

```
src/
  App.tsx            app shell: tab routing and state shared between screens
  screens/           Week, Report and Settings screens
  components/        sheets, calendar strip, lists and other UI pieces
  hooks/             live data queries, routing, swipe gestures, keyboard handling
  db/                Dexie schema and the repository (the only code that touches the database)
  lib/               pure logic, unit-tested: dates, money, report maths, backups, swipe rules
assets/icon/         source SVGs for the app icons (PNG sizes live in public/)
```

A few conventions worth knowing if you change things:

- **Dates** are local calendar dates stored as `YYYY-MM-DD` strings, never `Date` objects or timestamps. All date logic lives in `src/lib/dates.ts`. Weeks start on Monday.
- **Amounts** are whole numbers in the currency's minor unit (12.50 is stored as `1250`) and are formatted only for display.
- **Components never call Dexie directly.** They go through `src/db/repo.ts`.

[CLAUDE.md](CLAUDE.md) has the full set of working conventions.

## License

[MIT](LICENSE). You're free to use, copy, modify and share Pebble, including in your own projects, as long as the copyright and license notice stay with it.
