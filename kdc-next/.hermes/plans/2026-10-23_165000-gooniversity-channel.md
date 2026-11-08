# Gooniversity Telegram Channel — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

> **IMPORTANT:** Gooniversity is a **standalone project** (like `sevenminutestorysessions` and `vagary_index`), NOT a subsidiary of KingDesignCollectiveINC. It lives at `~/agents/gooniversity/` as a sibling content-production project. It does NOT integrate into `kdc-next/`.

**Goal:** Stand up Gooniversity as a standalone educational-content channel project for the Gooner community on Telegram (`@HeadMasterGooner_Bot`, chat ID `-1004207093953`), structured as a reusable content pipeline with a catalog of learnable content (mini-courses, bite-sized lessons) that can be published to the channel and consumed as a Telegram Mini App (TMA) web preview.

**Architecture:** Standalone project at `~/agents/gooniversity/` mirroring the `sevenminutestorysessions` layout: static course catalog data → lesson content → metadata → pipeline scripts → skills. The "what else to add to the Telegram channel" = content assets (courses + lessons + thumbnails) + a TMA web preview page (deployed separately, not in kdc-next).

**Tech Stack:** Static JSON data (no framework required for the pipeline), Python for content generation scripts (matching `vagary_index`), Vitest for any TS helpers, FAL.ai image generation for thumbnails, Telegram bot API for channel posting (local only; no CLASS-1 data). Git at `~/agents/` root (the holding monorepo).

---

## Step 0 — Confirm scope & assets

**Objective:** Pin down what "Gooniversity" ships first as a standalone project.

**Files:** none (clarification)

**Step 1: Review reference assets**

Inspect `~/Downloads/bropilot_*.png` for any Gooniversity wireframe. If a mockup exists, use it as ground truth for layout grammar.

**Step 2: Decide MVP content**

The user's core question is "what else should we add to the telegram channel." The MVP Gooniversity project delivers:
1. A course catalog (`data/catalog.json`) — 6 courses covering Gooner-relevant knowledge domains (gaming/streaming, football IQ, bot usage, community participation, creative tools, finance basics — framed for the Gooner community).
2. Per-course lesson content (`data/courses/<id>/`) — markdown lesson bodies.
3. Channel-ready metadata (`metadata/channel_posts/`) — Telegram-formatted post text for each course, ready to paste into the bot.
4. A TMA web preview landing page (`webapp/`) — static HTML/CSS that the bot can serve as a web preview or mini-app.
5. Pipeline scripts (`scripts/`) — generate thumbnails, compile catalog JSON, format channel posts.
6. A Hermes skill (`skills/gooniversity-pipeline`) — reusable workflow for adding new courses.

**Course domains (Gooner-focused):**
- **Aura Champions: Trinity Mastery** (✨ Gaming) — AR card battler fusion mechanics
- **Stream Setup Academy** (🎮 Tech) — hardware + software for Gooner streamers
- **Football IQ Essentials** (⚽ Sports) — reading formations, counters, meta knowledge
- **HeadMaster Bot Commands** (🤖 Tech) — using `@HeadMasterGooner_Bot` features, TMA, start params
- **Community Mod Playbook** (🛡️ Social) — moderation, engagement, running events
- **Gooner Finance 101** (💰 Finance) — crypto-treasury basics, wallet safety, NFT drops

**Open question (defer):** Is `@HeadMasterGooner_Bot` configured to serve TMA web previews? If not, the webapp works as a link-preview web page and posts go as formatted text + thumbnail. Either way the pipeline is the same.

---

## Step 1 — Scaffold Gooniversity project

**Objective:** Create the standalone project directory with the same structure as `sevenminutestorysessions`.

**Files:**
- Create: `~/agents/gooniversity/` directory tree
- Create: `~/agents/gooniversity/README.md`
- Create: `~/agents/gooniversity/data/placeholders.txt` (gitkeep substitute)

