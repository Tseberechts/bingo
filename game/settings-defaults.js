const { MAX_NUMBER } = require('./constants');

const { normalizeBrandColors } = require('./branding');

const defaultSettings = {
  gameTitle: 'BINGO',
  mainLogoPath: null,
  inGameDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  pauseDisplayMode: 'hide', // 'hide', 'sponsors', or 'logo'
  sponsors: [],
  brandColors: null, // paid: { accent, bg, bgActive } hex colours
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
  brandColors: Object.prototype.hasOwnProperty.call(saved, 'brandColors')
    ? normalizeBrandColors(saved.brandColors)
    : defaults.brandColors,
});

module.exports = {
  defaultSettings,
  mergeSettings,
};
