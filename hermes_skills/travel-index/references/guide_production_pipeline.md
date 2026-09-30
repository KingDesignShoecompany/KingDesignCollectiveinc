# The Vagary Index — 250-Country Guide Production Pipeline

## Objective
Produce a comprehensive, consistent travel guide for all 250 countries as both markdown and video assets.

## Output Standards
- Text: Markdown + JSON for structured data
- Video: 8-12 minute long-form YouTube script + narration + B-roll map
- Audio: Optional narration-only MP3 for accessibility

## Pipeline Stages

### Stage 1: Research
Agent: Copywriter (ops-1)
Input: Country name + ISO code
Output: history_culture_overview.md, entry_requirements.json, climate_summary.md, attractions.json, fun_facts.json, phrase_cards.json, couples_itinerary.json, solo_itinerary.json, source_citations.json
Dependencies: none
Validation:
  - 800+ words in overview
  - 100 fun facts with categories
  - 20 phrase cards with all required fields
  - 14-day itineraries for both Solo and Couples
  - Citations from official government/tourism sources

### Stage 2: Scripting
Agent: Copywriter (ops-1)
Input: All Stage 1 outputs
Output: youtube_longform_script.md
Rules:
  - Opening hook under 10 seconds
  - 8-12 minute runtime at ~150 wpm
  - Every 90 seconds: visual CTA or on-screen text
  - End with clear pitch to the 250-Country Guide
  - Sidebar: B-roll shot list mapped to timestamp

### Stage 3: Voice & Sound
Agent: Audio Producer
Input: youtube_longform_script.md
Output:
  - narration.mp3
  - ambient_music_bed.mp3
  - mixed_final.mp3
Rules:
  - Narration voice: neutral, warm, authoritative
  - Music bed: low-volume cinematic ambient throughout
  - Fade music under spoken sections, swell on transitions

### Stage 4: Visual Assembly
Agent: Media Planner (ops-2)
Input: B-roll shot list + mixed_final.mp3
Output:
  - storyboard.md
  - thumbnail_variants.png (3 options)
  - final_video.mp4
Rules:
  - Establish physical place in first 10 seconds
  - Map overlay for entry requirements and climate
  - Crown watermark 10% opacity, bottom right
  - End card: Guide CTA + link

### Stage 5: Metadata & Publishing
Agent: Media Planner (ops-2)
Input: final_video.mp4 + all source assets
Output:
  - title.txt
  - description.txt
  - tags.json
  - youtube_upload_checklist.md
Rules:
  - Title format: "[Country] Travel Guide 2026 | solo & couples | best time to visit"
  - Description includes: timestamps, entry requirements summary, Guide CTA
  - Tags: country + "solo travel", "couples travel", "travel guide", "The Vagary Index"

## Per-Country Directory Layout
batch_output/{country_code}/
  ├── 01_history_culture_overview.md
  ├── 02_entry_requirements.json
  ├── 03_climate_summary.md
  ├── 04_attractions_local_hotspots.json
  ├── 05_fun_facts.json
  ├── 06_phrase_cards.json
  ├── 07_couples_itinerary.json
  ├── 08_solo_itinerary.json
  ├── 09_source_citations.json
  ├── 10_youtube_longform_script.md
  ├── 11_storyboard.md
  └── assets/
      ├── narration.mp3
      ├── ambient_music_bed.mp3
      ├── mixed_final.mp3
      ├── thumbnail_variants.png
      └── final_video.mp4

## Quality Gates
- All 11 text/JSON files present per country
- narration.mp3 length matches script duration ±3%
- thumbnail_variants.png contains 3 distinct options
- source_citations.json includes official URLs for entry/health/climate
- youtube_upload_checklist.md completed before upload

## Parallel Execution
- Max 5 countries in parallel
- Within each country, stages 1-3 can run in parallel with prior country
- Stages 4-5 must wait for Stage 3 to complete for that country
