---
name: youtube_metadata_generator
description: Generate YouTube title, description, tags, and YouTube Kids-safe metadata from episode assets.
inputs:
  - scene_definitions
  - voiceover_script
  - thumbnail_prompt
outputs:
  - metadata/youtube_metadata.json
---

# YouTube Metadata Generator

## Steps

1. Read scene title and episode metadata.
2. Generate title:
   - Pattern: "<Episode Title> — <Emotional Hook> (Kids <Genre>)"
3. Write description including:
   - What happens in the episode
   - Who the characters are
   - Why kids will enjoy it
4. Generate tags list from:
   - episode title
   - character names
   - genre keywords
   - audience keywords
5. Validate made_for_kids = true.

## Constraints
- No misleading metadata.
- No unrelated tags.
- Description under 5000 chars.
- Tags under 500 chars total.
