const api = window.bingo;

const newGameButton = document.getElementById('newGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const loadGameButton = document.getElementById('loadGameButton');
const audienceWindowButton = document.getElementById('audienceWindowButton');
const exportReportButton = document.getElementById('exportReportButton');
const freeTierHint = document.getElementById('freeTierHint');
const fullscreenButton = document.getElementById('fullscreenButton');
const exitButton = document.getElementById('exitButton');
const loadGameModal = document.getElementById('loadGameModal');
const saveGameList = document.getElementById('saveGameList');
const closeModalButton = document.getElementById('closeModalButton');
const setupBanner = document.getElementById('setupBanner');
const projectorTip = document.getElementById('projectorTip');
const dismissProjectorTip = document.getElementById('dismissProjectorTip');
const updateBanner = document.getElementById('updateBanner');
const updateBannerText = document.getElementById('updateBannerText');
const updateBannerAction = document.getElementById('updateBannerAction');
const dismissUpdateBanner = document.getElementById('dismissUpdateBanner');

let updateBannerDismissed = false;

newGameButton.addEventListener('click', () => {
  api.startNewGame();
  window.location.href = '../game/index.html';
});

resumeGameButton.addEventListener('click', async () => {
  const result = await api.resumeLastGame();
  if (result?.ok) {
    window.location.href = '../game/index.html';
  } else {
    alert(result?.error || 'Geen recent spel gevonden. Start een nieuw spel.');
  }
});

const setButtonLabel = (button, text) => {
  const label = button?.querySelector('.btn-label');
  if (label) label.textContent = text;
  else if (button) button.textContent = text;
};

const updateFullscreenButton = (isOn) => {
  const on = Boolean(isOn);
  fullscreenButton.setAttribute('aria-pressed', on ? 'true' : 'false');
  fullscreenButton.classList.toggle('fullscreen-active', on);
  fullscreenButton.classList.toggle('bg-gray-700', !on);
  fullscreenButton.classList.toggle('bg-bingo-green', on);
  setButtonLabel(fullscreenButton, on ? 'Volledig scherm uit' : 'Volledig scherm');
};

fullscreenButton.addEventListener('click', async () => {
  const isOn = await api.toggleFullscreen();
  updateFullscreenButton(isOn);
});

const populateSaveGames = async () => {
  const saveGames = await api.listSaveGames();
  saveGameList.replaceChildren();

  if (!saveGames.length) {
    const empty = document.createElement('p');
    empty.className = 'text-gray-400';
    empty.textContent = 'Geen opgeslagen spellen gevonden.';
    saveGameList.appendChild(empty);
    return;
  }

  saveGames.forEach((save) => {
    const fileName = typeof save === 'string' ? save : save.fileName;
    const label = typeof save === 'string'
      ? fileName.replace('.json', '').replace(/game-/g, '')
      : save.label;
    const meta = typeof save === 'object' && save.meta ? save.meta : '';

    const container = document.createElement('div');
    container.className = 'save-game-item';

    const loadButton = document.createElement('button');
    loadButton.className = 'menu-button bg-bingo-blue flex-1 text-left min-w-0';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'btn-icon');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
    loadButton.appendChild(icon);
    const labelEl = document.createElement('span');
    labelEl.className = 'save-game-label btn-label';
    labelEl.textContent = label;
    loadButton.appendChild(labelEl);
    if (meta) {
      const metaEl = document.createElement('span');
      metaEl.className = 'save-game-meta';
      metaEl.textContent = meta;
      loadButton.appendChild(metaEl);
    }
    loadButton.onclick = () => {
      api.loadGame(fileName);
      window.location.href = '../game/index.html';
    };

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('aria-label', 'Verwijder spel');
    deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
    deleteButton.className = 'delete-save-button';
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      const confirmed = confirm(`Weet je zeker dat je het spel "${label}" wilt verwijderen?`);
      if (confirmed) {
        const result = await api.deleteSaveGame(fileName);
        if (!result?.ok) {
          alert(result?.error || 'Verwijderen mislukt');
          return;
        }
        populateSaveGames();
      }
    };

    container.appendChild(loadButton);
    container.appendChild(deleteButton);
    saveGameList.appendChild(container);
  });
};

loadGameButton.addEventListener('click', () => {
  populateSaveGames();
  loadGameModal.classList.remove('hidden');
  loadGameModal.classList.add('flex');
});

closeModalButton.addEventListener('click', () => {
  loadGameModal.classList.add('hidden');
  loadGameModal.classList.remove('flex');
});

