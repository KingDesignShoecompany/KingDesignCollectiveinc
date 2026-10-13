#!/usr/bin/env python3
"""
Update deployed sub-pages to match the dashboard: shared app-header + dropdown
nav + subsidiary accent, replacing the old standalone .navbar.

Each old sub-page has:
    <nav class="navbar"> <a class="nav-logo">BRAND</a> <div class="nav-links">...</div> </nav>
We inject the dashboard chrome (app-header with the 8-link dropdown + this
subsidiary's own sub-page group), hide the old .navbar via CSS, and set the
accent --accent so headings/links adopt the subsidiary color. Content is kept.

The 8 main links + this slug's sub-pages are rendered by JS (survives any
client re-render) into a fresh .app-header we prepend to <body>.
"""
import subprocess, os, hashlib, zlib, re

REPO = r"C:\Users\young\agents"
BR = "gh-pages"
SUB = "/KingDesignCollectiveinc"

# slug -> accent (unified black & gold brand)
ACCENT = {
    "travel-index":"#d4af37","shoe-brand":"#d4af37","game-design":"#d4af37",
    "kids-channel":"#d4af37","innovation-hub":"#d4af37","ewaste-recycling":"#d4af37",
    "quantum-wearables":"#d4af37",
}
# slug -> deployed sub-pages (file|label) for the in-page dropdown group
SUBPAGES = {
    "game-design":       ["cards.html|Card Database","events.html|Events & Tournaments","card-detail.html|Card Detail"],
    "shoe-brand":        ["products.html|Products","product.html|Product","about.html|About","contact.html|Contact","checkout.html|Checkout"],
    "travel-index":      ["countries.html|Countries","country.html|Country Detail"],
    "kids-channel":      ["stories.html|Library","story-play.html|Player","create.html|Create","about.html|About"],
    "innovation-hub":    ["whitepapers.html|White Papers","patents.html|Patents","tech-stack.html|Tech Stack"],
    "ewaste-recycling":  ["materials.html|Materials","logistics.html|Logistics","reports.html|Reports"],
    "quantum-wearables": ["sensors.html|Biometric Sensors","thermal.html|Thermal","safety.html|Safety"],
}
MAIN_LINKS = [("/","Dashboard"),("/travel-index/","Travel"),("/shoe-brand/","Shoes"),
              ("/game-design/","Games"),("/kids-channel/","Kids"),("/innovation-hub/","Innovation"),
              ("/ewaste-recycling/","E-Waste"),("/quantum-wearables/","Quantum")]

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME':'KingDesign Shoe Company','GIT_AUTHOR_EMAIL':'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME':'KingDesign Shoe Company','GIT_COMMITTER_EMAIL':'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git']+a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full=b'blob '+str(len(data)).encode()+b'\x00'+data; sha=hashlib.sha1(full).hexdigest()
    d=os.path.join(REPO,'.git','objects',sha[:2]); p=os.path.join(d,sha[2:]); os.makedirs(d,exist_ok=True)
    if not os.path.exists(p): open(p,'wb').write(zlib.compress(full))
    return sha

def main_js(): return ",".join('["%s","%s"]'%(h,l) for h,l in MAIN_LINKS)
def subs_js(slug): return ",".join('["%s","%s"]'%(f,l) for f,l in (s.split("|",1) for s in SUBPAGES[slug]))

# Kids-only cosmetic CSS: ~10% larger type/spacing for readability + gold #d4af37 accent
# on hover/active/focus. Scoped by :root var so it only affects kids-channel pages.
KIDS_CSS = """
/* larger, friendlier spacing */
.section { padding: 3.3rem 1.1rem; }
.section-title { font-size: 2rem; margin-bottom: 2.2rem; }
.story-grid { gap: 1.7rem; }
.story-card { padding: 1.15rem; }
.story-wizard { padding: 1.7rem; }
.story-player-container { padding: 1.7rem; }
.story-content { padding: 1.5rem; font-size: 1.08rem; line-height: 1.75; }
.story-header { padding: 1.3rem; }
.story-meta { padding: 0.9rem 0; font-size: 1rem; }
.hero-title { font-size: 2.1rem; }
.about-content { padding: 1.3rem; }
.episode-card { padding: 1.1rem; }
/* consistent gold accent on interactive states */
.story-card:hover, .theme-card:hover, .episode-card:hover { border-color: #d4af37; }
.nav-btn:hover, .cta-button:hover, .age-btn:hover, .theme-btn:hover,
.audio-btn:hover, .control-btn:hover, .timer-btn:hover { border-color: #d4af37; color: #d4af37; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #d4af37; }
#kdc-nav a:hover, #kdc-nav a.kdc-active { color: #d4af37; }

"""

