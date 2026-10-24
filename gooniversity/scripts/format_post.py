#!/usr/bin/env python3
"""format_post.py — Format Telegram channel posts for Gooniversity.

Takes a course or lesson slug and generates a formatted Markdown-style
post suitable for the @Gooniversity Telegram channel.

Usage:
    python scripts/format_post.py <slug> [--catalog data/catalog.json]
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Format a Telegram channel post for a lesson or course.")
    parser.add_argument("slug", help="Lesson slug or course id")
    parser.add_argument("--catalog", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "catalog.json")
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text())
    print(f"format_post.py: formatting post for '{args.slug}'")
    # TODO: look up slug/course in catalog and emit formatted Markdown post
    return 0


if __name__ == "__main__":
    sys.exit(main())
