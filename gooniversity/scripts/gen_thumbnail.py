#!/usr/bin/env python3
"""gen_thumbnail.py — Generate SVG hero thumbnails for Gooniversity courses.

Instead of relying on FAL.ai (which may be unavailable), this script generates
SVG files matching the kdc-next HeroArt gold-platform aesthetic. Each thumbnail
features a gold 3D-style object above a dark platform with concentric rings
and warm golden glow.

Usage:
    python3 scripts/gen_thumbnail.py [--catalog data/catalog.json] [--out thumbnails/]
    python3 scripts/gen_thumbnail.py --course aura-trinity-mastery  # single course
"""
import argparse
import json
import sys
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]

# Gold platform gradient colors
GOLD = "#d4af37"
GOLD_LIGHT = "#f5d67b"
GOLD_DARK = "#8a6d1f"

# SVG template for each course emoji
def make_svg(emoji: str, title: str, tag: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Platform -->
  <ellipse cx="128" cy="210" rx="80" ry="18" fill="url(#platGrad)" />
  <ellipse cx="128" cy="206" rx="80" ry="18" fill="none" stroke="{GOLD}" stroke-width="1" opacity="0.6" />
  <ellipse cx="128" cy="202" rx="60" ry="14" fill="none" stroke="{GOLD}" stroke-width="0.8" opacity="0.4" />
  <ellipse cx="128" cy="200" rx="40" ry="8" fill="none" stroke="{GOLD}" stroke-width="0.7" opacity="0.3" />
  <ellipse cx="128" cy="212" rx="90" ry="20" fill="{GOLD}" opacity="0.08" />
  <!-- Glow -->
  <ellipse cx="128" cy="208" rx="70" ry="14" fill="{GOLD_LIGHT}" opacity="0.18" />
  <!-- Main emoji object -->
  <text x="128" y="90" text-anchor="middle" font-size="80" font-family="Segoe UI Emoji, Arial, sans-serif" fill="url(#objGrad)">{escape(emoji)}</text>
  <!-- Tag badge -->
  <rect x="98" y="180" width="60" height="16" rx="8" fill="{GOLD_DARK}" stroke="{GOLD}" stroke-width="0.5" />
  <text x="128" y="192" text-anchor="middle" font-size="9" font-family="Inter, Arial, sans-serif" fill="{GOLD_LIGHT}">#{escape(tag)}</text>
  <!-- Title -->
  <text x="128" y="240" text-anchor="middle" font-size="11" font-family="Inter, Arial, sans-serif" fill="{GOLD_LIGHT}">{escape(title[:24])}</text>
  <defs>
    <linearGradient id="platGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{GOLD_LIGHT}" />
      <stop offset="55%" stop-color="{GOLD}" />
      <stop offset="100%" stop-color="{GOLD_DARK}" />
    </linearGradient>
    <linearGradient id="objGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{GOLD_LIGHT}" />
      <stop offset="55%" stop-color="{GOLD}" />
      <stop offset="100%" stop-color="{GOLD_DARK}" />
    </linearGradient>
  </defs>
</svg>'''

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate SVG hero thumbnails for Gooniversity courses.")
    parser.add_argument("--catalog", type=Path, default=ROOT / "data" / "catalog.json")
    parser.add_argument("--out", type=Path, default=ROOT / "thumbnails")
    parser.add_argument("--course", help="Generate only a single course by id")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))

    courses = [c for c in catalog if c["id"] == args.course] if args.course else catalog
    if not courses:
        print(f"Error: course '{args.course}' not found", file=sys.stderr)
        return 1

    for c in courses:
        svg = make_svg(c["emoji"], c["title"], c["tag"])
        out = args.out / f"{c['id']}.svg"
        out.write_text(svg, encoding="utf-8")
        print(f"  generated {out.name} ({len(svg)} bytes)")

    print(f"Done: {len(courses)} thumbnails into {args.out}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
