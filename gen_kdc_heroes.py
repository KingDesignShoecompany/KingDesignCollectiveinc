"""Generate KingDesignCollectiveINC hero images via ComfyUI API (Ernie-Image-Turbo)."""
import json, os, random, sys, time, uuid, urllib.request, urllib.error

COMFY = "http://127.0.0.1:8188"
OUT_DIR = r"C:\Users\young\AppData\Local\Comfy-Desktop\ComfyUI-Installs\Dom Ter\ComfyUI\output"
DEST = r"C:\Users\young\agents\kdc-next\public\heroes"

UNET = "ernie-image-turbo.safetensors"
CLIP = "ministral-3-3b.safetensors"
CLIP_PE = "ernie-image-prompt-enhancer.safetensors"
VAE = "flux2-vae.safetensors"

W, H = 896, 1152
NEG = ""

STYLE = (
    "vertical portrait 9:16 poster, pure matte black background with faint subtle digital network grid lines, "
    "centered composition, the entire upper 70 percent is negative dark space, "
    "a single large glossy metallic gold object floating in the center above a glowing gold circular platform, "
    "the platform has concentric glowing gold rings and emits warm golden light upward, "
    "faint golden light particles and glowing dots scattered around the object, "
    "gold rim lighting, deep shadows, cinematic volumetric gold glow, 3d render, premium luxury fintech aesthetic, "
    "8k ultra detailed, sharp focus"
)

JOBS = [
    ("travel", "TRAVEL", "250 COUNTRY GUIDES & INDEXED INSIGHTS",
     "a stylized glowing gold wireframe globe with several gold location pin markers"),
    ("shoes", "SHOE BRAND", "PREMIUM FOOTWEAR, INVENTORY & ECOMMERCE",
     "a stylized glossy gold high-top sneaker with a small gold crown above it"),
    ("games", "GAME DESIGN", "UNREAL ENGINE MECHANICS & BUILD SYSTEMS",
     "a stylized gold game controller with glowing purple accent buttons and a small gold crown above it"),
    ("kids", "KIDS", "SEVEN MINUTE STORY SESSIONS",
     "an open glowing gold storybook floating upright with a gold crown emblem on the right page, gentle sparkles"),
    ("innovation", "INNOVATION", "PATENTS, WHITE PAPERS & IP ARCHITECTURE",
     "a glowing gold lightbulb with intricate gold filament circuit details inside"),
    ("ewaste", "E-WASTE", "STREAMS, RECOVERY RATES & METRICS",
     "a gold computer circuit board with a gold three-arrow circular recycling symbol around it"),
    ("quantum", "QUANTUM", "COLD FISSION THERMAL & WEARABLE PHYSICS",
     "a gold atom model with three glowing orbital electron rings and bright gold electrons"),
]

def build_prompt(title, subtitle, subject):
    return (
        f"{subject}, {STYLE}. "
        f"At the bottom of the image, large elegant gold serif uppercase title text reading exactly \"{title}\", "
        f"centered, with a subtle golden glow. "
        f"Directly below it, smaller clean white sans-serif uppercase subtitle text reading exactly \"{subtitle}\". "
        f"Text must be spelled correctly and legible."
    )

def make_api_prompt(slug, title, subtitle, subject):
    prompt = build_prompt(title, subtitle, subject)
    g = {
        "1": {"inputs": {"width": W, "height": H, "batch_size": 1}, "class_type": "EmptyFlux2LatentImage", "_meta": {"title": "Empty Latent"}},
        "2": {"inputs": {"unet_name": UNET, "weight_dtype": "default"}, "class_type": "UNETLoader", "_meta": {"title": "Load Diffusion Model"}},
        "3": {"inputs": {"clip_name": CLIP, "type": "flux2"}, "class_type": "CLIPLoader", "_meta": {"title": "Load CLIP"}},
        "4": {"inputs": {"vae_name": VAE}, "class_type": "VAELoader", "_meta": {"title": "Load VAE"}},
        "5": {"inputs": {"clip": ["3", 0], "text": prompt}, "class_type": "CLIPTextEncode", "_meta": {"title": "CLIP Text Encode (Prompt)"}},
        "6": {"inputs": {"conditioning": ["5", 0]}, "class_type": "ConditioningZeroOut", "_meta": {"title": "ConditioningZeroOut"}},
        "7": {"inputs": {
            "model": ["2", 0], "positive": ["5", 0], "negative": ["6", 0],
            "latent_image": ["1", 0], "seed": random.randint(0, 2**32 - 1),
            "steps": 8, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1},
          "class_type": "KSampler", "_meta": {"title": "KSampler"}},
        "8": {"inputs": {"samples": ["7", 0], "vae": ["4", 0]}, "class_type": "VAEDecode", "_meta": {"title": "VAE Decode"}},
        "9": {"inputs": {"images": ["8", 0], "filename_prefix": f"KDC/{slug}"}, "class_type": "SaveImage", "_meta": {"title": "Save Image"}},
    }
    return {"client_id": str(uuid.uuid4()), "prompt": g}

def queue(p):
    data = json.dumps(p).encode()
    req = urllib.request.Request(COMFY + "/prompt", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        print("HTTP", e.code, body[:2000])
        print("PAYLOAD:", json.dumps(p)[:3000])
        sys.exit(1)

def poll_history(pid, timeout=1800):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(COMFY + f"/history/{pid}", timeout=30) as r:
                h = json.load(r)
            if pid in h and h[pid].get("status", {}).get("completed"):
                return h[pid]
        except urllib.error.URLError:
            pass
        time.sleep(5)
    raise TimeoutError(pid)

def main():
    os.makedirs(DEST, exist_ok=True)
    results = []
    for slug, title, subtitle, subject in JOBS:
        print(f"[queue] {slug} ({title})", flush=True)
        resp = queue(make_api_prompt(slug, title, subtitle, subject))
        pid = resp.get("prompt_id")
        if not pid:
            print("  QUEUE FAIL:", resp); continue
        hist = poll_history(pid)
        imgs = []
        for nid_, out in hist.get("outputs", {}).items():
            if "images" in out:
                imgs.extend(out["images"])
        if not imgs:
            print(f"  {slug}: no images, status={hist.get('status')}"); continue
        src = os.path.join(OUT_DIR, imgs[0].get("subfolder", ""), imgs[0]["filename"])
        dst = os.path.join(DEST, slug + ".png")
        with open(src, "rb") as f:
            data = f.read()
        with open(dst, "wb") as f:
            f.write(data)
        print(f"  OK {dst} ({len(data)} bytes)", flush=True)
        results.append((slug, dst))
    print("DONE", len(results), "images")

if __name__ == "__main__":
    main()
