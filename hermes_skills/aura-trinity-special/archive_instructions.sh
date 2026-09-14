#!/usr/bin/env bash
SKILL_DIR="/usr/skills/trinity-special"
ARCHIVE="/usr/skills/trinity-special-skill.zip"
cd /usr/skills || exit 1
zip -r "$(basename "$ARCHIVE")" "$(basename "$SKILL_DIR")"
echo "Archive created at $ARCHIVE"
