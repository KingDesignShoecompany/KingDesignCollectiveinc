#!/usr/bin/env python3
"""
Theme all 7 subsidiary pages: their own accent ("moral compass") + shared dashboard chrome.

For each <slug>/index.html in gh-pages we inject, before </body>:

  1. A per-page CSS var override so the shared chrome (nav active, badge, h2, focus,
     card accents) adopts the subsidiary's own color, while the dark-glass layout
     stays identical to the dashboard. Colors come from the build's own data array.
  2. The dropdown nav (same component as the dashboard), plus subdir-prefixed hrefs
     and correct active state (this page's link, not Dashboard).
  3. The link guard so no in-app nav escapes the /KingDesignCollectiveinc/ subdir.

Idempotent: prior kdc-subsidiary blocks are stripped before re-injection.
"""
import subprocess, os, hashlib, zlib, re

REPO = r"C:\Users\young\agents"
BR = "gh-pages"
SUB = "/KingDesignCollectiveinc"

# slug -> (accent, nav label, data-id used in the app)
# Unified black & gold brand: every subsidiary adopts the gold accent.
PAGES = {
    "travel-index":       ("#d4af37", "Travel",    "travel-index"),
    "shoe-brand":         ("#d4af37", "Shoes",     "shoe-brand"),
    "game-design":        ("#d4af37", "Games",     "game-design"),
    "kids-channel":       ("#d4af37", "Kids",      "kids-channel"),
    "innovation-hub":     ("#d4af37", "Innovation","innovation-hub"),
    "ewaste-recycling":   ("#d4af37", "E-Waste",   "ewaste-recycling"),
    "quantum-wearables":  ("#d4af37", "Quantum",   "quantum-wearables"),
}
SLUGS = list(PAGES.keys())

# Kids-only cosmetic CSS: ~10% larger type/spacing + gold #d4af37 accent on
# hover/active/focus. Landing page (kids-channel/index.html) only.
KIDS_CSS = """
.section { padding: 3.3rem 1.1rem; }
.section-title { font-size: 2rem; margin-bottom: 2.2rem; }
.hero-title { font-size: 2.1rem; }
.episode-card { padding: 1.1rem; }
.story-grid { gap: 1.7rem; }
.story-card { padding: 1.15rem; }
.episode-card:hover, .theme-card:hover, .story-card:hover { border-color: #d4af37; }
.nav-link:hover, .nav-link.active { color: #d4af37; }
a:hover { color: #d4af37; }
.cta-button:hover, .nav-btn:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3); color: #d4af37; }


"""

# E-waste-only cosmetic CSS for the landing page: subtle spacing polish + gold
# #d4af37 hover/active harmony. Scoped to ewaste-recycling/ landing only.
EWASTE_CSS = """
/* E-Waste Recycling — landing polish (spacing/heading + gold #d4af37). Content & layout structure unchanged. */
.subsidiary-page { padding: 30px; }
.content-overlay-layer h2 { font-size: 26px; letter-spacing: 0.06em; }
.nav-link:hover, .nav-link.active { color: #d4af37; }
.kdc-submenu-link:hover, .kdc-submenu-link.active { color: #d4af37; }
.logo-badge { background: #d4af37 !important; }
.cta-button:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3); color: #d4af37; }
"""

# Travel-index-only cosmetic CSS for the landing page: minimal — the gold accent
# already flows via --accent, so just add subtle heading treatment + ensure gold
# reads on nav active/hover. Scoped to travel-index/ landing only.
TRAVEL_CSS = """
/* Travel/Vagary — landing polish (subtle heading treatment + gold #d4af37). Content & layout structure unchanged. */
.KingDesignCollectiveINC-app .content-overlay-layer h2 { letter-spacing: 0.05em; }
.KingDesignCollectiveINC-app .main-nav .nav-link.active,
.KingDesignCollectiveINC-app .main-nav .nav-link:hover { color: #d4af37; }
.KingDesignCollectiveINC-app .main-nav .nav-link.active { background: rgba(212,175,55,0.15); }
.KingDesignCollectiveINC-app .logo-badge { background: #d4af37 !important; }
.KingDesignCollectiveINC-app .cta-button:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3); color: #d4af37; }

"""

