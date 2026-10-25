#!/usr/bin/env python3
"""format_post.py — Format Telegram channel posts for Gooniversity.

Modes:
  <course_id>              — course overview post
  <course_id> --lesson S   — single lesson post with prev/next nav
  --index                  — course index listing all courses
  --all-lessons            — batch-generate all 18 lesson posts
  --poll [course_id]       — poll post for one course (or all if course is 'all')
  --badge-all              — batch-generate 18 completion badge posts
  <course_id> --lesson S --badge — single badge post
"""
import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = PROJECT_ROOT / "data" / "catalog.json"
OUTPUT_DIR = PROJECT_ROOT / "metadata" / "channel_posts"
BOT_USERNAME = "HeadMasterGooner_Bot"

# One poll question + 4 answer options per course
POLLS = {
    "aura-trinity-mastery": ("Trinity Theory was:", ["🔥 Too easy!", "🎯 Spot on", "🤯 Brain melted", "❓ I'm lost"]),
    "stream-setup-academy": ("My stream setup is stuck on:", ["🖥️ Hardware", "⚙️ Software (OBS)", "👥 Audience", "💸 Budget"]),
    "football-iq-essentials": ("Which formation do you struggle against most?", ["4-3-3", "4-2-3-1", "3-5-2", "Something else"]),
    "headmaster-bot": ("Which HeadMaster Bot feature do you use?", ["📊 Leaderboards", "🔗 TMA deep-links", "🤖 Auto-moderation", "Nothing — teaching me!"]),
    "community-mod-playbook": ("Your biggest moderation challenge is:", ["⚠️ Toxicity", "📅 Event scheduling", "🔔 Low engagement", "👥 Managing volunteers"]),
    "gooner-finance-101": ("Crypto scared me because:", ["🔑 Lost my wallet", "📉 Lost my money", "👁️‍🗨️ Can't read charts", "🕵️ Too many scams"]),
}


def find_course(catalog, course_id):
    for c in catalog:
        if c.get("id") == course_id:
            return c
    return None

def lesson_slug(lesson):
    return lesson.get("slug") or lesson.get("id", "")

def format_course(course):
    emoji = course.get("emoji", "")
    tag = course.get("tag", "Gooniversity")
    lines = [
        f"{emoji} *{course['title']}*",
        f"_{course.get('tagline','')}_",
        "",
        course.get("description",""),
        "",
        "*Course contents:*",
    ]
    for i, l in enumerate(course.get("lessons", []), 1):
        lines.append(f"{i}. *{l.get('title','')}* — {l.get('duration','')}")
    lines += ["", f"#{tag} #Gooniversity"]
    return "\n".join(lines)

def format_index(catalog):
    lines = ["🎓 *Gooniversity — Course Index*", "", "All courses for the Gooner community:", ""]
    for i, c in enumerate(catalog, 1):
        ll = len(c.get("lessons", []))
        lines.append(f"{i}. {c.get('emoji','')} *{c['title']}* — _{c.get('tagline','')}_ ({ll} lessons)")
    lines += ["", "💡 Tap any course below to open in @HeadMasterGooner_Bot:"]
    for c in catalog:
        lines.append(f"👉 t.me/{BOT_USERNAME}/app?start_param=catalog_{c['id']}")
    lines += ["", "#Gooniversity #Index"]
    return "\n".join(lines)

def format_lesson(course, lesson, idx):
    emoji = course.get("emoji", "")
    tag = course.get("tag", "Gooniversity")
    slug = lesson_slug(lesson)
    total = len(course.get("lessons", []))
    link = f"t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{slug}"
    lines = [
        f"{emoji} *{lesson.get('title','')}*",
        f"_Lesson {idx} of {total} · {course.get('title','')}_",
        "",
        f"*{lesson.get('duration','')} read* · {course.get('title','')}",
        "",
        f"👉 {link}",
        "",
    ]
    if idx > 1:
        prev = course["lessons"][idx-2]
        lines.append(f"← Previous: t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{lesson_slug(prev)}")
    if idx < total:
        nxt = course["lessons"][idx]
        lines.append(f"→ Next: t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{lesson_slug(nxt)}")
    lines += [""]
    lines.append(f"#{tag} #Gooniversity #Lesson{idx}")
    return "\n".join(lines)

def format_poll(course):
    emoji = course.get("emoji", "")
    tag = course.get("tag", "Gooniversity")
    q, opts = POLLS.get(course["id"], ("What's your biggest challenge?", ["Too easy!", "Spot on", "Hard but fair", "Need more practice"]))
    lines = [
        f"{emoji} *Gooniversity Poll: {course['title']}*",
        "",
        q,
    ]
    lines += [f"• {o}" for o in opts]
    lines += ["", "Reply with your answer below ⬇️", "", f"#{tag} #Gooniversity #Poll"]
    return "\n".join(lines)

