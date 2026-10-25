#!/usr/bin/env python3
"""format_post.py — Format Telegram channel posts for Gooniversity.

Supports two modes:
  • Course-level (default): full course overview post
  • Lesson-level (--lesson <slug>): individual lesson teaser with deep-link

Usage:
    python scripts/format_post.py <course_id>                     # course overview
    python scripts/format_post.py <course_id> --lesson <slug>     # single lesson
    python scripts/format_post.py all                             # generate all course posts
"""
import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = PROJECT_ROOT / "data" / "catalog.json"
OUTPUT_DIR = PROJECT_ROOT / "metadata" / "channel_posts"

# TMA deep-link for the HeadlessGoon app
BOT_USERNAME = "HeadMasterGooner_Bot"


def find_course(catalog: list, course_id: str) -> dict | None:
    """Find a course by id in the catalog. Returns None if not found."""
    for course in catalog:
        if course.get("id") == course_id:
            return course
    return None


def find_lesson(course: dict, lesson_slug: str) -> dict | None:
    """Find a lesson by slug within a course. Returns None if not found."""
    for lesson in course.get("lessons", []):
        if lesson.get("slug") == lesson_slug:
            return lesson
    return None


def format_course_post(course: dict) -> str:
    """Build a formatted Telegram Markdown post from a course dict."""
    emoji = course.get("emoji", "📚")
    title = course.get("title", "")
    tagline = course.get("tagline", "")
    description = course.get("description", "")
    tag = course.get("tag", "Gooniversity")
    lessons = course.get("lessons", [])

    lines = [
        f"{emoji} *{title}*",
        f"_{tagline}_",
        "",
        description,
        "",
        "*Course contents:*",
    ]
    for i, lesson in enumerate(lessons, start=1):
        lines.append(f"{i}. *{lesson.get('title', '')}* — {lesson.get('duration', '')}")
    lines.append("")
    lines.append(f"#{tag} #Gooniversity")
    return "\n".join(lines)


def format_lesson_post(course: dict, lesson: dict, index: int) -> str:
    """Build a formatted Telegram Markdown post for a single lesson."""
    emoji = course.get("emoji", "📚")
    course_title = course.get("title", "")
    lesson_title = lesson.get("title", "")
    duration = lesson.get("duration", "")
    slug = lesson.get("slug", "")
    tag = course.get("tag", "Gooniversity")
    total = len(course.get("lessons", []))

    # Deep-link URL — opens the TMA webapp with start_param
    deep_link = f"t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{slug}"

    lines = [
        f"📖 *{lesson_title}*",
        f"_Lesson {index} of {total} · {course_title}_",
        "",
        f"*{duration} read* — tap to open in @HeadMasterGooner_Bot:",
        f"👉 {deep_link}",
        "",
        f"#{tag} #Gooniversity #Lesson{index}",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Format Gooniversity Telegram channel posts (course or lesson)."
    )
    parser.add_argument("course_id", help="Course id (e.g. aura-trinity-mastery), or 'all'")
    parser.add_argument("--lesson", help="Lesson slug (e.g. trinity-theory) — defaults to course-level post")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG, help="Path to catalog.json")
    args = parser.parse_args()

    # Read & parse the catalog
    try:
        catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"Error: catalog not found at {args.catalog}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"Error: failed to parse catalog: {exc}", file=sys.stderr)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Handle "all" — generate course overview posts for every course
    if args.course_id == "all":
        if args.lesson:
            print("Error: --lesson cannot be used with 'all'", file=sys.stderr)
            return 1
        for course in catalog:
            post = format_course_post(course)
            output_path = OUTPUT_DIR / f"{course['id']}.txt"
            output_path.write_text(post + "\n", encoding="utf-8")
            print(f"Saved: {output_path}", file=sys.stderr)
        return 0

    # Look up the course
    course = find_course(catalog, args.course_id)
    if course is None:
        print(f"Error: course '{args.course_id}' not found in {args.catalog}", file=sys.stderr)
        return 1

    # Lesson-level or course-level post
    if args.lesson:
        lesson = find_lesson(course, args.lesson)
        if lesson is None:
            print(f"Error: lesson '{args.lesson}' not found in course '{args.course_id}'", file=sys.stderr)
            return 1
        index = course["lessons"].index(lesson) + 1
        post = format_lesson_post(course, lesson, index)
        output_path = OUTPUT_DIR / f"{args.course_id}-{args.lesson}.txt"
    else:
        post = format_course_post(course)
        output_path = OUTPUT_DIR / f"{args.course_id}.txt"

    # Write to stdout
    print(post)

    # Write to file
    output_path.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {output_path}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
