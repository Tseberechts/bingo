#!/usr/bin/env node
/**
 * Issue a signed Bingo paid license key.
 *
 * Usage:
 *   node scripts/issue-license.js --lic BNG-TEST-0001 --email klant@example.be
 *   node scripts/issue-license.js --lic BNG-TEST-0001 --exp 2027-12-31
 *
 * Private key: LICENSE_PRIVATE_KEY_B64 env, or secrets/license-private.b64
 */
const fs = require('fs');
const path = require('path');
const { issueLicenseKey } = require('../game/license-crypto');

const parseArgs = (argv) => {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
};

const resolvePrivateKeyB64 = () => {
  if (process.env.LICENSE_PRIVATE_KEY_B64) {
    return process.env.LICENSE_PRIVATE_KEY_B64.trim();
  }
  const filePath = path.join(__dirname, '..', 'secrets', 'license-private.b64');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  throw new Error(
    'Missing private key. Set LICENSE_PRIVATE_KEY_B64 or create secrets/license-private.b64',
  );
};

const parseExp = (value) => {
  if (value == null || value === '') return null;
  if (/^\d+$/.test(String(value))) return Number(value);
  const ms = Date.parse(String(value));
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid --exp value: ${value}`);
  }
  return Math.floor(ms / 1000);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.lic) {
    console.error('Usage: node scripts/issue-license.js --lic BNG-XXXX [--email a@b.c] [--exp 2027-12-31]');
    process.exit(1);
  }
  const privateKeyDerB64 = resolvePrivateKeyB64();
  const key = issueLicenseKey(privateKeyDerB64, {
    lic: args.lic,
    email: args.email || null,
    exp: parseExp(args.exp),
  });
  console.log(key);
};

main();
