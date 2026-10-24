#!/usr/bin/env python3
"""gen_thumbnail.py — Generate course/lesson thumbnails via FAL.ai.

Uses the FAL.ai image-generation API to create branded thumbnail images
for each course and lesson in the Gooniversity catalog.

Usage:
    python scripts/gen_thumbnail.py [--catalog data/catalog.json] [--out thumbnails/]
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate thumbnails via FAL.ai.")
    parser.add_argument("--catalog", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "catalog.json")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "thumbnails", help="Output directory for thumbnail files")
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text())
    print(f"gen_thumbnail.py: generating thumbnails for {len(catalog)} courses into {args.out}")
    # TODO: call FAL.ai API for each course/lesson, save images
    return 0


if __name__ == "__main__":
    sys.exit(main())
