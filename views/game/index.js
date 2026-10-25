const api = window.bingo;

const gameTitleHeader = document.getElementById('gameTitleHeader');
const currentNumberEl = document.getElementById('currentNumber');
const currentNumberDisplayEl = document.getElementById('currentNumberDisplay');
const historyGridEl = document.getElementById('historyGrid');
const callNextButton = document.getElementById('callNextButton');
const nextRoundButton = document.getElementById('nextRoundButton');
const footerPauseButton = document.getElementById('footerPauseButton');
const correctModeButton = document.getElementById('correctModeButton');
const correctModeBanner = document.getElementById('correctModeBanner');
const roundCounterEl = document.getElementById('roundCounter');
const inGameDisplay = document.getElementById('inGameDisplay');
const inGameDisplayTitle = document.getElementById('inGameDisplayTitle');
const inGameDisplayContent = document.getElementById('inGameDisplayContent');
const gameToast = document.getElementById('gameToast');

const menuButton = document.getElementById('menuButton');
const gameMenuModal = document.getElementById('gameMenuModal');
const menuResumeButton = document.getElementById('menuResumeButton');
const menuPauseButton = document.getElementById('menuPauseButton');
const menuReturnToMainButton = document.getElementById('menuReturnToMainButton');
const menuEndGameButton = document.getElementById('menuEndGameButton');

const pauseOverlay = document.getElementById('pauseOverlay');
const pauseDisplayTitle = document.getElementById('pauseDisplayTitle');
const pauseContent = document.getElementById('pauseContent');
const resumeButton = document.getElementById('resumeButton');

const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let sponsorInterval;
let pulseTimeout;
let toastTimeout;
let correctMode = false;
let latestGameState = null;

const isOverlayOpen = () => (
  !confirmDialog.classList.contains('hidden')
  || !gameMenuModal.classList.contains('hidden')
  || !pauseOverlay.classList.contains('hidden')
);

const showToast = (message) => {
  if (!gameToast) return;
  gameToast.textContent = message;
  gameToast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    gameToast.classList.remove('show');
  }, 2500);
};

const setCorrectMode = (enabled) => {
  correctMode = Boolean(enabled);
  correctModeButton.setAttribute('aria-pressed', correctMode ? 'true' : 'false');
  correctModeButton.classList.toggle('correct-mode-active', correctMode);
  correctModeBanner.classList.toggle('hidden', !correctMode);
  if (latestGameState) {
    renderHistory(
      latestGameState.calledNumbers,
      latestGameState.lastCalled,
      latestGameState.maxNumber,
      latestGameState.boardCols,
    );
  }
};

const renderHistory = (calledNumbers, lastCalled, maxNumber, boardCols = 10) => {
  historyGridEl.innerHTML = '';
  const cols = Math.max(1, boardCols);
  const rows = Math.max(1, Math.ceil(maxNumber / cols));
  historyGridEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  historyGridEl.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

  for (let i = 1; i <= maxNumber; i++) {
    const isCalled = calledNumbers.includes(i);
    const isLastCalled = i === lastCalled;
    const ballEl = document.createElement('div');
    ballEl.textContent = String(i);
    ballEl.classList.add('board-cell');
    if (correctMode) {
      ballEl.classList.add('cursor-pointer', 'board-cell-editable');
    } else {
      ballEl.classList.add('cursor-default');
    }
    if (isCalled) {
      ballEl.classList.add('board-cell-called');
      if (isLastCalled) ballEl.classList.add('board-cell-last');
    } else {
      ballEl.classList.add('board-cell-uncalled');
    }

    if (correctMode) {
      ballEl.addEventListener('click', () => {
        const wasCalled = calledNumbers.includes(i);
        api.toggleCalledNumber(i);
        showToast(wasCalled ? `Nummer ${i} ongedaan gemaakt` : `Nummer ${i} aangeroepen`);
      });
    }

    historyGridEl.appendChild(ballEl);
  }
};