Directory layout (mirrors `sevenminutestorysessions`):
```
gooniversity/
├── README.md
├── data/
│   ├── catalog.json          # course index
│   └── courses/              # per-course lesson content
├── metadata/
│   └── channel_posts/        # Telegram-formatted post text per course
├── thumbnails/               # AI-generated hero images per course
├── webapp/                   # TMA web preview (static HTML)
├── scripts/
│   ├── build_catalog.py
│   ├── gen_thumbnail.py
│   └── format_post.py
└── skills/
    └── gooniversity-pipeline/
        └── SKILL.md
```

**Step 1: Create directory tree + README**

```bash
mkdir -p ~/agents/gooniversity/{data/courses,metadata/channel_posts,thumbnails,webapp,scripts,skills/gooniversity-pipeline}
```

`README.md`:
```md
# Gooniversity

Educational content channel for the Gooner community on Telegram (`@HeadMasterGooner_Bot`, chat `-1004207093953`).

## Structure
- `data/catalog.json` — course index (title, tag, emoji, lessons)
- `data/courses/<id>/` — per-course lesson content (markdown)
- `metadata/channel_posts/` — Telegram-formatted post text per course
- `thumbnails/` — AI-generated hero images (gold 3D platform aesthetic)
- `webapp/` — TMA web preview (static HTML, served by the bot or as link preview)
- `scripts/` — pipeline: build catalog, generate thumbnails, format posts
- `skills/gooniversity-pipeline/` — reusable Hermes skill

## Pipeline
1. Author lesson markdown in `data/courses/<id>/lesson-N.md`
2. Run `python scripts/build_catalog.py` to regenerate `data/catalog.json`
3. Run `python scripts/gen_thumbnail.py <course_id>` to generate `thumbnails/<id>.png`
4. Run `python scripts/format_post.py <course_id>` to produce `metadata/channel_posts/<id>.txt`
5. Paste the `.txt` content into `@HeadMasterGooner_Bot` to publish to the channel
```

**Step 2: Commit**

```bash
cd ~/agents
git add gooniversity/
git commit -m "chore(gooniversity): scaffold standalone project structure"
```

---

## Step 2 — Define course catalog data

**Objective:** Create the canonical course catalog as static JSON + TypeScript types (for the TMA web preview).

**Files:**
- Create: `~/agents/gooniversity/data/catalog.json`
- Create: `~/agents/gooniversity/data/catalog.ts` (TS types + import for webapp)
- Create: `~/agents/gooniversity/data/catalog.test.ts` (Vitest)

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { COURSES, getCourse } from './catalog';

describe('gooniversity catalog', () => {
  it('has 6 courses with unique ids', () => {
    expect(COURSES.length).toBe(6);
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every course has title, tagline, lessons, and emoji', () => {
    for (const c of COURSES) {
      expect(c.title).toBeTruthy();
      expect(c.tagline).toBeTruthy();
      expect(c.emoji).toBeTruthy();
      expect(c.lessons.length).toBeGreaterThan(0);
    }
  });
  it('getCourse returns null for unknown id', () => {
    expect(getCourse('nope')).toBeNull();
  });
});
```

**Step 2: Run test to verify failure**

```
npx vitest run data/catalog.test.ts
Expected: FAIL — module not found
```

**Step 3: Write implementation**

`data/catalog.ts`:
```ts
import catalogJson from './catalog.json';

export type Lesson = { id: string; title: string; duration: string; slug: string };
export type Course = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  emoji: string;
  lessons: Lesson[];
};

export const COURSES: Course[] = catalogJson as Course[];

