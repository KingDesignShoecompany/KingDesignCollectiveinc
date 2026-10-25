#!/usr/bin/env python3
"""gen_digest.py — Generate weekly digest posts from the course catalog.

Groups all lessons into weekly digests (3 lessons per week) with TMA deep-links.

Usage: python3 scripts/gen_digest.py
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "catalog.json"
OUTPUT = ROOT / "metadata" / "channel_posts"
BOT = "HeadMasterGooner_Bot"


def main():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)

    all_lessons = []
    for course in catalog:
        for i, lesson in enumerate(course.get("lessons", []), 1):
            all_lessons.append((course, lesson, i))

    num_digests = 0
    for week, idx in enumerate(range(0, len(all_lessons), 3), 1):
        chunk = all_lessons[idx:idx+3]
        lines = [
            f"📅 *Gooniversity Weekly Digest — Week {week}*",
            "",
            "This week's lessons:",
            "",
        ]
        for course, lesson, li in chunk:
            slug = lesson.get("slug", lesson.get("id", ""))
            link = f"t.me/{BOT}/app?start_param=learn_{course['id']}_{slug}"
            lines.append(f"• {course.get('emoji','')} *{lesson.get('title','')}* — _Lesson {li} · {course.get('title','')}_")
            lines.append(f"  👉 {link}")
        lines += ["", "#Gooniversity #Digest"]

        post = "\n".join(lines)
        out = OUTPUT / f"digest_week_{week}.txt"
        out.write_text(post + "\n", encoding="utf-8")
        print(f"Saved: {out}", file=sys.stderr)
        num_digests += 1

    print(f"Generated {num_digests} digest posts", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
