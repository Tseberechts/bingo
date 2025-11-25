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
    window.location.href = '../single/index.html';
});

resumeGameButton.addEventListener('click', async () => {
    const success = await ipcRenderer.invoke('resume-last-game');
    if (success) {
        window.location.href = '../single/index.html';
    } else {
        alert('Geen recent spel gevonden. Start een nieuw spel.');
    }
});

loadGameButton.addEventListener('click', async () => {
    const saveFiles = await ipcRenderer.invoke('list-save-games');
    saveGameList.innerHTML = '';

    if (saveFiles.length === 0) {
        saveGameList.innerHTML = '<p class="text-gray-400">Geen opgeslagen spellen gevonden.</p>';
    } else {
        saveFiles.forEach(file => {
            const button = document.createElement('button');
            button.textContent = file.replace('.json', '').replace(/game-/g, '');
            button.className = 'menu-button bg-bingo-blue';
            button.onclick = () => {
                ipcRenderer.send('load-game', file);
                window.location.href = '../single/index.html';
            };
            saveGameList.appendChild(button);
        });
    }
    
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
