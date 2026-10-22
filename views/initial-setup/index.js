const api = window.bingo;

const gameTitleInput = document.getElementById('gameTitle');
const getStartedButton = document.getElementById('getStartedButton');

getStartedButton.addEventListener('click', () => {
  const title = gameTitleInput.value.trim();
  if (!title) {
    alert('Vul een titel in voor je bingo.');
    gameTitleInput.focus();
    return;
  }
  api.completeInitialSetup({ gameTitle: title });
});

gameTitleInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') getStartedButton.click();
});
