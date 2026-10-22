const { MAX_NUMBER } = require('./constants');

const defaultSettings = {
  gameTitle: 'ROZENSTRAAT BINGO',
  mainLogoPath: null,
  inGameDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  pauseDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  sponsors: [],
  maxNumber: MAX_NUMBER,
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
