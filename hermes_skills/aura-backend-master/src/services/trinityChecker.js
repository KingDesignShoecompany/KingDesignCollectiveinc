// trinityChecker.js
// Server-side Trinity activation checker (pseudocode-ready)
// Local copy for backend self-containment (battle resolution owns Trinity checks).

function hasMonster(state, cardId) {
  if (!state || !Array.isArray(state.teams)) return null;
  for (const team of state.teams) {
    for (const m of team.monsters) {
      if (m.card_id === cardId && m.hp > 0) return m;
    }
  }
  return null;
}

function teamHasItem(state, itemCardId, teamIndex) {
  const team = state.teams[teamIndex];
  if (!team) return false;
  for (const eq of team.equipment || []) {
    if (eq.item_card_id === itemCardId) return true;
  }
  return false;
}

function checkTrinity(state, controllingTeamIndex) {
  if (!state || !Array.isArray(state.teams)) return { active: false };
  const has50 = !!hasMonster(state, 50);
  const has75 = !!hasMonster(state, 75);
  const has100 = !!hasMonster(state, 100);
  const hasStone = teamHasItem(state, 50, controllingTeamIndex);

  if (!has50 || !has75 || !has100) return { active: false };
  if (!hasStone) return { active: false };
  if (state.trinityState === 'ACTIVATED') return { active: false, alreadyActivated: true };

  return {
    active: true,
    effects: {
      statMultiplier: 1.5,
      ultimateReady: true,
      sharedConsciousness: true
    }
  };
}

module.exports = { checkTrinity };
