const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { verifyLicenseKey } = require('./license-crypto');

let licensePath;
let cached = { key: null, payload: null };

const initializeLicense = () => {
  licensePath = path.join(app.getPath('userData'), 'license.json');
  loadLicense();
};

const loadLicense = () => {
  cached = { key: null, payload: null };
  try {
    if (!licensePath) {
      licensePath = path.join(app.getPath('userData'), 'license.json');
    }
    if (!fs.existsSync(licensePath)) return cached;
    const raw = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const key = typeof raw?.key === 'string' ? raw.key : null;
    if (!key) return cached;
    const result = verifyLicenseKey(key);
    if (!result.ok) {
      // Stale/invalid stored key — treat as free; leave file for debugging until deactivate
      return cached;
    }
    cached = { key: result.key, payload: result.payload };
  } catch (error) {
    console.error('Failed to load license:', error);
  }
  return cached;
};

const persistLicense = (key) => {
  if (!licensePath) {
    licensePath = path.join(app.getPath('userData'), 'license.json');
  }
  fs.writeFileSync(licensePath, JSON.stringify({ key, activatedAt: new Date().toISOString() }, null, 2));
};

const activateLicense = (rawKey) => {
  const result = verifyLicenseKey(rawKey);
  if (!result.ok) return { ok: false, error: result.error };
  try {
    persistLicense(result.key);
    cached = { key: result.key, payload: result.payload };
    return { ok: true, status: getLicenseStatus() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

const deactivateLicense = () => {
  try {
    if (!licensePath) {
      licensePath = path.join(app.getPath('userData'), 'license.json');
    }
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath);
    }
    cached = { key: null, payload: null };
    return { ok: true, status: getLicenseStatus() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

const isPaid = () => {
  if (!cached.payload) loadLicense();
  if (!cached.key) return false;
  const result = verifyLicenseKey(cached.key);
  if (!result.ok) {
    cached = { key: null, payload: null };
    return false;
  }
  cached.payload = result.payload;
  return true;
};

const getLicenseStatus = () => {
  const paid = isPaid();
  const payload = paid ? cached.payload : null;
  return {
    tier: paid ? 'paid' : 'free',
    isPaid: paid,
    lic: payload?.lic ?? null,
    email: payload?.email ?? null,
    iat: payload?.iat ?? null,
    exp: payload?.exp ?? null,
  };
};

module.exports = {
  initializeLicense,
  loadLicense,
  activateLicense,
  deactivateLicense,
  isPaid,
  getLicenseStatus,
  verifyLicenseKey,
};
