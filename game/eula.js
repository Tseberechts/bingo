const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { hashEulaText } = require('./eula-hash');

/**
 * Read packaged/root EULA.md.
 * @returns {string}
 */
const readEulaText = () => {
  const eulaPath = path.join(app.getAppPath(), 'EULA.md');
  return fs.readFileSync(eulaPath, 'utf-8');
};

/**
 * @returns {string}
 */
const getCurrentEulaHash = () => hashEulaText(readEulaText());

module.exports = {
  hashEulaText,
  readEulaText,
  getCurrentEulaHash,
};
