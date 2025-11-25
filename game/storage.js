const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { gameState, resetState } = require('./state');

let savesDir;
const lastGameInfoFile = 'last_game.json';

const initializeStorage = () => {
  const userDataPath = app.getPath('userData');
  savesDir = path.join(userDataPath, 'savegames');
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
};

const saveState = (fileName) => {
  if (!savesDir || !fileName) return;
  try {
    const savePath = path.join(savesDir, fileName);
    fs.writeFileSync(savePath, JSON.stringify(gameState, null, 2));
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    fs.writeFileSync(lastGamePath, JSON.stringify({ lastSave: fileName }));
  } catch (error) {
    console.error(`Failed to save game state to ${fileName}:`, error);
  }
};

const loadState = (fileName) => {
  if (!savesDir || !fileName) return false;
  const savePath = path.join(savesDir, fileName);

  if (!fs.existsSync(savePath)) {
    console.error(`Save file not found: ${fileName}`);
    return false;
  }

  try {
    const savedData = fs.readFileSync(savePath, 'utf-8');
    const loadedState = JSON.parse(savedData);
    Object.assign(gameState, loadedState);
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    fs.writeFileSync(lastGamePath, JSON.stringify({ lastSave: fileName }));
    return true;
  } catch (error) {
    console.error(`Error loading game state from ${fileName}:`, error);
    resetState();
    return false;
  }
};

const deleteSaveFile = (fileName) => {
  if (!savesDir || !fileName) return;
  const savePath = path.join(savesDir, fileName);
  if (fs.existsSync(savePath)) {
    fs.unlinkSync(savePath);
  }
};

const deleteAllSaves = () => {
    if (savesDir && fs.existsSync(savesDir)) {
        fs.rmSync(savesDir, { recursive: true, force: true });
    }
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    if (fs.existsSync(lastGamePath)) {
        fs.unlinkSync(lastGamePath);
    }
};

const listSaveGames = () => {
  if (!savesDir || !fs.existsSync(savesDir)) return [];
  return fs.readdirSync(savesDir).filter(file => file.endsWith('.json'));
};

const getLastSave = () => {
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    if (fs.existsSync(lastGamePath)) {
        try {
            const info = JSON.parse(fs.readFileSync(lastGamePath, 'utf-8'));
            return info.lastSave;
        } catch (error) {
            return null;
        }
    }
    return null;
};

module.exports = {
  initializeStorage,
  saveState,
  loadState,
  deleteSaveFile,
  deleteAllSaves,
  listSaveGames,
  getLastSave,
};
