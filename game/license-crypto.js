const { createPublicKey, createPrivateKey, sign, verify } = require('crypto');
const { LICENSE_PUBLIC_KEY_DER_B64 } = require('./license-public-key');

const LICENSE_VERSION = 1;
const PAID_TIER = 'paid';

const base64UrlEncode = (buf) => Buffer.from(buf)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const base64UrlDecode = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
};

const publicKeyFromDerB64 = (derB64) => createPublicKey({
  key: Buffer.from(derB64, 'base64'),
  format: 'der',
  type: 'spki',
});

const getPublicKey = () => publicKeyFromDerB64(LICENSE_PUBLIC_KEY_DER_B64);

const getPrivateKeyFromDerB64 = (derB64) => createPrivateKey({
  key: Buffer.from(derB64, 'base64'),
  format: 'der',
  type: 'pkcs8',
});

/**
 * Pure verification (no filesystem). Returns { ok, payload?, error? }.
 * // future: remoteCheck(lic) can revoke by id without changing this format
 */
const verifyLicenseKey = (rawKey, { now = Date.now(), publicKeyDerB64 } = {}) => {
  if (typeof rawKey !== 'string') {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }
  const key = rawKey.trim().replace(/\s+/g, '');
  const parts = key.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }

  let payloadBytes;
  let signature;
  try {
    payloadBytes = base64UrlDecode(parts[0]);
    signature = base64UrlDecode(parts[1]);
  } catch {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }

  let validSig = false;
  try {
    const pub = publicKeyDerB64
      ? publicKeyFromDerB64(publicKeyDerB64)
      : getPublicKey();
    validSig = verify(null, payloadBytes, pub, signature);
  } catch {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }
  if (!validSig) {
    return { ok: false, error: 'Handtekening ongeldig' };
  }

  let payload;
  try {
    payload = JSON.parse(payloadBytes.toString('utf8'));
  } catch {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }
  if (payload.v !== LICENSE_VERSION) {
    return { ok: false, error: 'Onbekende licentieversie' };
  }
  if (payload.tier !== PAID_TIER) {
    return { ok: false, error: 'Geen betaalde licentie' };
  }
  if (typeof payload.lic !== 'string' || !payload.lic.trim()) {
    return { ok: false, error: 'Ongeldige licentiesleutel' };
  }
  if (payload.exp != null) {
    const expMs = Number(payload.exp) * 1000;
    if (!Number.isFinite(expMs) || now >= expMs) {
      return { ok: false, error: 'Licentie verlopen' };
    }
  }

  return {
    ok: true,
    payload: {
      v: payload.v,
      lic: String(payload.lic).trim(),
      email: typeof payload.email === 'string' ? payload.email : null,
      tier: payload.tier,
      iat: Number.isFinite(Number(payload.iat)) ? Number(payload.iat) : null,
      exp: payload.exp == null ? null : Number(payload.exp),
    },
    key,
  };
};

const issueLicenseKey = (privateKeyDerB64, fields) => {
  const payload = {
    v: LICENSE_VERSION,
    lic: String(fields.lic).trim(),
    email: fields.email ? String(fields.email).trim() : null,
    tier: PAID_TIER,
    iat: fields.iat != null ? Number(fields.iat) : Math.floor(Date.now() / 1000),
    exp: fields.exp == null ? null : Number(fields.exp),
  };
  const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8');
  const privateKey = getPrivateKeyFromDerB64(privateKeyDerB64);
  const signature = sign(null, payloadBytes, privateKey);
  return `${base64UrlEncode(payloadBytes)}.${base64UrlEncode(signature)}`;
};

module.exports = {
  LICENSE_VERSION,
  PAID_TIER,
  base64UrlEncode,
  base64UrlDecode,
  verifyLicenseKey,
  issueLicenseKey,
  getPrivateKeyFromDerB64,
};
