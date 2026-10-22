const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mergeSettings, defaultSettings } = require('../game/settings-defaults');

describe('mergeSettings', () => {
  it('fills defaults for missing keys', () => {
    const merged = mergeSettings(defaultSettings, { gameTitle: 'Test Bingo' });
    assert.equal(merged.gameTitle, 'Test Bingo');
    assert.equal(merged.inGameDisplayMode, 'hide');
    assert.equal(merged.maxNumber, defaultSettings.maxNumber);
    assert.deepEqual(merged.sponsors, []);
    assert.equal(merged.setupStep, 0);
    assert.equal(merged.setupComplete, false);
  });

  it('keeps provided sponsors array', () => {
    const sponsors = [{ id: 1, name: 'A', logo: '/x.png' }];
    const merged = mergeSettings(defaultSettings, { sponsors });
    assert.deepEqual(merged.sponsors, sponsors);
  });

  it('falls back to default sponsors when saved sponsors is not an array', () => {
    const merged = mergeSettings(defaultSettings, { sponsors: 'bad' });
    assert.deepEqual(merged.sponsors, []);
  });

  it('preserves setup progress fields when provided', () => {
    const merged = mergeSettings(defaultSettings, {
      setupStep: 3,
      setupComplete: false,
    });
    assert.equal(merged.setupStep, 3);
    assert.equal(merged.setupComplete, false);
  });

  it('normalizes brandColors when provided', () => {
    const merged = mergeSettings(defaultSettings, {
      brandColors: { accent: '#FF0000', bg: 'bad', bgActive: '#00FF00' },
    });
    assert.equal(merged.brandColors.accent, '#ff0000');
    assert.equal(merged.brandColors.bgActive, '#00ff00');
  });

  it('allows clearing brandColors with null', () => {
    const merged = mergeSettings(defaultSettings, { brandColors: null });
    assert.equal(merged.brandColors, null);
  });
});
