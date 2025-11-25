const { ipcRenderer } = require('electron');

// DOM-elementen
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
const pauseContent = document.getElementById('pauseContent');
const resumeButton = document.getElementById('resumeButton');

const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let sponsorInterval;

// --- Rendering ---
const renderHistory = (calledNumbers, lastCalled, maxNumber) => {
  historyGridEl.innerHTML = '';
  for (let i = 1; i <= maxNumber; i++) {
    const isCalled = calledNumbers.includes(i);
    const isLastCalled = i === lastCalled;
    const ballEl = document.createElement('div');
    ballEl.textContent = i;
    ballEl.classList.add('p-1', 'rounded', 'font-bold', 'transition-all', 'duration-300', 'text-xs', 'sm:text-6xl');
    if (isCalled) {
      ballEl.classList.add('bg-white', 'text-gray-800', 'shadow-md');
      if (isLastCalled) ballEl.classList.add('bg-yellow-300', 'ring-4', 'ring-yellow-500', 'scale-110');
    } else {
      ballEl.classList.add('bg-gray-700', 'text-gray-500', 'opacity-50');
    }
    historyGridEl.appendChild(ballEl);
  }
};

const updateUI = (gameState) => {
  const { calledNumbers, lastCalled, round, isGameOver, maxNumber, gameTitle } = gameState;
  gameTitleHeader.textContent = gameTitle || 'BINGO';
  roundCounterEl.textContent = `Ronde: ${round}`;
  currentNumberEl.textContent = lastCalled || '--';
  if (lastCalled && !isGameOver) {
    currentNumberDisplayEl.className = `relative p-6 sm:p-8 rounded-2xl shadow-2xl transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] border-4 border-bingo-orange bg-main-bg-active animate-pulse`;
    setTimeout(() => currentNumberDisplayEl.classList.remove('animate-pulse'), 3000);
  }
  callNextButton.disabled = isGameOver;
  callNextButton.textContent = isGameOver ? 'SPEL VOORBIJ' : 'ROEP VOLGEND NUMMER AF';
  renderHistory(calledNumbers, lastCalled, maxNumber);
};

const setupDisplay = (contentContainer, settings, modeKey, showKey) => {
    clearInterval(sponsorInterval);
    contentContainer.innerHTML = '';

    if (!settings[showKey]) return;

    const displayMode = settings[modeKey];
    if (displayMode === 'logo' && settings.mainLogoPath) {
        contentContainer.innerHTML = `<img src="${settings.mainLogoPath.replace(/\\/g, '/')}" class="main-logo fade-in" alt="Logo">`;
    } else if (displayMode === 'sponsors' && settings.sponsors.length > 0) {
        let currentIndex = 0;
        const showNextImage = () => {
            const currentImage = contentContainer.firstElementChild;
            if (currentImage) currentImage.classList.remove('fade-in');
            setTimeout(() => {
                if (contentContainer.firstElementChild) contentContainer.removeChild(contentContainer.firstElementChild);
                const img = document.createElement('img');
                img.src = settings.sponsors[currentIndex].logo.replace(/\\/g, '/');
                img.className = 'sponsor-logo';
                contentContainer.appendChild(img);
                requestAnimationFrame(() => img.classList.add('fade-in'));
                currentIndex = (currentIndex + 1) % settings.sponsors.length;
            }, 1000);
        };
        showNextImage();
        sponsorInterval = setInterval(showNextImage, 5000);
    }
};

// --- IPC & Event Listeners ---
ipcRenderer.on('game-state-update', (event, gameState) => updateUI(gameState));
callNextButton.addEventListener('click', () => ipcRenderer.send('call-next-number'));
nextRoundButton.addEventListener('click', () => showConfirmDialog('Ben je zeker dat je naar de volgende ronde wil?', () => ipcRenderer.send('next-round')));

const toggleMenu = () => gameMenuModal.classList.toggle('hidden');

const togglePause = () => {
    const isHidden = pauseOverlay.classList.contains('hidden');
    
    if (isHidden) {
        // If we are about to show the overlay, set up its content first
        setupDisplay(pauseContent, window.settings, 'pauseDisplayMode', 'showOnPause');
        pauseOverlay.classList.remove('hidden');
        pauseOverlay.classList.add('flex');
    } else {
        // If we are hiding it, just hide it
        pauseOverlay.classList.add('hidden');
        pauseOverlay.classList.remove('flex');
        // Stop the sponsor interval when hiding
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

menuReturnToMainButton.addEventListener('click', () => window.location.href = '../menu/index.html');
menuEndGameButton.addEventListener('click', () => {
  showConfirmDialog('Weet je zeker dat je dit spel wilt beëindigen? De voortgang wordt verwijderd.', () => {
    ipcRenderer.send('end-game');
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

// --- Initialization ---
window.onload = async () => {
  ipcRenderer.send('request-initial-state');
  window.settings = await ipcRenderer.invoke('get-settings');
  
  // Setup in-game display
  if (window.settings.showInGame) {
      inGameDisplay.classList.remove('hidden');
      inGameDisplay.classList.add('flex');
      inGameDisplayTitle.textContent = window.settings.inGameDisplayMode === 'sponsors' ? 'Onze Sponsors' : '';
      setupDisplay(inGameDisplayContent, window.settings, 'inGameDisplayMode', 'showInGame');
  } else {
      inGameDisplay.classList.add('hidden');
  }
};
