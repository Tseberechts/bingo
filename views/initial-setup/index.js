const api = window.bingo;

const TOTAL_STEPS = 5;
const DISPLAY_LABELS = {
  hide: 'Verbergen',
  sponsors: 'Sponsors',
  logo: 'Hoofdlogo',
};

const stepLabel = document.getElementById('stepLabel');
const stepDots = document.getElementById('stepDots');
const wizardSteps = document.querySelectorAll('.wizard-step');
const wizardError = document.getElementById('wizardError');

const gameTitleInput = document.getElementById('gameTitle');
const titleError = document.getElementById('titleError');
const demoButton = document.getElementById('demoButton');

const mainLogoInput = document.getElementById('mainLogo');
const mainLogoLabel = document.getElementById('mainLogoLabel');
const mainLogoPreview = document.getElementById('mainLogoPreview');
const noLogoText = document.getElementById('noLogoText');
const deleteMainLogoButton = document.getElementById('deleteMainLogo');
const logoError = document.getElementById('logoError');

const inGameDisplayModeSelect = document.getElementById('inGameDisplayMode');
const pauseDisplayModeSelect = document.getElementById('pauseDisplayMode');

const sponsorList = document.getElementById('sponsorList');
const sponsorNameInput = document.getElementById('sponsorName');
const sponsorLogoInput = document.getElementById('sponsorLogo');
const sponsorLogoLabel = document.getElementById('sponsorLogoLabel');
const sponsorLogoPreview = document.getElementById('sponsorLogoPreview');
const addSponsorButton = document.getElementById('addSponsorButton');
const sponsorError = document.getElementById('sponsorError');

const summaryList = document.getElementById('summaryList');

const backButton = document.getElementById('backButton');
const nextButton = document.getElementById('nextButton');
const laterButton = document.getElementById('laterButton');

let currentStep = 0;
const DEFAULT_TITLE = 'BINGO';

let settings = {
  gameTitle: DEFAULT_TITLE,
  mainLogoPath: null,
  mainLogoFileName: null,
  inGameDisplayMode: 'hide',
  pauseDisplayMode: 'hide',
  sponsors: [],
  setupStep: 0,
  setupComplete: false,
};

const showError = (el, message) => {
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
};

const clearErrors = () => {
  showError(titleError, '');
  showError(logoError, '');
  showError(sponsorError, '');
  showError(wizardError, '');
};

const hasSavedProgress = () => {
  const titleChanged = settings.gameTitle && settings.gameTitle !== DEFAULT_TITLE;
  const hasLogo = Boolean(settings.mainLogoPath);
  const hasSponsors = Array.isArray(settings.sponsors) && settings.sponsors.length > 0;
  const displayChanged = settings.inGameDisplayMode !== 'hide' || settings.pauseDisplayMode !== 'hide';
  const stepped = Number(settings.setupStep) > 0 || currentStep > 0;
  return titleChanged || hasLogo || hasSponsors || displayChanged || stepped;
};

const displayWarning = document.getElementById('displayWarning');

const updateDisplayWarning = () => {
  if (!displayWarning) return;
  const warnings = [];
  const modes = [inGameDisplayModeSelect.value, pauseDisplayModeSelect.value];
  if (modes.includes('logo') && !settings.mainLogoPath) {
    warnings.push('Je koos Hoofdlogo, maar er is nog geen logo geüpload.');
  }
  if (modes.includes('sponsors') && !(settings.sponsors || []).length) {
    warnings.push('Je koos Sponsors, maar er zijn nog geen sponsors toegevoegd.');
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
    deleteMainLogoButton.classList.remove('hidden');
    mainLogoLabel.textContent = fileName || 'Logo geüpload';
  } else {
    mainLogoPreview.classList.add('hidden');
    noLogoText.classList.remove('hidden');
    deleteMainLogoButton.classList.add('hidden');
    mainLogoInput.value = '';
    mainLogoLabel.textContent = 'Kies bestand...';
  }
};

