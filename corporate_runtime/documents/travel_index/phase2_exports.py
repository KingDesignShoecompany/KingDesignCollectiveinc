"""Phase 2 Export: DOCX + PDF + ZIP per region."""
from __future__ import annotations

import json
import shutil
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import docx2pdf
from pypdf import PdfReader, PdfWriter

base = Path("C:/Users/young/agents/vagary_index")
roster_path = base / "country_roster_master.json"
batch_output = base / "batch_output"

roster = json.loads(roster_path.read_text(encoding="utf-8-sig"))
countries = roster["countries"]

seen = {}
for c in countries:
    if c["iso3"] not in seen:
        seen[c["iso3"]] = c
unique = list(seen.values())
print(f"Deduplicated to {len(unique)} countries.")

regions = {}
for c in unique:
    r = c.get("region", "unknown")
    regions.setdefault(r, []).append(c)

print(f"Regions: {len(regions)}")
for r, members in regions.items():
    print(f"  {r}: {len(members)}")

sys.path.insert(0, str(base))
from docx_a6_pocketbook_generator import build_country_pocketbook  # noqa: E402

# Step 1: Parallel DOCX generation (docx generation is safe)
def gen_docx(country_code, country_name, output_file):
    if not output_file.exists():
        output_file.parent.mkdir(parents=True, exist_ok=True)
        build_country_pocketbook(country_code, country_name, output_file)
    return output_file

docx_tasks = []
for c in unique:
    if c.get("region") == "east_asia_block2":
        continue
    region = c.get("region", "unknown")
    out_dir = batch_output / f"{region}_docx"
    docx_path = out_dir / f"{c['iso3']}_pocketbook.docx"
    docx_tasks.append((c["iso3"], c["name"], docx_path))

docx_results = []
start = time.time()
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(gen_docx, code, name, out): (code, out) for code, name, out in docx_tasks}
    for fut in as_completed(futures):
        code, out = futures[fut]
        try:
            res = fut.result()
            docx_results.append((code, out, res, None))
        except Exception as exc:
            docx_results.append((code, out, None, str(exc)))
        if len(docx_results) % 100 == 0:
            print(f"DOCX progress: {len(docx_results)}/{len(docx_tasks)}...", flush=True)

print(f"DOCX generation done in {time.time()-start:.1f}s")

errs = [r for r in docx_results if r[2] is None]
if errs:
    print(f"DOCX errors: {len(errs)}")
    for e in errs[:10]:
        print(f"  {e[0]}: {e[3]}")
else:
    print("No DOCX errors.")

# Step 2: Sequential PDF conversion (docx2pdf COM is not thread-safe)
print("Starting PDF conversion (sequential)...")
start = time.time()
converted = 0
for code, region, docx_path, err in docx_results:
    if docx_path is None or err:
        continue
    pdf_path = docx_path.parent / "pdf" / f"{code}.pdf"
    if not pdf_path.exists():
        try:
            pdf_path.parent.mkdir(parents=True, exist_ok=True)
            docx2pdf.convert(str(docx_path), str(pdf_path))
            converted += 1
            if converted % 50 == 0:
                print(f"  PDF converted {converted}...", flush=True)
        except Exception as exc:
            print(f"  PDF ERROR {code}: {exc}")
            continue
print(f"PDF conversion done in {time.time()-start:.1f}s")

# Step 3: Stitch master PDFs per region
for region, members in regions.items():
    if region == "east_asia_block2":
        continue
    pdf_dir = batch_output / f"{region}_docx" / "pdf"
    if not pdf_dir.exists():
        continue
    pdfs = sorted(list(pdf_dir.glob("*.pdf")))
    if not pdfs:
        continue
    out_pdf = batch_output / f"{region}_docx" / f"{region}_Master_Booklet.pdf"
    writer = PdfWriter()
    for p in pdfs:
        writer.append(str(p))
    writer.write(str(out_pdf))
    print(f"Stitched {region}: {len(pdfs)} PDFs -> {out_pdf}")

# Step 4: README + ZIP per region
zip_root = batch_output / "_exports"
zip_root.mkdir(exist_ok=True)
for region, members in regions.items():
    if region == "east_asia_block2":
        continue
    src = batch_output / f"{region}_docx"
    if not src.exists():
        continue
    zip_path = zip_root / f"{region}_vagary_index.zip"
    if zip_path.exists():
        zip_path.unlink()
    shutil.make_archive(str(zip_path.with_suffix("")), "zip", str(src))
    print(f"ZIP: {zip_path}")

print("\nPhase 2 export complete.")
