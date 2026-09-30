#!/usr/bin/env python3
"""
Hermes Reconciled Index Generator
Builds the true master index from disk reality, writes completion flags.
"""
import json, os, glob
from datetime import datetime, timezone

TRAVEL_INDEX = "C:/Users/young/agents/corporate_runtime/documents/travel_index"
kingdesigncollectiveinc = "C:/Users/young/agents/kingdesigncollectiveinc"
OUTPUT_DIR = os.path.join(TRAVEL_INDEX, "_hermes")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Required asset types that must exist for a country to be "complete"
REQUIRED_ASSETS = [
    "attractions.json",
    "entry_requirements.json",
    "food_culture.md",
    "fun_facts.json",
    "history_culture.md",
    "itineraries_couples.json",
    "itineraries_families.json",
    "itineraries_solo.json",
    "logistics.md",
]

def get_all_country_codes():
    """Get all 250 country codes from the master list."""
    codes = set()
    # From regional_progress_summary
    progress_file = os.path.join(TRAVEL_INDEX, "regional_progress_summary.json")
    if os.path.exists(progress_file):
        with open(progress_file) as f:
            data = json.load(f)
        for region_data in data.get("regions", {}).values():
            for code in region_data.get("complete_codes", []):
                codes.add(code)
    # From population completeness report
    pop_file = os.path.join(kingdesigncollectiveinc, "population_completeness_report.json")
    if os.path.exists(pop_file):
        with open(pop_file) as f:
            data = json.load(f)
        for code in data.get("complete_countries", []):
            codes.add(code)
    # From country guides on disk
    guides_dir = os.path.join(TRAVEL_INDEX, "country_guides")
    if os.path.exists(guides_dir):
        for f in glob.glob(os.path.join(guides_dir, "*.json")):
            codes.add(os.path.basename(f)[:-5])
    # From 250 countries list
    countries_file = os.path.join(kingdesigncollectiveinc, "250 countries list n contents..txt")
    if os.path.exists(countries_file):
        with open(countries_file) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 1 and len(parts[0]) == 3 and parts[0].isupper():
                    codes.add(parts[0])
    return sorted(codes)

def check_country_complete(code):
    """Check if a country has all required assets and is marked complete."""
    guide_file = os.path.join(TRAVEL_INDEX, "country_guides", f"{code}.json")
    has_guide = os.path.exists(guide_file)
    
    if not has_guide:
        return False, "no guide file"
    
    with open(guide_file) as f:
        guide_data = json.load(f)
    
    # Check for completion flag
    if guide_data.get("complete") or guide_data.get("status") == "complete":
        return True, "flagged complete"
    
    # Check required fields in guide
    required_fields = ["country_code", "country_name", "region", "capitalCity", 
                       "latitude", "longitude", "entry_requirements", "climate"]
    missing_fields = [f for f in required_fields if f not in guide_data]
    if missing_fields:
        return False, f"missing fields: {missing_fields}"
    
    return False, "no completion flag"

def build_reconciled_index():
    all_codes = get_all_country_codes()
    print(f"Total country codes found: {len(all_codes)}")
    
    complete = []
    incomplete = []
    
    for code in all_codes:
        is_complete, reason = check_country_complete(code)
        status = {
            "code": code,
            "complete": is_complete,
            "reason": reason
        }
        if is_complete:
            complete.append(code)
        else:
            incomplete.append({
                "code": code,
                "reason": reason
            })
    
    # Build the reconciled index
    index = {
        "meta": {
            "version": "1.0-reconciled",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "disk-truth-reconciliation",
            "total_countries": len(all_codes),
            "complete_count": len(complete),
            "incomplete_count": len(incomplete),
            "completion_percent": round(len(complete) / len(all_codes) * 100, 1) if all_codes else 0
        },
        "complete": complete,
        "incomplete": incomplete
    }
    
    # Write the reconciled index
    output_file = os.path.join(OUTPUT_DIR, "reconciled_index.json")
    with open(output_file, "w") as f:
        json.dump(index, f, indent=2)
    print(f"\nReconciled index written to: {output_file}")
    
    # Also write a flag file that Hermes can check
    flags_file = os.path.join(OUTPUT_DIR, "completion_flags.json")
    with open(flags_file, "w") as f:
        json.dump({
            "complete": complete,
            "incomplete": [i["code"] for i in incomplete],
            "total": len(all_codes),
            "complete_count": len(complete),
            "incomplete_count": len(incomplete)
        }, f, indent=2)
    print(f"Completion flags written to: {flags_file}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Complete: {len(complete)}/{len(all_codes)} ({index['meta']['completion_percent']}%)")
    print(f"Incomplete: {len(incomplete)}")
    
    # Show incomplete list
    if incomplete:
        print(f"\nIncomplete countries ({len(incomplete)}):")
        for item in incomplete:
            print(f"  {item['code']}: {item['reason']}")
    
    return index

if __name__ == "__main__":
    build_reconciled_index()
