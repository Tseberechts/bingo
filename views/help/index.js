const api = window.bingo;

document.addEventListener('keydown', (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    if (api?.toggleFullscreen) api.toggleFullscreen();
  }
});
