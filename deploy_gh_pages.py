#!/usr/bin/env python3
"""
Deploy Umbrella Corporation subsidiary webapps to GitHub Pages (KingDesignCollectiveinc repo).
Syncs all corporate_runtime/documents/<subsidiary>/webapp/ files into the
KingDesignCollectiveinc repo's assets/<subsidiary>/ directory structure.
"""
import os
import shutil
import subprocess
import json

CORPORATE_RUNTIME = r"C:\Users\young\agents\corporate_runtime\documents"
GH_PAGES_REPO = r"C:\Users\young\agents\KingDesignCollectiveinc"
GITHUB_TOKEN = None

# Subsidiary directory mapping: corporate_runtime subdir -> GH Pages assets subdir
SUBSIDIARIES = {
    "shoe_brand": "shoe-brand",
    "travel_index": "travel-index",
    "game_design": "game-design",
    "kids_channel": "kids-channel",
    "innovation_hub": "innovation-hub",
    "ewaste_recycling": "ewaste-recycling",
    "quantum_wearables": "quantum-wearables",
}

def get_github_token():
    """Get GitHub token from git credentials."""
    try:
        result = subprocess.run(
            ["git", "config", "--global", "credential.helper"],
            capture_output=True, text=True
        )
        if "store" in result.stdout:
            cred_path = os.path.expanduser("~/.git-credentials")
            if os.path.exists(cred_path):
                with open(cred_path) as f:
                    for line in f:
                        if "github.com" in line:
                            # Format: https://oauth2:TOKEN@github.com
                            parts = line.strip().split(":")
                            if len(parts) >= 3:
                                token = parts[2].split("@")[0]
                                return token
    except:
        pass
    return None

def sync_subsidiary(subsidiary_key, assets_name):
    """Sync a subsidiary's webapp files to the GH Pages repo."""
    src_dir = os.path.join(CORPORATE_RUNTIME, subsidiary_key, "webapp")
    dst_dir = os.path.join(GH_PAGES_REPO, "assets", assets_name)
    
    if not os.path.exists(src_dir):
        print(f"  MISSING: {src_dir}")
        return 0
    
    # Clean destination
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    os.makedirs(dst_dir, exist_ok=True)
    
    # Copy all files
    file_count = 0
    for item in os.listdir(src_dir):
        src = os.path.join(src_dir, item)
        dst = os.path.join(dst_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
            for root, dirs, files in os.walk(dst):
                file_count += len(files)
        else:
            shutil.copy2(src, dst)
            file_count += 1
    
    print(f"  {assets_name}: {file_count} files synced")
    return file_count

def update_portal_index():
    """Update the index.html to link to all subsidiaries."""
    index_path = os.path.join(GH_PAGES_REPO, "index.html")
    
    # Read existing index
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add subsidiary launch links to the hero CTA area
    # Find the hero-cta div and add links
    links_html = '\n        <!-- Subsidiary Launches -->\n'
    for key, assets_name in SUBSIDIARIES.items():
        display_names = {
            "shoe_brand": "King Design Collective",
            "travel_index": "The Vagary Index",
            "game_design": "Aura Champions",
            "kids_channel": "Seven Minute Story Sessions",
            "innovation_hub": "Innovation Hub",
            "ewaste_recycling": "e-Waste Reclamation",
            "quantum_wearables": "Quantum Wearables",
        }
        links_html += f'        <a href="assets/{assets_name}/index.html" class="btn btn-ghost">{display_names[key]}</a>\n'
    
    # Insert before the scroll-hint
    content = content.replace(
        '    <div class="scroll-hint">',
        f'{links_html}    <div class="scroll-hint">'
    )
    
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"  Updated index.html with subsidiary links")

def main():
    global GITHUB_TOKEN
    
    GITHUB_TOKEN = get_github_token()
    
    # Clone the repo if it doesn't exist
    if not os.path.exists(GH_PAGES_REPO):
        print(f"Cloning KingDesignCollectiveinc repo...")
        if not GITHUB_TOKEN:
            print("ERROR: No GitHub token found")
            return 1
        
        repo_url = f"https://oauth2:{GITHUB_TOKEN}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
        result = subprocess.run(
            ["git", "clone", repo_url, GH_PAGES_REPO],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"Clone failed: {result.stderr}")
            return 1
        print("  Cloned successfully")
    else:
        print(f"Using existing repo at {GH_PAGES_REPO}")
        # Pull latest
        subprocess.run(["git", "pull"], cwd=GH_PAGES_REPO, capture_output=True)
    
    print("\nSyncing subsidiaries to GitHub Pages:")
    total_files = 0
    for key, assets_name in SUBSIDIARIES.items():
        count = sync_subsidiary(key, assets_name)
        total_files += count
    
    print(f"\nTotal files synced: {total_files}")
    
    # Update portal index
    print("\nUpdating portal index.html:")
    update_portal_index()
    
    # Commit and push
    print("\nCommitting and pushing...")
    subprocess.run(["git", "add", "-A"], cwd=GH_PAGES_REPO, capture_output=True)
    result = subprocess.run(
        ["git", "commit", "-m", "Deploy all 7 subsidiary webapps to GitHub Pages"],
        cwd=GH_PAGES_REPO, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"  Nothing to commit or error: {result.stdout}")
    else:
        print(f"  {result.stdout.strip()}")
    
    result = subprocess.run(["git", "push"], cwd=GH_PAGES_REPO, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  Push error: {result.stderr}")
        return 1
    else:
        print("  Pushed successfully!")
    
    print("\nDeployment complete!")
    return 0

if __name__ == "__main__":
    exit(main())
