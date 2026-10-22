const { getSettings } = require('./settings');
const { MAX_NUMBER, BOARD_COLS } = require('./constants');
const { isValidGameState } = require('./logic');

let gameState = {};

/**
 * Resets the game state to its initial values, respecting the current settings.
 * Can preserve the round number if needed.
 * @param {boolean} preserveRound - If true, the current round number is kept.
 */
const resetState = (preserveRound = false) => {
  const settings = getSettings();
  const maxNumber = settings.maxNumber || MAX_NUMBER;
  const gameTitle = settings.gameTitle || 'BINGO';

  const currentRound = preserveRound ? gameState.round : 1;
  const allNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);

  Object.assign(gameState, {
    calledNumbers: [],
    uncalledNumbers: [...allNumbers],
    lastCalled: null,
    round: currentRound,
    isGameOver: false,
    maxNumber,
    boardCols: BOARD_COLS,
    gameTitle,
  });
};

const applyLoadedState = (loadedState) => {
  if (!isValidGameState(loadedState)) {
    return false;
  }
  Object.assign(gameState, {
    calledNumbers: loadedState.calledNumbers,
    uncalledNumbers: loadedState.uncalledNumbers,
    lastCalled: loadedState.lastCalled ?? null,
    round: loadedState.round,
    isGameOver: Boolean(loadedState.isGameOver) || loadedState.uncalledNumbers.length === 0,
    maxNumber: loadedState.maxNumber,
    boardCols: loadedState.boardCols || BOARD_COLS,
    gameTitle: loadedState.gameTitle || getSettings().gameTitle || 'BINGO',
  });
  return true;
};

// Initialize with a clean state on startup
resetState();

module.exports = {
  gameState,
  resetState,
  applyLoadedState,
};
