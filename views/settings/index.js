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

const showToast = (message = 'Instellingen opgeslagen!', isError = false) => {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
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
  });
  pauseDisplayModeSelect.addEventListener('change', () => {
    saveSetting('pauseDisplayMode', pauseDisplayModeSelect.value);
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
    updateMainLogoUI(result.path, result.fileName);
    showToast('Hoofdlogo geüpload!');
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tabContents.forEach((c) => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.remove('hidden');
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

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-sponsor-btn';
    deleteBtn.dataset.id = String(sponsor.id);
    deleteBtn.setAttribute('aria-label', 'Verwijder sponsor');
    deleteBtn.textContent = '×';

    sponsorEl.appendChild(img);
    sponsorEl.appendChild(name);
    sponsorEl.appendChild(deleteBtn);
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
  renderSponsors(settings.sponsors);

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
    renderSponsors(settings.sponsors);
    showToast('Sponsor verwijderd!');
  }
});

deleteMainLogoButton.addEventListener('click', async () => {
  await api.deleteMainLogo();
  updateMainLogoUI(null);
  showToast('Hoofdlogo verwijderd!');
});

window.onload = async () => {
  const settings = await api.getSettings();
  gameTitleInput.value = settings.gameTitle || 'ROZENSTRAAT BINGO';
  inGameDisplayModeSelect.value = settings.inGameDisplayMode;
  pauseDisplayModeSelect.value = settings.pauseDisplayMode;
  updateMainLogoUI(settings.mainLogoPath, settings.mainLogoFileName);
  renderSponsors(settings.sponsors);
  setupAutoSave();
};
