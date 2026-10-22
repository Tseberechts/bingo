const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { gameState, resetState, applyLoadedState } = require('./state');
const { sanitizeSaveFileName } = require('./paths');

let savesDir;
const lastGameInfoFile = 'last_game.json';

const initializeStorage = () => {
  const userDataPath = app.getPath('userData');
  savesDir = path.join(userDataPath, 'savegames');
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
};

const resolveSavePath = (fileName) => {
  const safeName = sanitizeSaveFileName(fileName);
  if (!safeName || !savesDir) return null;
  const savePath = path.join(savesDir, safeName);
  if (!savePath.startsWith(savesDir)) return null;
  return { safeName, savePath };
};

const saveState = (fileName) => {
  const resolved = resolveSavePath(fileName);
  if (!resolved) return { ok: false, error: 'Ongeldige bestandsnaam' };
  try {
    fs.writeFileSync(resolved.savePath, JSON.stringify(gameState, null, 2));
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    fs.writeFileSync(lastGamePath, JSON.stringify({ lastSave: resolved.safeName }));
    return { ok: true };
  } catch (error) {
    console.error(`Failed to save game state to ${fileName}:`, error);
    return { ok: false, error: error.message };
  }
};

const loadState = (fileName) => {
  const resolved = resolveSavePath(fileName);
  if (!resolved) return false;

  if (!fs.existsSync(resolved.savePath)) {
    console.error(`Save file not found: ${fileName}`);
    return false;
  }

  try {
    const savedData = fs.readFileSync(resolved.savePath, 'utf-8');
    const loadedState = JSON.parse(savedData);
    if (!applyLoadedState(loadedState)) {
      console.error(`Invalid save file shape: ${fileName}`);
      resetState();
      return false;
    }
    const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
    fs.writeFileSync(lastGamePath, JSON.stringify({ lastSave: resolved.safeName }));
    return true;
  } catch (error) {
    console.error(`Error loading game state from ${fileName}:`, error);
    resetState();
    return false;
  }
};

const deleteSaveFile = (fileName) => {
  const resolved = resolveSavePath(fileName);
  if (!resolved) return { ok: false, error: 'Ongeldige bestandsnaam' };
  try {
    if (fs.existsSync(resolved.savePath)) {
      fs.unlinkSync(resolved.savePath);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
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
  if (savesDir) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
};

const listSaveGames = () => {
  if (!savesDir || !fs.existsSync(savesDir)) return [];
  return fs.readdirSync(savesDir).filter((file) => sanitizeSaveFileName(file));
};

const getLastSave = () => {
  const lastGamePath = path.join(app.getPath('userData'), lastGameInfoFile);
  if (fs.existsSync(lastGamePath)) {
    try {
      const info = JSON.parse(fs.readFileSync(lastGamePath, 'utf-8'));
      return sanitizeSaveFileName(info.lastSave);
    } catch {
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
  sanitizeSaveFileName,
};
