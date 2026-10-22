const fs = require('fs');
const path = require('path');

const BUILD_INFO_PATH = path.join(__dirname, 'build-info.json');

/**
 * Format a date as YYYYMMDD.HHmm in UTC (stable across CI runners).
 * Optional display stamp only — not used as the app semver.
 * @param {Date} [date]
 * @returns {string} e.g. "20261022.2130"
 */
const formatBuildStamp = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${mo}${day}.${h}${mi}`;
};

/**
 * @deprecated Prefer formatBuildStamp; kept for older call sites/tests that
 * want "base-stamp" display strings.
 * @param {string} baseVersion e.g. "1.0.0"
 * @param {Date} [date]
 * @returns {string} e.g. "1.0.0-20261022.2130"
 */
const stampVersion = (baseVersion, date = new Date()) => (
  `${baseVersion}-${formatBuildStamp(date)}`
);

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
 * Write game/build-info.json with package semver + builtAt (not a stamped version).
 * @param {string} baseVersion
 * @returns {{ version: string, builtAt: string, buildStamp: string }}
 */
const writeBuildInfo = (baseVersion) => {
  const date = resolveBuildDate();
  const builtAt = date.toISOString();
  const buildStamp = formatBuildStamp(date);
  const info = { version: baseVersion, builtAt, buildStamp };
  fs.writeFileSync(BUILD_INFO_PATH, `${JSON.stringify(info, null, 2)}\n`, 'utf8');
  return info;
};

/**
 * Read build-info.json if present.
 * @returns {{ version: string, builtAt: string, buildStamp: string | null } | null}
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
      buildStamp: typeof parsed.buildStamp === 'string' ? parsed.buildStamp : null,
    };
  } catch {
    return null;
  }
};

module.exports = {
  BUILD_INFO_PATH,
  formatBuildStamp,
  stampVersion,
  resolveBuildDate,
  writeBuildInfo,
  readBuildInfo,
};
