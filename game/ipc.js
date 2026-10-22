const { ipcMain, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { gameState, resetState } = require('./state');
const { saveState, loadState, deleteSaveFile, listSaveGames, getLastSave } = require('./storage');
const {
  getSettings,
  getSettingsForRenderer,
  saveSettings,
  defaultSettings,
  isSetupComplete,
} = require('./settings');
const { applyDemoSetup } = require('./demo-setup');
const { callNextNumber, toggleCalledNumber } = require('./logic');
const {
  sanitizeImageFileName,
  isAllowedImageBuffer,
  toFileUrl,
} = require('./paths');
const { readBuildInfo } = require('./version');
const {
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  getUpdateStatus,
} = require('./updater');
const pkg = require('../package.json');

const DISPLAY_MODES = new Set(['hide', 'sponsors', 'logo']);
const SETUP_STEP_COUNT = 5;

let allWindows = [];
let activeGameFile = null;

const loadMenu = (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.loadFile(path.join(__dirname, '..', 'views/menu/index.html'));
};

const clampSetupStep = (step) => {
  const n = Number(step);
  if (!Number.isInteger(n)) return 0;
  return Math.min(Math.max(n, 0), SETUP_STEP_COUNT - 1);
};

const broadcastUpdate = () => {
  allWindows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('game-state-update', gameState);
    }
  });
};

const emitFullscreenChanged = (win) => {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('fullscreen-changed', win.isFullScreen());
};

const registerWindow = (win) => {
  allWindows.push(win);
  win.on('enter-full-screen', () => emitFullscreenChanged(win));
  win.on('leave-full-screen', () => emitFullscreenChanged(win));
};

const unregisterWindow = (win) => {
  allWindows = allWindows.filter((w) => w !== win);
};

const bufferFromPayload = (payload) => {
  if (!payload) return null;
  if (Buffer.isBuffer(payload)) return payload;
  if (payload instanceof ArrayBuffer) return Buffer.from(payload);
  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  return null;
};

