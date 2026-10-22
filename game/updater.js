const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

/**
 * Update feed config. Swap `provider` to `generic` + `url` later for a paid feed
 * without rewriting the rest of the updater.
 */
const UPDATE_FEED = {
  provider: 'github',
  owner: 'Tseberechts',
  repo: 'bingo',
};

const STARTUP_CHECK_DELAY_MS = 4000;

/** @type {{ state: string, version: string | null, progress: number | null, error: string | null, interactive: boolean }} */
let status = {
  state: 'idle',
  version: null,
  progress: null,
  error: null,
  interactive: false,
};

let initialized = false;
let checkInFlight = false;

const broadcastStatus = () => {
  const payload = { ...status };
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('update-status', payload);
    }
  });
};

const setStatus = (partial) => {
  status = { ...status, ...partial };
  broadcastStatus();
};

const getUpdateStatus = () => ({ ...status });

const initializeUpdater = () => {
  if (initialized || !app.isPackaged) return;
  initialized = true;

  autoUpdater.setFeedURL(UPDATE_FEED);
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    setStatus({
      state: 'checking',
      error: null,
      progress: null,
    });
  });

  autoUpdater.on('update-available', (info) => {
    checkInFlight = false;
    setStatus({
      state: 'available',
      version: info?.version || null,
      error: null,
      progress: null,
    });
  });

  autoUpdater.on('update-not-available', () => {
    checkInFlight = false;
    setStatus({
      state: 'not-available',
      version: null,
      error: null,
      progress: null,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = typeof progress?.percent === 'number'
      ? Math.round(progress.percent)
      : null;
    setStatus({
      state: 'downloading',
      progress: percent,
      error: null,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    setStatus({
      state: 'downloaded',
      version: info?.version || status.version,
      progress: 100,
      error: null,
    });
  });

  autoUpdater.on('error', (err) => {
    checkInFlight = false;
    setStatus({
      state: 'error',
      error: err?.message || 'Update mislukt',
      progress: null,
    });
  });
};

/**
 * @param {{ interactive?: boolean }} [options]
 * @returns {Promise<{ ok: boolean, status: object }>}
 */
const checkForUpdates = async ({ interactive = false } = {}) => {
  setStatus({ interactive: Boolean(interactive) });

  if (!app.isPackaged) {
    setStatus({
      state: 'not-available',
      version: null,
      error: null,
      progress: null,
    });
    return { ok: true, status: getUpdateStatus() };
  }

  initializeUpdater();

  if (checkInFlight) {
    return { ok: true, status: getUpdateStatus() };
  }

  checkInFlight = true;
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true, status: getUpdateStatus() };
  } catch (err) {
    checkInFlight = false;
    setStatus({
      state: 'error',
      error: err?.message || 'Updatecontrole mislukt',
    });
    return { ok: false, status: getUpdateStatus() };
  }
};

/**
 * @returns {Promise<{ ok: boolean, error?: string, status: object }>}
 */
const downloadUpdate = async () => {
  if (!app.isPackaged) {
    return { ok: false, error: 'Alleen beschikbaar in de geïnstalleerde app', status: getUpdateStatus() };
  }
  if (status.state !== 'available' && status.state !== 'error') {
    return { ok: false, error: 'Geen update om te downloaden', status: getUpdateStatus() };
  }

  initializeUpdater();
  setStatus({ state: 'downloading', progress: 0, error: null, interactive: true });
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true, status: getUpdateStatus() };
  } catch (err) {
    setStatus({
      state: 'error',
      error: err?.message || 'Download mislukt',
    });
    return { ok: false, error: err?.message, status: getUpdateStatus() };
  }
};

/**
 * Quit and install a downloaded update.
 * @returns {{ ok: boolean, error?: string }}
 */
const quitAndInstall = () => {
  if (!app.isPackaged) {
    return { ok: false, error: 'Alleen beschikbaar in de geïnstalleerde app' };
  }
  if (status.state !== 'downloaded') {
    return { ok: false, error: 'Geen gedownloade update' };
  }
  // forceRunAfter=true, isSilent=false — user-initiated install
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
};

const scheduleStartupCheck = () => {
  if (!app.isPackaged) return;
  initializeUpdater();
  setTimeout(() => {
    checkForUpdates({ interactive: false }).catch(() => {});
  }, STARTUP_CHECK_DELAY_MS);
};

module.exports = {
  UPDATE_FEED,
  initializeUpdater,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  getUpdateStatus,
  scheduleStartupCheck,
};
