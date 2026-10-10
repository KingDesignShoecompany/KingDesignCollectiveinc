#!/usr/bin/env python3
"""
Guard the gh-pages site HTML against the two bugs that shipped a blank page:

  1. Root-relative asset refs (href/src="/_next/..."). GitHub Pages serves this
     project under /KingDesignCollectiveinc/, so a leading slash resolves to the
     domain origin -> every CSS/JS 404s -> blank page. Refs MUST carry the prefix.

  2. Malformed flight payload: assetPrefix value missing its comma separator
     (assetPrefix\":\"\"urlParts) -> invalid JSON -> React can't hydrate -> blank.

Run before/after any deploy that touches index.html. Exit 1 on any failure.

Usage:  python verify_gh_pages.py [branch]
        branch defaults to gh-pages (the live Pages source).
"""
import subprocess, sys, re

REPO = r"C:\Users\young\agents"
PREFIX = "KingDesignCollectiveinc"                          # subdir, no leading slash
BAD = b'assetPrefix\\":\\"\\"urlParts'          # missing-comma flight bug
ROOT_REF = rb'(?:href|src)="/_next/'            # bug 1: unprefixed root-relative
GOOD_REF = rb'(?:href|src)="/' + PREFIX.encode() + rb'/_next/'  # correct prefixed form

def git(args):
    return subprocess.run(["git"] + args, capture_output=True, cwd=REPO, timeout=120)

def main():
    branch = sys.argv[1] if len(sys.argv) > 1 else "gh-pages"
    errors = []

    for f in ("index.html", "404.html", "404/index.html"):
        r = git(["show", f"{branch}:{f}"])
        if r.returncode != 0:
            continue  # file absent on this branch, skip
        html = r.stdout

        root = re.findall(ROOT_REF, html)
        if root:
            errors.append(f"{f}: {len(root)} root-relative /_next/ refs (must be prefixed with /{PREFIX}/)")

        if not re.search(GOOD_REF, html):
            errors.append(f"{f}: no prefixed /{PREFIX}/_next/ refs found")

        if BAD in html:
            errors.append(f"{f}: malformed flight payload (assetPrefix missing comma)")

    if errors:
        print("VERIFY FAILED — blank-page regression present:")
        for e in errors:
            print("  - " + e)
        return 1

    print(f"verify_gh_pages: OK ({branch}) — asset refs prefixed, flight payload well-formed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
