const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FREE_ENTITLEMENTS, PAID_ENTITLEMENTS } = require('../game/entitlements-defs');

describe('entitlements matrix', () => {
  it('locks paid features on free tier', () => {
    assert.equal(FREE_ENTITLEMENTS.isPaid, false);
    assert.equal(FREE_ENTITLEMENTS.customSponsors, false);
    assert.equal(FREE_ENTITLEMENTS.customMainLogo, false);
    assert.equal(FREE_ENTITLEMENTS.customBrandColors, false);
    assert.equal(FREE_ENTITLEMENTS.multipleSaves, false);
    assert.equal(FREE_ENTITLEMENTS.eveningReport, false);
    assert.equal(FREE_ENTITLEMENTS.audienceWindow, false);
    assert.equal(FREE_ENTITLEMENTS.maxSaveSlots, 1);
  });

  it('unlocks paid features on paid tier', () => {
    assert.equal(PAID_ENTITLEMENTS.isPaid, true);
    assert.equal(PAID_ENTITLEMENTS.customSponsors, true);
    assert.equal(PAID_ENTITLEMENTS.customMainLogo, true);
    assert.equal(PAID_ENTITLEMENTS.customBrandColors, true);
    assert.equal(PAID_ENTITLEMENTS.multipleSaves, true);
    assert.equal(PAID_ENTITLEMENTS.eveningReport, true);
    assert.equal(PAID_ENTITLEMENTS.audienceWindow, true);
  });
});
