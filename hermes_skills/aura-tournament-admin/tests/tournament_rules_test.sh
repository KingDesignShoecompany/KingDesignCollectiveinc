#!/usr/bin/env bash
# tournament_rules_test.sh
# Validates basic tournament rule enforcement. Resolves the Hermes skill root
# from this script's location; writes the probe JS next to itself (Windows-path
# safe, no /tmp MSYS mismatch) and runs it with node.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -W)"
SKILLS_ROOT="${SKILLS_ROOT//\//\\}"
TMPJS="$SCRIPT_DIR/tournament_rules_test.generated.js"
# Convert MSYS path to Windows-native so the node binary resolves it
case "$TMPJS" in
  /?*) TMPJS="$(cd "$(dirname "$TMPJS")" && pwd -W)/$(basename "$TMPJS")" ;;
esac
TMPJS="${TMPJS//\//\\}"

cat > "$TMPJS" <<EOF
const path = require('path');
const ROOT = process.env.SKILLS_ROOT;
const m = require(path.join(ROOT, 'aura-tournament-admin/src/services/tournamentRules'));
console.log('sideboard_ok', m.checkSideboard({ currentChanges: 2 }));
console.log('sideboard_bad', m.checkSideboard({ currentChanges: 4 }));
console.log('round_ok', m.checkRoundTime({ elapsedSeconds: 1200 }));
console.log('trinity_allowed', m.canUseTrinity({ trinityAllowed: true }));
console.log('trinity_banned', m.canUseTrinity({ trinityAllowed: false }));
EOF

SKILLS_ROOT="$SKILLS_ROOT" node "$TMPJS"
rm -f "$TMPJS"
