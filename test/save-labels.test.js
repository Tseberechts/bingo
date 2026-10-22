const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  dateFromSaveFileName,
  formatDutchDateTime,
  buildSaveLabelParts,
} = require('../game/save-labels');

describe('dateFromSaveFileName', () => {
  it('parses game timestamp filenames', () => {
    const date = dateFromSaveFileName('game-2026-10-22T19-41-05-123Z.json');
    assert.ok(date instanceof Date);
    assert.equal(date.toISOString(), '2026-10-22T19:41:05.000Z');
  });

  it('returns null for invalid names', () => {
    assert.equal(dateFromSaveFileName('not-a-save.json'), null);
  });
});

describe('formatDutchDateTime', () => {
  it('formats a fixed UTC instant in local parts', () => {
    const date = new Date(Date.UTC(2026, 9, 22, 18, 15, 0));
    const label = formatDutchDateTime(date);
    assert.match(label, /okt 2026/);
    assert.match(label, /\d{2}:\d{2}$/);
  });
});

describe('buildSaveLabelParts', () => {
  it('includes round and called count in meta', () => {
    const parts = buildSaveLabelParts({
      fileName: 'game-2026-10-22T19-41-05-123Z.json',
      round: 3,
      calledCount: 42,
      when: new Date('2026-10-22T19:41:05.000Z'),
    });
    assert.match(parts.label, /okt 2026/);
    assert.equal(parts.meta, 'Ronde 3 · 42 nummers');
  });
});
