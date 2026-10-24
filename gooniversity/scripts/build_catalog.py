#!/usr/bin/env python3
"""build_catalog.py — Regenerate catalog.json from lesson markdown files.

Scans scripts/ for *.md lesson files, extracts frontmatter (id, title,
duration, slug), groups them into courses, and writes catalog.json.

Usage:
    python scripts/build_catalog.py [--input DIR] [--output data/catalog.json]
"""

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Regenerate catalog.json from lesson markdown.")
    parser.add_argument("--input", type=Path, default=Path(__file__).parent, help="Directory containing lesson .md files")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "catalog.json", help="Output catalog.json path")
    args = parser.parse_args()

    print(f"build_catalog.py: scanning {args.input} for lesson markdown...")
    print(f"  output -> {args.output}")
    # TODO: parse markdown frontmatter and synthesize catalog.json
    return 0


if __name__ == "__main__":
    sys.exit(main())
