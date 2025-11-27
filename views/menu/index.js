const { ipcRenderer } = require('electron');

const newGameButton = document.getElementById('newGameButton');
const resumeGameButton = document.getElementById('resumeGameButton');
const loadGameButton = document.getElementById('loadGameButton');
const exitButton = document.getElementById('exitButton');
const loadGameModal = document.getElementById('loadGameModal');
const saveGameList = document.getElementById('saveGameList');
const closeModalButton = document.getElementById('closeModalButton');

newGameButton.addEventListener('click', () => {
    ipcRenderer.send('start-new-game');
    window.location.href = '../game/index.html';
});

resumeGameButton.addEventListener('click', async () => {
    const success = await ipcRenderer.invoke('resume-last-game');
    if (success) {
        window.location.href = '../game/index.html';
    } else {
        alert('Geen recent spel gevonden. Start een nieuw spel.');
    }
});

const populateSaveGames = async () => {
    const saveFiles = await ipcRenderer.invoke('list-save-games');
    saveGameList.innerHTML = '';

    if (saveFiles.length === 0) {
        saveGameList.innerHTML = '<p class="text-gray-400">Geen opgeslagen spellen gevonden.</p>';
    } else {
        saveFiles.forEach(file => {
            const container = document.createElement('div');
            container.className = 'save-game-item';

            const loadButton = document.createElement('button');
            loadButton.textContent = file.replace('.json', '').replace(/game-/g, '');
            loadButton.className = 'menu-button bg-bingo-blue flex-grow';
            loadButton.onclick = () => {
                ipcRenderer.send('load-game', file);
                window.location.href = '../game/index.html';
            };

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
            deleteButton.className = 'delete-save-button';
            deleteButton.onclick = async (e) => {
                e.stopPropagation();
                const confirmed = confirm(`Weet je zeker dat je het spel "${file}" wilt verwijderen?`);
                if (confirmed) {
                    await ipcRenderer.invoke('delete-save-game', file);
                    populateSaveGames(); // Refresh the list
                }
            };

            container.appendChild(loadButton);
            container.appendChild(deleteButton);
            saveGameList.appendChild(container);
        });
    }
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
    ipcRenderer.send('exit-app');
});
