#!/usr/bin/env python3
"""KingDesignCollective — Product Master Index builder (Vagary-style).
Reconciles inventory.csv (6 generic SKUs) against manifest.json (8 photo SKUs on disk)
and emits a single verified master index + build tracker. Zero external deps.
"""
import json, os, csv, re, hashlib
from collections import defaultdict
from datetime import datetime, timezone

ROOT = r"C:/Users/young/agents/corporate_runtime/documents/shoe_brand"
IMG_DIR = os.path.join(ROOT, "images", "KingDesignCollective")
MANIFEST = os.path.join(ROOT, "manifest.json")
INV = os.path.join(ROOT, "inventory.csv")
OUT_IDX = os.path.join(ROOT, "product_master_index.json")
OUT_TRACK = os.path.join(ROOT, "build_tracker.json")

def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ---- 1. What's actually on disk ----
disk_files = []
if os.path.isdir(IMG_DIR):
    disk_files = sorted(os.listdir(IMG_DIR))
disk_by_sku = defaultdict(list)
sku_re = re.compile(r'^(.*?)-shoes-(.*?)\.(jpg|png)$', re.I)
for f in disk_files:
    m = sku_re.match(f)
    if m:
        disk_by_sku[m.group(1)].append(f)
    elif f.upper().startswith("LOGO"):
        disk_by_sku["LOGO"].append(f)

# ---- 2. inventory.csv ----
inv = []
if os.path.exists(INV):
    with open(INV, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            inv.append(row)

# ---- 3. manifest.json photo SKUs ----
manifest_photo_skus = set()
if os.path.exists(MANIFEST):
    man = json.load(open(MANIFEST))
    for col in man.get("image_collections", []):
        for fobj in col.get("files", []):
            s = fobj.get("sku")
            if s and s not in ("LOGO", "SIZING_FEMALE", "SIZING_MALE"):
                manifest_photo_skus.add(s)

# ---- 4. Reconcile: union of (a) inventory SKUs and (b) disk/photo SKUs ----
# Normalize inventory SKU names to a slug for matching against photo SKUs.
def slug(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

inv_skus = [r["SKU"] for r in inv]
photo_skus = set(disk_by_sku.keys()) - {"LOGO"}

master = []
# Build from inventory first (they carry pricing/stock)
inv_by_sku = {r["SKU"]: r for r in inv}
# Map inventory rows to a photo cluster by loose name match
def match_photo_cluster(inv_name):
    n = slug(inv_name)
    for ps in photo_skus:
        if slug(ps) in n or n in slug(ps):
            return ps
    return None

for r in inv:
    cluster = match_photo_cluster(r["Product_Name"])
    files = disk_by_sku.get(cluster, []) if cluster else []
    master.append({
        "sku": r["SKU"],
        "product_name": r["Product_Name"],
        "material": r.get("Material", ""),
        "cost_price": r.get("Cost_Price", ""),
        "retail_price": r.get("Retail_Price", ""),
        "stock_level": r.get("Stock_Level", ""),
        "category": r.get("Category", ""),
        "size_range": r.get("Size_Range", ""),
        "color": r.get("Color", ""),
        "status": r.get("Status", ""),
        "photo_cluster": cluster,
        "image_files_on_disk": files,
        "image_count": len(files),
        "has_photography": bool(files),
    })

# Add photo-only SKUs not in inventory (orphan photography)
for ps in sorted(photo_skus):
    if not any(m["photo_cluster"] == ps for m in master):
        files = disk_by_sku.get(ps, [])
        master.append({
            "sku": f"KD-{slug(ps)[:8].upper()}",
            "product_name": ps,
            "material": "",
            "cost_price": "",
            "retail_price": "",
            "stock_level": "",
            "category": "",
            "size_range": "",
            "color": "",
            "status": "PHOTO_ONLY_NO_INVENTORY",
            "photo_cluster": ps,
            "image_files_on_disk": files,
            "image_count": len(files),
            "has_photography": bool(files),
        })

# ---- 5. Build tracker ----
total = len(master)
with_pricing = sum(1 for m in master if m["retail_price"] not in ("", None))
with_photos = sum(1 for m in master if m["has_photography"])
with_both = sum(1 for m in master if m["retail_price"] not in ("", None) and m["has_photography"])
orphan_photos = sum(1 for m in master if m["status"] == "PHOTO_ONLY_NO_INVENTORY")
no_photo_priced = sum(1 for m in master if m["retail_price"] not in ("", None) and not m["has_photography"])

tracker = {
    "subsidiary": "shoe-brand",
    "brand": "KingDesignCollective",
    "updated_at": now_iso(),
    "target_universe": "reconciled inventory + photography",
    "total_products": total,
    "with_pricing": with_pricing,
    "with_photography": with_photos,
    "complete_priced_and_photographed": with_both,
    "orphan_photography_skus": orphan_photos,
    "priced_but_no_photo": no_photo_priced,
    "disk_image_files": len(disk_files),
    "manifest_claimed_files": 53,
    "image_drift_vs_manifest": len(disk_files) - 53,
    "gaps": [],
}
if orphan_photos:
    tracker["gaps"].append(f"{orphan_photos} photo SKU(s) have no inventory row (need pricing/stock/category).")
if no_photo_priced:
    tracker["gaps"].append(f"{no_photo_priced} priced SKU(s) have no photography mapped.")
if tracker["image_drift_vs_manifest"]:
    tracker["gaps"].append(f"Disk has {len(disk_files)} images vs manifest claim of 53 (drift {tracker['image_drift_vs_manifest']}).")
tracker["status"] = "RECONCILED_WITH_GAPS" if tracker["gaps"] else "COMPLETE"

# ---- 6. Write ----
with open(OUT_IDX, "w", encoding="utf-8") as f:
    json.dump({"generated_at": now_iso(), "products": master}, f, indent=2)
with open(OUT_TRACK, "w", encoding="utf-8") as f:
    json.dump(tracker, f, indent=2)

print(json.dumps(tracker, indent=2))
