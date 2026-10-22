const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('crypto');
const {
  issueLicenseKey,
  verifyLicenseKey,
  LICENSE_VERSION,
} = require('../game/license-crypto');

const makePair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateB64: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
    publicB64: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
  };
};

describe('license-crypto', () => {
  it('verifies a freshly issued key', () => {
    const { privateB64, publicB64 } = makePair();
    const key = issueLicenseKey(privateB64, {
      lic: 'BNG-TEST-001',
      email: 'test@example.be',
      exp: null,
    });
    const result = verifyLicenseKey(key, { publicKeyDerB64: publicB64 });
    assert.equal(result.ok, true);
    assert.equal(result.payload.lic, 'BNG-TEST-001');
    assert.equal(result.payload.email, 'test@example.be');
    assert.equal(result.payload.v, LICENSE_VERSION);
    assert.equal(result.payload.tier, 'paid');
  });

  it('rejects a tampered payload', () => {
    const { privateB64, publicB64 } = makePair();
    const key = issueLicenseKey(privateB64, { lic: 'BNG-TEST-002' });
    const [payloadPart, sigPart] = key.split('.');
    const raw = Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/') + '==', 'base64').toString('utf8');
    const tweaked = JSON.parse(raw);
    tweaked.email = 'hacker@evil.test';
    const tweakedB64 = Buffer.from(JSON.stringify(tweaked), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const result = verifyLicenseKey(`${tweakedB64}.${sigPart}`, { publicKeyDerB64: publicB64 });
    assert.equal(result.ok, false);
  });

  it('rejects an expired key', () => {
    const { privateB64, publicB64 } = makePair();
    const past = Math.floor(Date.now() / 1000) - 60;
    const key = issueLicenseKey(privateB64, { lic: 'BNG-TEST-003', exp: past });
    const result = verifyLicenseKey(key, { publicKeyDerB64: publicB64 });
    assert.equal(result.ok, false);
    assert.match(result.error, /verlopen/i);
  });

  it('rejects garbage input', () => {
    assert.equal(verifyLicenseKey('').ok, false);
    assert.equal(verifyLicenseKey('not-a-key').ok, false);
    assert.equal(verifyLicenseKey(null).ok, false);
  });
});
