// trinity_activation_test.js
const { checkTrinity } = require('../src/services/trinityValidator');

const baseState = (overrides = {}) => ({
  stateVersion: 1,
  teams: [
    {
      playerId: 'p1',
      monsters: [
        { card_id: 50, hp: 100, equipment: [] },
        { card_id: 75, hp: 100, equipment: [] },
        { card_id: 100, hp: 100, equipment: [] }
      ]
    }
  ],
  playerItems: [],
  ...overrides
});

const tests = [
  {
    name: 'activates with trio alive and stone in equipment',
    state: baseState({
      teams: [
        {
          playerId: 'p1',
          monsters: [
            { card_id: 50, hp: 100, equipment: ['TRINITY_CONVERGENCE_STONE'] },
            { card_id: 75, hp: 100, equipment: [] },
            { card_id: 100, hp: 100, equipment: [] }
          ]
        }
      ]
    }),
    expected: true
  },
  {
    name: 'does not activate without stone',
    state: baseState(),
    expected: false
  },
  {
    name: 'does not activate if already activated',
    state: baseState({
      teams: [
        {
          playerId: 'p1',
          monsters: [
            { card_id: 50, hp: 100, equipment: ['TRINITY_CONVERGENCE_STONE'] },
            { card_id: 75, hp: 100, equipment: [] },
            { card_id: 100, hp: 100, equipment: [] }
          ]
        }
      ],
      trinity: { activated: true }
    }),
    expected: false
  }
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = checkTrinity(t.state, 0);
  if (result.activated === t.expected) {
    passed++;
  } else {
    failed++;
    console.log('FAIL:', t.name);
    console.log(' expected:', t.expected);
    console.log(' got:', result.activated);
  }
}

console.log(`tests=${tests.length} passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