export function getCourse(id: string): Course | null {
  return COURSES.find((c) => c.id === id) ?? null;
}
```

`data/catalog.json`:
```json
[
  {
    "id": "aura-trinity-mastery",
    "title": "Aura Champions: Trinity Mastery",
    "tagline": "Master element convergence and NFC fusion",
    "description": "Deep dive into #50/#75/#100 convergence mechanics and NTAG216 NFC fusion workflows for the AR card battler.",
    "tag": "Gaming",
    "emoji": "✨",
    "lessons": [
      { "id": "trinity-theory", "title": "Trinity Theory", "duration": "4 min", "slug": "trinity-theory" },
      { "id": "fusion-flow", "title": "Fusion Flow", "duration": "6 min", "slug": "fusion-flow" },
      { "id": "convergence-50", "title": "Convergence #50", "duration": "12 min", "slug": "convergence-50" }
    ]
  },
  {
    "id": "stream-setup-academy",
    "title": "Stream Setup Academy",
    "tagline": "Hardware and software for Gooner streamers",
    "description": "Build a budget streaming rig, configure OBS, and grow your audience on Twitch/YouTube.",
    "tag": "Tech",
    "emoji": "🎮",
    "lessons": [
      { "id": "budget-rig", "title": "Budget Rig Build", "duration": "5 min", "slug": "budget-rig" },
      { "id": "obs-config", "title": "OBS Studio Config", "duration": "6 min", "slug": "obs-config" },
      { "id": "audience-growth", "title": "Audience Growth", "duration": "7 min", "slug": "audience-growth" }
    ]
  },
  {
    "id": "football-iq-essentials",
    "title": "Football IQ Essentials",
    "tagline": "Read formations, counters, and meta knowledge",
    "description": "Understand tactical formations, counter-strategies, and how to spot mismatches in the 23-man squad.",
    "tag": "Sports",
    "emoji": "⚽",
    "lessons": [
      { "id": "formations-101", "title": "Formations 101", "duration": "4 min", "slug": "formations-101" },
      { "id": "counter-play", "title": "Counter Play", "duration": "6 min", "slug": "counter-play" },
      { "id": "squad-meta", "title": "Squad Meta", "duration": "5 min", "slug": "squad-meta" }
    ]
  },
  {
    "id": "headmaster-bot",
    "title": "HeadMaster Bot Commands",
    "tagline": "Using @HeadMasterGooner_Bot features and TMA",
    "description": "Master every command in @HeadMasterGooner_Bot: leaderboards, stats, TMA deep-links, and start_param navigation.",
    "tag": "Tech",
    "emoji": "🤖",
    "lessons": [
      { "id": "bot-basics", "title": "Bot Basics", "duration": "3 min", "slug": "bot-basics" },
      { "id": "leaderboards", "title": "Leaderboards & Stats", "duration": "4 min", "slug": "leaderboards" },
      { "id": "tma-deep-links", "title": "TMA Deep Links", "duration": "5 min", "slug": "tma-deep-links" }
    ]
  },
  {
    "id": "community-mod-playbook",
    "title": "Community Mod Playbook",
    "tagline": "Moderation, engagement, and event running",
    "description": "Run a tight ship: enforce rules, schedule events, and keep the chat active without burning out.",
    "tag": "Social",
    "emoji": "🛡️",
    "lessons": [
      { "id": "mod-tools", "title": "Mod Tools", "duration": "3 min", "slug": "mod-tools" },
      { "id": "event-scheduling", "title": "Event Scheduling", "duration": "5 min", "slug": "event-scheduling" },
      { "id": "engagement-loops", "title": "Engagement Loops", "duration": "4 min", "slug": "engagement-loops" }
    ]
  },
  {
    "id": "gooner-finance-101",
    "title": "Gooner Finance 101",
    "tagline": "Crypto basics, wallet safety, NFT drops",
    "description": "Safe introduction to wallets, token safety, NFT drops, and how the KDC treasury model works for the community.",
    "tag": "Finance",
    "emoji": "💰",
    "lessons": [
      { "id": "wallet-setup", "title": "Wallet Setup", "duration": "5 min", "slug": "wallet-setup" },
      { "id": "token-safety", "title": "Token Safety", "duration": "6 min", "slug": "token-safety" },
      { "id": "nft-drops", "title": "NFT Drops", "duration": "7 min", "slug": "nft-drops" }
    ]
  }
]
```

**Step 4: Run test to verify pass**

```
npx vitest run data/catalog.test.ts
Expected: PASS — 3 passed
```

**Step 5: Commit**

```bash
cd ~/agents
git add gooniversity/data/catalog.json gooniversity/data/catalog.ts gooniversity/data/catalog.test.ts
git commit -m "feat(gooniversity): add course catalog data + TS types + tests"
```

> Note: The repo root (`~/agents/.git`) is the shared git root — commits from `~/agents` cover all sub-projects.

---

## Step 3 — Author lesson content (markdown)

**Objective:** Write the lesson body markdown for all 6 courses (3 lessons each = 18 files), stored under `data/courses/<id>/lesson-<slug>.md`.

**Files:**
- Create: 18 markdown files under `data/courses/<course-id>/`

**Step 1: Example template** (for `data/courses/aura-trinity-mastery/lesson-trinity-theory.md`):

```md
# Trinity Theory

