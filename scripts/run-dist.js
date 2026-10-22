#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const pkg = require('../package.json');
const { writeBuildInfo } = require('../game/version');

const platformArgs = process.argv.slice(2);
const { version } = writeBuildInfo(pkg.version);

const result = spawnSync(
  'npx',
  ['electron-builder', ...platformArgs, `--config.extraMetadata.version=${version}`],
  {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    shell: process.platform === 'win32',
    env: process.env,
  },
);

process.exit(result.status === null ? 1 : result.status);
