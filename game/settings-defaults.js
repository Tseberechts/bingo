const { MAX_NUMBER } = require('./constants');

const defaultSettings = {
  gameTitle: 'BINGO',
  mainLogoPath: null,
  inGameDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  pauseDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  sponsors: [],
  maxNumber: MAX_NUMBER,
  setupStep: 0,
  setupComplete: false,
  projectorTipSeen: false,
  eulaAcceptedAt: null,
  eulaAcceptedHash: null,
};

const mergeSettings = (defaults, saved = {}) => ({
  ...defaults,
  ...saved,
  sponsors: Array.isArray(saved.sponsors) ? saved.sponsors : defaults.sponsors,
});

module.exports = {
  defaultSettings,
  mergeSettings,
};
