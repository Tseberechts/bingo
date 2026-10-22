/**
 * Pure game mutations — safe to unit test without Electron.
 * Mutates and returns the same state object for convenience.
 */

const syncGameOver = (state) => {
  state.isGameOver = !state.uncalledNumbers || state.uncalledNumbers.length === 0;
  return state;
};

const callNextNumber = (state) => {
  if (!state || !Array.isArray(state.uncalledNumbers)) return state;

  if (state.uncalledNumbers.length === 0) {
    state.isGameOver = true;
    return state;
  }

  const randomIndex = Math.floor(Math.random() * state.uncalledNumbers.length);
  const newNumber = state.uncalledNumbers[randomIndex];
  state.uncalledNumbers.splice(randomIndex, 1);
  state.calledNumbers.push(newNumber);
  state.lastCalled = newNumber;
  syncGameOver(state);
  return state;
};

const toggleCalledNumber = (state, number) => {
  if (!state || typeof number !== 'number') return state;

  const indexInCalled = state.calledNumbers.indexOf(number);
  if (indexInCalled > -1) {
    state.calledNumbers.splice(indexInCalled, 1);
    state.uncalledNumbers.push(number);
    state.uncalledNumbers.sort((a, b) => a - b);
    if (state.lastCalled === number) {
      state.lastCalled = state.calledNumbers.length
        ? state.calledNumbers[state.calledNumbers.length - 1]
        : null;
    }
  } else {
    const indexInUncalled = state.uncalledNumbers.indexOf(number);
    if (indexInUncalled > -1) {
      state.uncalledNumbers.splice(indexInUncalled, 1);
      state.calledNumbers.push(number);
      state.calledNumbers.sort((a, b) => a - b);
      state.lastCalled = number;
    }
  }

  syncGameOver(state);
  return state;
};

const isValidGameState = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.calledNumbers) || !Array.isArray(data.uncalledNumbers)) return false;
  if (typeof data.round !== 'number' || data.round < 1) return false;
  if (typeof data.maxNumber !== 'number' || data.maxNumber < 1) return false;
  return true;
};

module.exports = {
  syncGameOver,
  callNextNumber,
  toggleCalledNumber,
  isValidGameState,
};
