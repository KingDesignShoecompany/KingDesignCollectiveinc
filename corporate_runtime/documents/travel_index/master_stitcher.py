"""Vagary Index — Master PDF Stitcher
Combines per-country A6 PDFs into a SEA-ALL regional booklet.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

try:
    from pypdf import PdfMerger
    HAVE_PDF_DEPS = True
except Exception:
    HAVE_PDF_DEPS = False


def iter_country_pdfs(countries: Iterable[str], input_dir: Path) -> list[Path]:
    found: list[Path] = []
    for country in countries:
        path = input_dir / f"{country}.pdf"
        if path.exists():
            found.append(path)
    return found


def stitch_selection(input_dir: Path, output_path: Path, countries: list[str]) -> dict:
    if not HAVE_PDF_DEPS:
        raise RuntimeError("pypdf is required for PDF stitching")
    pdfs = iter_country_pdfs(countries, input_dir)
    merger = PdfMerger()
    for path in pdfs:
        merger.append(str(path))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    merger.write(str(output_path))
    merger.close()
    return {
        "output": str(output_path),
        "stitched_count": len(pdfs),
        "countries": countries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Vagary Index master PDF stitcher")
    parser.add_argument("--input-dir", type=Path, default=Path("batch_output/pdf"))
    parser.add_argument("--output", type=Path, default=Path("batch_output/sea_all_booklet.pdf"))
    parser.add_argument("--countries", type=str, default="", help="comma-separated country slugs")
    args = parser.parse_args()
    countries = [part.strip() for part in args.countries.split(",") if part.strip()] if args.countries else [
        "thailand",
        "vietnam",
        "indonesia",
        "malaysia",
        "singapore",
        "cambodia",
        "laos",
        "myanmar",
        "brunei",
        "philippines",
    ]
    result = stitch_selection(args.input_dir, args.output, countries)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
