# WARP.md

Guidance for WARP (warp.dev) when working in this repository.

## Commands

```bash
npm install
npm start              # prestart builds CSS, then watch + Electron
npm run build:css
npm test
npm run lint
npm run dist:win       # or dist:mac / dist:linux
```

## Architecture

Electron multi-page bingo caller:

- **Main**: `main.js` creates a BrowserWindow with `contextIsolation` and `preload.js`.
- **IPC**: `game/ipc.js` owns game mutations; pure logic lives in `game/logic.js`.
- **Persistence**: settings and savegames under Electron `userData`.
- **UI**: HTML/JS under `views/`; shared styles via Tailwind (`styles/input.css` → `styles/output.css`) and `styles/global.css`.
- **Projection**: single mirrored window (F11 fullscreen); no second display window.