exitButton.addEventListener('click', () => {
  api.exitApp();
});

dismissProjectorTip.addEventListener('click', () => {
  projectorTip.classList.add('hidden');
  api.saveSettings({ projectorTipSeen: true });
});

document.addEventListener('keydown', async (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    const isOn = await api.toggleFullscreen();
    updateFullscreenButton(isOn);
  }
});

if (api.onFullscreenChanged) {
  api.onFullscreenChanged((isOn) => updateFullscreenButton(isOn));
}

const appVersionLabel = document.getElementById('appVersionLabel');
if (appVersionLabel && api.getAppInfo) {
  api.getAppInfo().then((info) => {
    if (info?.version) {
      appVersionLabel.textContent = `v${info.version}`;
    }
  });
}

const hideUpdateBanner = () => {
  if (!updateBanner) return;
  updateBanner.classList.add('hidden');
};

const showUpdateBanner = (status) => {
  if (!updateBanner || !updateBannerText || !updateBannerAction || updateBannerDismissed) return;

  if (status?.state === 'available') {
    updateBannerText.textContent = status.version
      ? `Update v${status.version} is beschikbaar.`
      : 'Er is een update beschikbaar.';
    setButtonLabel(updateBannerAction, 'Download');
    updateBannerAction.onclick = async () => {
      const result = await api.downloadUpdate();
      if (!result?.ok) {
        alert(result?.error || 'Download mislukt');
      }
    };
    updateBanner.classList.remove('hidden');
    return;
  }

  if (status?.state === 'downloading') {
    updateBannerText.textContent = typeof status.progress === 'number'
      ? `Update downloaden… ${status.progress}%`
      : 'Update downloaden…';
    setButtonLabel(updateBannerAction, 'Bezig…');
    updateBannerAction.onclick = null;
    updateBanner.classList.remove('hidden');
    return;
  }

  if (status?.state === 'downloaded') {
    updateBannerText.textContent = status.version
      ? `v${status.version} is klaar om te installeren.`
      : 'Update is klaar om te installeren.';
    setButtonLabel(updateBannerAction, 'Herstart om te installeren');
    updateBannerAction.onclick = () => {
      api.installUpdate();
    };
    updateBanner.classList.remove('hidden');
    return;
  }

  hideUpdateBanner();
};

if (dismissUpdateBanner) {
  dismissUpdateBanner.addEventListener('click', () => {
    updateBannerDismissed = true;
    hideUpdateBanner();
  });
}

if (api.onUpdateStatus) {
  api.onUpdateStatus((status) => {
    // Only surface quiet launch updates on the menu — never mid-game.
    showUpdateBanner(status);
  });
}

if (audienceWindowButton) {
  audienceWindowButton.addEventListener('click', async () => {
    const result = await api.openAudienceWindow();
    if (!result?.ok) {
      alert(result?.error || 'Publieksvenster openen mislukt');
    }
  });
}

if (exportReportButton) {
  exportReportButton.addEventListener('click', async () => {
    const result = await api.exportEveningReport();
    if (result?.cancelled) return;
    if (!result?.ok) {
      alert(result?.error || 'Exporteren mislukt');
      return;
    }
    alert('Avondrapport opgeslagen.');
  });
}

window.onload = async () => {
  const entitlements = (await api.getEntitlements()) || { isPaid: false };
  const settings = await api.getSettings();
  if (window.applyBrandColors && settings.effectiveBrandColors) {
    window.applyBrandColors(settings.effectiveBrandColors);
  }
  if (settings.setupComplete === false) {
    setupBanner.classList.remove('hidden');
  }
  if (!settings.projectorTipSeen) {
    projectorTip.classList.remove('hidden');
  }
  const paid = Boolean(entitlements.isPaid);
  if (loadGameButton) loadGameButton.classList.toggle('hidden', !paid);
  if (audienceWindowButton) audienceWindowButton.classList.toggle('hidden', !paid);
  if (exportReportButton) exportReportButton.classList.toggle('hidden', !paid);
  if (freeTierHint) freeTierHint.classList.toggle('hidden', paid);
  // Free tier: projector tip stays relevant; paid can use dedicated audience window.
  if (paid && projectorTip && !projectorTip.classList.contains('hidden')) {
    // Keep tip available until dismissed — dual display still useful.
  }
  if (api.getFullscreen) {
    updateFullscreenButton(await api.getFullscreen());
  }
  if (api.getUpdateStatus) {
    showUpdateBanner(await api.getUpdateStatus());
  }
};
