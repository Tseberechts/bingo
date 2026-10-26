const path = require('path');
const fs = require('fs');
const { toFileUrl } = require('./paths');

const ARKASTRO_SPONSOR_ID = 'arkastro';
const ARKASTRO_CAPTION = 'Gedroomd en gecreerd door';
const ARKASTRO_DISPLAY_NAME = 'Arkastro.be';
const ARKASTRO_LOGO_FILENAME = 'ARKASTRO_LOGO-full-color.svg';

const getDevBrandPath = () => path.join(__dirname, '..', 'build', ARKASTRO_LOGO_FILENAME);

/**
 * Packaged full-color Arkastro mark used as the permanent first sponsor.
 * Dev: repo build/ asset. Packaged: electron-builder extraResources (build/ is
 * buildResources and is not packed into the app unless listed explicitly).
 */
const getArkastroBrandPath = () => {
  if (typeof process.resourcesPath === 'string' && process.resourcesPath) {
    const packaged = path.join(process.resourcesPath, ARKASTRO_LOGO_FILENAME);
    if (fs.existsSync(packaged)) return packaged;
  }
  return getDevBrandPath();
};

const getArkastroBrandFileUrl = () => toFileUrl(getArkastroBrandPath()) || getArkastroBrandPath();

const lockedArkastroSponsorForRenderer = () => ({
  id: ARKASTRO_SPONSOR_ID,
  name: ARKASTRO_DISPLAY_NAME,
  logo: getArkastroBrandFileUrl(),
  locked: true,
  caption: ARKASTRO_CAPTION,
});

module.exports = {
  ARKASTRO_SPONSOR_ID,
  ARKASTRO_CAPTION,
  ARKASTRO_DISPLAY_NAME,
  getArkastroBrandPath,
  getArkastroBrandFileUrl,
  lockedArkastroSponsorForRenderer,
};
