#!/usr/bin/env python3
"""gen_lessons.py — Generate 18 lesson markdown files from the course catalog.

Reads data/catalog.json and writes one markdown file per lesson into
metadata/channel_posts/ (or a configurable output directory).

Usage:
    python scripts/gen_lessons.py [--catalog data/catalog.json] [--out metadata/channel_posts/]
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate lesson markdown files from catalog.")
    parser.add_argument("--catalog", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "catalog.json")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "metadata" / "channel_posts", help="Output directory for lesson markdown")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(args.catalog.read_text())
    total = 0
    for course in catalog:
        for lesson in course["lessons"]:
            filename = f"{lesson['slug']}.md"
            filepath = args.out / filename
            content = (
                f"---\n"
                f"title: \"{course['title']} — {lesson['title']}\"\n"
                f"course_id: {course['id']}\n"
                f"lesson_id: {lesson['id']}\n"
                f"duration: {lesson['duration']}\n"
                f"tag: {course['tag']}\n"
                f"emoji: {course['emoji']}\n"
                f"---\n\n"
                f"# {lesson['title']}\n\n"
                f"*{course['tagline']}*\n\n"
                f"(Lesson content goes here — auto-generated from catalog.json)\n"
            )
            filepath.write_text(content)
            total += 1
    print(f"gen_lessons.py: generated {total} lesson markdown files into {args.out}")
    # TODO: enhance with richer lesson templates per course category
    return 0


if __name__ == "__main__":
    sys.exit(main())
