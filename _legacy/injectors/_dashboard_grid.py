#!/usr/bin/env python3
"""
Rebuild the dashboard into the 8-panel grid from reference image #14.

The Next.js app renders 7 .hybrid-card elements with hardcoded inline
position:absolute left/top % (a scattered ring around the globe). This injector:
  1. Hides the globe canvas entirely.
  2. Overrides the cards into a responsive 4x2 CSS grid (black & gold panels).
  3. JS-injects a "Dashboard" panel as cell 1 + enriches each subsidiary panel
     with a hero strip, 3 stats, and 3 thumbnails (placeholder content).
  4. Adds the reference header (logo + tagline + "Made with AI" badge) and footer.

Idempotent: prior kdc-dash-grid / kdc-dash-panels blocks stripped before inject.
Injected into index.html before </body>. Deploys via git plumbing to gh-pages.
"""
import subprocess, os, hashlib, zlib, re

REPO = r"C:\Users\young\agents"
BR = "gh-pages"; HTML = "index.html"
SUB = "/KingDesignCollectiveinc"
GOLD = "#d4af37"

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME':'KingDesign Shoe Company','GIT_AUTHOR_EMAIL':'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME':'KingDesign Shoe Company','GIT_COMMITTER_EMAIL':'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git']+a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full=b'blob '+str(len(data)).encode()+b'\x00'+data; sha=hashlib.sha1(full).hexdigest()
    d=os.path.join(REPO,'.git','objects',sha[:2]); p=os.path.join(d,sha[2:]); os.makedirs(d,exist_ok=True)
    if not os.path.exists(p): open(p,'wb').write(zlib.compress(full))
    return sha

# Per-panel sample content (hero label, 3 stats, 3 thumbnail labels). No real
# image assets exist on the built site, so heroes/thumbs are CSS gradients + emoji.
PANELS = {
    "dashboard": {"tag":"WELCOME BACK","stats":[("Users","12.8M"),("Projects","86"),("Satisfaction","9.8")],
                  "thumbs":["Overview","Analytics","Activity"]},
    "travel-index": {"stats":[("Itineraries","12"),("Destinations","45"),("Bookings","89")],
                     "thumbs":["Skyline","Mountains","Hiker"]},
    "shoe-brand": {"stats":[("In Stock","1,240"),("New Arrivals","85"),("Sold","3,450")],
                   "thumbs":["Side View","Box","On Foot"]},
    "game-design": {"stats":[("Players","12.5K"),("Releases","8"),("Tournaments","3")],
                    "thumbs":["Character","Controller","Racing"]},
    "kids-channel": {"stats":[("Paths","50+"),("Safe Mode","ON"),("Rating","9.7/10")],
                     "thumbs":["Learning","Stories","Create"]},
    "innovation-hub": {"stats":[("Ideas","1,240"),("Patents","45"),("R&D","12")],
                       "thumbs":["Lightbulb","Prototype","Lab"]},
    "ewaste-recycling": {"stats":[("Collected","12,540"),("Processed","8,875"),("Reclaimed","15,620")],
                         "thumbs":["Collection","Sorting","Output"]},
    "quantum-wearables": {"stats":[("Sensors","1.2M"),("Readings","8,450"),("Uptime","99.99%")],
                          "thumbs":["Sensor","Thermal","Status"]},
}
# display order for the grid (cell 1 = Dashboard, then subsidiaries in ref order)
ORDER = ["dashboard","travel-index","shoe-brand","game-design","kids-channel",
         "innovation-hub","ewaste-recycling","quantum-wearables"]

