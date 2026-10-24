#!/usr/bin/env python3
"""format_post.py — Format Telegram channel posts for Gooniversity.

Looks up a course by id in catalog.json and emits a formatted Markdown-style
Telegram post (emoji, bold title, italic tagline, description, lesson list,
hashtags) to both stdout and metadata/channel_posts/<id>.txt.

Usage:
    python scripts/format_post.py <course_id> [--catalog data/catalog.json]
"""

import argparse
import json
import sys
from pathlib import Path


# Project root is one level up from scripts/
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = PROJECT_ROOT / "data" / "catalog.json"
OUTPUT_DIR = PROJECT_ROOT / "metadata" / "channel_posts"


def find_course(catalog: list, course_id: str) -> dict | None:
    """Find a course by id in the catalog. Returns None if not found."""
    for course in catalog:
        if course.get("id") == course_id:
            return course
    return None


def format_post(course: dict) -> str:
    """Build a formatted Telegram Markdown post from a course dict."""
    emoji = course.get("emoji", "📚")
    title = course.get("title", "")
    tagline = course.get("tagline", "")
    description = course.get("description", "")
    tag = course.get("tag", "Gooniversity")
    lessons = course.get("lessons", [])

    lines: list[str] = []

    # Header: emoji + bold title + italic tagline
    lines.append(f"{emoji} *{title}*")
    lines.append(f"_{tagline}_")
    lines.append("")

    # Description
    lines.append(description)
    lines.append("")

    # Lesson list
    lines.append("*Course contents:*")
    for i, lesson in enumerate(lessons, start=1):
        lesson_title = lesson.get("title", "")
        duration = lesson.get("duration", "")
        lines.append(f"{i}. *{lesson_title}* — {duration}")
    lines.append("")

    # Hashtags
    lines.append(f"#{tag} #Gooniversity")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Format a Telegram channel post for a Gooniversity course."
    )
    parser.add_argument(
        "course_id",
        help="Course id (e.g. aura-trinity-mastery)",
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=DEFAULT_CATALOG,
        help="Path to catalog.json",
    )
    args = parser.parse_args()

    # Read & parse the catalog
    try:
        catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"Error: catalog not found at {args.catalog}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"Error: failed to parse catalog at {args.catalog}: {exc}", file=sys.stderr)
        return 1

    # Look up the course
    course = find_course(catalog, args.course_id)
    if course is None:
        print(
            f"Error: course '{args.course_id}' not found in {args.catalog}",
            file=sys.stderr,
        )
        return 1

    # Format the post
    post = format_post(course)

    # Write to stdout
    print(post)

    # Write to metadata/channel_posts/<id>.txt
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{args.course_id}.txt"
    output_path.write_text(post + "\n", encoding="utf-8")
    print(f"Saved: {output_path}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