const updateUI = (gameState) => {
  latestGameState = gameState;
  const { calledNumbers, lastCalled, round, isGameOver, maxNumber, boardCols, gameTitle } = gameState;
  gameTitleHeader.textContent = gameTitle || 'BINGO';
  roundCounterEl.textContent = `Ronde: ${round}`;
  currentNumberEl.textContent = lastCalled || '--';

  clearTimeout(pulseTimeout);
  currentNumberDisplayEl.classList.remove('animate-pulse');

  if (lastCalled && !isGameOver) {
    currentNumberDisplayEl.classList.add('animate-pulse');
    pulseTimeout = setTimeout(() => currentNumberDisplayEl.classList.remove('animate-pulse'), 3000);
  }

  callNextButton.disabled = isGameOver;
  const callLabel = callNextButton.querySelector('.btn-label');
  if (callLabel) {
    callLabel.textContent = isGameOver ? 'SPEL VOORBIJ' : 'VOLGENDE NUMMER';
  } else {
    callNextButton.textContent = isGameOver ? 'SPEL VOORBIJ' : 'VOLGENDE NUMMER';
  }
  renderHistory(calledNumbers, lastCalled, maxNumber, boardCols);
};

const hasDisplayContent = (settings, displayMode) => {
  if (displayMode === 'logo') return Boolean(settings.mainLogoPath);
  if (displayMode === 'sponsors') return Array.isArray(settings.sponsors) && settings.sponsors.length > 0;
  return false;
};

const setupDisplay = (contentContainer, titleContainer, settings, modeKey) => {
  clearInterval(sponsorInterval);
  contentContainer.replaceChildren();
  if (titleContainer) titleContainer.textContent = '';

  const displayMode = settings[modeKey];

  if (displayMode === 'hide' || !hasDisplayContent(settings, displayMode)) {
    if (contentContainer === inGameDisplayContent) {
      inGameDisplay.classList.add('hidden');
      inGameDisplay.classList.remove('flex');
    }
    return;
  }

  if (contentContainer === inGameDisplayContent) {
    inGameDisplay.classList.remove('hidden');
    inGameDisplay.classList.add('flex');
  }

  if (displayMode === 'logo' && settings.mainLogoPath) {
    const img = document.createElement('img');
    img.src = settings.mainLogoPath;
    img.className = 'main-logo fade-in';
    img.alt = 'Logo';
    contentContainer.appendChild(img);
  } else if (displayMode === 'sponsors' && settings.sponsors.length > 0) {
    let currentIndex = 0;
    const showNextSponsor = () => {
      const currentSponsorElement = contentContainer.firstElementChild;
      if (currentSponsorElement) currentSponsorElement.classList.remove('fade-in');
      setTimeout(() => {
        contentContainer.replaceChildren();

        const sponsor = settings.sponsors[currentIndex];
        const hasCaption = Boolean(sponsor.caption);
        if (titleContainer) {
          titleContainer.textContent = hasCaption ? '' : 'Onze Sponsors';
        }

        const sponsorWrapper = document.createElement('div');
        sponsorWrapper.className = 'sponsor-display-wrapper';

        if (hasCaption) {
          const captionEl = document.createElement('p');
          captionEl.textContent = sponsor.caption;
          captionEl.className = 'sponsor-caption';
          sponsorWrapper.appendChild(captionEl);
        }

        const img = document.createElement('img');
        img.src = sponsor.logo;
        img.className = 'sponsor-logo';
        img.alt = sponsor.name;

        const nameEl = document.createElement('p');
        nameEl.textContent = sponsor.name;
        nameEl.className = 'sponsor-name text-xl font-bold mt-2';

        sponsorWrapper.appendChild(img);
        sponsorWrapper.appendChild(nameEl);
        contentContainer.appendChild(sponsorWrapper);

        sponsorWrapper.offsetHeight;

        requestAnimationFrame(() => {
          sponsorWrapper.classList.add('fade-in');
        });

        currentIndex = (currentIndex + 1) % settings.sponsors.length;
      }, 1000);
    };
    showNextSponsor();
    sponsorInterval = setInterval(showNextSponsor, 5000);
  }
};

api.onGameStateUpdate((gameState) => updateUI(gameState));
callNextButton.addEventListener('click', () => api.callNextNumber());
nextRoundButton.addEventListener('click', () => {
  showConfirmDialog(
    'Ben je zeker dat je naar de volgende ronde wil?',
    null,
    () => api.nextRound(),
  );
});

