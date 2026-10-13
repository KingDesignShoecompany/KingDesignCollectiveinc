#!/usr/bin/env python3
"""
Fix bare (root-relative) internal links on the gh-pages build.

The app links to subsidiaries with href="/game-design/" etc. GitHub Pages serves
this project under /KingDesignCollectiveinc/, so those bare paths resolve to the
domain root and 404. Two layers carry the bad links:

  1. server-rendered index.html nav  -> patch href="/x/" to href="/KingDesignCollectiveinc/x/"
  2. client chunks (8 page-*.js)      -> patch href:"/x/" to href:"/KingDesignCollectiveinc/x/"

Plus a runtime guard in index.html that rewrites any remaining bare in-app link
on click and intercepts client-router navigations, so nothing escapes the subdir.
"""
import subprocess, os, hashlib, zlib

REPO = r"C:\Users\young\agents"
BR = "gh-pages"
SUB = b"/KingDesignCollectiveinc"
SLUGS = [b"ewaste-recycling", b"game-design", b"innovation-hub",
         b"kids-channel", b"quantum-wearables", b"shoe-brand", b"travel-index"]

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME': 'KingDesign Shoe Company', 'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME': 'KingDesign Shoe Company', 'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com'})

def git(a, inp=None):
    return subprocess.run(['git'] + a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)

def wblob(data):
    full = b'blob ' + str(len(data)).encode() + b'\x00' + data
    sha = hashlib.sha1(full).hexdigest()
    d = os.path.join(REPO, '.git', 'objects', sha[:2]); p = os.path.join(d, sha[2:])
    os.makedirs(d, exist_ok=True)
    if not os.path.exists(p): open(p, 'wb').write(zlib.compress(full))
    return sha

def reset_index():
    for f in ('index.lock', 'index'):
        fp = os.path.join(REPO, '.git', f)
        if os.path.exists(fp): os.remove(fp)
    git(['config', 'core.autocrlf', 'false']); git(['read-tree', BR])

def prefix_chunk(data):
    # href:"/slug/"  ->  href:"/KingDesignCollectiveinc/slug/"   (skip if already prefixed)
    for s in SLUGS:
        data = data.replace(b'href:"/' + s + b'/"', b'href:"' + SUB + b'/' + s + b'/"')
    return data

# ---- collect files to patch ----
reset_index()
files = git(['ls-tree', '-r', BR, '--name-only']).stdout.decode().splitlines()
targets = [f for f in files if f.endswith('.js') and '/chunks/' in f]
targets += ['index.html']

changed = []
for f in targets:
    r = git(['show', f'{BR}:{f}'])
    if r.returncode != 0: continue
    old = r.stdout
    new = old
    if f == 'index.html':
        # nav + any bare hrefs
        for s in SLUGS:
            new = new.replace(b'href="/' + s + b'/"', b'href="' + SUB + b'/' + s + b'/"')
    else:
        new = prefix_chunk(new)
    if new != old:
        git(['update-index', '--cacheinfo', f'100644,{wblob(new)},{f}'])
        changed.append(f)

print(f"patched {len(changed)} files:")
for c in changed: print("  " + c)

# ---- runtime guard appended to index.html (rewrites any missed bare link) ----
GUARD = '''<script id="kdc-link-guard">
(function(){
  var SUB="/KingDesignCollectiveinc";
  var SLUGS=["ewaste-recycling","game-design","innovation-hub","kids-channel","quantum-wearables","shoe-brand","travel-index"];
  function fix(a){
    var h=a.getAttribute("href")||"";
    if(SLUGS.some(function(s){return h==="/"+s+"/";})) a.setAttribute("href",SUB+h);
  }
  function sweep(){document.querySelectorAll("a[href]").forEach(fix);}
  sweep();setTimeout(sweep,300);setTimeout(sweep,1000);
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[href]");
    if(!a)return;
    var h=a.getAttribute("href")||"";
    if(SLUGS.some(function(s){return h==="/"+s+"/";})){e.preventDefault();location.href=SUB+h;}
  },true);
})();
</script>'''
html = git(['show', f'{BR}:index.html']).stdout
if b'kdc-link-guard' not in html:
    html = html.replace(b'</body>', GUARD.encode() + b'</body>')
    git(['update-index', '--cacheinfo', f'100644,{wblob(html)},index.html'])
    print("added kdc-link-guard to index.html")

# ---- commit + push ----
tree = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse', f'origin/{BR}']).stdout.decode().strip()
mf = os.path.join(REPO, '_m.txt')
open(mf, 'w').write("fix: prefix internal links with /KingDesignCollectiveinc (nav + cards were 404ing)")
commit = git(['commit-tree', tree, '-p', parent, '-F', mf]).stdout.decode().strip()
os.remove(mf)
open(os.path.join(REPO, '.git', 'refs', 'heads', BR), 'w').write(commit + '\n')
tok = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=REPO).stdout.strip()
url = f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r = git(['push', url, f'{commit}:{BR}', '--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8', 'replace'))
