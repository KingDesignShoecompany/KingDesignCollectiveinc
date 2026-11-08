---
name: fooocus-image-generator
description: Generate scene images from scene definitions using Fooocus-style prompts and character consistency.
---

# Fooocus Image Generator

Use this skill when scene definitions are ready and images need to be generated.

## Workflow
1. Read `scene_definitions.json`.
2. For each scene, construct a Fooocus prompt using:
   - scene description
   - character descriptions
   - style guide
3. Recommended prompt file: `prompts.md` (human readable) or inline prompt blocks.
4. Generate output images into:
   - `assets/<book>/<episode>/scenes/scene<id>/`
5. Naming: `scene<id>_shot<nn>.png`.

## Prompt Structure
[Scene shot description], [character names], soft pastel storybook style, kid-friendly sci-fi, round shapes, big expressive eyes, gentle lighting, bright warm colors.

## Constraints
- Keep character visual descriptions consistent across all prompts.
- Output PNGs only.
- Avoid dark themes; pastel palette only.
