const path = require('path');
const { pathToFileURL } = require('url');

const SAVE_FILE_PATTERN = /^game-[\w.-]+\.json$/;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Returns a safe basename for save files, or null if invalid / path traversal.
 */
const sanitizeSaveFileName = (fileName) => {
  if (typeof fileName !== 'string' || !fileName.trim()) return null;
  if (fileName.includes('..') || /[/\\]/.test(fileName)) return null;
  const base = path.basename(fileName);
  if (base !== fileName) return null;
  if (!SAVE_FILE_PATTERN.test(base)) return null;
  return base;
};

const sanitizeImageFileName = (originalName) => {
  if (typeof originalName !== 'string' || !originalName.trim()) return null;
  const base = path.basename(originalName);
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) return null;
  const stem = path.basename(base, path.extname(base)).replace(/[^\w.-]+/g, '_').slice(0, 80) || 'image';
  return `${stem}${ext}`;
};

const isAllowedImageBuffer = (buffer) => {
  if (!buffer || typeof buffer.length !== 'number') return false;
  return buffer.length > 0 && buffer.length <= MAX_IMAGE_BYTES;
};

const toFileUrl = (fsPath) => {
  if (!fsPath || typeof fsPath !== 'string') return null;
  try {
    return pathToFileURL(fsPath).href;
  } catch {
    return null;
  }
};

/**
 * True when `child` resolves to a path inside `parent` (or is parent itself).
 * Prefer this over String#startsWith — on Windows drive-letter casing and
 * separator differences make prefix checks fail and silently skip saves.
 */
const isPathInside = (parent, child) => {
  if (!parent || !child) return false;
  const resolvedParent = path.resolve(parent);
  const resolvedChild = path.resolve(child);
  const rel = path.relative(resolvedParent, resolvedChild);
  if (!rel) return true;
  return !rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel);
};

module.exports = {
  SAVE_FILE_PATTERN,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  sanitizeSaveFileName,
  sanitizeImageFileName,
  isAllowedImageBuffer,
  toFileUrl,
  isPathInside,
};
