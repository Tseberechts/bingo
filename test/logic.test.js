const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  callNextNumber,
  toggleCalledNumber,
  syncGameOver,
  isValidGameState,
} = require('../game/logic');

const makeState = (overrides = {}) => ({
  calledNumbers: [],
  uncalledNumbers: [1, 2, 3],
  lastCalled: null,
  round: 1,
  isGameOver: false,
  maxNumber: 3,
  ...overrides,
});

describe('callNextNumber', () => {
  it('moves a number from uncalled to called and sets lastCalled', () => {
    const state = makeState();
    callNextNumber(state);
    assert.equal(state.calledNumbers.length, 1);
    assert.equal(state.uncalledNumbers.length, 2);
    assert.ok(state.calledNumbers.includes(state.lastCalled));
    assert.equal(state.isGameOver, false);
  });

  it('sets isGameOver when the last number is called', () => {
    const state = makeState({ uncalledNumbers: [7], calledNumbers: [1, 2] });
    callNextNumber(state);
    assert.deepEqual(state.uncalledNumbers, []);
    assert.equal(state.lastCalled, 7);
    assert.equal(state.isGameOver, true);
  });

  it('marks game over when already empty without changing called', () => {
    const state = makeState({ uncalledNumbers: [], calledNumbers: [1, 2, 3] });
    callNextNumber(state);
    assert.equal(state.isGameOver, true);
    assert.deepEqual(state.calledNumbers, [1, 2, 3]);
  });
});

describe('toggleCalledNumber', () => {
  it('calls an uncalled number and syncs game over', () => {
    const state = makeState({ uncalledNumbers: [1], calledNumbers: [2, 3] });
    toggleCalledNumber(state, 1);
    assert.deepEqual(state.uncalledNumbers, []);
    assert.ok(state.calledNumbers.includes(1));
    assert.equal(state.isGameOver, true);
  });

  it('uncalls a called number and clears game over', () => {
    const state = makeState({
      uncalledNumbers: [],
      calledNumbers: [1, 2, 3],
      lastCalled: 3,
      isGameOver: true,
    });
    toggleCalledNumber(state, 3);
    assert.ok(state.uncalledNumbers.includes(3));
    assert.equal(state.isGameOver, false);
  });
});

describe('syncGameOver', () => {
  it('reflects empty uncalled list', () => {
    const state = makeState({ uncalledNumbers: [] });
    syncGameOver(state);
    assert.equal(state.isGameOver, true);
  });
});

describe('isValidGameState', () => {
  it('accepts a well-formed save', () => {
    assert.equal(isValidGameState(makeState()), true);
  });

  it('rejects missing arrays or bad round', () => {
    assert.equal(isValidGameState(null), false);
    assert.equal(isValidGameState({ ...makeState(), calledNumbers: null }), false);
    assert.equal(isValidGameState({ ...makeState(), round: 0 }), false);
  });
});
