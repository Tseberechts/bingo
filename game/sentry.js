/**
 * Sentry usage + error reporting for packaged Bingo installs.
 * Enable unpackaged with BINGO_SENTRY=1 (e.g. verification).
 *
 * Release Health: MainProcessSession (sendOnCreate) + anonymous install id.
 * @see https://docs.sentry.io/product/releases/health/
 * @see https://docs.sentry.io/platforms/javascript/guides/electron/configuration/releases/
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const SENTRY_DSN = 'https://9e6c42e86bf44a116d3a2aa279e0a31f@o4512004612620288.ingest.de.sentry.io/4512313044238416';
const INSTALL_ID_FILE = 'sentry-install-id';

let enabled = false;

const shouldEnableSentry = (app) => (
  Boolean(app.isPackaged) || process.env.BINGO_SENTRY === '1'
);

/**
 * Stable anonymous install id (UUID) for crash-free users / adoption.
 * Not tied to IP or personal identity.
 * @param {import('electron').App} app
 * @returns {string}
 */
const getOrCreateInstallId = (app) => {
  const idPath = path.join(app.getPath('userData'), INSTALL_ID_FILE);
  try {
    if (fs.existsSync(idPath)) {
      const existing = fs.readFileSync(idPath, 'utf8').trim();
      if (existing) return existing;
    }
  } catch {
    // fall through and create
  }
  const id = randomUUID();
  try {
    fs.writeFileSync(idPath, id, 'utf8');
  } catch (error) {
    console.error('Failed to persist Sentry install id:', error);
  }
  return id;
};

/**
 * Initialize Sentry in the Electron main process. Call as early as possible.
 * Release / environment default to Bingo@version and packaged→production.
 * @returns {boolean} whether Sentry was enabled
 */
const initializeSentryMain = () => {
  const { app } = require('electron');
  if (!shouldEnableSentry(app)) {
    enabled = false;
    return false;
  }

  const Sentry = require('@sentry/electron/main');
  const installId = getOrCreateInstallId(app);
  // Stable across packaged/unpackaged (avoid Electron/productName drift)
  const release = `bingo@${app.getVersion()}`;

  Sentry.init({
    dsn: SENTRY_DSN,
    release,
    environment: app.isPackaged ? 'production' : 'development',
    dataCollection: { userInfo: false },
    tracesSampleRate: 0,
    initialScope: {
      user: { id: installId },
    },
    integrations: (defaults) => [
      ...defaults.filter((i) => i.name !== 'MainProcessSession'),
      // Send session at start so Releases shows usage without waiting for quit
      Sentry.mainProcessSessionIntegration({ sendOnCreate: true }),
    ],
  });

  enabled = true;
  process.env.BINGO_SENTRY_ACTIVE = '1';
  return true;
};

const isSentryEnabled = () => enabled;

/**
 * Capture a verification exception (main process). No-op if Sentry is off.
 * @param {string} [message]
 */
const captureVerificationError = (message = 'Bingo Sentry verification error') => {
  if (!enabled) return null;
  const Sentry = require('@sentry/electron/main');
  return Sentry.captureException(new Error(message));
};

module.exports = {
  SENTRY_DSN,
  initializeSentryMain,
  isSentryEnabled,
  captureVerificationError,
};
