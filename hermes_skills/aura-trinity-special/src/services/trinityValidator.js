// trinityValidator.js
// Preconditions:
// - Monsters #50, #75, #100 exist on the controlling team with hp > 0
// - Trinity Convergence Stone equipped by the controlling team
// - trinityState !== 'ACTIVATED' already
// state.teams: [{playerId, monsters:[{card_id, card_uid, hp, pos, ...}]}, ...]

function checkTrinity(state, controllingTeamIndex = 0) {
  const team = (state.teams || [])[controllingTeamIndex];
  if (!team) return { activated: false };

  const trioAlive = [50, 75, 100].every(id =>
    (team.monsters || []).some(m => m.card_id === id && (m.hp || 0) > 0)
  );
  if (!trioAlive) return { activated: false };

  if (state.trinity && state.trinity.activated) return { activated: false };

  const hasStone = (team.monsters || []).some(
    m => (m.equipment || []).includes('TRINITY_CONVERGENCE_STONE')
  ) || (state.playerItems || []).includes('TRINITY_CONVERGENCE_STONE');
  if (!hasStone) return { activated: false };

  state.trinity = {
    activated: true,
    members: [50, 75, 100],
    appliedAt: Date.now()
  };

  for (const m of (team.monsters || [])) {
    if ([50, 75, 100].includes(m.card_id)) {
      m.buffs = m.buffs || [];
      m.buffs.push({
        id: 'TRINITY_SYNERGY',
        multiplier: 1.5,
        expiresAt: null
      });
    }
  }

  const events = [{
    type: 'TRINITY_ACTIVATED',
    members: [50, 75, 100],
    effects: { statMultiplier: 1.5, ultimateReady: true }
  }];

  return { activated: true, events, state };
}

module.exports = { checkTrinity };
