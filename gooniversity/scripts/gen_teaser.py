#!/usr/bin/env python3
"""gen_teaser.py — Generate teaser posts for Gooniversity courses.

Produces a 1-2 line hook post that builds anticipation for an upcoming course.
Useful for scheduling "Course drops tomorrow" style posts.

Usage:
    python3 scripts/gen_teaser.py <course_id> [--catalog data/catalog.json] [--out metadata/channel_posts/<id>.teaser.txt]
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "data" / "catalog.json"
OUTPUT_DIR = ROOT / "metadata" / "channel_posts"

TEASERS = {
    "aura-trinity-mastery": "✨ How many gooners know you can chain 3× #50 into a #100? Tomorrow: Trinity Theory drops. #Gooniversity",
    "stream-setup-academy": "🎮 Still streaming at 720p30 in 2026? Full rig rebuild guide drops tomorrow. #Gooniversity",
    "football-iq-essentials": "⚽ Can you spot a 4-3-3 weakness before the whistle? Football IQ drops tomorrow. #Gooniversity",
    "headmaster-bot": "🤖 @HeadMasterGooner_Bot has 147 commands. Which 3 do you actually use? Bot mastery drops tomorrow. #Gooniversity",
    "community-mod-playbook": "🛡️ Your server has 500 members and 3 mods. How does that work? Mod playbook drops tomorrow. #Gooniversity",
    "gooner-finance-101": "💰 That airdrop you just claimed? Probably a honeypot. Finance 101 drops tomorrow. #Gooniversity",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a teaser post for a Gooniversity course.")
    parser.add_argument("course_id", help="Course id (e.g. aura-trinity-mastery)")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--out", type=Path, default=None, help="Output path (default: metadata/channel_posts/<id>.teaser.txt)")
    args = parser.parse_args()

    if args.course_id not in TEASERS:
        print(f"Error: course '{args.course_id}' not found in catalog or no teaser defined", file=sys.stderr)
        return 1

    teaser = TEASERS[args.course_id]

    # Verify the course exists in catalog
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    if not any(c["id"] == args.course_id for c in catalog):
        print(f"Error: course '{args.course_id}' not found in {args.catalog}", file=sys.stderr)
        return 1

    print(teaser)

    # Write to file
    out = args.out or (OUTPUT_DIR / f"{args.course_id}.teaser.txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(teaser + "\n", encoding="utf-8")
    print(f"Saved: {out}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
