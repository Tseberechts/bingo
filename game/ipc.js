const { ipcMain, BrowserWindow, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { gameState, resetState } = require('./state');
const { saveState, loadState, deleteSaveFile, listSaveGames, getLastSave } = require('./storage');
const { getSettings, saveSettings } = require('./settings');

let allWindows = [];
let activeGameFile = null;

const broadcastUpdate = () => {
  allWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('game-state-update', gameState);
    }
  });
};

const registerWindow = (win) => {
  allWindows.push(win);
};

const unregisterWindow = (win) => {
  allWindows = allWindows.filter(w => w !== win);
};

const initializeIpc = () => {
  // App control
  ipcMain.on('exit-app', () => app.quit());

  // Initial setup
  ipcMain.on('complete-initial-setup', (event, initialSettings) => {
    saveSettings(initialSettings);
    const win = BrowserWindow.fromWebContents(event.sender);
    win.loadFile('views/menu/index.html');
  });

  // Settings handlers
  ipcMain.handle('get-settings', getSettings);
  ipcMain.on('save-settings', (event, settings) => saveSettings(settings));

  // Sponsor/Logo handlers
  ipcMain.handle('add-sponsor', (event, { name, buffer, originalName }) => {
    const settings = getSettings();
    const sponsorsDir = path.join(app.getPath('userData'), 'sponsors');
    if (!fs.existsSync(sponsorsDir)) fs.mkdirSync(sponsorsDir);
    
    const sanitizedName = path.basename(originalName);
    const newFileName = `${Date.now()}-${sanitizedName}`;
    const newPath = path.join(sponsorsDir, newFileName);
    
    fs.writeFileSync(newPath, buffer);

    const newSponsor = { id: Date.now(), name, logo: newPath };
    settings.sponsors.push(newSponsor);
    saveSettings(settings);
    return newSponsor;
  });

  ipcMain.on('delete-sponsor', (event, sponsorId) => {
    const settings = getSettings();
    const sponsorToDelete = settings.sponsors.find(s => s.id === sponsorId);
    if (sponsorToDelete && fs.existsSync(sponsorToDelete.logo)) {
      fs.unlinkSync(sponsorToDelete.logo);
    }
    settings.sponsors = settings.sponsors.filter(s => s.id !== sponsorId);
    saveSettings(settings);
  });

  ipcMain.handle('upload-main-logo', (event, { buffer, originalName }) => {
    const settings = getSettings();
    const logosDir = path.join(app.getPath('userData'), 'logos');
    if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir);

    if (settings.mainLogoPath && fs.existsSync(settings.mainLogoPath)) {
        fs.unlinkSync(settings.mainLogoPath);
    }
    
    const sanitizedName = path.basename(originalName);
    const newFileName = `main-logo-${Date.now()}-${sanitizedName}`;
    const newPath = path.join(logosDir, newFileName);
    
    fs.writeFileSync(newPath, buffer);
    settings.mainLogoPath = newPath;
    saveSettings(settings);
    return newPath;
  });

  ipcMain.on('delete-main-logo', () => {
    const settings = getSettings();
    if (settings.mainLogoPath && fs.existsSync(settings.mainLogoPath)) {
        fs.unlinkSync(settings.mainLogoPath);
    }
    settings.mainLogoPath = null;
    saveSettings(settings);
  });

  // Game management
  ipcMain.on('start-new-game', () => {
    resetState();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    activeGameFile = `game-${timestamp}.json`;
    saveState(activeGameFile);
    broadcastUpdate();
  });

  ipcMain.on('load-game', (event, fileName) => {
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
        return true;
    }
    return false;
  });

  ipcMain.handle('list-save-games', listSaveGames);

  ipcMain.on('end-game', () => {
    if (activeGameFile) {
      deleteSaveFile(activeGameFile);
      activeGameFile = null;
    }
    resetState();
    broadcastUpdate();
  });

  // Core game logic
  ipcMain.on('call-next-number', () => {
    if (!activeGameFile) return;
    if (gameState.uncalledNumbers.length === 0) gameState.isGameOver = true;
    else {
      const randomIndex = Math.floor(Math.random() * gameState.uncalledNumbers.length);
      const newNumber = gameState.uncalledNumbers[randomIndex];
      gameState.uncalledNumbers.splice(randomIndex, 1);
      gameState.calledNumbers.push(newNumber);
      gameState.lastCalled = newNumber;
    }
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

  ipcMain.on('toggle-called-number', (event, number) => {
    if (!activeGameFile) return;

    const indexInCalled = gameState.calledNumbers.indexOf(number);
    if (indexInCalled > -1) {
      // Number is currently called, so uncall it
      gameState.calledNumbers.splice(indexInCalled, 1);
      gameState.uncalledNumbers.push(number);
      gameState.uncalledNumbers.sort((a, b) => a - b); // Keep uncalled numbers sorted
      if (gameState.lastCalled === number) {
        gameState.lastCalled = null; // If the uncalled number was the last called, clear it
      }
    } else {
      // Number is not called, so call it
      const indexInUncalled = gameState.uncalledNumbers.indexOf(number);
      if (indexInUncalled > -1) {
        gameState.uncalledNumbers.splice(indexInUncalled, 1);
        gameState.calledNumbers.push(number);
        gameState.calledNumbers.sort((a, b) => a - b); // Keep called numbers sorted
        gameState.lastCalled = number; // Set this as the last called number
      }
    }
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
