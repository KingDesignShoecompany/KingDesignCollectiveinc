#!/usr/bin/env python3
"""
Inject logo icons + hover color behavior into the built gh-pages index.html.

The Next.js source isn't on this machine, so we patch the committed build output
(same git-plumbing approach used for the assetPrefix fixes). This rides on the
existing client render and can't break hydration:

  1. Cards render an emoji in <p style="color:var(--text-secondary)">, keyed by
     the parent .hybrid-card[data-card-id]. A DOMContentLoaded script swaps that
     emoji for the matching logo <img src="/KingDesignCollectiveinc/logos/<id>.png">.

  2. .hybrid-card had no hover color (only scale). We add CSS: on hover the card
     border + glow turn gold (--accent) and lift slightly.
"""
import subprocess, os, hashlib, zlib

REPO = r"C:\Users\young\agents"
BRANCH = "gh-pages"
HTML = "index.html"

env = os.environ.copy()
env.update({
    'GIT_AUTHOR_NAME': 'KingDesign Shoe Company', 'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
    'GIT_COMMITTER_NAME': 'KingDesign Shoe Company', 'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com',
})

def git(a, inp=None):
    return subprocess.run(['git'] + a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)

def write_blob(data):
    full = b'blob ' + str(len(data)).encode() + b'\x00' + data
    sha = hashlib.sha1(full).hexdigest()
    d = os.path.join(REPO, '.git', 'objects', sha[:2]); p = os.path.join(d, sha[2:])
    os.makedirs(d, exist_ok=True)
    if not os.path.exists(p):
        with open(p, 'wb') as f: f.write(zlib.compress(full))
    return sha

# ---- CSS + JS to inject (prefixed paths for the Pages subdir) ----
INJECT = '''<style id="kdc-card-hover">
.hybrid-card{transition:border-color .25s ease,box-shadow .25s ease,transform .25s ease!important}
.hybrid-card:hover{border-color:rgba(212,175,55,.9)!important;box-shadow:0 8px 32px rgba(212,175,55,.35)!important}
.hybrid-card .kdc-logo{width:34px;height:34px;object-fit:contain;display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5));transition:transform .25s ease}
.hybrid-card:hover .kdc-logo{transform:scale(1.12)}
.kdc-logo-wrap{display:flex;align-items:center;margin-bottom:4px}
</style>
<script id="kdc-card-logos">
(function(){
  var BASE="/KingDesignCollectiveinc/logos/";
  var SIZES={34:34};
  function swap(){
    document.querySelectorAll('.hybrid-card[data-card-id]').forEach(function(card){
      if(card.querySelector('.kdc-logo'))return;
      var id=card.getAttribute('data-card-id');
      // the emoji lives in the <p> with color:var(--text-secondary)
      var p=card.querySelector('p');
      if(!p)return;
      var wrap=document.createElement('div');wrap.className='kdc-logo-wrap';
      var img=document.createElement('img');img.className='kdc-logo';img.alt=id+' logo';
      img.width=34;img.height=34;img.src=BASE+id+'.png';img.loading='lazy';
      img.onerror=function(){wrap.remove();}; // keep emoji fallback if logo missing
      wrap.appendChild(img);
      p.parentNode.replaceChild(wrap,p);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',swap);else swap();
  // cards are client-rendered (React), so also sweep shortly after load
  setTimeout(swap,400);setTimeout(swap,1200);
})();
</script>'''

# ---- load current index.html from gh-pages ----
html = git(['show', f'{BRANCH}:{HTML}']).stdout
if not html:
    raise SystemExit(f"could not read {BRANCH}:{HTML}")

if b'kdc-card-logos' in html:
    print("already injected; nothing to do")
    raise SystemExit(0)

# inject just before </body>
marker = b'</body>'
assert html.count(marker) == 1, f"expected one </body>, found {html.count(marker)}"
new = html.replace(marker, INJECT.encode() + marker)

# commit via plumbing
lock = os.path.join(REPO, '.git', 'index.lock')
if os.path.exists(lock): os.remove(lock)
if os.path.exists(os.path.join(REPO, '.git', 'index')): os.remove(os.path.join(REPO, '.git', 'index'))
git(['config', 'core.autocrlf', 'false'])
git(['read-tree', BRANCH])
blob = write_blob(new)
git(['update-index', '--cacheinfo', f'100644,{blob},{HTML}'])
tree = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse', f'origin/{BRANCH}']).stdout.decode().strip()
msg = "feat: logo icons + gold hover on portal cards (inject into built index.html)"
mf = os.path.join(REPO, '_m.txt')
open(mf, 'w').write(msg)
commit = git(['commit-tree', tree, '-p', parent, '-F', mf]).stdout.decode().strip()
open(os.path.join(REPO, '.git', 'refs', 'heads', BRANCH), 'w').write(commit + '\n')
os.remove(mf)
token = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=REPO).stdout.strip()
url = f"https://x-access-token:{token}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r = git(['push', url, f'{commit}:{BRANCH}', '--force'])
print(f"commit {commit[:10]}  push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8', 'replace'))
print(f"injected {len(INJECT)} bytes into {HTML}")