const initializeIpc = () => {
  ipcMain.on('exit-app', () => app.quit());

  ipcMain.handle('toggle-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    win.setFullScreen(!win.isFullScreen());
    return win.isFullScreen();
  });

  ipcMain.handle('get-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    return win.isFullScreen();
  });

  ipcMain.handle('save-setup-progress', (_event, partial) => {
    if (!partial || typeof partial !== 'object') {
      return { ok: false, error: 'Ongeldige gegevens' };
    }

    const allowed = {
      setupComplete: false,
    };

    if (typeof partial.gameTitle === 'string') {
      const title = partial.gameTitle.trim();
      allowed.gameTitle = title || defaultSettings.gameTitle;
    }
    if (DISPLAY_MODES.has(partial.inGameDisplayMode)) {
      allowed.inGameDisplayMode = partial.inGameDisplayMode;
    }
    if (DISPLAY_MODES.has(partial.pauseDisplayMode)) {
      allowed.pauseDisplayMode = partial.pauseDisplayMode;
    }
    if (partial.setupStep !== undefined) {
      allowed.setupStep = clampSetupStep(partial.setupStep);
    }

    const result = saveSettings(allowed);
    if (!result.ok) return result;
    return { ok: true, settings: getSettingsForRenderer() };
  });

  ipcMain.handle('continue-setup-later', (event, payload) => {
    const setupStep = clampSetupStep(payload?.setupStep ?? getSettings().setupStep);
    const patch = {
      setupStep,
      setupComplete: false,
    };
    if (typeof payload?.gameTitle === 'string') {
      const title = payload.gameTitle.trim();
      patch.gameTitle = title || defaultSettings.gameTitle;
    }
    if (DISPLAY_MODES.has(payload?.inGameDisplayMode)) {
      patch.inGameDisplayMode = payload.inGameDisplayMode;
    }
    if (DISPLAY_MODES.has(payload?.pauseDisplayMode)) {
      patch.pauseDisplayMode = payload.pauseDisplayMode;
    }
    const result = saveSettings(patch);
    if (!result.ok) return result;
    loadMenu(event);
    return { ok: true };
  });

  ipcMain.handle('complete-setup', (event) => {
    const result = saveSettings({ setupComplete: true });
    if (!result.ok) return result;
    loadMenu(event);
    return { ok: true };
  });

  ipcMain.handle('apply-demo-setup', (event) => {
    const result = applyDemoSetup();
    if (!result.ok) return result;
    loadMenu(event);
    return { ok: true };
  });

  ipcMain.handle('get-app-info', () => {
    const buildInfo = readBuildInfo();
    if (app.isPackaged) {
      return {
        version: app.getVersion(),
        builtAt: buildInfo?.builtAt ?? null,
      };
    }
    return {
      version: pkg.version,
      builtAt: buildInfo?.builtAt ?? null,
    };
  });

  ipcMain.handle('get-eula', () => {
    try {
      const eulaPath = path.join(app.getAppPath(), 'EULA.md');
      const text = fs.readFileSync(eulaPath, 'utf-8');
      return { ok: true, text };
    } catch (error) {
      return { ok: false, error: error.message || 'Kon EULA niet lezen' };
    }
  });

  ipcMain.handle('accept-eula', (event) => {
    const result = saveSettings({ eulaAcceptedAt: new Date().toISOString() });
    if (!result.ok) return result;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (isSetupComplete()) {
        win.loadFile(path.join(__dirname, '..', 'views/menu/index.html'));
      } else {
        win.loadFile(path.join(__dirname, '..', 'views/initial-setup/index.html'));
      }
    }
    return { ok: true };
  });

  ipcMain.handle('get-update-status', () => getUpdateStatus());
  ipcMain.handle('check-for-updates', (_event, options) => (
    checkForUpdates({ interactive: Boolean(options?.interactive) })
  ));
  ipcMain.handle('download-update', () => downloadUpdate());
  ipcMain.handle('install-update', () => quitAndInstall());

  ipcMain.handle('get-settings', () => getSettingsForRenderer());
  ipcMain.on('save-settings', (_event, partial) => {
    if (!partial || typeof partial !== 'object') return;
    const allowed = {};
    if (typeof partial.gameTitle === 'string') {
      allowed.gameTitle = partial.gameTitle.trim() || getSettings().gameTitle;
    }
    if (DISPLAY_MODES.has(partial.inGameDisplayMode)) {
      allowed.inGameDisplayMode = partial.inGameDisplayMode;
    }
    if (DISPLAY_MODES.has(partial.pauseDisplayMode)) {
      allowed.pauseDisplayMode = partial.pauseDisplayMode;
    }
    if (partial.setupStep !== undefined) {
      allowed.setupStep = clampSetupStep(partial.setupStep);
    }
    if (typeof partial.setupComplete === 'boolean') {
      allowed.setupComplete = partial.setupComplete;
    }
    if (typeof partial.projectorTipSeen === 'boolean') {
      allowed.projectorTipSeen = partial.projectorTipSeen;
    }
    if (Object.keys(allowed).length) saveSettings(allowed);
  });

  ipcMain.handle('add-sponsor', async (_event, { name, buffer, originalName }) => {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) return { ok: false, error: 'Naam is verplicht' };

    const fileBuffer = bufferFromPayload(buffer);
    const safeImageName = sanitizeImageFileName(originalName);
    if (!safeImageName || !isAllowedImageBuffer(fileBuffer)) {
      return { ok: false, error: 'Ongeldig of te groot afbeeldingsbestand (max 5 MB)' };
    }

    try {
      const settings = getSettings();
      const sponsorsDir = path.join(app.getPath('userData'), 'sponsors');
      if (!fs.existsSync(sponsorsDir)) fs.mkdirSync(sponsorsDir, { recursive: true });

      const newFileName = `${Date.now()}-${safeImageName}`;
      const newPath = path.join(sponsorsDir, newFileName);
      fs.writeFileSync(newPath, fileBuffer);

      const newSponsor = { id: Date.now(), name: trimmedName, logo: newPath };
      settings.sponsors.push(newSponsor);
      saveSettings(settings);
      return {
        ok: true,
        sponsor: { ...newSponsor, logo: toFileUrl(newPath) },
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('delete-sponsor', (_event, sponsorId) => {
    const settings = getSettings();
    const id = Number(sponsorId);
    const sponsorToDelete = settings.sponsors.find((s) => s.id === id);
    if (sponsorToDelete && fs.existsSync(sponsorToDelete.logo)) {
      fs.unlinkSync(sponsorToDelete.logo);
    }
    settings.sponsors = settings.sponsors.filter((s) => s.id !== id);
    saveSettings(settings);
    return { ok: true };
  });

  ipcMain.handle('upload-main-logo', async (_event, { buffer, originalName }) => {
    const fileBuffer = bufferFromPayload(buffer);
    const safeImageName = sanitizeImageFileName(originalName);
    if (!safeImageName || !isAllowedImageBuffer(fileBuffer)) {
      return { ok: false, error: 'Ongeldig of te groot afbeeldingsbestand (max 5 MB)' };
    }

    try {
      const settings = getSettings();
      const logosDir = path.join(app.getPath('userData'), 'logos');
      if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

      if (settings.mainLogoPath && fs.existsSync(settings.mainLogoPath)) {
        fs.unlinkSync(settings.mainLogoPath);
      }

      const newFileName = `main-logo-${Date.now()}-${safeImageName}`;
      const newPath = path.join(logosDir, newFileName);
      fs.writeFileSync(newPath, fileBuffer);
      settings.mainLogoPath = newPath;
      saveSettings(settings);
      return {
        ok: true,
        path: toFileUrl(newPath),
        fileName: path.basename(newPath),
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('delete-main-logo', () => {
    const settings = getSettings();
    if (settings.mainLogoPath && fs.existsSync(settings.mainLogoPath)) {
      fs.unlinkSync(settings.mainLogoPath);
    }
    settings.mainLogoPath = null;
    saveSettings(settings);
    return { ok: true };
  });

  ipcMain.on('start-new-game', () => {
    resetState();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    activeGameFile = `game-${timestamp}.json`;
    saveState(activeGameFile);
    broadcastUpdate();
  });

  ipcMain.on('load-game', (_event, fileName) => {
    if (loadState(fileName)) activeGameFile = fileName;
    else {
      resetState();
      activeGameFile = null;
    }
    broadcastUpdate();
  });

  ipcMain.handle('resume-last-game', () => {
    const lastSave = getLastSave();
    if (lastSave && loadState(lastSave)) {
      activeGameFile = lastSave;
      broadcastUpdate();
      return { ok: true };
    }
    return { ok: false, error: 'Geen recent spel gevonden' };
  });

  ipcMain.handle('list-save-games', () => listSaveGames());

  ipcMain.handle('delete-save-game', (_event, fileName) => deleteSaveFile(fileName));

  ipcMain.on('end-game', () => {
    if (activeGameFile) {
      deleteSaveFile(activeGameFile);
      activeGameFile = null;
    }
    resetState();
    broadcastUpdate();
  });

  ipcMain.on('call-next-number', () => {
    if (!activeGameFile) return;
    callNextNumber(gameState);
    saveState(activeGameFile);
    broadcastUpdate();
  });

  ipcMain.on('next-round', () => {
    if (!activeGameFile) return;
    gameState.round++;
    resetState(true);
    saveState(activeGameFile);
    broadcastUpdate();
  });

  ipcMain.on('toggle-called-number', (_event, number) => {
    if (!activeGameFile) return;
    const n = Number(number);
    if (!Number.isInteger(n)) return;
    toggleCalledNumber(gameState, n);
    saveState(activeGameFile);
    broadcastUpdate();
  });

  ipcMain.on('request-initial-state', (event) => {
    event.sender.send('game-state-update', gameState);
  });
};

module.exports = {
  initializeIpc,
  registerWindow,
  unregisterWindow,
};
