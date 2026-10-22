const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bingo', {
  // App
  exitApp: () => ipcRenderer.send('exit-app'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  completeInitialSetup: (settings) => ipcRenderer.send('complete-initial-setup', settings),

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
});
