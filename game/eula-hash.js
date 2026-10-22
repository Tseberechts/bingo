const crypto = require('crypto');

/**
 * Stable SHA-256 hex digest of EULA markdown (UTF-8).
 * @param {string} text
 * @returns {string}
 */
const hashEulaText = (text) => (
  crypto.createHash('sha256').update(String(text), 'utf8').digest('hex')
);

module.exports = {
  hashEulaText,
};
