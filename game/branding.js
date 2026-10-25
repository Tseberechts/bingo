const path = require('path');
const { toFileUrl } = require('./paths');

const ARKASTRO_SPONSOR_ID = 'arkastro';
const ARKASTRO_CAPTION = 'Gedroomd en gecreerd door';
const ARKASTRO_DISPLAY_NAME = 'Arkastro.be';

/** Packaged full-color Arkastro mark used as the permanent first sponsor. */
const getArkastroBrandPath = () => path.join(__dirname, '..', 'build', 'ARKASTRO_LOGO-full-color.svg');

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