# E-waste-only cosmetic CSS: slightly tighter industrial spacing + larger heading
# + gold #d4af37 accent on hover/active/focus. Scoped under the ewaste body class so
# it only affects ewaste-recycling pages and beats the multi-tenant specificity.
EWASTE_CSS = """
/* E-Waste Recycling — industrial-tuned polish (spacing/heading + gold #d4af37). Content & layout structure unchanged. */
.KingDesignCollectiveINC-ewaste-recycling .section { padding: 3.1rem 1.05rem; }
.KingDesignCollectiveINC-ewaste-recycling .section-title { font-size: 1.85rem; margin-bottom: 2rem; }
.KingDesignCollectiveINC-ewaste-recycling .subtitle { margin-bottom: 2rem; }
/* bump card/panel padding ~10% (1.5rem -> 1.65rem; 2rem -> 2.2rem) */
.KingDesignCollectiveINC-ewaste-recycling .cert-card,
.KingDesignCollectiveINC-ewaste-recycling .payload-json,
.KingDesignCollectiveINC-ewaste-recycling .results,
.KingDesignCollectiveINC-ewaste-recycling .schedule-timeline,
.KingDesignCollectiveINC-ewaste-recycling .compliance-item { padding: 1.65rem; }
.KingDesignCollectiveINC-ewaste-recycling .calculator { padding: 2.2rem; }
/* gold accent on interactive states */
.KingDesignCollectiveINC-ewaste-recycling .cert-card:hover,
.KingDesignCollectiveINC-ewaste-recycling .compliance-item:hover,
.KingDesignCollectiveINC-ewaste-recycling .results:hover { border-color: #d4af37; }
.KingDesignCollectiveINC-ewaste-recycling .cta-button:hover,
.KingDesignCollectiveINC-ewaste-recycling .cta-button:active {
  border-color: #d4af37; color: #d4af37; box-shadow: 0 6px 20px rgba(212,175,55,0.3); }
.KingDesignCollectiveINC-ewaste-recycling .form-group input:focus,
.KingDesignCollectiveINC-ewaste-recycling .form-group select:focus { border-color: #d4af37; outline-color: #d4af37; }
#kdc-nav a:hover, #kdc-nav a.kdc-active { color: #d4af37; }

"""

# Travel-index-only cosmetic CSS: subtle spacing/heading polish tuned for a
# data-dense country list + gold #d4af37 accent on hover/active/filter states.
# Scoped under the travel body class so it only affects travel-index pages.
# Content & layout structure unchanged (cosmetic CSS only).
TRAVEL_CSS = """
/* Travel/Vagary — polish (spacing/heading + gold #d4af37 hover/active/filter harmony). Content & layout structure unchanged. */
.KingDesignCollectiveINC-travel-index .section { padding: 3.0rem 1rem; }
.KingDesignCollectiveINC-travel-index .section-title { font-size: 1.9rem; margin-bottom: 1.9rem; }
/* tighter grid rhythm for many country cards */
.KingDesignCollectiveINC-travel-index .country-grid { gap: 1.4rem; }
.KingDesignCollectiveINC-travel-index .region-card { padding: 1.1rem; }
.KingDesignCollectiveINC-travel-index .region-card:hover { border-color: #d4af37; }
/* gold accent on filter buttons (active + hover) */
.KingDesignCollectiveINC-travel-index .filter-btn { border-color: #d4af37; }
.KingDesignCollectiveINC-travel-index .filter-btn:hover { border-color: #d4af37; color: #d4af37; }
.KingDesignCollectiveINC-travel-index .filter-btn.active {
  border-color: #d4af37; color: #d4af37; background: rgba(212,175,55,0.14); }
/* gold focus ring on the search input */
.KingDesignCollectiveINC-travel-index .search-container input:focus { border-color: #d4af37; outline-color: #d4af37; }
/* gold harmony on country-detail tabs */
.KingDesignCollectiveINC-travel-index .tab-btn:hover,
.KingDesignCollectiveINC-travel-index .tab-btn.active { border-color: #d4af37; color: #d4af37; }
/* footer link/heading color harmony */
.KingDesignCollectiveINC-travel-index .footer a { color: #d4af37; }
.KingDesignCollectiveINC-travel-index .footer a:hover { color: #d4af37; }
#kdc-nav a:hover, #kdc-nav a.kdc-active { color: #d4af37; }

"""

