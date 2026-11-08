---
name: video_assembler
description: Assemble a final MP4 from generated images, TTS audio, subtitles, and music.
inputs:
  - scenes_dir: assets/<book>/<episode>/scenes
  - audio_dir: audio
  - output_path: episodes/book3/episode1.mp4
---

# Video Assembler

Use this skill when images and voiceover are ready.

## Steps

1. Read scene image paths:
   assets/book3/episode1/scenes/scene1/scene1_shot01.png
   assets/book3/episode1/scenes/scene2/scene2_shot01.png
   ...

2. Use scene_definitions.json durations for timing.

3. Assembler rules:
   - Static scene = 3.5s image + 1s crossfade
   - Keep narration aligned to scene start
   - Allow no more than 10s per scene for pace

4. Output:
   - episodes/book3/episode1.mp4
   - chapters automatically inferred from scene transitions

## Platform Constraints
- MP4 H.264
- 1080x1080 or 1080x1920
- <300MB for YouTube Kids safety
