const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const {
  ARKASTRO_SPONSOR_ID,
  ARKASTRO_CAPTION,
  ARKASTRO_DISPLAY_NAME,
  getArkastroBrandPath,
  lockedArkastroSponsorForRenderer,
} = require('../game/branding');

describe('branding', () => {
  it('ships the Arkastro brand asset', () => {
    assert.equal(fs.existsSync(getArkastroBrandPath()), true);
  });

  it('packages the Arkastro brand via extraResources', () => {
    const pkg = require('../package.json');
    const resources = pkg.build?.extraResources || [];
    const match = resources.some((entry) => {
      if (typeof entry === 'string') return entry.includes('ARKASTRO_LOGO-full-color.svg');
      return entry?.from?.includes('ARKASTRO_LOGO-full-color.svg');
    });
    assert.equal(match, true);
  });

  it('returns a locked Arkastro sponsor for the renderer', () => {
    const sponsor = lockedArkastroSponsorForRenderer();
    assert.equal(sponsor.id, ARKASTRO_SPONSOR_ID);
    assert.equal(sponsor.name, ARKASTRO_DISPLAY_NAME);
    assert.equal(sponsor.caption, ARKASTRO_CAPTION);
    assert.equal(sponsor.locked, true);
    assert.ok(typeof sponsor.logo === 'string' && sponsor.logo.length > 0);
  });
});
