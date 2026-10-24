# Gooniversity Pipeline Skill

> Hermes skill for orchestrating the Gooniversity content pipeline.

## Overview

This skill defines the workflow for bootstrapping, testing, and deploying
Gooniversity course content — from catalog data to Telegram channel posts
and thumbnail generation.

## Tasks

### 1. Scaffold Project

```bash
mkdir -p ~/agents/gooniversity/{data,metadata/channel_posts,thumbnails,webapp,scripts,skills/gooniversity-pipeline}
```

### 2. Create Catalog Data (TDD)

1. Write `data/catalog.test.ts` with Vitest tests (3 tests).
2. Run tests — **FAIL** (no implementation yet).
3. Write `data/catalog.ts` (types + `COURSES` + `getCourse`).
4. Write `data/catalog.json` (6 courses, 18 lessons).
5. Run tests — **PASS**.
6. Run full suite — **no regressions**.

```bash
cd ~/agents/gooniversity && npx vitest run
```

Tests run self-contained from the project dir via npx (no vitest.config.ts needed —
vitest 5 handles JSON imports and TS transforms by default).

### 3. Generate Lesson Markdown

```bash
python gooniversity/scripts/gen_lessons.py
```

### 4. Generate Thumbnails

Thumbnails are SVG files matching the kdc-next HeroArt gold-platform aesthetic (no external API needed):

```bash
cd ~/agents/gooniversity && python3 scripts/gen_thumbnail.py
```

### 5. Format & Post to Telegram

```bash
python gooniversity/scripts/format_post.py <slug>
```

## Commit

```bash
cd ~/agents && git add gooniversity/ && git commit -m "feat(gooniversity): scaffold project + catalog data"
```
