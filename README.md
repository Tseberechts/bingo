# Bingo

Desktop bingo caller for live events (Dutch UI). Runs on **Windows**, **macOS**, and **Linux** via Electron.

## Free vs paid

| | Free | Paid (license key) |
|--|------|--------------------|
| Branding | Mandatory Arkastro logo + sponsor | Custom logo, sponsors, brand colours |
| Saves | Last game only (1 slot) | Multiple save slots |
| Avondrapport | — | HTML export |
| Audience display | OS screen mirroring | Dedicated second window |

Activate a key under **Voorkeuren → Licentie**. Keys are offline Ed25519-signed (no daily server callback). Issue keys with:

```bash
node scripts/issue-license.js --lic BNG-XXXX --email klant@example.be
```

(Requires `secrets/license-private.b64` or `LICENSE_PRIVATE_KEY_B64` — see `secrets/README.md`.)

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

Public downloads live at **[arkastro.be/bingo](https://arkastro.be/bingo)**. A packaged app checks for updates on launch (quietly) and from **Voorkeuren → Over**. Updates are never auto-installed mid-game.

- **Windows / Linux**: download in-app, then choose **Herstart om te installeren** (NSIS / AppImage). Portable/`.deb` remain available as manual downloads.
- **macOS**: in-app install is disabled (ad-hoc signing breaks Squirrel.Mac). Version checks still work; **Download update** opens [arkastro.be/bingo](https://arkastro.be/bingo) so you can install the latest DMG manually.

Builds are **not notarized** (no paid Apple/Windows certificates yet):

- **Windows**: SmartScreen may warn on first open; choose “More info” → “Run anyway”.
- **macOS** (Apple Silicon): builds are **ad-hoc signed** so Gatekeeper shows *“Apple could not verify…”* instead of the unrecoverable *“is damaged”* dialog. First open:
  1. Click **Done** (or Cancel).
  2. Open **System Settings → Privacy & Security**.
  3. Scroll to the blocked-app message and choose **Open Anyway**.
  - On older macOS: right-click the app → **Open**.
  - Terminal fallback: `xattr -cr /Applications/Bingo.app` then open the app.
  - v1.0.0 Mac builds lacked ad-hoc signing; use **v1.0.1+** or the `xattr` command above on an already-installed copy.
- Developer ID signing / notarization can be added later for quieter first launches.

Local `dist` runs do **not** publish (`EB_PUBLISH` defaults to `never`). CI builds with `EB_PUBLISH=never`, then attaches every platform artifact in a single Release create (compatible with immutable releases).

## First run

1. Accept the Dutch EULA (Gebruiksvoorwaarden) on first launch.
2. Complete the guided setup wizard (title, logo, display modes, sponsors), or choose **Gebruik de demo** for a ready-made sample.
3. Use **Later verder** to pause setup; the next launch resumes on the same step.
4. Start a new game, or resume / load a save. Change anything later in **Voorkeuren**.

Settings, logos, sponsors, and savegames live under the Electron **user data** folder (Developer menu → *Open Data Folder* in unpackaged builds).

## Running an event (projector)

**Free:** connect the projector/TV in **duplicate / mirror** mode, start Bingo, press **F11** (or **Beeld → Volledig scherm**).

**Paid:** open **Venster voor publiek** (menu or Beeld) on the second display, or still use OS mirroring if you prefer.

## Architecture (short)

- `main.js` — Electron main process, secure window prefs + preload
- `preload.js` — narrow `window.bingo` IPC API (`contextIsolation`)
- `game/` — settings, saves, IPC, updater, pure game logic
- `views/` — multi-page UI (menu, game, settings, initial setup, EULA)

Board size is fixed at **90** numbers (10 columns) via `game/constants.js` for a future setting.

## License

Proprietary © [Arkastro BV](https://arkastro.be) (Rozenstraat 5, 2580 Putte, BE1036200718). See [`LICENSE`](LICENSE) and [`EULA.md`](EULA.md).