> **Course:** Aura Champions: Trinity Mastery · **Lesson:** 1 of 3

## What is Trinity?

Trinity stones are rarity-convergence catalysts. When two cards of the same element reach rarity threshold #50, their stats fuse into a single #75 card, gaining bonus attributes and a fusion-specific ability.

## Convergence Thresholds

- **#50** — First fusion: 2 cards → 1 upgraded card
- **#75** — Second fusion: 2 × #50 cards → 1 #75 card
- **#100** — Third fusion: 2 × #75 cards → 1 #100 card

## Element Rules

| Element 1 | Element 2 | Result         |
|-----------|-----------|----------------|
| Water     | Water     | Water #50      |
| Fire      | Fire      | Fire #50       |
| Water     | Fire      | Steam #50 (rare) |

## Next: Fusion Flow
Tap an NFC-enabled physical card, verify the hash, then tap the second card within 5 seconds to trigger fusion.
```

**Step 2: Generate all 18 lesson files**

One markdown file per lesson across 6 courses (3 lessons each = 18 files), stored at `data/courses/<course-id>/lesson-<slug>.md`. The implementer generates these via bulk `write_file` calls or a loop — see `scripts/gen_lessons.py` for automation reference.

**Step 3: Commit**

```bash
git add gooniversity/data/courses/
git commit -m "feat(gooniversity): author 18 lesson markdown bodies"
```

---

## Step 4 — Build the catalog compilation script

**Objective:** Python script that scans `data/courses/` and (re)generates `data/catalog.json`, so adding a new course = drop a folder + run one script.

**Files:**
- Create: `~/agents/gooniversity/scripts/build_catalog.py`

**Step 1: Write script**

```python
#!/usr/bin/env python3
"""Rebuild data/catalog.json from the lesson markdown files in data/courses/."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES_DIR = ROOT / "data" / "courses"
OUTPUT = ROOT / "data" / "catalog.json"

# Metadata overrides for fields not in markdown
META = {
    "aura-trinity-mastery": { "title": "Aura Champions: Trinity Mastery", "tagline": "Master element convergence and NFC fusion", "description": "...", "tag": "Gaming", "emoji": "✨" },
    "stream-setup-academy": { "title": "Stream Setup Academy", "tagline": "Hardware and software for Gooner streamers", "description": "...", "tag": "Tech", "emoji": "🎮" },
    "football-iq-essentials": { "title": "Football IQ Essentials", "tagline": "Read formations, counters, and meta knowledge", "description": "...", "tag": "Sports", "emoji": "⚽" },
    "headmaster-bot": { "title": "HeadMaster Bot Commands", "tagline": "Using @HeadMasterGooner_Bot features and TMA", "description": "...", "tag": "Tech", "emoji": "🤖" },
    "community-mod-playbook": { "title": "Community Mod Playbook", "tagline": "Moderation, engagement, and event running", "description": "...", "tag": "Social", "emoji": "🛡️" },
    "gooner-finance-101": { "title": "Gooner Finance 101", "tagline": "Crypto basics, wallet safety, NFT drops", "description": "...", "tag": "Finance", "emoji": "💰" },
}

def main():
    courses = []
    for course_dir in sorted(COURSES_DIR.iterdir()):
        if not course_dir.is_dir():
            continue
        cid = course_dir.name
        meta = META.get(cid, {})
        lessons = []
        for md in sorted(course_dir.glob("lesson-*.md")):
            title = re.search(r"^# (.+)$", md.read_text(encoding="utf-8"), re.M)
            lessons.append({
                "id": md.stem.replace("lesson-", ""),
                "title": title.group(1) if title else md.stem,
                "duration": "5 min",  # parse from body or default
                "slug": md.stem.replace("lesson-", ""),
            })
        courses.append({
            "id": cid,
            "title": meta.get("title", cid),
            "tagline": meta.get("tagline", ""),
            "description": meta.get("description", ""),
            "tag": meta.get("tag", "General"),
            "emoji": meta.get("emoji", "📚"),
            "lessons": lessons,
        })
    OUTPUT.write_text(json.dumps(courses, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(courses)} courses, {sum(len(c['lessons']) for c in courses)} lessons to {OUTPUT}")

if __name__ == "__main__":
    main()
```

**Step 2: Test**

```bash
cd ~/agents/gooniversity
python3 scripts/build_catalog.py
# Re-run vitest to confirm catalog.json still matches
cd ~/agents && npx vitest run gooniversity/data/catalog.test.ts
Expected: PASS
```

**Step 3: Commit**

```bash
git add gooniversity/scripts/build_catalog.py gooniversity/data/catalog.json
git commit -m "feat(gooniversity): add catalog compilation script"
```

---

## Step 5 — Generate thumbnails (FAL.ai)

**Objective:** Generate a gold-3D-platform-style hero thumbnail per course, matching the KDC aesthetic (gold metallic, concentric rings, warm glow).

**Files:**
- Create: `~/agents/gooniversity/scripts/gen_thumbnail.py`
- Output: `~/agents/gooniversity/thumbnails/<id>.png` (6 files)

**Step 1: Write script**

```python
#!/usr/bin/env python3
"""Generate a gold-platform hero thumbnail for a Gooniversity course via FAL.ai."""
import sys
from pathlib import Path
import requests  # or use the FAL SDK

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "thumbnails"
OUT.mkdir(exist_ok=True)

PROMPT_TEMPLATE = (
    "Gold 3D {emoji} floating above a dark platform with concentric gold rings, "
    "warm golden glow from below, minimalist flat design, black background, "
    "corporate luxury, SVG icon style, square -- {title} -- {tagline}"
)

def main():
    if len(sys.argv) < 2:
        print("Usage: gen_thumbnail.py <course_id>"); sys.exit(1)
    cid = sys.argv[1]
    import json
    catalog = json.loads((ROOT / "data" / "catalog.json").read_text())
    course = next((c for c in catalog if c["id"] == cid), None)
    if not course:
        print(f"Course {cid} not found"); sys.exit(1)
    prompt = PROMPT_TEMPLATE.format(**course)
    # Use image_generate tool (FAL.ai Flux) — handled by Hermes, not raw requests
    print(prompt)

if __name__ == "__main__":
    main()
```

**Step 2: Generate 6 thumbnails**

Each course uses the same prompt pattern. Use the `image_generate` tool with `aspect_ratio: square` for each:

- `aura-trinity-mastery`: "Gold 3D ✨ floating above dark platform with concentric gold rings..."
- `stream-setup-academy`: "Gold 3D 🎮 floating above dark platform..."
- `football-iq-essentials`: "Gold 3D ⚽ floating above dark platform..."
- `headmaster-bot`: "Gold 3D 🤖 floating above dark platform..."
- `community-mod-playbook`: "Gold 3D 🛡️ floating above dark platform..."
- `gooner-finance-101`: "Gold 3D 💰 floating above dark platform..."

**Step 3: Commit**

```bash
git add gooniversity/thumbnails/
git commit -m "feat(gooniversity): generate 6 hero thumbnails"
```

---

## Step 6 — Format Telegram channel posts

**Objective:** Produce ready-to-paste Telegram post text for each course, including the course title, tagline, emoji, a short description, and lesson list with durations.

**Files:**
- Create: `~/agents/gooniversity/scripts/format_post.py`
- Output: `~/agents/gooniversity/metadata/channel_posts/<id>.txt` (6 files)

**Step 1: Write script**

```python
#!/usr/bin/env python3
"""Format a Gooniversity course as a Telegram channel post."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main():
    if len(sys.argv) < 2:
        print("Usage: format_post.py <course_id>"); sys.exit(1)
    cid = sys.argv[1]
    catalog = json.loads((ROOT / "data" / "catalog.json").read_text())
    course = next((c for c in catalog if c["id"] == cid), None)
    if not course:
        print(f"Course {cid} not found"); sys.exit(1)

    lines = [
        f"{course['emoji']} <b>{course['title']}</b>",
        f"_{course['tagline']}_",
        "",
        course['description'],
        "",
        "<b>Course contents:</b>",
    ]
    for i, l in enumerate(course['lessons'], 1):
        lines.append(f"{i}. <b>{l['title']}</b> — {l['duration']}")
    lines += [
        "",
        f"#{course['tag']} #Gooniversity",
    ]
    text = "\n".join(lines)
    out = ROOT / "metadata" / "channel_posts" / f"{cid}.txt"
    out.write_text(text, encoding="utf-8")
    print(f"Wrote {out}")

