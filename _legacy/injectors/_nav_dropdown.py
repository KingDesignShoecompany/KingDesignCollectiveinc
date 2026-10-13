#!/usr/bin/env python3
"""
Convert the portal header nav into a right-aligned dropdown menu.

The Next.js source isn't local, so we inject into the committed gh-pages
index.html (same git-plumbing approach as prior fixes). A hamburger toggle on
the right of the header reveals the existing .main-nav links stacked vertically.
Hover still works; links keep their prefixed /KingDesignCollectiveinc/ hrefs.
Mobile-safe: on narrow screens the nav is hidden by default and toggled open.
"""
import subprocess, os, hashlib, zlib

REPO = r"C:\Users\young\agents"
BR = "gh-pages"; HTML = "index.html"

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME': 'KingDesign Shoe Company', 'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME': 'KingDesign Shoe Company', 'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git'] + a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full = b'blob ' + str(len(data)).encode() + b'\x00' + data; sha = hashlib.sha1(full).hexdigest()
    d = os.path.join(REPO, '.git', 'objects', sha[:2]); p = os.path.join(d, sha[2:]); os.makedirs(d, exist_ok=True)
    if not os.path.exists(p): open(p, 'wb').write(zlib.compress(full))
    return sha

INJECT = '''<style id="kdc-nav-dropdown">
.app-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
.kdc-menu-btn{display:inline-flex;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;
  padding:10px;background:rgba(255,255,255,.05);border:1px solid var(--glass-border);border-radius:8px;cursor:pointer}
.kdc-menu-btn span{display:block;height:2px;width:100%;background:var(--accent);border-radius:2px;transition:transform .25s,opacity .25s}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(2){opacity:0}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.main-nav{position:absolute;top:100%;right:0;left:auto;flex-direction:column;gap:0;margin:0;
  min-width:200px;padding:8px;background:rgba(13,15,17,.97);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:1px solid var(--glass-border);border-radius:10px;box-shadow:var(--shadow-xl);
  opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .2s,transform .2s,visibility .2s;z-index:200}
.app-header{position:relative}
.kdc-nav-open .main-nav{opacity:1;visibility:visible;transform:translateY(4px)}
.main-nav .nav-link{padding:10px 14px;border-radius:6px;font-size:.8rem}
.main-nav .nav-link:hover{background:rgba(212,175,55,.12)}
.main-nav .nav-link.active{background:rgba(212,175,55,.16);color:var(--accent)}
@media(max-width:720px){.main-nav{right:12px}}
</style>
<script id="kdc-nav-dropdown-js">
(function(){
  function mount(){
    var header=document.querySelector('.app-header');
    var nav=document.querySelector('.main-nav');
    if(!header||!nav||header.querySelector('.kdc-menu-btn'))return;
    var btn=document.createElement('button');
    btn.className='kdc-menu-btn'; btn.type='button'; btn.setAttribute('aria-label','Menu'); btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span></span><span></span><span></span>';
    header.appendChild(btn);
    function close(){header.classList.remove('kdc-nav-open');btn.setAttribute('aria-expanded','false');}
    function toggle(){var open=header.classList.toggle('kdc-nav-open');btn.setAttribute('aria-expanded',open?'true':'false');}
    btn.addEventListener('click',function(e){e.stopPropagation();toggle();});
    document.addEventListener('click',function(e){if(header.classList.contains('kdc-nav-open')&&!header.contains(e.target))close();});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  }
  // React re-renders the header after hydration and wipes the injected button,
  // so re-mount whenever the header subtree changes.
  mount();
  var headerEl=document.querySelector('.app-header');
  if(headerEl&&window.MutationObserver){
    new MutationObserver(mount).observe(headerEl,{childList:true,subtree:true});
  }
  setTimeout(mount,300);setTimeout(mount,1000);setTimeout(mount,2500);
})();
</script>'''

# sync local ref then patch
git(['fetch', 'origin', BR])
if git(['rev-parse', BR]).stdout.decode().strip() != git(['rev-parse', 'origin/'+BR]).stdout.decode().strip():
    git(['update-ref', 'refs/heads/'+BR, git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock', 'index'):
    fp = os.path.join(REPO, '.git', f)
    if os.path.exists(fp): os.remove(fp)
git(['config', 'core.autocrlf', 'false']); git(['read-tree', BR])

html = git(['show', f'{BR}:{HTML}']).stdout
# strip any prior dropdown injection (id-guarded) so we always ship the latest JS
import re as _re
html = _re.sub(rb'<style id="kdc-nav-dropdown">.*?</style>\n?', b'', html, flags=_re.S)
html = _re.sub(rb'<script id="kdc-nav-dropdown-js">.*?</script>\n?', b'', html, flags=_re.S)
assert html.count(b'</body>') == 1
html = html.replace(b'</body>', INJECT.encode() + b'</body>')
git(['update-index', '--cacheinfo', f'100644,{wblob(html)},{HTML}'])

tree = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()
mf = os.path.join(REPO, '_m.txt'); open(mf, 'w').write("feat: right-aligned dropdown nav menu on portal header")
commit = git(['commit-tree', tree, '-p', parent, '-F', mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO, '.git', 'refs', 'heads', BR), 'w').write(commit + '\n')
tok = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=REPO).stdout.strip()
url = f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r = git(['push', url, f'{commit}:{BR}', '--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8', 'replace'))
