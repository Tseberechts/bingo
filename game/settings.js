const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { toFileUrl } = require('./paths');
const { defaultSettings, mergeSettings } = require('./settings-defaults');

let settingsPath;
let settings = {};

const initializeSettings = () => {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  loadSettings();
};

const settingsExist = () => {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return fs.existsSync(settingsPath);
};

const loadSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      const savedSettings = JSON.parse(settingsData);
      settings = mergeSettings(defaultSettings, savedSettings);
    } else {
      settings = { ...defaultSettings };
    }
  } catch (error) {
    console.error('Failed to load settings, falling back to defaults:', error);
    settings = { ...defaultSettings };
  }
  return settings;
};

const saveSettings = (newSettings) => {
  if (newSettings) {
    settings = mergeSettings(settings, newSettings);
  }
  try {
    if (!settingsPath) {
      settingsPath = path.join(app.getPath('userData'), 'settings.json');
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
};

const getSettings = () => settings;

/** Settings shaped for the renderer (file URLs for images). */
const getSettingsForRenderer = () => {
  const current = getSettings();
  return {
    ...current,
    mainLogoPath: toFileUrl(current.mainLogoPath) || current.mainLogoPath,
    mainLogoFileName: current.mainLogoPath ? path.basename(current.mainLogoPath) : null,
    sponsors: (current.sponsors || []).map((sponsor) => ({
      ...sponsor,
      logo: toFileUrl(sponsor.logo) || sponsor.logo,
    })),
  };
};

const deleteSettings = () => {
  if (settingsPath && fs.existsSync(settingsPath)) {
    fs.unlinkSync(settingsPath);
  }
  const sponsorsDir = path.join(app.getPath('userData'), 'sponsors');
  if (fs.existsSync(sponsorsDir)) {
    fs.rmSync(sponsorsDir, { recursive: true, force: true });
  }
  const logosDir = path.join(app.getPath('userData'), 'logos');
  if (fs.existsSync(logosDir)) {
    fs.rmSync(logosDir, { recursive: true, force: true });
  }
  settings = { ...defaultSettings };
};

module.exports = {
  defaultSettings,
  mergeSettings,
  initializeSettings,
  loadSettings,
  saveSettings,
  getSettings,
  getSettingsForRenderer,
  settingsExist,
  deleteSettings,
};