def block(slug, accent):
    kids_css = KIDS_CSS if slug == "kids-channel" else ""
    ewaste_css = EWASTE_CSS if slug == "ewaste-recycling" else ""
    travel_css = TRAVEL_CSS if slug == "travel-index" else ""
    return f'''<style id="kdc-subpage-chrome">
:root{{--accent:{accent}}}
/* Diamond cursor — gold diamond on black, site-wide. Falls back to pointer. */
html, body, a, button, [role="button"], input, select, textarea, label {{ cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 1 L23 12 L12 23 L1 12 Z' fill='%23d4af37' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E") 12 12, pointer; }}
/* hide the old standalone navbar; dashboard chrome replaces it */
.navbar{{display:none!important}}
/* prepended dashboard header */
#kdc-header{{position:sticky;top:0;z-index:300;background:rgba(13,15,17,.9);backdrop-filter:blur(10px);
  border-bottom:1px solid hsla(0,0%,100%,.06);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative}}
#kdc-header .kdc-brand{{font-family:Fraunces,serif;font-weight:700;color:#f0f0f0;display:flex;align-items:center;gap:8px}}
#kdc-header .kdc-badge{{background:var(--accent);color:#050709;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:4px}}
#kdc-menu-btn{{display:inline-flex;flex-direction:column;justify-content:center;gap:5px;width:44px;height:44px;padding:10px;
  background:rgba(255,255,255,.05);border:1px solid hsla(0,0%,100%,.06);border-radius:8px;cursor:pointer}}
#kdc-menu-btn span{{display:block;height:2px;width:100%;background:var(--accent);border-radius:2px;transition:transform .25s,opacity .25s}}
#kdc-menu-btn[aria-expanded="true"] span:nth-child(1){{transform:translateY(7px) rotate(45deg)}}
#kdc-menu-btn[aria-expanded="true"] span:nth-child(2){{opacity:0}}
#kdc-menu-btn[aria-expanded="true"] span:nth-child(3){{transform:translateY(-7px) rotate(-45deg)}}
#kdc-nav{{position:absolute;top:100%;right:0;flex-direction:column;gap:0;margin:0;min-width:210px;padding:8px;
  background:rgba(13,15,17,.97);backdrop-filter:blur(12px);border:1px solid hsla(0,0%,100%,.06);border-radius:10px;
  box-shadow:0 6px 24px rgba(0,0,0,.45);opacity:0;visibility:hidden;transform:translateY(-8px);
  transition:opacity .2s,transform .2s,visibility .2s;z-index:400}}
#kdc-header.kdc-open #kdc-nav{{opacity:1;visibility:visible;transform:translateY(4px)}}
#kdc-nav a{{display:block;padding:10px 14px;border-radius:6px;font-size:.8rem;color:#a0a0a0;text-decoration:none}}
#kdc-nav a:hover{{background:{accent}1f;color:var(--accent)}}
#kdc-nav a.kdc-active{{background:{accent}26;color:var(--accent)}}
#kdc-nav .kdc-sub-label{{padding:8px 14px 4px;font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;color:#a0a0a0;opacity:.7}}
#kdc-nav a.kdc-sub{{padding-left:24px;font-size:.78rem}}
/* Kids Channel — kid-friendly cosmetic polish (larger type/spacing + gold #d4af37 accent on hover/active). Content & layout structure unchanged. */
{kids_css}
/* E-Waste Recycling — industrial-tuned polish (spacing/heading + gold #d4af37 accent on hover/active). Content & layout structure unchanged. */
{ewaste_css}
/* Travel/Vagary — polish (spacing/heading + gold #d4af37 hover/active/filter harmony). Content & layout structure unchanged. */
{travel_css}
</style>
<div id="kdc-header">
  <div class="kdc-brand">KingDesignCollectiveINC<span class="kdc-badge">250</span></div>
  <button id="kdc-menu-btn" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
  <nav id="kdc-nav"></nav>
</div>
<script id="kdc-subpage-chrome-js">
(function(){{
  var SUB="{SUB}";var SELF="{slug}";
  var header=document.getElementById('kdc-header'),nav=document.getElementById('kdc-nav'),btn=document.getElementById('kdc-menu-btn');
  if(!header||!nav||!btn)return;
  // id-guard: never let a re-mount create a second Menu button / header
  if(document.querySelectorAll('#kdc-menu-btn').length>1){{
    var extras=document.querySelectorAll('#kdc-menu-btn');
    for(var i=1;i<extras.length;i++)extras[i].remove();
    btn=document.getElementById('kdc-menu-btn');
  }}
  var MAIN=[{main_js()}],SUBS=[{subs_js(slug)}];
  function build(){{
    nav.innerHTML='';
    MAIN.forEach(function(p){{
      var a=document.createElement('a');a.href=SUB+p[0];a.textContent=p[1];
      if(p[0]==='/'+SELF+'/')a.classList.add('kdc-active');
      nav.appendChild(a);
    }});
    if(SUBS.length){{
      var lab=document.createElement('div');lab.className='kdc-sub-label';lab.textContent='{slug}';nav.appendChild(lab);
      SUBS.forEach(function(p){{
        var a=document.createElement('a');a.className='kdc-sub';a.href=SUB+'/'+SELF+'/'+p[0];a.textContent=p[1];
        if(location.pathname.endsWith('/'+p[0]))a.classList.add('kdc-active');
        nav.appendChild(a);
      }});
    }}
  }}
  build();
  function close(){{header.classList.remove('kdc-open');btn.setAttribute('aria-expanded','false');}}
  btn.addEventListener('click',function(e){{e.stopPropagation();var o=header.classList.toggle('kdc-open');btn.setAttribute('aria-expanded',o?'true':'false');}});
  document.addEventListener('click',function(e){{if(header.classList.contains('kdc-open')&&!header.contains(e.target))close();}});
  nav.addEventListener('click',function(e){{if(e.target.tagName==='A')close();}});
  document.addEventListener('keydown',function(e){{if(e.key==='Escape')close();}});
  // keep bare /<slug>/ links in-subdir
  document.addEventListener('click',function(e){{
    var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    var h=a.getAttribute('href')||'';
    if(/^\\/[a-z-]+\\/$/.test(h)){{e.preventDefault();location.href=SUB+h;}}
  }},true);
}})();
</script>'''

