const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const {
  normalizeBrandColors,
  getArkastroBrandPath,
  DEFAULT_BRAND_COLORS,
  ARKASTRO_SPONSOR_ID,
} = require('../game/branding');

describe('branding', () => {
  it('normalizes valid hex colours', () => {
    const colors = normalizeBrandColors({
      accent: '#AABBCC',
      bg: '#112233',
      bgActive: '#445566',
    });
    assert.deepEqual(colors, {
      accent: '#aabbcc',
      bg: '#112233',
      bgActive: '#445566',
    });
  });

  it('returns null for empty/invalid input', () => {
    assert.equal(normalizeBrandColors(null), null);
    assert.equal(normalizeBrandColors({}), null);
    assert.equal(normalizeBrandColors({ accent: 'red' }), null);
  });

  it('fills missing channels from defaults when at least one is valid', () => {
    const colors = normalizeBrandColors({ accent: '#ff0000' });
    assert.equal(colors.accent, '#ff0000');
    assert.equal(colors.bg, DEFAULT_BRAND_COLORS.bg);
    assert.equal(colors.bgActive, DEFAULT_BRAND_COLORS.bgActive);
  });

  it('ships the Arkastro brand asset', () => {
    assert.equal(ARKASTRO_SPONSOR_ID, 'arkastro');
    assert.equal(fs.existsSync(getArkastroBrandPath()), true);
  });
});
