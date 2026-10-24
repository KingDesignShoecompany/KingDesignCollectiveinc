#!/usr/bin/env python3
"""gen_lessons.py — Generate lesson markdown files from the course catalog.

Reads data/catalog.json and writes one markdown file per lesson into
data/courses/<course_id>/lesson-<slug>.md. If a file already exists with
real content (more than a stub), it is skipped to preserve authored content.

Usage:
    python3 scripts/gen_lessons.py [--catalog data/catalog.json] [--out data/courses/]
"""
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate lesson markdown from the Gooniversity catalog.")
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "catalog.json",
        help="Path to catalog.json",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "courses",
        help="Output root directory (data/courses/)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing lesson files",
    )
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    total = 0
    skipped = 0
    for course in catalog:
        course_dir = args.out / course["id"]
        course_dir.mkdir(parents=True, exist_ok=True)
        for i, lesson in enumerate(course["lessons"], 1):
            filename = f"lesson-{lesson['slug']}.md"
            filepath = course_dir / filename
            if filepath.exists() and not args.force:
                # Check if file is a stub (contains placeholder text)
                existing = filepath.read_text(encoding="utf-8")
                if "Lesson content goes here" not in existing and len(existing) > 200:
                    skipped += 1
                    continue
            content = (
                f"---\n"
                f"title: \"{course['title']} — {lesson['title']}\"\n"
                f"course_id: {course['id']}\n"
                f"lesson_id: {lesson['id']}\n"
                f"lesson_number: {i}\n"
                f"total_lessons: {len(course['lessons'])}\n"
                f"duration: {lesson['duration']}\n"
                f"tag: {course['tag']}\n"
                f"emoji: {course['emoji']}\n"
                f"---\n\n"
                f"# {lesson['title']}\n\n"
                f"> **Course:** {course['title']} · **Lesson:** {i} of {len(course['lessons'])}\n\n"
                f"*(Lesson content goes here — expand on the topic in gooner-friendly terms.)*\n"
            )
            filepath.write_text(content, encoding="utf-8")
            total += 1
    print(f"gen_lessons.py: generated {total} lesson files ({skipped} skipped as already populated) into {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())