const renderSponsors = (sponsors) => {
  sponsorList.replaceChildren();
  if (!sponsors || sponsors.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-gray-400 col-span-full';
    empty.textContent = 'Nog geen sponsors toegevoegd.';
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

    const deleteBtn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    deleteBtn.setAttribute('class', 'delete-sponsor-btn');
    deleteBtn.setAttribute('data-id', String(sponsor.id));
    deleteBtn.setAttribute('fill', 'none');
    deleteBtn.setAttribute('stroke', 'currentColor');
    deleteBtn.setAttribute('viewBox', '0 0 24 24');
    deleteBtn.setAttribute('aria-label', 'Verwijder sponsor');
    deleteBtn.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

    sponsorEl.appendChild(img);
    sponsorEl.appendChild(name);
    sponsorEl.appendChild(deleteBtn);
    sponsorList.appendChild(sponsorEl);
  });
};

const renderSummary = () => {
  summaryList.replaceChildren();
  const rows = [
    ['Titel', settings.gameTitle || '—'],
    ['Hoofdlogo', settings.mainLogoPath ? (settings.mainLogoFileName || 'Ingesteld') : 'Geen'],
    ['Spelscherm', DISPLAY_LABELS[settings.inGameDisplayMode] || settings.inGameDisplayMode],
    ['Pauzescherm', DISPLAY_LABELS[settings.pauseDisplayMode] || settings.pauseDisplayMode],
    ['Sponsors', `${(settings.sponsors || []).length} sponsor(s)`],
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.appendChild(dt);
    row.appendChild(dd);
    summaryList.appendChild(row);
  });
};

const renderStepDots = () => {
  stepDots.replaceChildren();
  for (let i = 0; i < TOTAL_STEPS; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'step-dot';
    if (i === currentStep) dot.classList.add('active');
    else if (i < currentStep) dot.classList.add('done');
    stepDots.appendChild(dot);
  }
};

const showStep = (step) => {
  currentStep = Math.min(Math.max(step, 0), TOTAL_STEPS - 1);
  wizardSteps.forEach((section) => {
    const stepIndex = Number(section.dataset.step);
    section.classList.toggle('hidden', stepIndex !== currentStep);
  });

  stepLabel.textContent = `Stap ${currentStep + 1} van ${TOTAL_STEPS}`;
  renderStepDots();

  backButton.classList.toggle('hidden', currentStep === 0);
  nextButton.textContent = currentStep === TOTAL_STEPS - 1 ? 'Aan de slag' : 'Volgende';

  if (currentStep === TOTAL_STEPS - 1) renderSummary();
  clearErrors();
};

const applySettingsToForm = (nextSettings) => {
  settings = { ...settings, ...nextSettings };
  gameTitleInput.value = settings.gameTitle || DEFAULT_TITLE;
  inGameDisplayModeSelect.value = settings.inGameDisplayMode || 'hide';
  pauseDisplayModeSelect.value = settings.pauseDisplayMode || 'hide';
  updateMainLogoUI(settings.mainLogoPath, settings.mainLogoFileName);
  renderSponsors(settings.sponsors || []);
  updateDisplayWarning();
};

const saveTitleProgress = async (setupStep) => {
  const title = gameTitleInput.value.trim();
  if (!title) {
    showError(titleError, 'Vul een titel in voor je bingo.');
    gameTitleInput.focus();
    return null;
  }
  const result = await api.saveSetupProgress({ gameTitle: title, setupStep });
  if (!result?.ok) {
    showError(wizardError, result?.error || 'Opslaan mislukt');
    return null;
  }
  applySettingsToForm(result.settings);
  return result.settings;
};

const saveDisplayProgress = async (setupStep) => {
  const result = await api.saveSetupProgress({
    inGameDisplayMode: inGameDisplayModeSelect.value,
    pauseDisplayMode: pauseDisplayModeSelect.value,
    setupStep,
  });
  if (!result?.ok) {
    showError(wizardError, result?.error || 'Opslaan mislukt');
    return null;
  }
  applySettingsToForm(result.settings);
  return result.settings;
};

const saveStepOnly = async (setupStep) => {
  const result = await api.saveSetupProgress({ setupStep });
  if (!result?.ok) {
    showError(wizardError, result?.error || 'Opslaan mislukt');
    return null;
  }
  applySettingsToForm(result.settings);
  return result.settings;
};

const persistLeavingStep = async (targetStep) => {
  if (currentStep === 0) return saveTitleProgress(targetStep);
  if (currentStep === 2) return saveDisplayProgress(targetStep);
  return saveStepOnly(targetStep);
};

const goToStep = async (targetStep) => {
  clearErrors();
  const saved = await persistLeavingStep(targetStep);
  if (!saved) return;
  showStep(targetStep);
};

