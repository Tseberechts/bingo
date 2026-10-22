const api = window.bingo;

const gameTitleHeader = document.getElementById('gameTitleHeader');
const currentNumberEl = document.getElementById('currentNumber');
const currentNumberDisplayEl = document.getElementById('currentNumberDisplay');
const historyGridEl = document.getElementById('historyGrid');
const roundCounterEl = document.getElementById('roundCounter');
const inGameDisplay = document.getElementById('inGameDisplay');
const inGameDisplayTitle = document.getElementById('inGameDisplayTitle');
const inGameDisplayContent = document.getElementById('inGameDisplayContent');

let sponsorInterval;
let pulseTimeout;

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
    ballEl.classList.add('board-cell', 'cursor-default');
    if (isCalled) {
      ballEl.classList.add('board-cell-called');
      if (isLastCalled) ballEl.classList.add('board-cell-last');
    } else {
      ballEl.classList.add('board-cell-uncalled');
    }
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
  renderHistory(calledNumbers, lastCalled, maxNumber, boardCols);
};

const hasDisplayContent = (settings, displayMode) => {
  if (displayMode === 'logo') return Boolean(settings.mainLogoPath);
  if (displayMode === 'sponsors') return Array.isArray(settings.sponsors) && settings.sponsors.length > 0;
  return false;
};

const setupDisplay = (settings) => {
  clearInterval(sponsorInterval);
  inGameDisplayContent.replaceChildren();
  inGameDisplayTitle.textContent = '';

  const displayMode = settings.inGameDisplayMode;
  if (displayMode === 'hide' || !hasDisplayContent(settings, displayMode)) {
    inGameDisplay.classList.add('hidden');
    inGameDisplay.classList.remove('flex');
    return;
  }

  inGameDisplay.classList.remove('hidden');
  inGameDisplay.classList.add('flex');

  if (displayMode === 'logo' && settings.mainLogoPath) {
    const img = document.createElement('img');
    img.src = settings.mainLogoPath;
    img.className = 'main-logo fade-in';
    img.alt = 'Logo';
    inGameDisplayContent.appendChild(img);
    return;
  }

  if (displayMode === 'sponsors' && settings.sponsors.length > 0) {
    inGameDisplayTitle.textContent = 'Onze Sponsors';
    let currentIndex = 0;
    const showNextSponsor = () => {
      setTimeout(() => {
        inGameDisplayContent.replaceChildren();
        const sponsor = settings.sponsors[currentIndex];
        const sponsorWrapper = document.createElement('div');
        sponsorWrapper.className = 'sponsor-display-wrapper fade-in';
        const img = document.createElement('img');
        img.src = sponsor.logo;
        img.className = 'sponsor-logo';
        img.alt = sponsor.name;
        const nameEl = document.createElement('p');
        nameEl.textContent = sponsor.name;
        nameEl.className = 'sponsor-name text-xl font-bold mt-2';
        sponsorWrapper.appendChild(img);
        sponsorWrapper.appendChild(nameEl);
        inGameDisplayContent.appendChild(sponsorWrapper);
        currentIndex = (currentIndex + 1) % settings.sponsors.length;
      }, 200);
    };
    showNextSponsor();
    sponsorInterval = setInterval(showNextSponsor, 5000);
  }
};

api.onGameStateUpdate((gameState) => updateUI(gameState));

document.addEventListener('keydown', (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    api.toggleFullscreen();
  }
});

window.onload = async () => {
  api.requestInitialState();
  const settings = await api.getSettings();
  if (window.applyBrandColors && settings.effectiveBrandColors) {
    window.applyBrandColors(settings.effectiveBrandColors);
  }
  setupDisplay(settings);
};
