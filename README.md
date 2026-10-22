# Bingo

Desktop bingo caller for live events (Dutch UI). Runs on **Windows**, **macOS**, and **Linux** via Electron.

Operators use one fullscreen window and **mirror the laptop display** to the projector (OS display mirroring) — there is no separate audience window.

## Requirements

- Node.js 20+
- npm

## Development

```bash
npm install
npm start
```

`prestart` builds Tailwind CSS into `styles/output.css` (gitignored). `npm start` also watches CSS while Electron runs.

Useful scripts:

| Command | Purpose |
|---------|---------|
| `npm start` | Build CSS, watch CSS, run Electron |
| `npm run build:css` | One-shot CSS build |
| `npm test` | Unit tests (no Electron required) |
| `npm run lint` | ESLint |
| `npm run version:suggest` | Suggest next semver bump from Conventional Commits |
| `npm run dist:win` | Windows NSIS + portable |
| `npm run dist:mac` | macOS DMG + zip |
| `npm run dist:linux` | Linux AppImage + deb |
| `npm run dist` | All platform targets (from a capable host) |

## Commits & releases

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by a husky `commit-msg` hook via commitlint):

| Type | Effect on next version |
|------|------------------------|
| `feat:` | minor |
| `fix:` | patch |
| `feat!:` / `BREAKING CHANGE:` | major |
| `chore` / `docs` / `style` / `refactor` / `test` / `ci` / `build` / `perf` | no bump (unless breaking) |

Release flow:

1. `npm run version:suggest` — review the recommendation
2. `npm version patch|minor|major` — bumps `package.json`, commits, and tags
3. `git push && git push --tags` — CI builds installers for `v*` tags, then creates one [GitHub Release](https://github.com/Tseberechts/bingo/releases) with all platform assets (required when release immutability is enabled)

Packaged apps use the plain semver from `package.json` (e.g. `1.0.1`). Each build also records `builtAt` (and an optional build stamp) for the About tab; CI sets `SOURCE_DATE_EPOCH` from the tag commit so all platforms share one timestamp.

## Downloads & auto-update

Installers are on **GitHub Releases**. A packaged app checks for updates on launch (quietly) and from **Voorkeuren → Over**. Updates are never auto-installed mid-game; you download and choose **Herstart om te installeren**.

Auto-update uses the NSIS installer (Windows), zip (macOS), and AppImage (Linux). Portable/`.deb`/`.dmg` remain available as manual downloads.

Builds are **unsigned**:

- **Windows**: SmartScreen may warn on first open; choose “More info” → “Run anyway”.
- **macOS**: Gatekeeper may block unsigned apps; right-click → Open, or `xattr -cr` on the app.
- Code signing / notarization can be added later for quieter installs.

Local `dist` runs do **not** publish (`EB_PUBLISH` defaults to `never`). CI builds with `EB_PUBLISH=never`, then attaches every platform artifact in a single Release create (compatible with immutable releases).

## First run

1. Complete the guided setup wizard (title, logo, display modes, sponsors), or choose **Gebruik de demo** for a ready-made sample.
2. Use **Later verder** to pause setup; the next launch resumes on the same step.
3. Start a new game, or resume / load a save. Change anything later in **Voorkeuren**.

Settings, logos, sponsors, and savegames live under the Electron **user data** folder (Developer menu → *Open Data Folder* in unpackaged builds).

## Running an event (projector)

1. Connect the projector/TV and set the OS to **duplicate / mirror** the laptop screen.
2. Start Bingo and press **F11** (or **View → Toggle Full Screen**) so the caller fills the display.
3. Call numbers as usual — the projector shows the same UI.

## Architecture (short)

- `main.js` — Electron main process, secure window prefs + preload
- `preload.js` — narrow `window.bingo` IPC API (`contextIsolation`)
- `game/` — settings, saves, IPC, updater, pure game logic
- `views/` — multi-page UI (menu, game, settings, initial setup)

Board size is fixed at **90** numbers (10 columns) via `game/constants.js` for a future setting.

## License & monetization

ISC — free to use, fork, and redistribute. The update feed is public GitHub Releases today; the updater module (`game/updater.js`) is written so a future paid/generic HTTPS feed can replace it without a rewrite. If you later want a proprietary “Pro” product of this same codebase, change the license **before** wide adoption — ISC already grants redistribution rights forever.

## License

ISC