# sync
git(['fetch','origin',BR])
if git(['rev-parse',BR]).stdout.decode().strip()!=git(['rev-parse','origin/'+BR]).stdout.decode().strip():
    git(['update-ref','refs/heads/'+BR,git(['rev-parse','origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock','index'):
    fp=os.path.join(REPO,'.git',f)
    if os.path.exists(fp): os.remove(fp)
git(['config','core.autocrlf','false']); git(['read-tree',BR])

# find all deployed sub-pages
tree = git(['ls-tree','-r','--name-only',BR]).stdout.decode().splitlines()
updated=[]
for slug in SUBPAGES:
    accent=ACCENT[slug]
    for line in tree:
        if not line.startswith(slug+'/') or not line.endswith('.html'): continue
        if line == f"{slug}/index.html": continue  # Next.js landing, handled elsewhere
        r=git(['show',f'{BR}:{line}'])
        if r.returncode!=0: continue
        html=r.stdout
        # strip any prior chrome injection (idempotent)
        html=re.sub(rb'<style id="kdc-subpage-chrome">.*?</style>\n?',b'',html,flags=re.S)
        html=re.sub(rb'<div id="kdc-header">.*?</div>\n?',b'',html,flags=re.S)
        html=re.sub(rb'<script id="kdc-subpage-chrome-js">.*?</script>\n?',b'',html,flags=re.S)
        html=re.sub(rb'<style id="kdc-subpage">.*?</style>\n?',b'',html,flags=re.S)
        html=re.sub(rb'<script id="kdc-subpage-js">.*?</script>\n?',b'',html,flags=re.S)
        # split the block into style+script (before </body>) and header div (after <body>)
        full=block(slug,accent)
        style_only=full.split('<div id="kdc-header">')[0]
        script_part=full[full.index('<script id="kdc-subpage-chrome-js">'):]
        header_div=('<div id="kdc-header"><div class="kdc-brand">KingDesignCollectiveINC'
                    '<span class="kdc-badge">250</span></div>'
                    '<button id="kdc-menu-btn" type="button" aria-label="Menu" aria-expanded="false">'
                    '<span></span><span></span><span></span></button><nav id="kdc-nav"></nav></div>')
        m=re.search(rb'<body[^>]*>',html)
        if not m: continue
        # remove any prior chrome header (nested <div> safe: strip by explicit marker pair),
        # then insert exactly one after <body> so the Menu button is never doubled
        html=re.sub(rb'<div id="kdc-header">.*?(</nav></div>)',b'',html,flags=re.S)
        html=re.sub(rb'(<div id="kdc-header">.*?</div>)\s*(<div id="kdc-header">)',rb'\1',html,flags=re.S)
        html=html[:m.end()] + header_div.encode() + html[m.end():]
        html=html.replace(b'</body>', (style_only+script_part).encode() + b'</body>')
        git(['update-index','--cacheinfo',f'100644,{wblob(html)},{line}'])
        updated.append(line)

print(f"updated {len(updated)} sub-pages:")
for u in updated: print("  "+u)

tree_sha=git(['write-tree']).stdout.decode().strip()
parent=git(['rev-parse','origin/'+BR]).stdout.decode().strip()
mf=os.path.join(REPO,'_m.txt'); open(mf,'w').write("feat: sub-pages adopt dashboard header + dropdown + accent (uniform chrome)")
commit=git(['commit-tree',tree_sha,'-p',parent,'-F',mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO,'.git','refs','heads',BR),'w').write(commit+'\n')
tok=subprocess.run(['gh','auth','token'],capture_output=True,text=True,cwd=REPO).stdout.strip()
url=f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r=git(['push',url,f'{commit}:{BR}','--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8','replace'))
