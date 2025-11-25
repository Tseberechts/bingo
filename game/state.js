const { getSettings } = require('./settings');

let gameState = {};

/**
 * Resets the game state to its initial values, respecting the current settings.
 * Can preserve the round number if needed.
 * @param {boolean} preserveRound - If true, the current round number is kept.
 */
const resetState = (preserveRound = false) => {
  const settings = getSettings();
  const maxNumber = settings.maxNumber || 90;
  const gameTitle = settings.gameTitle || 'BINGO';
  
  const currentRound = preserveRound ? gameState.round : 1;
  const allNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  
  Object.assign(gameState, {
    calledNumbers: [],
    uncalledNumbers: [...allNumbers],
    lastCalled: null,
    round: currentRound,
    isGameOver: false,
    maxNumber: maxNumber,
    gameTitle: gameTitle,
  });
};

// Initialize with a clean state on startup
// The actual state will be loaded or reset by IPC handlers
resetState();

module.exports = {
  gameState,
  resetState,
};
