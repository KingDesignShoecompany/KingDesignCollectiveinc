# Gooniversity — Additional Channel Content Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Expand Gooniversity's Telegram channel content beyond the 31 posts already built (index, teasers, course overviews, lesson posts) with interactive and recurring content formats that boost engagement and retention.

**Architecture:** Generate additional content types as formatted text posts that paste directly into `@HeadMasterGooner_Bot` for chat `-1004207093953`, using the existing `format_post.py` pattern (read `catalog.json`, output Markdown).

**Tech Stack:** Python scripts (no external APIs), plain text output, telegram URL scheme `t.me/HeadMasterGooner_Bot/app?start_param=<param>`. Git at `~/agents/` root.

---

## Current state (already shipped)
- 6 course overview posts (`<id>.txt`)
- 6 teaser posts (`<id>.teaser.txt`)
- 18 lesson posts with prev/next nav (`<id>-<slug>.txt`)
- 1 course index post (`_index.txt`)
- 6 SVG thumbnails (gold platform, matching KDC HeroArt)
- TMA web preview at `webapp/index.html` (supports `?cid=` and `?cid=&lesson=`)

---

## What to add

### Content ideas for additional posts:

1. **Poll posts** (3-5 options each, using Telegram's native poll format text)
   - "Which course should we expand next? 🎮 vs ⚽ vs 💰"
   - "Favorite lesson so far? 1/3 of Aura Trinity Mastery"
   - "HeadMaster Bot: which command do you use most?"

2. **Progress tracker posts** (per-course completion badge text)
   - "🏆 You finished Aura Trinity Mastery! Share this badge in the chat."
   - Generated for each of the 18 lesson endings

3. **Weekly digest posts** (compile 3-5 lesson posts into one)
   - "This week on Gooniversity: Stream Setup, Football IQ, Bot Basics"

4. **Community spotlight posts** (template-based, user submissions)
   - "🌟 Gooner of the week: @username mastered Trinity Theory!"
   - (Requires bot integration to collect submissions — deferred)

5. **Quiz posts** (text-based Q&A at the end of each lesson)
   - "Quick check: what's the convergence number for a 3× #50 fusion? Reply below!"

6. **Resource pack posts** (bonus content links)
   - "📎 Aura Trinity Mastery: download the Fusion Flow cheat sheet (PDF)"

---

## Step 1 — Generate poll posts

**Objective:** Create 6 poll question posts (one per course) to promote engagement.

**Files:**
- Modify: `gooniversity/scripts/format_post.py` (add `--poll` mode)
- Output: `gooniversity/metadata/channel_posts/<id>.poll.txt` (6 files)

**Step 1: Add `format_poll_post()` to format_post.py**

```python
def format_poll_post(course: dict) -> str:
    """Build a formatted Telegram poll post for a course."""
    emoji = course.get("emoji", "📚")
    title = course.get("title", "")
    tag = course.get("tag", "Gooniversity")
    questions = POLL_QUESTIONS.get(course["id"], ["What's your biggest challenge?", "Too easy!", "Spot on", "Hard but fair", "Need more practice"])

    lines = [
        f"{emoji} *Gooniversity Poll: {title}*",
        "",
        questions[0],
    ]
    for q in questions[1:]:
        lines.append(f"• {q}")
    lines += ["", "Reply with your answer below ⬇️", "", f"#{tag} #Gooniversity #Poll"]
    return "\n".join(lines)


POLL_QUESTIONS = {
    "aura-trinity-mastery": ["Trinity Theory was:", "🔥 Too easy!", "🎯 Spot on", "🤯 Brain melted", "❓ I'm lost"],
    "stream-setup-academy": ["My stream setup is stuck on:", "🖥️ Hardware", "⚙️ Software (OBS)", "👥 Audience", "💸 Budget"],
    "football-iq-essentials": ["Which formation do you struggle against most?", "4-3-3", "4-2-3-1", "3-5-2", "Something else"],
    "headmaster-bot": ["Which HeadMaster Bot feature do you use?", "📊 Leaderboards", "🔗 TMA deep-links", "🤖 Auto-moderation", "Nothing — teaching me!"],
    "community-mod-playbook": ["Your biggest moderation challenge is:", "⚠️ Toxicity", "📅 Event scheduling", "🔔 Low engagement", "👥 Managing volunteers"],
    "gooner-finance-101": ["Crypto scared me because:", "🔑 Lost my wallet", "📉 Lost my money", "👁️‍🗨️ Can't read charts", "🕵️‍♂️ Too many scams"],
}
```

**Step 2: Add `--poll` flag**

```python
parser.add_argument("--poll", action="store_true", help="Generate a poll post for the course")
```

In `main()`, before `--index`:
```python
if args.poll:
    if not args.course_id or args.course_id == "all":
        # Generate polls for all 6 courses
        for course in catalog:
            post = format_poll_post(course)
            out = OUTPUT_DIR / f"{course['id']}.poll.txt"
            out.write_text(post + "\n", encoding="utf-8")
        return 0
    course = find_course(catalog, args.course_id)
    if course is None:
        print(f"Error: course '{args.course_id}' not found", file=sys.stderr)
        return 1
    post = format_poll_post(course)
    out = OUTPUT_DIR / f"{args.course_id}.poll.txt"
    print(post)
    out.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {out}", file=sys.stderr)
    return 0
```

**Step 3: Generate all poll posts**

```bash
cd ~/agents/gooniversity
python3 scripts/format_post.py --poll
```

**Step 4: Verify**

```bash
ls metadata/channel_posts/*.poll.txt | wc -l  # expect 6
cat metadata/channel_posts/aura-trinity-mastery.poll.txt  # check format
```

**Step 5: Commit**

```bash
cd ~/agents
git add gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add poll posts for all 6 courses"
```

---

## Step 2 — Generate completion badge posts

**Objective:** Create 18 "completion badge" posts (one per lesson) — users can share these after finishing a lesson.

**Files:**
- Modify: `gooniversity/scripts/format_post.py` (add `--badge` mode)
- Output: `gooniversity/metadata/channel_posts/<id>-<slug>.badge.txt` (18 files)

**Step 1: Add `format_badge_post()`**

```python
def format_badge_post(course: dict, lesson: dict, index: int) -> str:
    """Build a completion badge post for a lesson."""
    emoji = lesson.get("emoji", "✅")
    lesson_title = lesson.get("title", "")
    course_title = course.get("title", "")
    duration = lesson.get("duration", "")
    tag = course.get("tag", "Gooniversity")
    slug = lesson_slug(lesson)
    deep_link = f"t.me/{BOT_USERNAME}/app?start_param=completed_{course['id']}_{slug}"

    lines = [
        f"🏆 *{emoji} Lesson Complete!*",
        "",
        f"*{course_title} · Lesson {index}*",
        f"_{lesson_title}_ — {duration}",
        "",
        f"I just finished this lesson on Gooniversity! Tap to verify:",
        f"👉 {deep_link}",
        "",
        f"#{tag} #Gooniversity #Badge#{index}",
    ]
    return "\n".join(lines)
```

**Step 2: Add `--badge` flag**

```python
parser.add_argument("--badge", help="Lesson slug — generates a completion badge post")
```

In `main()`:
```python
if args.badge:
    lesson = find_lesson(course, args.badge)
    if lesson is None:
        print(f"Error: lesson '{args.badge}' not found in course '{args.course_id}'", file=sys.stderr)
        return 1
    idx = course["lessons"].index(lesson) + 1
    post = format_badge_post(course, lesson, idx)
    out = OUTPUT_DIR / f"{args.course_id}-{args.badge}.badge.txt"
    print(post)
    out.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {out}", file=sys.stderr)
    return 0
```

**Step 3: Generate all 18 badges**

```bash
cd ~/agents/gooniversity
python3 scripts/format_post.py all --badge-mode
```

Need to add a `--badge-all` flag for batch generation:
```python
parser.add_argument("--badge-all", action="store_true", help="Generate completion badges for all lessons")

if args.badge_all:
    for course in catalog:
        for i, lesson in enumerate(course["lessons"], 1):
            post = format_badge_post(course, lesson, i)
            out = OUTPUT_DIR / f"{course['id']}-{lesson_slug(lesson)}.badge.txt"
            out.write_text(post + "\n", encoding="utf-8")
    print(f"Generated {sum(len(c['lessons']) for c in catalog)} badge posts", file=sys.stderr)
    return 0
```

**Step 4: Verify**

```bash
ls metadata/channel_posts/*.badge.txt | wc -l  # expect 18
cat metadata/channel_posts/aura-trinity-mastery-trinity-theory.badge.txt
```

**Step 5: Commit**

```bash
git add gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add 18 completion badge posts"
```

---

## Step 3 — Generate weekly digest posts

**Objective:** Create digest posts that bundle 2-3 lessons together (e.g., "This week: Stream Setup + Football IQ").

**Files:**
- Create: `gooniversity/scripts/gen_digest.py`
- Output: `gooniversity/metadata/channel_posts/digest_week_N.txt` (6 digests)

**Step 1: Write `gen_digest.py`**

```python
#!/usr/bin/env python3
"""gen_digest.py — Generate weekly digest posts from the course catalog."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "catalog.json"
OUTPUT = ROOT / "metadata" / "channel_posts"
BOT = "HeadMasterGooner_Bot"

def main():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)

    # Group: 3 lessons per digest = 6 digests for 18 lessons
    all_lessons = []
    for course in catalog:
        for i, lesson in enumerate(course.get("lessons", []), 1):
            all_lessons.append((course, lesson, i))

    # Split into groups of 3
    for week, chunk in enumerate(range(0, len(all_lessons), 3), 1):
        items = all_lessons[chunk:chunk+3]
        lines = [
            "📅 *Gooniversity Weekly Digest — Week " + str(week) + "*",
            "",
            "This week's lessons:",
            "",
        ]
        for course, lesson, idx in items:
            slug = lesson.get("slug", lesson.get("id", ""))
            link = f"t.me/{BOT}/app?start_param=learn_{course['id']}_{slug}"
            lines.append(f"• {course.get('emoji','')} *{lesson['title']}* — _Lesson {idx} of {course['title']}_")
            lines.append(f"  👉 {link}")
        lines += ["", "#Gooniversity #Digest"]

        post = "\n".join(lines)
        out = OUTPUT / f"digest_week_{week}.txt"
        out.write_text(post + "\n", encoding="utf-8")
        print(f"Saved: {out}", file=sys.stderr)

    print(f"Generated {len(list(range(0, len(all_lessons), 3)))} digest posts", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

**Step 2: Generate digests**

```bash
cd ~/agents/gooniversity && python3 scripts/gen_digest.py
```

**Step 3: Verify**

```bash
ls metadata/channel_posts/digest_week_*.txt | wc -l  # expect 6
cat metadata/channel_posts/digest_week_1.txt
```

**Step 4: Commit**

```bash
cd ~/agents
git add gooniversity/scripts/gen_digest.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add weekly digest generator"
```

---

## Summary of all channel content

| Content type | Count | Files | Generation script |
|-------------|--------|--------|-------------------|
| Course overview | 6 | `<id>.txt` | `format_post.py <id>` |
| Teaser hooks | 6 | `<id>.teaser.txt` | `gen_teaser.py <id>` |
| Lesson posts (prev/next) | 18 | `<id>-<slug>.txt` | `format_post.py <id> --all-lessons` |
| Course index | 1 | `_index.txt` | `format_post.py --index` |
| Poll posts | 6 | `<id>.poll.txt` | `format_post.py --poll` |
| Completion badges | 18 | `<id>-<slug>.badge.txt` | `format_post.py --badge-all` |
| Weekly digests | 6 | `digest_week_N.txt` | `gen_digest.py` |
| **Total** | **55** | | |

## Tests / Validation

| Task | Command | Expected |
|------|---------|----------|
| Step 1 | `python3 scripts/format_post.py --poll` | 6 `.poll.txt` files created |
| Step 2 | `python3 scripts/format_post.py --badge-all` | 18 `.badge.txt` files created |
| Step 3 | `python3 scripts/gen_digest.py` | 6 `digest_week_N.txt` files created |
| All | `npx vitest run` (from gooniversity/) | 3/3 tests still pass |

## Risks & Tradeoffs

- Poll posts are static text (can't actually create a Telegram native poll via bot API from a text file — they need manual creation in the bot UI, but the text provides the question + options ready to paste)
- Badges require the TMA webapp to accept `start_param=completed_<course>_<slug>` — the webapp currently only handles `start_param=learn_<course>_<slug>`. Need to add badge recognition.
- Digests are time-based (3 lessons per week) but don't track which lessons have been posted — good enough for a static content pipeline