def format_badge(course, lesson, idx):
    emoji = lesson.get("emoji", "✅")
    tag = course.get("tag", "Gooniversity")
    slug = lesson_slug(lesson)
    link = f"t.me/{BOT_USERNAME}/app?start_param=completed_{course['id']}_{slug}"
    lines = [
        f"🏆 *{emoji} Lesson Complete!*",
        "",
        f"*{course['title']} · Lesson {idx}*",
        f"_{lesson.get('title','')}_ — {lesson.get('duration','')}",
        "",
        "I just finished this lesson on Gooniversity! Tap to verify:",
        f"👉 {link}",
        "",
        f"#{tag} #Gooniversity #Badge#{idx}",
    ]
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser(description="Format Gooniversity Telegram posts")
    p.add_argument("course_id", nargs="?")
    p.add_argument("--lesson")
    p.add_argument("--index", action="store_true")
    p.add_argument("--all-lessons", action="store_true")
    p.add_argument("--poll", action="store_true")
    p.add_argument("--badge-all", action="store_true")
    p.add_argument("--badge", action="store_true", help="Generate a badge post for the lesson in --lesson")
    p.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    args = p.parse_args()

    try:
        catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"Error: catalog not found at {args.catalog}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # --index
    if args.index:
        post = format_index(catalog)
        out = OUTPUT_DIR / "_index.txt"
        out.write_text(post + "\n", encoding="utf-8")
        print(post)
        print(f"Saved: {out}", file=sys.stderr)
        return 0

    # --all-lessons
    if args.all_lessons:
        if args.course_id or args.lesson:
            print("Error: can't combine --all-lessons with course_id/--lesson", file=sys.stderr)
            return 1
        count = 0
        for course in catalog:
            for i, lesson in enumerate(course["lessons"], 1):
                post = format_lesson(course, lesson, i)
                out = OUTPUT_DIR / f"{course['id']}-{lesson_slug(lesson)}.txt"
                out.write_text(post + "\n", encoding="utf-8")
                count += 1
        print(f"Generated {count} lesson posts", file=sys.stderr)
        return 0

    # --poll
    if args.poll:
        if not args.course_id or args.course_id == "all":
            for course in catalog:
                post = format_poll(course)
                out = OUTPUT_DIR / f"{course['id']}.poll.txt"
                out.write_text(post + "\n", encoding="utf-8")
                print(f"Saved: {out}", file=sys.stderr)
            print(f"Generated poll posts for {len(catalog)} courses", file=sys.stderr)
            return 0
        course = find_course(catalog, args.course_id)
        if course is None:
            print(f"Error: course '{args.course_id}' not found", file=sys.stderr)
            return 1
        post = format_poll(course)
        out = OUTPUT_DIR / f"{args.course_id}.poll.txt"
        print(post)
        out.write_text(post + "\n", encoding="utf-8")
        print(f"Saved: {out}", file=sys.stderr)
        return 0

    # --badge-all
    if args.badge_all:
        if args.course_id or args.lesson:
            print("Error: can't combine --badge-all with course_id/--lesson", file=sys.stderr)
            return 1
        count = 0
        for course in catalog:
            for i, lesson in enumerate(course["lessons"], 1):
                post = format_badge(course, lesson, i)
                out = OUTPUT_DIR / f"{course['id']}-{lesson_slug(lesson)}.badge.txt"
                out.write_text(post + "\n", encoding="utf-8")
                count += 1
        print(f"Generated {count} badge posts", file=sys.stderr)
        return 0

    # Course/lesson mode
    if not args.course_id:
        p.print_help()
        return 1

    course = find_course(catalog, args.course_id)
    if course is None:
        print(f"Error: course '{args.course_id}' not found", file=sys.stderr)
        return 1

    if args.lesson:
        lesson = next((l for l in course["lessons"] if lesson_slug(l) == args.lesson), None)
        if lesson is None:
            print(f"Error: lesson '{args.lesson}' not found in '{args.course_id}'", file=sys.stderr)
            return 1
        idx = course["lessons"].index(lesson) + 1
        if args.badge:
            post = format_badge(course, lesson, idx)
            out = OUTPUT_DIR / f"{args.course_id}-{args.lesson}.badge.txt"
        else:
            post = format_lesson(course, lesson, idx)
            out = OUTPUT_DIR / f"{args.course_id}-{args.lesson}.txt"
    else:
        post = format_course(course)
        out = OUTPUT_DIR / f"{args.course_id}.txt"

    print(post)
    out.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
