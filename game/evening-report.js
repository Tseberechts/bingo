const fs = require('fs');
const path = require('path');
const { app, dialog, BrowserWindow } = require('electron');
const { getSettings } = require('./settings');
const { gameState } = require('./state');
const { resolveSavePath } = require('./storage');
const { buildEveningReportHtml, escapeHtml } = require('./evening-report-html');

const loadReportState = (fileName) => {
  if (fileName) {
    const resolved = resolveSavePath(fileName);
    if (!resolved || !fs.existsSync(resolved.savePath)) {
      return { ok: false, error: 'Opgeslagen spel niet gevonden' };
    }
    try {
      const data = JSON.parse(fs.readFileSync(resolved.savePath, 'utf8'));
      return { ok: true, state: data, fileName: resolved.safeName };
    } catch {
      return { ok: false, error: 'Kon opgeslagen spel niet lezen' };
    }
  }
  return {
    ok: true,
    state: { ...gameState },
    fileName: null,
  };
};

const exportEveningReport = async ({ fileName, parentWindow } = {}) => {
  const loaded = loadReportState(fileName);
  if (!loaded.ok) return loaded;

  const html = buildEveningReportHtml({
    state: loaded.state,
    settings: getSettings(),
  });

  const defaultName = `bingo-avondrapport-${new Date().toISOString().slice(0, 10)}.html`;
  const win = parentWindow && !parentWindow.isDestroyed()
    ? parentWindow
    : BrowserWindow.getFocusedWindow();

  const { canceled, filePath } = await dialog.showSaveDialog(win || undefined, {
    title: 'Avondrapport exporteren',
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'HTML', extensions: ['html'] }],
  });

  if (canceled || !filePath) {
    return { ok: false, cancelled: true };
  }

  try {
    fs.writeFileSync(filePath, html, 'utf8');
    return { ok: true, path: filePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

module.exports = {
  escapeHtml,
  buildEveningReportHtml,
  exportEveningReport,
};