# slug -> (accent, nav label, data-id, [(subpage file, display label)])
SUBPAGES = {
    "travel-index":       ["countries.html|Countries", "country.html|Country Detail"],
    "shoe-brand":         ["products.html|Products", "product.html|Product", "about.html|About", "contact.html|Contact", "checkout.html|Checkout"],
    "game-design":        ["cards.html|Card Database", "events.html|Events & Tournaments", "card-detail.html|Card Detail"],
    "kids-channel":       ["stories.html|Library", "story-play.html|Player", "create.html|Create", "about.html|About"],
    "innovation-hub":     ["whitepapers.html|White Papers", "patents.html|Patents", "tech-stack.html|Tech Stack"],
    "ewaste-recycling":   ["materials.html|Materials", "logistics.html|Logistics", "reports.html|Reports"],
    "quantum-wearables":  ["sensors.html|Biometric Sensors", "thermal.html|Thermal", "safety.html|Safety"],
}

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME': 'KingDesign Shoe Company', 'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME': 'KingDesign Shoe Company', 'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git'] + a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full = b'blob ' + str(len(data)).encode() + b'\x00' + data; sha = hashlib.sha1(full).hexdigest()
    d = os.path.join(REPO, '.git', 'objects', sha[:2]); p = os.path.join(d, sha[2:]); os.makedirs(d, exist_ok=True)
    if not os.path.exists(p): open(p, 'wb').write(zlib.compress(full))
    return sha

def block(slug, accent, label):
    kids_css = KIDS_CSS if slug == "kids-channel" else ""
    ewaste_css = EWASTE_CSS if slug == "ewaste-recycling" else ""
    travel_css = TRAVEL_CSS if slug == "travel-index" else ""
    subs = SUBPAGES.get(slug, [])
    subs_js = ",".join('["%s","%s"]' % (f, l) for f, l in (s.split("|", 1) for s in subs))
    return f'''<style id="kdc-subsidiary">
:root{{--accent:{accent};--accent-soft:{accent}26}}
/* Diamond cursor — gold diamond on black, site-wide. Falls back to pointer. */
html, body, a, button, [role="button"], input, select, textarea, label {{ cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 1 L23 12 L12 23 L1 12 Z' fill='%23d4af37' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E") 12 12, pointer; }}
.kdc-menu-btn span{{background:var(--accent)}}
.main-nav .nav-link.active,.nav-link:hover{{color:var(--accent)}}
.main-nav .nav-link.active{{background:{accent}26}}
.kdc-menu-btn[aria-expanded="true"] span{{background:var(--accent)}}
.logo-badge{{background:var(--accent)!important;color:var(--bg-primary)!important}}
/* app hardcodes these inline; !important needed to adopt the subsidiary accent */
.content-overlay-layer h2,.content-overlay-layer h2[style]{{color:var(--accent)!important}}
.subsidiary-page h2,.subsidiary-page h3{{color:var(--accent)!important}}
h2[style*="color"]{{color:var(--accent)!important}}
a{{color:var(--accent)}}
/* Kids Channel — kid-friendly cosmetic polish (larger type/spacing + gold #d4af37 accent). Landing only; content & layout structure unchanged. */
{kids_css}
/* E-Waste Recycling — landing polish (spacing/heading + gold #d4af37). Landing only; content & layout structure unchanged. */
{ewaste_css}
/* Travel/Vagary — landing polish (subtle heading treatment + gold #d4af37). Landing only; content & layout structure unchanged. */
{travel_css}
</style>
<style id="kdc-nav-dropdown">
.app-header{{display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative}}
.kdc-menu-btn{{display:inline-flex;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;
  padding:10px;background:rgba(255,255,255,.05);border:1px solid var(--glass-border);border-radius:8px;cursor:pointer}}
.kdc-menu-btn span{{display:block;height:2px;width:100%;border-radius:2px;transition:transform .25s,opacity .25s}}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(1){{transform:translateY(7px) rotate(45deg)}}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(2){{opacity:0}}
.kdc-menu-btn[aria-expanded="true"] span:nth-child(3){{transform:translateY(-7px) rotate(-45deg)}}
.main-nav{{position:absolute;top:100%;right:0;left:auto;flex-direction:column;gap:0;margin:0;min-width:200px;padding:8px;
  background:rgba(13,15,17,.97);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:1px solid var(--glass-border);border-radius:10px;box-shadow:var(--shadow-xl);
  opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .2s,transform .2s,visibility .2s;z-index:200}}
.kdc-nav-open .main-nav{{opacity:1;visibility:visible;transform:translateY(4px)}}
.main-nav .nav-link{{padding:10px 14px;border-radius:6px;font-size:.8rem}}
.main-nav .nav-link:hover{{background:{accent}1f}}
.kdc-submenu-label{{padding:8px 14px 4px;font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-secondary);opacity:.7}}
.kdc-submenu-link{{display:block;padding:8px 14px 8px 24px;border-radius:6px;font-size:.78rem;color:var(--text-secondary);text-decoration:none}}
.kdc-submenu-link:hover{{background:{accent}1f;color:var(--accent)}}
</style>
<script id="kdc-subsidiary-js">
(function(){{
  var SUB="{SUB}";var SELF="{slug}";
  // fix bare nav hrefs + active state
  function fixNav(){{
    document.querySelectorAll('.main-nav a').forEach(function(a){{
      var h=a.getAttribute('href')||'';
      var m=h.match(/^\\/([a-z-]+)\\/$/);
      if(m)a.setAttribute('href',SUB+h);
      a.classList.toggle('active', h==='/'+SELF+'/'||a.getAttribute('href')===SUB+'/'+SELF+'/');
    }});
  }}
  // dropdown mount (survives React re-render)
  function mount(){{
    var header=document.querySelector('.app-header');var nav=document.querySelector('.main-nav');
    if(!header||!nav||header.querySelector('.kdc-menu-btn'))return;
    fixNav();
    // append this subsidiary's sub-pages as a labeled group in the dropdown
    var SUBS=[{subs_js}];
    if(SUBS.length&&!nav.querySelector('.kdc-submenu-link')){{
      var lab=document.createElement('div');lab.className='kdc-submenu-label';lab.textContent='{label}';
      nav.appendChild(lab);
      SUBS.forEach(function(p){{
        var a=document.createElement('a');a.className='kdc-submenu-link';a.href=SUB+'/'+SELF+'/'+p[0];a.textContent=p[1];
        nav.appendChild(a);
      }});
    }}
    var btn=document.createElement('button');btn.className='kdc-menu-btn';btn.type='button';
    btn.setAttribute('aria-label','Menu');btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span></span><span></span><span></span>';header.appendChild(btn);
    function close(){{header.classList.remove('kdc-nav-open');btn.setAttribute('aria-expanded','false');}}
    btn.addEventListener('click',function(e){{e.stopPropagation();var o=header.classList.toggle('kdc-nav-open');btn.setAttribute('aria-expanded',o?'true':'false');}});
    document.addEventListener('click',function(e){{if(header.classList.contains('kdc-nav-open')&&!header.contains(e.target))close();}});
    nav.addEventListener('click',function(e){{if(e.target.closest('a'))close();}});
    document.addEventListener('keydown',function(e){{if(e.key==='Escape')close();}});
  }}
  mount();
  var he=document.querySelector('.app-header');
  if(he&&window.MutationObserver)new MutationObserver(mount).observe(he,{{childList:true,subtree:true}});
  setTimeout(mount,300);setTimeout(mount,1000);setTimeout(mount,2500);
  // click guard: keep in-subdir
  document.addEventListener('click',function(e){{
    var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    var h=a.getAttribute('href')||'';
    if(/^\\/([a-z-]+)\\/$/.test(h)){{e.preventDefault();location.href=SUB+h;}}
  }},true);
}})();
</script>'''

