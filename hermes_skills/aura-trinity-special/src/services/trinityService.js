// trinityService.js
// Responsibilities:
// - Determine whether Trinity is active for a given battle state
// - Emit server-side events via eventEmitter
// - Persist trinityState to battle JSON
const { checkTrinity } = require('./trinityValidator');
const { emit } = require('../utils/eventEmitter');

async function evaluateTrinity({ battleId, state, controllingTeamIndex = 0 }) {
  const result = checkTrinity(state, controllingTeamIndex);
  if (result.active) {
    state.trinityState = 'ACTIVATED';
    await emit('TRINITY_ACTIVATED', {
      battleId,
      effects: result.effects,
      stateVersion: state.stateVersion
    });
  } else if (state.trinityState === 'ACTIVATED' && !result.active) {
    state.trinityState = 'CANCELLED';
    await emit('TRINITY_CANCELLED', {
      battleId,
      reason: result.reason || 'preconditions_lost'
    });
  }
  return result;
}

module.exports = { evaluateTrinity };