if __name__ == "__main__":
    main()
```

**Step 2: Generate 6 posts**

```bash
cd ~/agents/gooniversity
for cid in aura-trinity-mastery stream-setup-academy football-iq-essentials headmaster-bot community-mod-playbook gooner-finance-101; do
  python3 scripts/format_post.py $cid
done
```

**Step 3: Commit**

```bash
git add gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add Telegram channel post formatter"
```

---

## Step 7 — TMA web preview

**Objective:** A static HTML page (`webapp/index.html`) that renders the course catalog, matchable to the gold 3D platform aesthetic. This is what the bot serves as a web preview or TMA.

**Files:**
- Create: `~/agents/gooniversity/webapp/index.html`
- Create: `~/agents/gooniversity/webapp/styles.css`

**Step 1: Write HTML**

Static HTML + inline CSS (no framework — this is a standalone preview). Matches the `public/heroes/` gold platform aesthetic from kdc-next. Render the 6 courses as gold-accented cards.

**Step 2: Commit**

```bash
git add gooniversity/webapp/
git commit -m "feat(gooniversity): add TMA web preview page"
```

---

## Step 8 — Hermes skill (reusable pipeline)

**Objective:** Package the Gooniversity content pipeline as a reusable Hermes skill so the user can invoke it via `delegate_task` or cron.

**Files:**
- Create: `~/agents/gooniversity/skills/gooniversity-pipeline/SKILL.md`

**Step 1: Write SKILL.md**

Follows the standard skill format — trigger keywords (gooniversity, telegram, channel, course, lesson), pipeline steps, file paths, example invocations.

**Step 2: Register**

Skills under `~/agents/` are auto-discovered by Hermes. No registration needed.

**Step 3: Commit**

```bash
git add gooniversity/skills/gooniversity-pipeline/SKILL.md
git commit -m "feat(gooniversity): add Hermes pipeline skill"
```

---

## Risks, Tradeoffs, Open Questions

- **Standalone vs. embedded:** Gooniversity does NOT go into `kdc-next/`. It is a sibling project under `~/agents/gooniversity/`. This was the user's correction.
- **Bot integration:** If `@HeadMasterGooner_Bot` doesn't already accept TMA web apps or `start_param` deep-links, the channel posts work as plain formatted-text + thumbnail. The web preview is still useful as a link in the bot's pinned message or channel description.
- **Thumbnail generation:** FAL.ai is available via Nous subscription. No API key needed — use `image_generate` tool.
- **CLASS-1 isolation:** Gooniversity content is public-facing educational content. No KDC ledger, tokenomics, or anti-cheat data should ever be referenced in the channel posts (even the "KDC Treasury" course is a general tokenomics primer, not the actual ledger).
- **Git root:** Commits go from `~/agents/` (the monorepo root), which holds all sub-projects.

---

## Verification

```bash
cd ~/agents/gooniversity
python3 scripts/build_catalog.py    # regenerates catalog.json
python3 scripts/format_post.py aura-trinity-mastery  # generates one post
npx vitest run data/catalog.test.ts # all green
cd ~/agents && git log --oneline -8  # confirm commits
ls thumbnails/                      # 6 PNGs
ls metadata/channel_posts/          # 6 TXT files
```
