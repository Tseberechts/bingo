const api = window.bingo;

const gameTitleInput = document.getElementById('gameTitle');
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

const inGameDisplayModeSelect = document.getElementById('inGameDisplayMode');
const pauseDisplayModeSelect = document.getElementById('pauseDisplayMode');
const mainLogoInput = document.getElementById('mainLogo');
const mainLogoPreview = document.getElementById('mainLogoPreview');
const noLogoText = document.getElementById('noLogoText');
const deleteMainLogoButton = document.getElementById('deleteMainLogo');
const mainLogoLabel = document.querySelector('label[for="mainLogo"]');

const sponsorList = document.getElementById('sponsorList');
const sponsorNameInput = document.getElementById('sponsorName');
const sponsorLogoInput = document.getElementById('sponsorLogo');
const sponsorLogoLabel = document.querySelector('label[for="sponsorLogo"]');
const sponsorLogoPreview = document.getElementById('sponsorLogoPreview');
const addSponsorButton = document.getElementById('addSponsorButton');

const toast = document.getElementById('toast');
const displayWarning = document.getElementById('displayWarning');
const freeBrandingNote = document.getElementById('freeBrandingNote');
const freeSponsorsNote = document.getElementById('freeSponsorsNote');
const addSponsorForm = document.getElementById('addSponsorForm');
const brandColorsSection = document.getElementById('brandColorsSection');
const mainLogoUploadRow = document.getElementById('mainLogoUploadRow');
const mainLogoDeleteRow = document.getElementById('mainLogoDeleteRow');
const brandAccentInput = document.getElementById('brandAccent');
const brandBgInput = document.getElementById('brandBg');
const brandBgActiveInput = document.getElementById('brandBgActive');
const resetBrandColorsButton = document.getElementById('resetBrandColors');
const licenseTierLabel = document.getElementById('licenseTierLabel');
const licenseDetails = document.getElementById('licenseDetails');
const licenseIdLine = document.getElementById('licenseIdLine');
const licenseEmailLine = document.getElementById('licenseEmailLine');
const licenseExpLine = document.getElementById('licenseExpLine');
const licenseActivateForm = document.getElementById('licenseActivateForm');
const licenseDeactivateRow = document.getElementById('licenseDeactivateRow');
const licenseKeyInput = document.getElementById('licenseKeyInput');
const activateLicenseButton = document.getElementById('activateLicenseButton');
const deactivateLicenseButton = document.getElementById('deactivateLicenseButton');

let currentSettings = {
  mainLogoPath: null,
  sponsors: [],
};
let entitlements = { isPaid: false };

