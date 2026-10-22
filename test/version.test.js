const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const {
  stampVersion,
  resolveBuildDate,
  writeBuildInfo,
  readBuildInfo,
  BUILD_INFO_PATH,
} = require('../game/version');

describe('stampVersion', () => {
  it('formats base version with YYYYMMDD.HHmm in UTC', () => {
    const date = new Date(Date.UTC(2026, 9, 22, 21, 30, 45));
    assert.equal(stampVersion('1.0.0', date), '1.0.0-20261022.2130');
  });

  it('pads single-digit month, day, hour, and minute', () => {
    const date = new Date(Date.UTC(2026, 0, 5, 3, 7));
    assert.equal(stampVersion('2.1.3', date), '2.1.3-20260105.0307');
  });
});

describe('resolveBuildDate', () => {
  const original = process.env.SOURCE_DATE_EPOCH;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SOURCE_DATE_EPOCH;
    } else {
      process.env.SOURCE_DATE_EPOCH = original;
    }
  });

  it('uses SOURCE_DATE_EPOCH seconds when set', () => {
    process.env.SOURCE_DATE_EPOCH = '1729600000';
    const date = resolveBuildDate();
    assert.equal(date.toISOString(), new Date(1729600000 * 1000).toISOString());
  });

  it('falls back to now when SOURCE_DATE_EPOCH is missing', () => {
    delete process.env.SOURCE_DATE_EPOCH;
    const before = Date.now();
    const date = resolveBuildDate();
    const after = Date.now();
    assert.ok(date.getTime() >= before - 1000);
    assert.ok(date.getTime() <= after + 1000);
  });

  it('falls back to now when SOURCE_DATE_EPOCH is invalid', () => {
    process.env.SOURCE_DATE_EPOCH = 'not-a-number';
    const before = Date.now();
    const date = resolveBuildDate();
    assert.ok(date.getTime() >= before - 1000);
  });
});

describe('writeBuildInfo / readBuildInfo', () => {
  const original = process.env.SOURCE_DATE_EPOCH;

  beforeEach(() => {
    if (fs.existsSync(BUILD_INFO_PATH)) fs.unlinkSync(BUILD_INFO_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(BUILD_INFO_PATH)) fs.unlinkSync(BUILD_INFO_PATH);
    if (original === undefined) {
      delete process.env.SOURCE_DATE_EPOCH;
    } else {
      process.env.SOURCE_DATE_EPOCH = original;
    }
  });

  it('writes and reads stamped version and ISO builtAt', () => {
    process.env.SOURCE_DATE_EPOCH = '1729600000';
    const info = writeBuildInfo('1.0.0');
    const expectedDate = new Date(1729600000 * 1000);
    assert.equal(info.version, stampVersion('1.0.0', expectedDate));
    assert.equal(info.builtAt, expectedDate.toISOString());
    assert.deepEqual(readBuildInfo(), info);
  });

  it('returns null when build-info is missing', () => {
    assert.equal(readBuildInfo(), null);
  });
});
