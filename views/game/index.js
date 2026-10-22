const api = window.bingo;

const gameTitleHeader = document.getElementById('gameTitleHeader');
const currentNumberEl = document.getElementById('currentNumber');
const currentNumberDisplayEl = document.getElementById('currentNumberDisplay');
const historyGridEl = document.getElementById('historyGrid');
const callNextButton = document.getElementById('callNextButton');
const nextRoundButton = document.getElementById('nextRoundButton');
const roundCounterEl = document.getElementById('roundCounter');
const inGameDisplay = document.getElementById('inGameDisplay');
const inGameDisplayTitle = document.getElementById('inGameDisplayTitle');
const inGameDisplayContent = document.getElementById('inGameDisplayContent');

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
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let sponsorInterval;
let pulseTimeout;

const renderHistory = (calledNumbers, lastCalled, maxNumber, boardCols = 10) => {
  historyGridEl.innerHTML = '';
  historyGridEl.style.gridTemplateColumns = `repeat(${boardCols}, minmax(0, 1fr))`;

  for (let i = 1; i <= maxNumber; i++) {
    const isCalled = calledNumbers.includes(i);
    const isLastCalled = i === lastCalled;
    const ballEl = document.createElement('div');
    ballEl.textContent = String(i);
    ballEl.classList.add(
      'p-1',
      'rounded',
      'font-bold',
      'transition-all',
      'duration-300',
      'text-xs',
      'sm:text-6xl',
      'cursor-pointer',
    );
    if (isCalled) {
      ballEl.classList.add('bg-white', 'text-gray-800', 'shadow-md');
      if (isLastCalled) ballEl.classList.add('bg-yellow-300', 'ring-4', 'ring-yellow-500', 'scale-110');
    } else {
      ballEl.classList.add('bg-gray-700', 'text-gray-500', 'opacity-50');
    }

    ballEl.addEventListener('click', () => {
      api.toggleCalledNumber(i);
    });

    historyGridEl.appendChild(ballEl);
  }
};

const updateUI = (gameState) => {
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
  callNextButton.textContent = isGameOver ? 'SPEL VOORBIJ' : 'ROEP VOLGEND NUMMER AF';
  renderHistory(calledNumbers, lastCalled, maxNumber, boardCols);
};

const setupDisplay = (contentContainer, titleContainer, settings, modeKey) => {
  clearInterval(sponsorInterval);
  contentContainer.replaceChildren();
  if (titleContainer) titleContainer.textContent = '';

  const displayMode = settings[modeKey];

  if (displayMode === 'hide') {
    if (contentContainer === inGameDisplayContent) {
      inGameDisplay.classList.add('hidden');
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
    if (titleContainer) titleContainer.textContent = 'Onze Sponsors';
    let currentIndex = 0;
    const showNextSponsor = () => {
      const currentSponsorElement = contentContainer.firstElementChild;
      if (currentSponsorElement) currentSponsorElement.classList.remove('fade-in');
      setTimeout(() => {
        contentContainer.replaceChildren();

        const sponsor = settings.sponsors[currentIndex];
        const sponsorWrapper = document.createElement('div');
        sponsorWrapper.className = 'sponsor-display-wrapper';

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
  showConfirmDialog('Ben je zeker dat je naar de volgende ronde wil?', () => api.nextRound());
});

const toggleMenu = () => gameMenuModal.classList.toggle('hidden');

const togglePause = () => {
  const isHidden = pauseOverlay.classList.contains('hidden');

  if (isHidden) {
    setupDisplay(pauseContent, pauseDisplayTitle, window.settings, 'pauseDisplayMode');
    pauseOverlay.classList.remove('hidden');
    pauseOverlay.classList.add('flex');
  } else {
    pauseOverlay.classList.add('hidden');
    pauseOverlay.classList.remove('flex');
    clearInterval(sponsorInterval);
  }
};

menuButton.addEventListener('click', toggleMenu);
menuResumeButton.addEventListener('click', toggleMenu);
menuPauseButton.addEventListener('click', () => {
  toggleMenu();
  togglePause();
});
resumeButton.addEventListener('click', togglePause);

menuReturnToMainButton.addEventListener('click', () => {
  window.location.href = '../menu/index.html';
});
menuEndGameButton.addEventListener('click', () => {
  showConfirmDialog('Weet je zeker dat je dit spel wilt beëindigen? De voortgang wordt verwijderd.', () => {
    api.endGame();
    window.location.href = '../menu/index.html';
  });
});

const showConfirmDialog = (title, onConfirm) => {
  confirmTitle.textContent = title;
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    api.toggleFullscreen();
  }
  if (event.key === 'Escape') {
    if (!confirmDialog.classList.contains('hidden')) hideConfirmDialog();
    else if (!gameMenuModal.classList.contains('hidden')) toggleMenu();
  }
});

window.onload = async () => {
  api.requestInitialState();
  window.settings = await api.getSettings();
  setupDisplay(inGameDisplayContent, inGameDisplayTitle, window.settings, 'inGameDisplayMode');
};
