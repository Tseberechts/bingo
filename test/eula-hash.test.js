const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { hashEulaText } = require('../game/eula-hash');

describe('hashEulaText', () => {
  it('returns a stable sha256 hex for a fixed string', () => {
    const input = 'Gebruiksvoorwaarden — Bingo\n';
    const expected = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    const hash = hashEulaText(input);
    assert.equal(hash, expected);
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert.equal(hashEulaText(input), hash);
  });

  it('changes when the input changes', () => {
    const a = hashEulaText('versie een');
    const b = hashEulaText('versie twee');
    assert.notEqual(a, b);
  });
});
