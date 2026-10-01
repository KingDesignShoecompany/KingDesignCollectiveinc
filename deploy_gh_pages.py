#!/usr/bin/env python3
import os
import shutil
import subprocess

NEXT_EXPORT_DIR = r"C:\Users\young\agents\kingdesign-intelligence-platform\out"
GH_PAGES_REPO = r"C:\Users\young\agents\KingDesignCollectiveinc"
GITHUB_TOKEN = None

def get_github_token():
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
                            parts = line.strip().split(":")
                            if len(parts) >= 3:
                                token = parts[2].split("@")[0]
                                return token
    except:
        pass
    return None

def sync_next_export():
    if not os.path.exists(NEXT_EXPORT_DIR):
        print(f"ERROR: Next.js export dir not found: {NEXT_EXPORT_DIR}")
        return 0

    # Clean repo root (except .git)
    for item in os.listdir(GH_PAGES_REPO):
        if item == ".git":
            continue
        path = os.path.join(GH_PAGES_REPO, item)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)

    # Copy out/ into repo root
    file_count = 0
    for item in os.listdir(NEXT_EXPORT_DIR):
        src = os.path.join(NEXT_EXPORT_DIR, item)
        dst = os.path.join(GH_PAGES_REPO, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
            for _, _, files in os.walk(dst):
                file_count += len(files)
        else:
            shutil.copy2(src, dst)
            file_count += 1

    print(f"  Synced {file_count} files from Next.js export")
    return file_count

def main():
    global GITHUB_TOKEN
    GITHUB_TOKEN = get_github_token()

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
        subprocess.run(["git", "pull"], cwd=GH_PAGES_REPO, capture_output=True)

    print("\nSyncing Next.js export to GitHub Pages:")
    total_files = sync_next_export()
    print(f"\nTotal files synced: {total_files}")

    print("\nCommitting and pushing...")
    subprocess.run(["git", "add", "-A"], cwd=GH_PAGES_REPO, capture_output=True)
    result = subprocess.run(
        ["git", "commit", "-m", "Deploy Next.js intelligence platform"],
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