const showToast = (message = 'Instellingen opgeslagen!', isError = false) => {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

const updateDisplayWarning = () => {
  if (!displayWarning) return;
  const warnings = [];
  const modes = [inGameDisplayModeSelect.value, pauseDisplayModeSelect.value];
  if (entitlements.customMainLogo && modes.includes('logo') && !currentSettings.mainLogoPath) {
    warnings.push('Je koos “Hoofdlogo tonen”, maar er is nog geen logo geüpload.');
  }
  if (entitlements.customSponsors && modes.includes('sponsors') && !(currentSettings.sponsors || []).length) {
    warnings.push('Je koos “Sponsors tonen”, maar er zijn nog geen sponsors toegevoegd.');
  }
  if (!warnings.length) {
    displayWarning.classList.add('hidden');
    displayWarning.textContent = '';
    return;
  }
  displayWarning.textContent = warnings.join(' ');
  displayWarning.classList.remove('hidden');
};

const updateMainLogoUI = (logoPath, fileName) => {
  if (logoPath) {
    mainLogoPreview.src = logoPath;
    mainLogoPreview.classList.remove('hidden');
    noLogoText.classList.add('hidden');
    if (entitlements.customMainLogo && !currentSettings.mainLogoLocked) {
      deleteMainLogoButton.classList.remove('hidden');
    } else {
      deleteMainLogoButton.classList.add('hidden');
    }
    mainLogoLabel.textContent = fileName || 'Logo geüpload';
  } else {
    mainLogoPreview.classList.add('hidden');
    noLogoText.classList.remove('hidden');
    deleteMainLogoButton.classList.add('hidden');
    mainLogoInput.value = '';
    mainLogoLabel.textContent = 'Kies bestand...';
  }
};

const applyEntitlementUi = () => {
  const paid = Boolean(entitlements.isPaid);
  if (freeBrandingNote) freeBrandingNote.classList.toggle('hidden', paid);
  if (freeSponsorsNote) freeSponsorsNote.classList.toggle('hidden', paid);
  if (addSponsorForm) addSponsorForm.classList.toggle('hidden', !paid);
  if (brandColorsSection) brandColorsSection.classList.toggle('hidden', !paid);
  if (mainLogoUploadRow) mainLogoUploadRow.classList.toggle('hidden', !paid);
  if (mainLogoDeleteRow) mainLogoDeleteRow.classList.toggle('hidden', !paid);
};

const renderLicenseStatus = (status) => {
  const paid = Boolean(status?.isPaid);
  if (licenseTierLabel) {
    licenseTierLabel.textContent = paid ? 'Betaald' : 'Gratis';
  }
  if (licenseDetails) {
    licenseDetails.classList.toggle('hidden', !paid);
  }
  if (paid) {
    if (licenseIdLine) licenseIdLine.textContent = status.lic ? `Licentie: ${status.lic}` : '';
    if (licenseEmailLine) {
      licenseEmailLine.textContent = status.email ? `E-mail: ${status.email}` : '';
      licenseEmailLine.classList.toggle('hidden', !status.email);
    }
    if (licenseExpLine) {
      if (status.exp) {
        const expDate = new Date(status.exp * 1000);
        licenseExpLine.textContent = `Geldig tot: ${expDate.toLocaleDateString('nl-BE')}`;
        licenseExpLine.classList.remove('hidden');
      } else {
        licenseExpLine.textContent = 'Geldig tot: onbeperkt';
        licenseExpLine.classList.remove('hidden');
      }
    }
  }
  if (licenseActivateForm) licenseActivateForm.classList.toggle('hidden', paid);
  if (licenseDeactivateRow) licenseDeactivateRow.classList.toggle('hidden', !paid);
};

const syncBrandColorInputs = (colors) => {
  const c = colors || { accent: '#f39c12', bg: '#1f2937', bgActive: '#4a4e69' };
  if (brandAccentInput) brandAccentInput.value = c.accent || '#f39c12';
  if (brandBgInput) brandBgInput.value = c.bg || '#1f2937';
  if (brandBgActiveInput) brandBgActiveInput.value = c.bgActive || '#4a4e69';
};

const saveBrandColorsFromInputs = () => {
  if (!entitlements.customBrandColors) return;
  const brandColors = {
    accent: brandAccentInput.value,
    bg: brandBgInput.value,
    bgActive: brandBgActiveInput.value,
  };
  api.saveSettings({ brandColors });
  currentSettings.brandColors = brandColors;
  currentSettings.effectiveBrandColors = brandColors;
  if (window.applyBrandColors) window.applyBrandColors(brandColors);
  showToast('Merkkleuren opgeslagen');
};

const saveSetting = (key, value) => {
  api.saveSettings({ [key]: value });
  showToast();
};

const setupAutoSave = () => {
  gameTitleInput.addEventListener('change', () => {
    const title = gameTitleInput.value.trim();
    if (!title) {
      showToast('Titel mag niet leeg zijn', true);
      return;
    }
    saveSetting('gameTitle', title);
  });
  inGameDisplayModeSelect.addEventListener('change', () => {
    saveSetting('inGameDisplayMode', inGameDisplayModeSelect.value);
    updateDisplayWarning();
  });
  pauseDisplayModeSelect.addEventListener('change', () => {
    saveSetting('pauseDisplayMode', pauseDisplayModeSelect.value);
    updateDisplayWarning();
  });

  mainLogoInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const result = await api.uploadMainLogo({ buffer, originalName: file.name });
    if (!result?.ok) {
      showToast(result?.error || 'Upload mislukt', true);
      return;
    }
    currentSettings.mainLogoPath = result.path;
    updateMainLogoUI(result.path, result.fileName);
    updateDisplayWarning();
    showToast('Hoofdlogo geüpload!');
  });
};

const activateTab = (tabId) => {
  const target = [...tabs].find((t) => t.dataset.tab === tabId) || tabs[0];
  if (!target) return;
  tabs.forEach((t) => t.classList.remove('active'));
  tabContents.forEach((c) => c.classList.add('hidden'));
  target.classList.add('active');
  const panel = document.getElementById(target.dataset.tab);
  if (panel) panel.classList.remove('hidden');
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
  });
});

const setupFileInput = (input, label, preview) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      label.textContent = file.name;
      if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    }
  });
};
setupFileInput(sponsorLogoInput, sponsorLogoLabel, sponsorLogoPreview);

const renderSponsors = (sponsors) => {
  sponsorList.replaceChildren();
  if (!sponsors || sponsors.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-gray-400 col-span-full';
    empty.textContent = 'Geen sponsors gevonden.';
    sponsorList.appendChild(empty);
    return;
  }

  sponsors.forEach((sponsor) => {
    const sponsorEl = document.createElement('div');
    sponsorEl.className = 'sponsor-item';

    const img = document.createElement('img');
    img.src = sponsor.logo;
    img.alt = sponsor.name;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = sponsor.name;

    sponsorEl.appendChild(img);
    sponsorEl.appendChild(name);

    if (entitlements.customSponsors && !sponsor.locked) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-sponsor-btn';
      deleteBtn.dataset.id = String(sponsor.id);
      deleteBtn.setAttribute('aria-label', 'Verwijder sponsor');
      deleteBtn.textContent = '×';
      sponsorEl.appendChild(deleteBtn);
    }

    sponsorList.appendChild(sponsorEl);
  });
};