STYLE = '''<style id="kdc-dash-grid">
/* Hide the globe entirely — the grid is now the hero */
#kdc-globe-canvas, .canvas-background, .canvas-overlay { display:none !important; }
/* Turn the absolute overlay into a responsive grid */
.canvas-root { height:auto !important; overflow:visible !important; }
.content-overlay-layer { position:static !important; inset:auto !important; pointer-events:auto !important;
  display:grid !important; grid-template-columns:repeat(4,1fr); gap:18px; padding:20px 24px 40px;
  align-items:stretch; max-width:1500px; margin:0 auto; }
/* Kill the scattered absolute ring; make cards grid cells */
.hybrid-card { position:relative !important; left:auto !important; top:auto !important;
  width:100% !important; min-height:300px !important; transform:none !important;
  display:flex !important; flex-direction:column; border-radius:14px; overflow:hidden;
  background:rgba(255,255,255,0.03); border:1px solid rgba(212,175,55,0.18);
  box-shadow:0 8px 30px rgba(0,0,0,0.5); transition:transform .18s ease, box-shadow .18s ease, border-color .18s; }
.hybrid-card:hover { transform:translateY(-4px); border-color:rgba(212,175,55,0.5);
  box-shadow:0 14px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.25); }
/* Panel internals (injected) */
.kdc-hero { height:120px; display:flex; align-items:center; justify-content:center; font-size:2.6rem;
  background:linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.04) 60%, transparent);
  border-bottom:1px solid rgba(212,175,55,0.15); }
.kdc-panel-body { padding:16px 18px; display:flex; flex-direction:column; gap:12px; flex:1; }
.kdc-panel-title { font-family:Fraunces,Georgia,serif; font-weight:700; font-size:1.15rem; color:#f0e6c8; }
.kdc-stats { display:flex; gap:10px; }
.kdc-stat { flex:1; text-align:center; }
.kdc-stat b { display:block; font-size:1.35rem; color:#d4af37; font-family:Fraunces,serif; }
.kdc-stat span { font-size:.68rem; color:#9a927f; text-transform:uppercase; letter-spacing:.5px; }
.kdc-thumbs { display:flex; gap:8px; margin-top:auto; }
.kdc-thumb { flex:1; height:44px; border-radius:8px; display:flex; align-items:flex-end; justify-content:center;
  font-size:.6rem; color:#e8e0c8; padding-bottom:4px;
  background:linear-gradient(160deg, rgba(212,175,55,0.18), rgba(255,255,255,0.02));
  border:1px solid rgba(212,175,55,0.12); }
.kdc-panel-cta { display:inline-block; margin-top:6px; color:#d4af37; font-weight:700; font-size:.82rem; text-decoration:none; }
.kdc-panel-cta:hover { text-decoration:underline; }
.kdc-corner { position:absolute; top:10px; left:12px; font-size:.6rem; font-weight:800; letter-spacing:1px;
  color:#d4af37; opacity:.8; }
/* Header + footer branding */
.kdc-grid-header { text-align:center; padding:26px 20px 6px; }
.kdc-grid-header h1 { font-family:Fraunces,Georgia,serif; color:#d4af37; font-size:1.9rem; letter-spacing:.04em; margin:0; }
.kdc-grid-header p { color:#9a927f; font-size:.72rem; letter-spacing:.22em; margin:.4rem 0 0; text-transform:uppercase; }
.kdc-grid-header .kdc-badge { display:inline-block; margin-top:.6rem; font-size:.65rem; color:#0a0a0a;
  background:#fff; padding:3px 10px; border-radius:20px; font-weight:700; }
.kdc-grid-footer { text-align:center; padding:18px; color:#d4af37; }
.kdc-grid-footer .kdc-flogo { font-family:Fraunces,Georgia,serif; font-size:1.1rem; letter-spacing:.05em; }
.kdc-grid-footer .kdc-ftag { font-size:.62rem; letter-spacing:.24em; color:#9a927f; margin-top:.3rem; text-transform:uppercase; }
.kdc-grid-footer .kdc-crown { font-size:1.3rem; margin-top:.4rem; }
@media (max-width:1100px){ .content-overlay-layer{grid-template-columns:repeat(2,1fr)} }
@media (max-width:640px){ .content-overlay-layer{grid-template-columns:1fr} }
</style>'''

# PANELS/ORDER serialized into JS
import json
PANELS_JS = json.dumps(PANELS)
ORDER_JS = json.dumps(ORDER)