const toggleMenu = () => gameMenuModal.classList.toggle('hidden');

const isPaused = () => !pauseOverlay.classList.contains('hidden');

const togglePause = () => {
  const opening = pauseOverlay.classList.contains('hidden');

  if (opening) {
    setupDisplay(pauseContent, pauseDisplayTitle, window.settings, 'pauseDisplayMode');
    pauseOverlay.classList.remove('hidden');
    pauseOverlay.classList.add('flex');
    const pauseLabel = footerPauseButton.querySelector('.btn-label');
    if (pauseLabel) pauseLabel.textContent = 'HERVATTEN';
    else footerPauseButton.textContent = 'HERVATTEN';
  } else {
    pauseOverlay.classList.add('hidden');
    pauseOverlay.classList.remove('flex');
    clearInterval(sponsorInterval);
    const pauseLabel = footerPauseButton.querySelector('.btn-label');
    if (pauseLabel) pauseLabel.textContent = 'PAUZE';
    else footerPauseButton.textContent = 'PAUZE';
  }
};

menuButton.addEventListener('click', toggleMenu);
menuResumeButton.addEventListener('click', toggleMenu);
menuPauseButton.addEventListener('click', () => {
  toggleMenu();
  if (!isPaused()) togglePause();
});
footerPauseButton.addEventListener('click', () => {
  togglePause();
});
resumeButton.addEventListener('click', togglePause);

correctModeButton.addEventListener('click', () => {
  setCorrectMode(!correctMode);
});

menuReturnToMainButton.addEventListener('click', () => {
  showConfirmDialog(
    'Terug naar het hoofdmenu?',
    'Het spel blijft bewaard. Je kunt het later hervatten.',
    () => {
      window.location.href = '../menu/index.html';
    },
  );
});
menuEndGameButton.addEventListener('click', () => {
  showConfirmDialog(
    'Spel afsluiten?',
    'Dit spel wordt verwijderd en kan niet meer geladen worden.',
    () => {
      api.endGame();
      window.location.href = '../menu/index.html';
    },
  );
});

const showConfirmDialog = (title, message, onConfirm) => {
  confirmTitle.textContent = title;
  if (message) {
    confirmMessage.textContent = message;
    confirmMessage.classList.remove('hidden');
  } else {
    confirmMessage.textContent = '';
    confirmMessage.classList.add('hidden');
  }
  confirmDialog.classList.remove('hidden');
  confirmDialog.classList.add('flex');
  const handleYes = () => {
    onConfirm();
    hideConfirmDialog();
    confirmYes.removeEventListener('click', handleYes);
    confirmNo.removeEventListener('click', handleNo);
  };
  const handleNo = () => {
    hideConfirmDialog();
    confirmYes.removeEventListener('click', handleYes);
    confirmNo.removeEventListener('click', handleNo);
  };
  confirmYes.addEventListener('click', handleYes);
  confirmNo.addEventListener('click', handleNo);
};

const hideConfirmDialog = () => {
  confirmDialog.classList.add('hidden');
  confirmDialog.classList.remove('flex');
};

const isTypingTarget = (target) => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    api.toggleFullscreen();
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    if (!confirmDialog.classList.contains('hidden')) hideConfirmDialog();
    else if (!gameMenuModal.classList.contains('hidden')) toggleMenu();
    else if (isPaused()) togglePause();
    return;
  }

  if (isTypingTarget(event.target)) return;

  if (event.key === ' ' || event.key === 'Enter') {
    if (isOverlayOpen()) return;
    event.preventDefault();
    if (!callNextButton.disabled) api.callNextNumber();
    return;
  }

  if (event.key === 'p' || event.key === 'P') {
    if (!confirmDialog.classList.contains('hidden') || !gameMenuModal.classList.contains('hidden')) {
      return;
    }
    event.preventDefault();
    togglePause();
  }
});

window.onload = async () => {
  api.requestInitialState();
  window.settings = await api.getSettings();
  setupDisplay(inGameDisplayContent, inGameDisplayTitle, window.settings, 'inGameDisplayMode');
};