addSponsorButton.addEventListener('click', async () => {
  const name = sponsorNameInput.value.trim();
  const logoFile = sponsorLogoInput.files[0];
  if (!name || !logoFile) {
    showToast('Vul een naam in en selecteer een logo.', true);
    return;
  }

  const buffer = await logoFile.arrayBuffer();
  const result = await api.addSponsor({ name, buffer, originalName: logoFile.name });
  if (!result?.ok) {
    showToast(result?.error || 'Sponsor toevoegen mislukt', true);
    return;
  }

  const settings = await api.getSettings();
  currentSettings = settings;
  renderSponsors(settings.sponsors);
  updateDisplayWarning();

  sponsorNameInput.value = '';
  sponsorLogoInput.value = '';
  sponsorLogoLabel.textContent = 'Kies bestand...';
  sponsorLogoPreview.classList.add('hidden');
  showToast('Sponsor toegevoegd!');
});

sponsorList.addEventListener('click', async (e) => {
  const deleteButton = e.target.closest('.delete-sponsor-btn');
  if (deleteButton && deleteButton.dataset.id) {
    const sponsorId = parseInt(deleteButton.dataset.id, 10);
    await api.deleteSponsor(sponsorId);
    const settings = await api.getSettings();
    currentSettings = settings;
    renderSponsors(settings.sponsors);
    updateDisplayWarning();
    showToast('Sponsor verwijderd!');
  }
});

deleteMainLogoButton.addEventListener('click', async () => {
  await api.deleteMainLogo();
  currentSettings.mainLogoPath = null;
  updateMainLogoUI(null);
  updateDisplayWarning();
  showToast('Hoofdlogo verwijderd!');
});

