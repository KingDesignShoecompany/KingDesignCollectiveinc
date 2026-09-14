// tournamentRules.js
const penaltyLadder = [
  'Warning',
  'Game Loss',
  'Match Loss',
  'Tournament DQ',
  'Ban'
];

function checkSideboard({ currentChanges, allowed = 3 }) {
  return currentChanges <= allowed;
}

function checkRoundTime({ elapsedSeconds, limitSeconds = 45 * 60 }) {
  return elapsedSeconds <= limitSeconds;
}

function canUseTrinity({ trinityAllowed }) {
  return !!trinityAllowed;
}

module.exports = {
  penaltyLadder,
  checkSideboard,
  checkRoundTime,
  canUseTrinity
};
