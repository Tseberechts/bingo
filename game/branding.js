const path = require('path');
const { toFileUrl } = require('./paths');

const ARKASTRO_SPONSOR_ID = 'arkastro';

/** Packaged / repo path to the full-color Arkastro brand mark (free-tier lock). */
const getArkastroBrandPath = () => path.join(__dirname, '..', 'build', 'arkastro-brand.svg');

const getArkastroBrandFileUrl = () => toFileUrl(getArkastroBrandPath()) || getArkastroBrandPath();

const lockedArkastroSponsor = () => ({
  id: ARKASTRO_SPONSOR_ID,
  name: 'Arkastro',
  logo: getArkastroBrandPath(),
  locked: true,
});

const lockedArkastroSponsorForRenderer = () => ({
  id: ARKASTRO_SPONSOR_ID,
  name: 'Arkastro',
  logo: getArkastroBrandFileUrl(),
  locked: true,
});

const DEFAULT_BRAND_COLORS = Object.freeze({
  accent: '#f39c12',
  bg: '#1f2937',
  bgActive: '#4a4e69',
});

const HEX_COLOR_RE = /^#([0-9a-fA-F]{6})$/;

const isHexColor = (value) => typeof value === 'string' && HEX_COLOR_RE.test(value.trim());

const normalizeBrandColors = (input) => {
  if (!input || typeof input !== 'object') return null;
  const accent = isHexColor(input.accent) ? input.accent.trim().toLowerCase() : null;
  const bg = isHexColor(input.bg) ? input.bg.trim().toLowerCase() : null;
  const bgActive = isHexColor(input.bgActive) ? input.bgActive.trim().toLowerCase() : null;
  if (!accent && !bg && !bgActive) return null;
  return {
    accent: accent || DEFAULT_BRAND_COLORS.accent,
    bg: bg || DEFAULT_BRAND_COLORS.bg,
    bgActive: bgActive || DEFAULT_BRAND_COLORS.bgActive,
  };
};

module.exports = {
  ARKASTRO_SPONSOR_ID,
  getArkastroBrandPath,
  getArkastroBrandFileUrl,
  lockedArkastroSponsor,
  lockedArkastroSponsorForRenderer,
  DEFAULT_BRAND_COLORS,
  isHexColor,
  normalizeBrandColors,
};
