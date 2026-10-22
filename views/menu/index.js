const api = window.bingo;

const newGameButton = document.getElementById('newGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const loadGameButton = document.getElementById('loadGameButton');
const exitButton = document.getElementById('exitButton');
const loadGameModal = document.getElementById('loadGameModal');
const saveGameList = document.getElementById('saveGameList');
const closeModalButton = document.getElementById('closeModalButton');

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

const populateSaveGames = async () => {
  const saveFiles = await api.listSaveGames();
  saveGameList.replaceChildren();

  if (!saveFiles.length) {
    const empty = document.createElement('p');
    empty.className = 'text-gray-400';
    empty.textContent = 'Geen opgeslagen spellen gevonden.';
    saveGameList.appendChild(empty);
    return;
  }

  saveFiles.forEach((file) => {
    const container = document.createElement('div');
    container.className = 'save-game-item';

    const loadButton = document.createElement('button');
    loadButton.textContent = file.replace('.json', '').replace(/game-/g, '');
    loadButton.className = 'menu-button bg-bingo-blue flex-grow';
    loadButton.onclick = () => {
      api.loadGame(file);
      window.location.href = '../game/index.html';
    };

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('aria-label', 'Verwijder spel');
    deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
    deleteButton.className = 'delete-save-button';
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      const confirmed = confirm(`Weet je zeker dat je het spel "${file}" wilt verwijderen?`);
      if (confirmed) {
        const result = await api.deleteSaveGame(file);
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    api.toggleFullscreen();
  }
});

const appVersionLabel = document.getElementById('appVersionLabel');
if (appVersionLabel && api.getAppInfo) {
  api.getAppInfo().then((info) => {
    if (info?.version) {
      appVersionLabel.textContent = `v${info.version}`;
    }
  });
}
