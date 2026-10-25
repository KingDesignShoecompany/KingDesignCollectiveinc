#!/usr/bin/env python3
"""format_post.py — Format Telegram channel posts for Gooniversity.

Modes: course overview, lesson-level (--lesson), index (--index), all-lessons (--all-lessons).
"""
import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = PROJECT_ROOT / "data" / "catalog.json"
OUTPUT_DIR = PROJECT_ROOT / "metadata" / "channel_posts"
BOT_USERNAME = "HeadMasterGooner_Bot"


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
    lines += ["", f"#{tag} #Gooniversity #Lesson{idx}"]
    return "\n".join(lines)

def main():
    p = argparse.ArgumentParser(description="Format Gooniversity Telegram posts")
    p.add_argument("course_id", nargs="?")
    p.add_argument("--lesson")
    p.add_argument("--index", action="store_true")
    p.add_argument("--all-lessons", action="store_true")
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

    if args.index:
        post = format_index(catalog)
        out = OUTPUT_DIR / "_index.txt"
        out.write_text(post + "\n", encoding="utf-8")
        print(post)
        print(f"Saved: {out}", file=sys.stderr)
        return 0

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
            print(f"Error: lesson '{args.lesson}' not found", file=sys.stderr)
            return 1
        idx = course["lessons"].index(lesson) + 1
        post = format_lesson(course, lesson, idx)
        out = OUTPUT_DIR / f"{args.course_id}-{lesson_slug(lesson)}.txt"
    else:
        post = format_course(course)
        out = OUTPUT_DIR / f"{args.course_id}.txt"

    print(post)
    out.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {out}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
