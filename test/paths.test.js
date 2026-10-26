const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
  sanitizeSaveFileName,
  sanitizeImageFileName,
  isAllowedImageBuffer,
  isPathInside,
  MAX_IMAGE_BYTES,
} = require('../game/paths');

describe('sanitizeSaveFileName', () => {
  it('accepts valid game save names', () => {
    assert.equal(sanitizeSaveFileName('game-2024-01-01T12-00-00-000Z.json'), 'game-2024-01-01T12-00-00-000Z.json');
  });

  it('rejects path traversal and non-game files', () => {
    assert.equal(sanitizeSaveFileName('../game-x.json'), null);
    assert.equal(sanitizeSaveFileName('evil.json'), null);
    assert.equal(sanitizeSaveFileName(''), null);
    assert.equal(sanitizeSaveFileName(null), null);
  });
});

describe('sanitizeImageFileName', () => {
  it('keeps safe image basenames', () => {
    assert.equal(sanitizeImageFileName('logo.PNG'), 'logo.png');
    assert.match(sanitizeImageFileName('/tmp/../sponsor.webp'), /\.webp$/);
  });

  it('rejects unsupported extensions', () => {
    assert.equal(sanitizeImageFileName('payload.exe'), null);
    assert.equal(sanitizeImageFileName('note.txt'), null);
  });
});

describe('isAllowedImageBuffer', () => {
  it('accepts reasonable sizes', () => {
    assert.equal(isAllowedImageBuffer(Buffer.alloc(100)), true);
  });

  it('rejects empty or oversized buffers', () => {
    assert.equal(isAllowedImageBuffer(Buffer.alloc(0)), false);
    assert.equal(isAllowedImageBuffer(Buffer.alloc(MAX_IMAGE_BYTES + 1)), false);
  });
});

describe('isPathInside', () => {
  it('accepts files under the parent directory', () => {
    const parent = path.join('C:', 'Users', 'x', 'Bingo', 'savegames');
    const child = path.join(parent, 'game-1.json');
    assert.equal(isPathInside(parent, child), true);
  });

  it('rejects paths that escape the parent', () => {
    const parent = path.join('C:', 'Users', 'x', 'Bingo', 'savegames');
    const escape = path.join('C:', 'Users', 'x', 'Bingo', 'other', 'game-1.json');
    assert.equal(isPathInside(parent, escape), false);
  });
});
