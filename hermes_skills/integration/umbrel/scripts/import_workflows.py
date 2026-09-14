#!/usr/bin/env python3
"""
Import n8n workflows into the Umbrella stack.
Usage: python3 import_workflows.py
"""
import json
import os
import shutil
from datetime import datetime

N8N_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".n8n")
WORKFLOW_DIR = os.path.join(os.path.dirname(__file__), "..")

def import_workflows():
    """Copy workflow JSON files to n8n's import directory."""
    
    os.makedirs(N8N_DATA_DIR, exist_ok=True)
    os.makedirs(os.path.join(N8N_DATA_DIR, "workflows"), exist_ok=True)
    
    # Find all workflow JSON files in the integration docs
    workflow_files = []
    for f in os.listdir(WORKFLOW_DIR):
        if f.endswith(".json") and f != "service_health.json":
            workflow_files.append(os.path.join(WORKFLOW_DIR, f))
    
    imported = []
    for wf_path in workflow_files:
        try:
            with open(wf_path, "r") as f:
                wf = json.load(f)
            
            # n8n expects workflow files named by workflow ID or name
            wf_name = wf.get("name", os.path.basename(wf_path))
            dest = os.path.join(N8N_DATA_DIR, "workflows", f"{wf_name}.json")
            shutil.copy2(wf_path, dest)
            imported.append(wf_name)
            print(f"  ✓ Imported: {wf_name}")
        except Exception as e:
            print(f"  ✗ Error importing {wf_path}: {e}")
    
    print(f"\n{len(imported)} workflows imported to {N8N_DATA_DIR}/workflows/")
    print(f"Access n8n at: http://127.0.0.1:5678")
    return imported

if __name__ == "__main__":
    import_workflows()
