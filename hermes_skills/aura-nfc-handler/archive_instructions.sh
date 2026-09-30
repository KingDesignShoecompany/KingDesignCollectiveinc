#!/usr/bin/env bash
# Create a zip archive of the skill directory
SKILL_DIR="/usr/skills/nfc-handler"
ARCHIVE="/usr/skills/nfc-handler-skill.zip"
cd /usr/skills || exit 1
zip -r "$(basename "$ARCHIVE")" "$(basename "$SKILL_DIR")"
echo "Archive created at $ARCHIVE"
