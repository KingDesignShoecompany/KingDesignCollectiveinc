#!/usr/bin/env bash
SKILL_DIR="/usr/skills/tournament-admin"
ARCHIVE="/usr/skills/tournament-admin-skill.zip"
cd /usr/skills || exit 1
zip -r "$(basename "$ARCHIVE")" "$(basename "$SKILL_DIR")"
echo "Archive created at $ARCHIVE"