nextButton.addEventListener('click', async () => {
  if (currentStep === TOTAL_STEPS - 1) {
    clearErrors();
    const result = await api.completeSetup();
    if (!result?.ok) {
      showError(wizardError, result?.error || 'Afronden mislukt');
    }
    return;
  }
  await goToStep(currentStep + 1);
});

backButton.addEventListener('click', async () => {
  if (currentStep === 0) return;
  await goToStep(currentStep - 1);
});

laterButton.addEventListener('click', async () => {
  clearErrors();
  const payload = { setupStep: currentStep };

  if (currentStep === 0) {
    const title = gameTitleInput.value.trim();
    payload.gameTitle = title || DEFAULT_TITLE;
  }
  if (currentStep === 2) {
    payload.inGameDisplayMode = inGameDisplayModeSelect.value;
    payload.pauseDisplayMode = pauseDisplayModeSelect.value;
  }

  const result = await api.continueSetupLater(payload);
  if (!result?.ok) {
    showError(wizardError, result?.error || 'Opslaan mislukt');
  }
});

demoButton.addEventListener('click', async () => {
  clearErrors();
  if (hasSavedProgress()) {
    const confirmed = window.confirm(
      'Je hebt al voortgang opgeslagen. De demo vervangt titel, logo, weergave en sponsors. Doorgaan?',
    );
    if (!confirmed) return;
  }
  const result = await api.applyDemoSetup();
  if (!result?.ok) {
    showError(wizardError, result?.error || 'Demo laden mislukt');
  }
});

gameTitleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && currentStep === 0) {
    event.preventDefault();
    nextButton.click();
  }
});

mainLogoInput.addEventListener('change', async (event) => {
  clearErrors();
  const file = event.target.files[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  const result = await api.uploadMainLogo({ buffer, originalName: file.name });
  if (!result?.ok) {
    showError(logoError, result?.error || 'Upload mislukt');
    return;
  }
  settings.mainLogoPath = result.path;
  settings.mainLogoFileName = result.fileName;
  updateMainLogoUI(result.path, result.fileName);
  await api.saveSetupProgress({ setupStep: currentStep });
});

deleteMainLogoButton.addEventListener('click', async () => {
  clearErrors();
  await api.deleteMainLogo();
  settings.mainLogoPath = null;
  settings.mainLogoFileName = null;
  updateMainLogoUI(null);
  await api.saveSetupProgress({ setupStep: currentStep });
});

sponsorLogoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  sponsorLogoLabel.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    sponsorLogoPreview.src = e.target.result;
    sponsorLogoPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

addSponsorButton.addEventListener('click', async () => {
  clearErrors();
  const name = sponsorNameInput.value.trim();
  const logoFile = sponsorLogoInput.files[0];
  if (!name || !logoFile) {
    showError(sponsorError, 'Vul een naam in en selecteer een logo.');
    return;
  }

  const buffer = await logoFile.arrayBuffer();
  const result = await api.addSponsor({ name, buffer, originalName: logoFile.name });
  if (!result?.ok) {
    showError(sponsorError, result?.error || 'Sponsor toevoegen mislukt');
    return;
  }

  const refreshed = await api.getSettings();
  applySettingsToForm(refreshed);
  await api.saveSetupProgress({ setupStep: currentStep });

  sponsorNameInput.value = '';
  sponsorLogoInput.value = '';
  sponsorLogoLabel.textContent = 'Kies bestand...';
  sponsorLogoPreview.classList.add('hidden');
});

sponsorList.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('.delete-sponsor-btn');
  if (!deleteButton || !deleteButton.dataset.id) return;
  clearErrors();
  const sponsorId = parseInt(deleteButton.dataset.id, 10);
  await api.deleteSponsor(sponsorId);
  const refreshed = await api.getSettings();
  applySettingsToForm(refreshed);
  await api.saveSetupProgress({ setupStep: currentStep });
});

inGameDisplayModeSelect.addEventListener('change', updateDisplayWarning);
pauseDisplayModeSelect.addEventListener('change', updateDisplayWarning);

window.onload = async () => {
  const loaded = await api.getSettings();
  applySettingsToForm(loaded);
  const resumeStep = Number.isInteger(loaded.setupStep) ? loaded.setupStep : 0;
  showStep(resumeStep);
};
