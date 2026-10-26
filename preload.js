const { contextBridge, ipcRenderer } = require('electron');

// Sandboxed preload cannot require local app modules; init renderer Sentry directly.
if (process.env.BINGO_SENTRY_ACTIVE === '1') {
  try {
    require('@sentry/electron/renderer').init();
  } catch {
    // Main-process sessions still cover Release Health if renderer init fails.
  }
}

contextBridge.exposeInMainWorld('bingo', {
  // App
  exitApp: () => ipcRenderer.send('exit-app'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getFullscreen: () => ipcRenderer.invoke('get-fullscreen'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  getEula: () => ipcRenderer.invoke('get-eula'),
  acceptEula: () => ipcRenderer.invoke('accept-eula'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  checkForUpdates: (options) => ipcRenderer.invoke('check-for-updates', options),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Initial setup wizard
  saveSetupProgress: (payload) => ipcRenderer.invoke('save-setup-progress', payload),
  continueSetupLater: (payload) => ipcRenderer.invoke('continue-setup-later', payload),
  completeSetup: () => ipcRenderer.invoke('complete-setup'),
  applyDemoSetup: () => ipcRenderer.invoke('apply-demo-setup'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  addSponsor: (payload) => ipcRenderer.invoke('add-sponsor', payload),
  deleteSponsor: (id) => ipcRenderer.invoke('delete-sponsor', id),
  uploadMainLogo: (payload) => ipcRenderer.invoke('upload-main-logo', payload),
  deleteMainLogo: () => ipcRenderer.invoke('delete-main-logo'),

  // Games
  startNewGame: () => ipcRenderer.send('start-new-game'),
  loadGame: (fileName) => ipcRenderer.send('load-game', fileName),
  resumeLastGame: () => ipcRenderer.invoke('resume-last-game'),
  listSaveGames: () => ipcRenderer.invoke('list-save-games'),
  deleteSaveGame: (fileName) => ipcRenderer.invoke('delete-save-game', fileName),
  persistActiveGame: () => ipcRenderer.invoke('persist-active-game'),
  endGame: () => ipcRenderer.send('end-game'),
  callNextNumber: () => ipcRenderer.send('call-next-number'),
  nextRound: () => ipcRenderer.send('next-round'),
  toggleCalledNumber: (number) => ipcRenderer.send('toggle-called-number', number),
  requestInitialState: () => ipcRenderer.send('request-initial-state'),

  // Events
  onGameStateUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('game-state-update', listener);
    return () => ipcRenderer.removeListener('game-state-update', listener);
  },
  onFullscreenChanged: (callback) => {
    const listener = (_event, isFullScreen) => callback(isFullScreen);
    ipcRenderer.on('fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('fullscreen-changed', listener);
  },
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
});
