const { ipcRenderer } = require('electron');

const gameTitleInput = document.getElementById('gameTitle');
const getStartedButton = document.getElementById('getStartedButton');

getStartedButton.addEventListener('click', () => {
    const initialSettings = {
        gameTitle: gameTitleInput.value,
        // Other settings will use defaults
    };
    ipcRenderer.send('complete-initial-setup', initialSettings);
});
