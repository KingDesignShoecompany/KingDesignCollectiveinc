#!/usr/bin/env python3
"""KingDesignCollective canonical catalog + e-commerce copy (Vagary-style).
Source of truth = photographed SKUs actually on disk (8 clusters, 56 images).
Generates: catalog.json, product copy, updated tracker. No external deps.
"""
import json, os, re, csv
from collections import defaultdict
from datetime import datetime, timezone

ROOT = r"C:/Users/young/agents/corporate_runtime/documents/shoe_brand"
IMG_DIR = os.path.join(ROOT, "images", "KingDesignCollective")
OUT_CAT = os.path.join(ROOT, "catalog.json")
OUT_TRACK = os.path.join(ROOT, "build_tracker.json")

def now_iso(): return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ---- gather disk photography by SKU ----
sku_re = re.compile(r'^(.*?)-shoes-(.*?)\.(jpg|png)$', re.I)
by_sku = defaultdict(list)
logo = []
for f in sorted(os.listdir(IMG_DIR)):
    m = sku_re.match(f)
    if m: by_sku[m.group(1)].append(f)
    elif f.upper().startswith("LOGO"): logo.append(f)

# ---- brand voice helpers ----
CATEGORY_MAP = {
    "Dendroaspispolyles": "Athletic Street",
    "Mota mary": "The Hybrid",
    "Opustošeni nepažlj": "Occasional Formal",
    "Queen_s Ace": "The Hybrid",
    "Ravenoustum satori": "Athletic Street",
    "SASSY SOL": "Athletic Street",
    "Unique Sin": "Occasional Formal",
    "Voda Šetač": "Athletic Street",
}
# Friendly display name + tagline per cluster (derived from SKU name + vibe)
def display_name(sku):
    # Keep the brand-cryptic names as the product line, add a crown-tier label
    return sku.replace("_s ", "'s ")

TAGLINES = {
    "Dendroaspispolyles": "The serpent's spine, rendered in Italian calfskin.",
    "Mota mary": "Quiet luxury for the in-between hours.",
    "Opustošeni nepažlj": "Reckless precision. Hand-painted, never apologetic.",
    "Queen_s Ace": "The ace up your sleeve — structured, sovereign.",
    "Ravenoustum satori": "A sudden enlightenment, laced in obsidian.",
    "SASSY SOL": "Solar confidence. Built to be remembered.",
    "Unique Sin": "The only sin is blending in.",
    "Voda Šetač": "The water-walker. Engineered to defy gravity.",
}

# ---- build catalog ----
products = []
for sku in sorted(by_sku.keys()):
    files = by_sku[sku]
    cat = CATEGORY_MAP.get(sku, "The Hybrid")
    tag = TAGLINES.get(sku, "Crafted for those who rule their own path.")
    name = display_name(sku)
    # inventory lookup for any existing pricing
    products.append({
        "sku": sku,
        "display_name": name,
        "line": "KDC Crown Series",
        "category": cat,
        "tagline": tag,
        "material_hint": "Italian handcrafted leather + heritage sole construction",
        "image_count": len(files),
        "image_files": files,
        "has_photography": True,
        "pricing_status": "pending_inventory",
        "copy_status": "generated",
    })

# ---- short e-commerce copy block for each ----
copy_blocks = {}
for p in products:
    sku = p["sku"]
    copy_blocks[sku] = {
        "headline": f"{p['display_name']} — {p['category']}",
        "tagline": p["tagline"],
        "description": (
            f"Designed in California, handcrafted in Italy. The {p['display_name']} sits in our "
            f"{p['category']} tier — {p['tagline']} Every pair carries KDC's signature obsidian-sole "
            f"architecture and third-generation cordwainer finishing. {p['image_count']} studio shots "
            f"capture the grain, the soul, and the silhouette."
        ),
        "cta": "[ CLAIM YOUR PAIR ]",
        "alt_text_seed": f"KingDesignCollective {p['display_name']} {p['category']} sneaker, Italian leather",
    }

# ---- tracker ----
tracker = {
    "subsidiary": "shoe-brand",
    "brand": "KingDesignCollective",
    "updated_at": now_iso(),
    "method": "photography-on-disk is source of truth; inventory.csv is pending mapping",
    "products_with_photography": len(products),
    "total_image_files": len([f for fl in by_sku.values() for f in fl]) + len(logo),
    "copy_generated": len(copy_blocks),
    "pricing_mapped": 0,
    "status": "CATALOG_BUILT_COPY_READY_PRICING_PENDING",
    "next_actions": [
        "Map 6 inventory.csv SKUs (Apex Runner V1 etc.) to real photo clusters OR retire them.",
        "Set retail/cost pricing for the 8 photographed SKUs.",
        "Bind storefront platform + payment (ecommerce_setup.json still [PENDING]).",
        "Generate product hero images if AI renders desired (currently real photography only).",
    ],
}

catalog = {
    "brand": "KingDesignCollective",
    "generated_at": now_iso(),
    "source_of_truth": "images/KingDesignCollective/ (verified on disk)",
    "products": products,
    "copy": copy_blocks,
    "logo_assets": logo,
}

with open(OUT_CAT, "w", encoding="utf-8") as f: json.dump(catalog, f, indent=2)
with open(OUT_TRACK, "w", encoding="utf-8") as f: json.dump(tracker, f, indent=2)

print(f"products={len(products)} images={catalog['total_image_files'] if 'total_image_files' in catalog else len([f for fl in by_sku.values() for f in fl])+len(logo)} copy={len(copy_blocks)}")
print(json.dumps(tracker, indent=2))
