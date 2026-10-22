#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const pkg = require('../package.json');

const root = path.join(__dirname, '..');

const getLatestTag = () => {
  try {
    return execSync('git describe --tags --abbrev=0 --match "v*"', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

const bumpVersion = (version, releaseType) => {
  const parts = String(version).split('.').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  let [major, minor, patch] = parts;
  if (releaseType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (releaseType === 'minor') {
    minor += 1;
    patch = 0;
  } else if (releaseType === 'patch') {
    patch += 1;
  } else {
    return version;
  }
  return `${major}.${minor}.${patch}`;
};

const run = async () => {
  let recommendedBump;
  try {
    recommendedBump = require('conventional-recommended-bump');
  } catch {
    console.log('Suggested bump: unavailable (install conventional-recommended-bump)');
    return;
  }

  const tag = getLatestTag();

  try {
    const result = await recommendedBump({
      preset: {
        name: 'conventionalcommits',
      },
      path: root,
      ...(tag ? { tagPrefix: 'v' } : {}),
    });

    const releaseType = result?.releaseType;
    if (!releaseType) {
      console.log(`Suggested bump: none (stay at ${pkg.version})`);
      return;
    }

    const next = bumpVersion(pkg.version, releaseType);
    if (next) {
      console.log(`Suggested bump: ${releaseType} (${pkg.version} → ${next})`);
    } else {
      console.log(`Suggested bump: ${releaseType}`);
    }
  } catch (err) {
    console.log(`Suggested bump: unavailable (${err.message})`);
  }
};

run().then(() => process.exit(0));
