---
name: kids-story-generator
description: Turn raw kids story text into structured episode artifacts: scene list, character sheets, style guide, and voiceover script.
---

# Kids Story Generator

Use this skill when the user provides a raw story manuscript and wants an episode plan.

## Steps

1. Read the provided story text.
2. Extract scene boundaries and titles.
3. Create a `scene_definitions.json` with:
   - episode metadata
   - character list with visual descriptions
   - style guide
   - scenes array with id, title, duration, voiceover, shots
4. Write a `audio/voiceover_script.txt` with narrator lines per scene.
5. Emit the file paths back to the user.

## Output Paths
- `assets/<book>/<episode>/scene_definitions.json`
- `audio/voiceover_script.txt`

## Constraints
- Target episode duration: 90-150 seconds.
- Voiceover must be kid-safe, clear, and under 20 words per scene.
- Characters should be visually distinct.
