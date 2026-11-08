#!/usr/bin/env python3
"""Episode 1 image pipeline test script.

- Reads scene definitions and prompt mappings.
- Can run in dry-run mode to validate setup without generating images.
- When DRY_RUN=false, calls Fooocus headless API/renderer to produce assets.

IMPORTANT: Do NOT fabricate images or file writes. This script reports actual outputs only.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# ============================================================
# CONFIG
# ============================================================
DRY_RUN = os.environ.get("EPISODE_DRY_RUN", "true").lower() in ("1", "true", "yes")
BASE_DIR = Path(r"C:\Users\young\agents\sevenminutestorysessions")
ASSETS_DIR = BASE_DIR / "assets" / "book3" / "episode1"
SCENES_DIR = ASSETS_DIR / "scenes"
THUMB_DIR = ASSETS_DIR / "thumbnail"
FOOOCUS_DIR = Path(r"C:\Users\young\Fooocus")
FOOOCUS_MODELS_DIR = FOOOCUS_DIR / "models" / "checkpoints"
FOOOCUS_API_URL = os.environ.get("FOOOCUS_API_URL", "http://127.0.0.1:8888")

# Model fallback order for SD 1.5 kids style-lock
MODEL_CANDIDATES = [
    "v1-5-pruned-emaonly.safetensors",
    "v1-5-pruned-emaonly.ckpt",
]

# Resolution constraints for 4GB VRAM / CPU fallback
WIDTH = 512
HEIGHT = 320
SAMPLER = "DPM++ 2M Karras"
STEPS = 24
CFG = 7.0
SEED = 42

# ============================================================
# DATA
# ============================================================
SCENE_PROMPTS = {
    1: (
        "Lunaria spaceship cockpit, Elara and Ziva and Teddybot and Pranza looking ahead with big "
        "amazed eyes, soft pastel colors, round friendly shapes, gentle lighting, kid-friendly sci-fi "
        "adventure, storybook illustration"
    ),
    2: (
        "Team floating inside a swirling time vortex, rainbow spirals, soft glowing lights, Elara and "
        "Ziva and Teddybot and Pranza weightless and curious, gentle motion, pastel colors, safe gentle "
        "feeling, storybook illustration"
    ),
    3: (
        "Prehistoric jungle, oversized friendly plants, friendly giant gentle creatures in the distance, "
        "Elara and friends walking soft pastel landscape, round shapes, safe environment, kid-friendly, "
        "gentle adventure illustration"
    ),
    4: (
        "Ancient ruin interior, soft warm torch lighting, intricate hieroglyphics glowing faintly "
        "purple-blue, stone tablet with magical glowing riddle, Elara and friends looking curious and "
        "hopeful, soft edges, cartoon adventure style"
    ),
    5: (
        "Team climbing tall cliffs, crossing wobbly rope bridge, cute creatures watching from rocks, "
        "bright sky, pastel colors, heroic but gentle tone, storybook adventure illustration"
    ),
    6: (
        "Ancient temple interior mixed with futuristic glowing technology, symbols on walls, central "
        "pedestal with glowing Key of Quantum Entanglement, soft neon glow, magical atmosphere, "
        "kid-friendly sci-fi, pastel colors"
    ),
    7: (
        "Elara touching the glowing Key, huge burst of soft rainbow energy, team engulfed in warm light, "
        "cartoon sci-fi style, safe gentle explosion of color, hopeful mood"
    ),
    8: (
        "Lunaria flying through starlight, Key glowing softly in Elara's hands, team smiling together, "
        "hopeful bright finale, soft pastel sci-fi, storybook style"
    ),
}

THUMB_PROMPT = (
    "Elara holding the glowing Key of Quantum Entanglement, Lunaria spaceship behind her in the stars, "
    "soft pastel colors, kid-friendly sci-fi adventure, big expressive eyes, bright and magical, "
    "YouTube kids thumbnail, high contrast, centered character"
)

NEGATIVE_PROMPT = (
    "photorealistic, 3d render, dark, scary, violent, nsfw, deformed, blurry, low quality, watermark, "
    "text, signature, ugly, bad anatomy"
)


# ============================================================
# HELPERS
# ============================================================
def find_sd15_model() -> str | None:
    if not FOOOCUS_MODELS_DIR.exists():
        return None
    for candidate in MODEL_CANDIDATES:
        if (FOOOCUS_MODELS_DIR / candidate).exists():
            return candidate
    return None


def validate_setup() -> dict:
    result = {
        "base_dir_exists": BASE_DIR.exists(),
        "assets_dir_exists": ASSETS_DIR.exists(),
        "scenes_dir_exists": SCENES_DIR.exists(),
        "thumb_dir_exists": THUMB_DIR.exists(),
        "fooocus_dir_exists": FOOOCUS_DIR.exists(),
        "fooocus_models_dir_exists": FOOOCUS_MODELS_DIR.exists(),
        "sd15_model": find_sd15_model(),
        "scene_definitions_exists": (ASSETS_DIR / "scene_definitions.json").exists(),
        "scene_prompt_count": len(SCENE_PROMPTS),
    }
    return result


# ============================================================
# RENDERING
# ============================================================
def build_payload(prompt: str, negative: str, output_path: Path) -> dict:
    return {
        "prompt": prompt,
        "negative_prompt": negative,
        "width": WIDTH,
        "height": HEIGHT,
        "sampler_name": SAMPLER,
        "steps": STEPS,
        "cfg_scale": CFG,
        "seed": SEED,
        "output_path": str(output_path),
    }


def submit_task(payload: dict) -> dict:
    try:
        import requests  # type: ignore
    except Exception as exc:  # pragma: no cover
        return {"status": "error", "error": f"requests not available: {exc}"}

    try:
        resp = requests.post(
            f"{FOOOCUS_API_URL}/v1/generation/text-to-image",
            json=payload,
            timeout=300,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def run_scene(scene_id: int) -> dict:
    prompt = SCENE_PROMPTS.get(scene_id)
    if not prompt:
        return {"scene": scene_id, "status": "skipped", "reason": "no prompt"}

    model = find_sd15_model()
    if not model:
        return {"scene": scene_id, "status": "skipped", "reason": "no_sd15_model"}

    out_dir = SCENES_DIR / f"scene{scene_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"scene{scene_id}_shot1.png"

    if DRY_RUN:
        return {
            "scene": scene_id,
            "status": "dry_run",
            "model": model,
            "would_write": str(out_path),
            "prompt_head": prompt[:80],
        }

    payload = build_payload(prompt, NEGATIVE_PROMPT, out_path)
    result = submit_task(payload)
    result["scene"] = scene_id
    result["model"] = model
    result["output_path"] = str(out_path)
    return result


def run_thumbnail() -> dict:
    model = find_sd15_model()
    if not model:
        return {"scene": "thumbnail", "status": "skipped", "reason": "no_sd15_model"}

    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    out_path = THUMB_DIR / "thumbnail_shot1.png"

    if DRY_RUN:
        return {
            "scene": "thumbnail",
            "status": "dry_run",
            "model": model,
            "would_write": str(out_path),
            "prompt_head": THUMB_PROMPT[:80],
        }

    payload = build_payload(THUMB_PROMPT, NEGATIVE_PROMPT, out_path)
    result = submit_task(payload)
    result["scene"] = "thumbnail"
    result["model"] = model
    result["output_path"] = str(out_path)
    return result


# ============================================================
# MAIN
# ============================================================
def main() -> int:
    print(f"DRY_RUN={DRY_RUN}")
    print("SETUP=" + json.dumps(validate_setup(), indent=2))

    if not any(validate_setup().values()):
        print("FATAL: setup validation failed")
        return 2

    print("RUNNING_STYLE_LOCK_SCENE=scene1")
    scene1 = run_scene(1)
    print("SCENE1_RESULT=" + json.dumps(scene1, indent=2))

    print("RUNNING_THUMBNAIL")
    thumb = run_thumbnail()
    print("THUMB_RESULT=" + json.dumps(thumb, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
