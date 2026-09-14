#!/usr/bin/env bash
cd /usr/skills || exit 1
zip -r ue-client-skill.zip ue-client
echo "Archive created at /usr/skills/ue-client-skill.zip"
