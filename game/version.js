const fs = require('fs');
const path = require('path');

const BUILD_INFO_PATH = path.join(__dirname, 'build-info.json');

/**
 * Format a date as YYYYMMDD.HHmm in UTC (stable across CI runners).
 * @param {string} baseVersion e.g. "1.0.0"
 * @param {Date} [date]
 * @returns {string} e.g. "1.0.0-20261022.2130"
 */
const stampVersion = (baseVersion, date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${baseVersion}-${y}${mo}${day}.${h}${mi}`;
};

/**
 * Resolve the build instant: SOURCE_DATE_EPOCH (seconds) if set, else now.
 * @returns {Date}
 */
const resolveBuildDate = () => {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch !== undefined && epoch !== '') {
    const seconds = Number(epoch);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return new Date(seconds * 1000);
    }
  }
  return new Date();
};

/**
 * Write game/build-info.json and return { version, builtAt }.
 * @param {string} baseVersion
 * @returns {{ version: string, builtAt: string }}
 */
const writeBuildInfo = (baseVersion) => {
  const date = resolveBuildDate();
  const version = stampVersion(baseVersion, date);
  const builtAt = date.toISOString();
  const info = { version, builtAt };
  fs.writeFileSync(BUILD_INFO_PATH, `${JSON.stringify(info, null, 2)}\n`, 'utf8');
  return info;
};

/**
 * Read build-info.json if present.
 * @returns {{ version: string, builtAt: string } | null}
 */
const readBuildInfo = () => {
  try {
    if (!fs.existsSync(BUILD_INFO_PATH)) return null;
    const raw = fs.readFileSync(BUILD_INFO_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.version !== 'string') return null;
    return {
      version: parsed.version,
      builtAt: typeof parsed.builtAt === 'string' ? parsed.builtAt : null,
    };
  } catch {
    return null;
  }
};

module.exports = {
  BUILD_INFO_PATH,
  stampVersion,
  resolveBuildDate,
  writeBuildInfo,
  readBuildInfo,
};
