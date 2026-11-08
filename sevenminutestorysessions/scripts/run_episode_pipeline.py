#!/usr/bin/env python3
"""
automation: run_episode_pipeline.py
Dry-run orchestrator for Regeneratable Kids Episode Pipeline (Hermes + Fooocus)

Usage: python scripts/run_episode_pipeline.py

This script does not call external APIs.
It validates inputs, prints planned artifact paths, and exits.
"""

from pathlib import Path

BOOK = "book3"
EPISODE = "episode1"
BASE = Path(__file__).resolve().parent.parent
ARTIFACTS = {
    "scene_definitions": BASE / f"assets/{BOOK}/{EPISODE}/scene_definitions.json",
    "voiceover_script": BASE / f"audio/voiceover_script.txt",
    "prompts": BASE / "prompts.md",
    "youtube_metadata": BASE / f"metadata/youtube_metadata.json",
    "episode_mp4": BASE / f"episodes/{BOOK}/{EPISODE}.mp4",
    "thumbnail_prompt": BASE / f"metadata/youtube_metadata.json",
}


def validate():
    print("Validating episode artifacts...")
    missing = [str(p) for p in ARTIFACTS.values() if not p.exists()]
    if missing:
        print("MISSING:")
        for m in missing:
            print(" -", m)
        return False
    print("OK: all planned artifacts present")
    return True


def plan():
    print("\nPlanned episode pipeline:")
    print(f"  Book: {BOOK} | Episode: {EPISODE}")
    print(f"  Inputs: {ARTIFACTS['scene_definitions']}")
    print(f"  Images: assets/{BOOK}/{EPISODE}/scenes/sceneN/sceneN_shotNN.png")
    print(f"  Audio:  {ARTIFACTS['voiceover_script']}")
    print(f"  Output: {ARTIFACTS['episode_mp4']}")
    print(f"  Metadata: {ARTIFACTS['youtube_metadata']}")


if __name__ == "__main__":
    plan()
    print()
    validate()