SCRIPT = '''<script id="kdc-dash-panels">
(function(){
  var PANELS = __PANELS__;
  var ORDER = __ORDER__;
  var GOLD = "#d4af37";
  var SUB = "__SUB__";
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  function buildHeader(){
    if(document.querySelector(".kdc-grid-header")) return;
    var h=document.createElement("div"); h.className="kdc-grid-header";
    h.innerHTML='<h1>KINGDESIGNCOLLECTIVEINC</h1><p>Eight Pillars. One Intelligence. Infinite Impact.</p><span class="kdc-badge">Made with AI</span>';
    var layer=document.querySelector(".content-overlay-layer");
    if(layer) layer.parentNode.insertBefore(h, layer);
  }
  function buildFooter(){
    if(document.querySelector(".kdc-grid-footer")) return;
    var f=document.createElement("div"); f.className="kdc-grid-footer";
    f.innerHTML='<div class="kdc-flogo">KINGDESIGNCOLLECTIVEINC</div><div class="kdc-ftag">Intelligence &bull; Innovation &bull; Impact</div><div class="kdc-crown">&#128081;</div>';
    var layer=document.querySelector(".content-overlay-layer");
    if(layer) layer.parentNode.insertBefore(f, layer.nextSibling);
  }

  // Dashboard panel (cell 1) — injected before the subsidiary cards
  function buildDashboard(){
    if(document.getElementById("kdc-dash-panel")) return;
    var layer=document.querySelector(".content-overlay-layer"); if(!layer) return;
    var d=PANELS["dashboard"];
    var el=document.createElement("div");
    el.className="hybrid-card"; el.id="kdc-dash-panel"; el.setAttribute("data-card-id","dashboard");
    var stats=d.stats.map(function(s){return '<div class="kdc-stat"><b>'+esc(s[1])+'</b><span>'+esc(s[0])+'</span></div>';}).join("");
    var thumbs=d.thumbs.map(function(t){return '<div class="kdc-thumb">'+esc(t)+'</div>';}).join("");
    el.innerHTML='<div class="kdc-corner">KDCI</div>'
      +'<div class="kdc-hero">&#128200;</div>'
      +'<div class="kdc-panel-body">'
      +'<div class="kdc-panel-title">Dashboard</div>'
      +'<div class="kdc-stats">'+stats+'</div>'
      +'<div class="kdc-thumbs">'+thumbs+'</div>'
      +'<a class="kdc-panel-cta" href="'+location.pathname+'">Real-time intelligence &rarr;</a>'
      +'</div>';
    layer.insertBefore(el, layer.firstChild);
  }

  // Enrich each existing subsidiary card with hero/stats/thumbs
  function enrich(){
    document.querySelectorAll(".hybrid-card[data-card-id]").forEach(function(card){
      var id=card.getAttribute("data-card-id");
      if(id==="dashboard"||card.getAttribute("data-kdc-enriched")) return;
      var d=PANELS[id]; if(!d) return;
      card.setAttribute("data-kdc-enriched","1");
      // capture existing link + title before we rebuild inner content
      var link=card.querySelector("a[href]");
      var href=link?link.getAttribute("href"):(SUB+"/"+id+"/");
      var title=(card.querySelector("h1,h2,h3")||{}).textContent||id;
      var icon=card.querySelector("svg,img,.icon")?card.querySelector("svg,img,.icon").outerHTML:"&#127758;";
      var stats=d.stats.map(function(s){return '<div class="kdc-stat"><b>'+esc(s[1])+'</b><span>'+esc(s[0])+'</span></div>';}).join("");
      var thumbs=d.thumbs.map(function(t){return '<div class="kdc-thumb">'+esc(t)+'</div>';}).join("");
      card.innerHTML='<div class="kdc-corner">KDCI</div>'
        +'<div class="kdc-hero">'+icon+'</div>'
        +'<div class="kdc-panel-body">'
        +'<div class="kdc-panel-title">'+esc(title)+'</div>'
        +'<div class="kdc-stats">'+stats+'</div>'
        +'<div class="kdc-thumbs">'+thumbs+'</div>'
        +'<a class="kdc-panel-cta" href="'+esc(href)+'">Explore &rarr;</a>'
        +'</div>';
    });
  }

  function init(){
    if(!document.querySelector(".hybrid-card")) return false;
    buildHeader(); buildDashboard(); enrich(); buildFooter();
    return true;
  }
  if(init())return;
  var mo=new MutationObserver(function(){ if(init()) mo.disconnect(); });
  mo.observe(document.body,{childList:true,subtree:true});
  setTimeout(init,200); setTimeout(init,600); setTimeout(init,1500);
})();
</script>'''.replace("__PANELS__", PANELS_JS).replace("__ORDER__", ORDER_JS).replace("__SUB__", SUB)

INJECT = STYLE + "\n" + SCRIPT

git(['fetch','origin',BR])
if git(['rev-parse',BR]).stdout.decode().strip()!=git(['rev-parse','origin/'+BR]).stdout.decode().strip():
    git(['update-ref','refs/heads/'+BR,git(['rev-parse','origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock','index'):
    fp=os.path.join(REPO,'.git',f)
    if os.path.exists(fp): os.remove(fp)
git(['config','core.autocrlf','false']); git(['read-tree',BR])

html=git(['show',f'{BR}:{HTML}']).stdout
# strip prior grid injection
html=re.sub(rb'<style id="kdc-dash-grid">.*?</style>\n?',b'',html,flags=re.S)
html=re.sub(rb'<script id="kdc-dash-panels">.*?</script>\n?',b'',html,flags=re.S)
assert html.count(b'</body>')==1
html=html.replace(b'</body>', INJECT.encode() + b'</body>')
git(['update-index','--cacheinfo',f'100644,{wblob(html)},{HTML}'])

tree=git(['write-tree']).stdout.decode().strip()
parent=git(['rev-parse','origin/'+BR]).stdout.decode().strip()
mf=os.path.join(REPO,'_m.txt'); open(mf,'w').write("feat: rebuild dashboard into 8-panel black-and-gold grid (hide globe, rich panels, header/footer)")
commit=git(['commit-tree',tree,'-p',parent,'-F',mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO,'.git','refs','heads',BR),'w').write(commit+'\n')
tok=subprocess.run(['gh','auth','token'],capture_output=True,text=True,cwd=REPO).stdout.strip()
url=f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r=git(['push',url,f'{commit}:{BR}','--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8','replace'))
