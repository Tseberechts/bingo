const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getSettings, saveSettings } = require('./settings');
const { isPaid } = require('./license');
const { ARKASTRO_SPONSOR_ID, getArkastroBrandPath } = require('./branding');

const DEMO_SPONSORS = [
  { name: 'Café De Hoek', file: 'sponsor-cafe.svg' },
  { name: 'Bakkerij Molen', file: 'sponsor-bakery.svg' },
  { name: 'Garage van Dijk', file: 'sponsor-garage.svg' },
];

/** Bundled assets live next to `game/` in both unpackaged and packaged builds. */
const getDemoDir = () => path.join(__dirname, '..', 'demo');

const clearManagedImages = () => {
  const settings = getSettings();
  if (settings.mainLogoPath && fs.existsSync(settings.mainLogoPath)) {
    fs.unlinkSync(settings.mainLogoPath);
  }
  for (const sponsor of settings.sponsors || []) {
    if (sponsor.id === ARKASTRO_SPONSOR_ID) continue;
    if (sponsor.logo && fs.existsSync(sponsor.logo)) {
      fs.unlinkSync(sponsor.logo);
    }
  }
};

/**
 * Free tier: demo title + Arkastro branding only (no white-label sample sponsors).
 * Paid: copies bundled demo logo/sponsors into userData.
 */
const applyDemoSetup = () => {
  try {
    clearManagedImages();

    if (!isPaid()) {
      const result = saveSettings({
        gameTitle: 'DEMO BINGO',
        mainLogoPath: null,
        inGameDisplayMode: 'sponsors',
        pauseDisplayMode: 'sponsors',
        sponsors: [],
        brandColors: null,
        setupStep: 4,
        setupComplete: true,
      });
      if (!result.ok) return result;
      return { ok: true };
    }

    const demoDir = getDemoDir();
    const mainLogoSource = path.join(demoDir, 'main-logo.svg');
    if (!fs.existsSync(mainLogoSource)) {
      return { ok: false, error: 'Demo-bestanden ontbreken' };
    }
    for (const sponsor of DEMO_SPONSORS) {
      if (!fs.existsSync(path.join(demoDir, sponsor.file))) {
        return { ok: false, error: 'Demo-bestanden ontbreken' };
      }
    }

    const logosDir = path.join(app.getPath('userData'), 'logos');
    const sponsorsDir = path.join(app.getPath('userData'), 'sponsors');
    fs.mkdirSync(logosDir, { recursive: true });
    fs.mkdirSync(sponsorsDir, { recursive: true });

    const stamp = Date.now();
    const mainLogoDest = path.join(logosDir, `main-logo-demo-${stamp}.svg`);
    fs.copyFileSync(mainLogoSource, mainLogoDest);

    const sponsors = DEMO_SPONSORS.map((sponsor, index) => {
      const dest = path.join(sponsorsDir, `demo-${stamp}-${index}-${sponsor.file}`);
      fs.copyFileSync(path.join(demoDir, sponsor.file), dest);
      return { id: stamp + index, name: sponsor.name, logo: dest };
    });

    const result = saveSettings({
      gameTitle: 'DEMO BINGO',
      mainLogoPath: mainLogoDest,
      inGameDisplayMode: 'sponsors',
      pauseDisplayMode: 'sponsors',
      sponsors,
      setupStep: 4,
      setupComplete: true,
    });

    if (!result.ok) return result;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

// Ensure brand asset exists for free-tier display sanity checks in tests/tools.
const assertBrandAssetPresent = () => fs.existsSync(getArkastroBrandPath());

module.exports = {
  applyDemoSetup,
  assertBrandAssetPresent,
};