const formatBuiltAt = (iso) => {
  if (!iso) return 'Ontwikkelversie';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Ontwikkelversie';
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

const updateStatusText = document.getElementById('updateStatusText');
const checkUpdateButton = document.getElementById('checkUpdateButton');
const downloadUpdateButton = document.getElementById('downloadUpdateButton');
const installUpdateButton = document.getElementById('installUpdateButton');

const describeUpdateStatus = (status) => {
  if (!status) return '—';
  switch (status.state) {
    case 'checking':
      return 'Bezig met controleren…';
    case 'available':
      return status.version
        ? `Update beschikbaar: v${status.version}`
        : 'Er is een update beschikbaar.';
    case 'not-available':
      return 'Je hebt de nieuwste versie.';
    case 'downloading':
      return typeof status.progress === 'number'
        ? `Downloaden… ${status.progress}%`
        : 'Downloaden…';
    case 'downloaded':
      return status.version
        ? `v${status.version} is gedownload. Herstart om te installeren.`
        : 'Update is gedownload. Herstart om te installeren.';
    case 'error':
      return status.error || 'Updatecontrole mislukt.';
    default:
      return 'Nog niet gecontroleerd.';
  }
};

const renderUpdateStatus = (status) => {
  if (updateStatusText) {
    updateStatusText.textContent = describeUpdateStatus(status);
  }
  const state = status?.state;
  if (downloadUpdateButton) {
    downloadUpdateButton.classList.toggle('hidden', state !== 'available');
  }
  if (installUpdateButton) {
    installUpdateButton.classList.toggle('hidden', state !== 'downloaded');
  }
  if (checkUpdateButton) {
    checkUpdateButton.disabled = state === 'checking' || state === 'downloading';
  }
};

const loadAppInfo = async () => {
  const info = await api.getAppInfo();
  const versionEl = document.getElementById('appVersion');
  const builtAtEl = document.getElementById('appBuiltAt');
  const copyrightEl = document.getElementById('appCopyright');
  if (versionEl) versionEl.textContent = info?.version || '—';
  if (builtAtEl) builtAtEl.textContent = formatBuiltAt(info?.builtAt);
  if (copyrightEl) {
    const year = new Date().getFullYear();
    copyrightEl.textContent = [
      `© ${year} Arkastro BV`,
      'BE1036200718',
      'Rozenstraat 5, 2580 Putte',
      'info@arkastro.be',
      'Alle rechten voorbehouden.',
    ].join('\n');
  }
};

const setupUpdates = async () => {
  if (!api.getUpdateStatus) return;
  renderUpdateStatus(await api.getUpdateStatus());
  if (api.onUpdateStatus) {
    api.onUpdateStatus(renderUpdateStatus);
  }
  if (checkUpdateButton) {
    checkUpdateButton.addEventListener('click', async () => {
      const result = await api.checkForUpdates({ interactive: true });
      renderUpdateStatus(result?.status);
      if (result?.status?.state === 'error') {
        showToast(result.status.error || 'Updatecontrole mislukt', true);
      }
    });
  }
  if (downloadUpdateButton) {
    downloadUpdateButton.addEventListener('click', async () => {
      const result = await api.downloadUpdate();
      renderUpdateStatus(result?.status);
      if (!result?.ok) {
        showToast(result?.error || 'Download mislukt', true);
      } else if (result?.openedExternal) {
        showToast('Downloadpagina geopend');
      }
    });
  }
  if (installUpdateButton) {
    installUpdateButton.addEventListener('click', async () => {
      const result = await api.installUpdate();
      if (!result?.ok) showToast(result?.error || 'Installeren mislukt', true);
    });
  }
};

if (brandAccentInput) {
  brandAccentInput.addEventListener('change', saveBrandColorsFromInputs);
  brandBgInput.addEventListener('change', saveBrandColorsFromInputs);
  brandBgActiveInput.addEventListener('change', saveBrandColorsFromInputs);
}

if (resetBrandColorsButton) {
  resetBrandColorsButton.addEventListener('click', () => {
    if (!entitlements.customBrandColors) return;
    api.saveSettings({ brandColors: null });
    currentSettings.brandColors = null;
    const defaults = { accent: '#f39c12', bg: '#1f2937', bgActive: '#4a4e69' };
    currentSettings.effectiveBrandColors = defaults;
    syncBrandColorInputs(defaults);
    if (window.applyBrandColors) window.applyBrandColors(defaults);
    showToast('Standaardkleuren hersteld');
  });
}

if (activateLicenseButton) {
  activateLicenseButton.addEventListener('click', async () => {
    const key = licenseKeyInput?.value?.trim();
    if (!key) {
      showToast('Plak eerst een licentiesleutel', true);
      return;
    }
    const result = await api.activateLicense(key);
    if (!result?.ok) {
      showToast(result?.error || 'Activeren mislukt', true);
      return;
    }
    entitlements = await api.getEntitlements();
    renderLicenseStatus(result.status || entitlements.license);
    applyEntitlementUi();
    const settings = await api.getSettings();
    currentSettings = settings;
    updateMainLogoUI(settings.mainLogoPath, settings.mainLogoFileName);
    renderSponsors(settings.sponsors);
    syncBrandColorInputs(settings.effectiveBrandColors);
    if (window.applyBrandColors) window.applyBrandColors(settings.effectiveBrandColors);
    if (licenseKeyInput) licenseKeyInput.value = '';
    showToast('Licentie geactiveerd');
  });
}

if (deactivateLicenseButton) {
  deactivateLicenseButton.addEventListener('click', async () => {
    const confirmed = confirm('Licentie deactiveren? Je keert terug naar de gratis versie met Arkastro-branding.');
    if (!confirmed) return;
    const result = await api.deactivateLicense();
    if (!result?.ok) {
      showToast(result?.error || 'Deactiveren mislukt', true);
      return;
    }
    entitlements = await api.getEntitlements();
    renderLicenseStatus(result.status || entitlements.license);
    applyEntitlementUi();
    const settings = await api.getSettings();
    currentSettings = settings;
    updateMainLogoUI(settings.mainLogoPath, settings.mainLogoFileName);
    renderSponsors(settings.sponsors);
    syncBrandColorInputs(settings.effectiveBrandColors);
    if (window.applyBrandColors) window.applyBrandColors(settings.effectiveBrandColors);
    showToast('Terug op gratis versie');
  });
}

window.onload = async () => {
  entitlements = (await api.getEntitlements()) || { isPaid: false };
  const settings = await api.getSettings();
  currentSettings = settings;
  gameTitleInput.value = settings.gameTitle || 'BINGO';
  inGameDisplayModeSelect.value = settings.inGameDisplayMode;
  pauseDisplayModeSelect.value = settings.pauseDisplayMode;
  applyEntitlementUi();
  updateMainLogoUI(settings.mainLogoPath, settings.mainLogoFileName);
  renderSponsors(settings.sponsors);
  syncBrandColorInputs(settings.effectiveBrandColors);
  if (window.applyBrandColors) window.applyBrandColors(settings.effectiveBrandColors);
  renderLicenseStatus(entitlements.license || { isPaid: entitlements.isPaid });
  updateDisplayWarning();
  setupAutoSave();
  loadAppInfo();
  setupUpdates();
  const hashTab = window.location.hash.replace(/^#/, '');
  if (hashTab) activateTab(hashTab);
};
