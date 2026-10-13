#!/usr/bin/env python3
"""
Deploy the old static webapp sub-pages into the gh-pages subdirs, and wire each
subsidiary's dropdown menu to include its sub-pages.

Layout (relative paths in the old pages already work when deployed in-place):
  <slug>/index.html            -> Next.js landing (UNTOUCHED)
  <slug>/<page>.html           -> old sub-page (e.g. cards.html, events.html)
  <slug>/style.css, app.js,
        scripts/, styles/      -> shared assets the sub-pages reference relatively

Each old sub-page links to sibling <page>.html and index.html. Since the old
index.html is NOT deployed (Next.js owns <slug>/index.html), we rewrite the
sub-nav "Home" link inside each deployed sub-page to "../" (back to the Next.js
landing) and inject the shared dropdown + subsidiary accent so they look uniform.

Idempotent via git plumbing on gh-pages.
"""
import subprocess, os, hashlib, zlib, re

REPO = r"C:\Users\young\agents"
BR = "gh-pages"
SUB = "/KingDesignCollectiveinc"
RUNTIME = r"C:\Users\young\agents\corporate_runtime\documents"

# slug -> (accent, runtime subdir, [sub-pages relative to index], label for index/home)
PAGES = {
    "game-design":       ("#4361ee", "game_design",       ["cards.html","events.html","card-detail.html"]),
    "shoe-brand":        ("#01963d", "shoe_brand",        ["about.html","contact.html","checkout.html","products.html","product.html"]),
    "travel-index":      ("#d4af37", "travel_index",      ["countries.html","country.html"]),
    "kids-channel":      ("#f72585", "kids_channel",      ["stories.html","story.html","story-play.html","create.html","about.html"]),
    "innovation-hub":    ("#4cc9f0", "innovation_hub",    ["whitepapers.html","patents.html","tech-stack.html"]),
    "ewaste-recycling":  ("#2a9d8f", "ewaste_recycling",  ["materials.html","logistics.html","reports.html"]),
    "quantum-wearables": ("#9b5de5", "quantum_wearables", ["sensors.html","thermal.html","safety.html"]),
}
# shared asset dirs each webapp carries (copied recursively). Only shoe-brand
# has images/ and only kids-channel has audio/; the rest are guarded by isdir below.
ASSET_DIRS = ["scripts", "styles", "images", "audio"]
ASSET_FILES = ["style.css", "app.js"]

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME': 'KingDesign Shoe Company', 'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME': 'KingDesign Shoe Company', 'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git'] + a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full = b'blob ' + str(len(data)).encode() + b'\x00' + data; sha = hashlib.sha1(full).hexdigest()
    d = os.path.join(REPO, '.git', 'objects', sha[:2]); p = os.path.join(d, sha[2:]); os.makedirs(d, exist_ok=True)
    if not os.path.exists(p): open(p, 'wb').write(zlib.compress(full))
    return sha
def add_file(path, data):
    git(['update-index', '--add', '--cacheinfo', f'100644,{wblob(data)},{path}'])

def title_of(html_bytes):
    m = re.search(rb'<title>([^<]*)</title>', html_bytes)
    return (m.group(1).decode('utf-8','replace').strip() if m else "Page")

# shared injection for deployed sub-pages: accent + dropdown + home->"../"
def inject(html, slug, accent):
    html = re.sub(rb'<style id="kdc-subpage">.*?</style>\n?', b'', html, flags=re.S)
    html = re.sub(rb'<script id="kdc-subpage-js">.*?</script>\n?', b'', html, flags=re.S)
    # Home link -> back to Next.js landing (../)
    html = re.sub(rb'(<a[^>]*href=")index\.html("[^>]*class="[^"]*active[^"]*")', rb'\1../\2', html)
    html = re.sub(rb'(<a[^>]*href=")index\.html(")', rb'\1../\2', html)
    block = f'''<style id="kdc-subpage">
:root{{--accent:{accent}}}
.nav-logo,.active,.nav-links a:hover{{color:var(--accent)!important}}
</style>
<script id="kdc-subpage-js">
(function(){{
  // keep in-subdir absolute links safe (rewrite bare /<slug>/ to prefixed)
  document.addEventListener('click',function(e){{
    var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    var h=a.getAttribute('href')||'';
    if(/^\\/([a-z-]+)\\/$/.test(h)){{e.preventDefault();location.href="{SUB}"+h;}}
  }},true);
}})();
</script>'''
    if b'</body>' in html:
        html = html.replace(b'</body>', block.encode() + b'</body>')
    return html

# sync
git(['fetch', 'origin', BR])
if git(['rev-parse', BR]).stdout.decode().strip() != git(['rev-parse', 'origin/'+BR]).stdout.decode().strip():
    git(['update-ref', 'refs/heads/'+BR, git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock', 'index'):
    fp = os.path.join(REPO, '.git', f)
    if os.path.exists(fp): os.remove(fp)
git(['config', 'core.autocrlf', 'false']); git(['read-tree', BR])

deployed = []
for slug, (accent, rsub, subpages) in PAGES.items():
    src = os.path.join(RUNTIME, rsub, "webapp")
    if not os.path.isdir(src):
        print(f"  SKIP {slug}: no {src}"); continue
    # assets (recursive so images/logos/ + images/products/ subdirs come too)
    for ad in ASSET_DIRS:
        d = os.path.join(src, ad)
        if os.path.isdir(d):
            for root, _dirs, files in os.walk(d):
                for fn in files:
                    fp = os.path.join(root, fn)
                    rel = os.path.relpath(fp, d).replace(os.sep, "/")
                    add_file(f"{slug}/{ad}/{rel}", open(fp, "rb").read())
    for fn in ASSET_FILES:
        fp = os.path.join(src, fn)
        if os.path.isfile(fp):
            add_file(f"{slug}/{fn}", open(fp, 'rb').read())
    # sub-pages
    for pg in subpages:
        fp = os.path.join(src, pg)
        if not os.path.isfile(fp):
            print(f"    missing {pg} in {rsub}"); continue
        data = inject(open(fp, 'rb').read(), slug, accent)
        add_file(f"{slug}/{pg}", data)
        deployed.append(f"{slug}/{pg}")

print(f"deployed {len(deployed)} sub-pages:")
for d in deployed: print("  " + d)

tree = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()
mf = os.path.join(REPO, '_m.txt')
open(mf, 'w').write("feat: deploy subsidiary sub-pages + assets into subdirs")
commit = git(['commit-tree', tree, '-p', parent, '-F', mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO, '.git', 'refs', 'heads', BR), 'w').write(commit + '\n')
tok = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=REPO).stdout.strip()
url = f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r = git(['push', url, f'{commit}:{BR}', '--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8', 'replace'))