# sync local ref
git(['fetch', 'origin', BR])
if git(['rev-parse', BR]).stdout.decode().strip() != git(['rev-parse', 'origin/'+BR]).stdout.decode().strip():
    git(['update-ref', 'refs/heads/'+BR, git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock', 'index'):
    fp = os.path.join(REPO, '.git', f)
    if os.path.exists(fp): os.remove(fp)
git(['config', 'core.autocrlf', 'false']); git(['read-tree', BR])

changed = []
for slug, (accent, label, _id) in PAGES.items():
    path = f"{slug}/index.html"
    r = git(['show', f'{BR}:{path}'])
    if r.returncode != 0:
        print(f"  SKIP {path} (absent)"); continue
    html = r.stdout
    # strip prior subsidiary + dropdown injections
    html = re.sub(rb'<style id="kdc-subsidiary">.*?</style>\n?', b'', html, flags=re.S)
    html = re.sub(rb'<style id="kdc-nav-dropdown">.*?</style>\n?', b'', html, flags=re.S)
    html = re.sub(rb'<script id="kdc-subsidiary-js">.*?</script>\n?', b'', html, flags=re.S)
    # prefix any bare nav hrefs in the static shell too
    for s in SLUGS:
        html = html.replace(b'href="/' + s.encode() + b'/"',
                            b'href="' + (SUB + '/' + s + '/').encode() + b'"')
    assert html.count(b'</body>') == 1, f"{path}: body count {html.count(b'</body>')}"
    html = html.replace(b'</body>', block(slug, accent, label).encode() + b'</body>')
    git(['update-index', '--cacheinfo', f'100644,{wblob(html)},{path}'])
    changed.append(path)

print(f"themed {len(changed)} pages: {changed}")

tree = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse', 'origin/'+BR]).stdout.decode().strip()
mf = os.path.join(REPO, '_m.txt')
open(mf, 'w').write("feat: theme 7 subsidiary pages (own accent + dropdown nav + active state + prefixed hrefs)")
commit = git(['commit-tree', tree, '-p', parent, '-F', mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO, '.git', 'refs', 'heads', BR), 'w').write(commit + '\n')
tok = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=REPO).stdout.strip()
url = f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r = git(['push', url, f'{commit}:{BR}', '--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8', 'replace'))
