const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let settingsPath;
let settings = {};

const defaultSettings = {
    gameTitle: 'ROZENSTRAAT BINGO',
    mainLogoPath: null,
    // In-game display
    showInGame: true,
    inGameDisplayMode: 'sponsors', // 'sponsors' or 'logo'
    // Pause screen display
    showOnPause: true,
    pauseDisplayMode: 'sponsors', // 'sponsors' or 'logo'
    sponsors: [],
};

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
            settings = { ...defaultSettings, ...savedSettings };
        } else {
            settings = { ...defaultSettings };
        }
    } catch (error) {
        console.error("Failed to load settings, falling back to defaults:", error);
        settings = { ...defaultSettings };
    }
    return settings;
};

const saveSettings = (newSettings) => {
    if (newSettings) {
        settings = { ...settings, ...newSettings };
    }
    try {
        if (!settingsPath) {
            settingsPath = path.join(app.getPath('userData'), 'settings.json');
        }
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error("Failed to save settings:", error);
    }
};

const getSettings = () => {
    return settings;
};

const deleteSettings = () => {
    if (settingsPath && fs.existsSync(settingsPath)) {
        fs.unlinkSync(settingsPath);
    }
    const sponsorsDir = path.join(app.getPath('userData'), 'sponsors');
    if (fs.existsSync(sponsorsDir)) {
        fs.rmSync(sponsorsDir, { recursive: true, force: true });
    }
};

module.exports = {
    initializeSettings,
    loadSettings,
    saveSettings,
    getSettings,
    settingsExist,
    deleteSettings,
};
