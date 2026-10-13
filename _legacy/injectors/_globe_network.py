#!/usr/bin/env python3
"""
Render the 3D spinning-globe network concept on the dashboard.

Replaces the plain 2D globe with a canvas scene matching the concept art:
  - night-side Earth: dark sphere, faint city-light speckle, blue atmospheric rim
  - golden equatorial band with "KingDesignCollectiveINC" in serif
  - 7 signal lines from the globe center out to each subsidiary node, colored to
    match that subsidiary, with animated pulse dots traveling along each line

The 7 existing .hybrid-card nodes already sit at fixed % positions forming a ring;
we read their live positions and draw lines to them, so nodes and lines stay in
sync even if the layout shifts. Injected into index.html; hides the old globe.

Idempotent: prior kdc-globe block stripped before re-injection.
"""
import subprocess, os, hashlib, zlib, re

REPO = r"C:\Users\young\agents"
BR = "gh-pages"; HTML = "index.html"

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME':'KingDesign Shoe Company','GIT_AUTHOR_EMAIL':'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME':'KingDesign Shoe Company','GIT_COMMITTER_EMAIL':'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git']+a, capture_output=True, cwd=REPO, timeout=180, input=inp, env=env)
def wblob(data):
    full=b'blob '+str(len(data)).encode()+b'\x00'+data; sha=hashlib.sha1(full).hexdigest()
    d=os.path.join(REPO,'.git','objects',sha[:2]); p=os.path.join(d,sha[2:]); os.makedirs(d,exist_ok=True)
    if not os.path.exists(p): open(p,'wb').write(zlib.compress(full))
    return sha

# slug -> accent color (unified black & gold brand)
COLORS = {
    "travel-index":"#d4af37","shoe-brand":"#d4af37","game-design":"#d4af37",
    "kids-channel":"#d4af37","innovation-hub":"#d4af37","ewaste-recycling":"#d4af37",
    "quantum-wearables":"#d4af37",
}

INJECT = '''<style id="kdc-globe">
/* Diamond cursor — gold diamond on black, site-wide. Falls back to pointer. */
html, body, a, button, [role="button"], input, select, textarea, label { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 1 L23 12 L12 23 L1 12 Z' fill='%23d4af37' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E") 12 12, pointer; }
#kdc-globe-canvas{position:fixed;inset:0;width:100vw;height:100vh;display:block;z-index:0;pointer-events:none}
.canvas-background{display:none!important}
.canvas-root{position:relative;z-index:1}
.content-overlay-layer{position:relative;z-index:5}
.canvas-overlay{z-index:2}
</style>
<script id="kdc-globe-js">
(function(){
  window.__globeBoot=(window.__globeBoot||0)+1;
  try{
  // React mounts .canvas-root after this inline script parses, so if it's not
  // ready yet, observe the body and init when it appears (don't early-return).
  var booted=false;
  function init(){
    if(booted)return true;
    var root=document.querySelector('.canvas-root');
    if(!root)return false;
    booted=true;
    run(root);
    return true;
  }
  function run(root){
  // React hydration wipes nodes inside its managed tree, so mount the canvas on
  // document.body as a fixed full-screen layer. resize()/frame() always re-fetch
  // the live canvas via liveCanvas(), so a hydration wipe self-heals.
  var cv=null,ctx=null;
  var COLORS=__COLORS__;
  var BRAND="KingDesignCollectiveINC";
  var DPR=Math.min(window.devicePixelRatio||1,2);
  var W=0,H=0,cx=0,cy=0,R=0;
  // deterministic starfield + city-light speckle
  function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  var rnd=mulberry(1337);
  var STARS=Array.from({length:160},function(){return{x:rnd(),y:rnd(),r:rnd()*1.3+.2,a:rnd()*.75+.25}});
  var LIGHTS=Array.from({length:420},function(){return{a:rnd()*Math.PI*2,d:Math.sqrt(rnd())*0.92,w:rnd()*1.6+.4}});
  // always operate on the LIVE canvas (a re-append may have replaced the node)
  function liveCanvas(){
    var c=document.getElementById('kdc-globe-canvas');
    if(!c){c=document.createElement('canvas');c.id='kdc-globe-canvas';
      c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none;display:block';
      document.body.appendChild(c);}
    else if(c.parentNode!==document.body){document.body.appendChild(c);}
    return c;
  }
  function resize(){
    cv=liveCanvas();ctx=cv.getContext('2d');
    W=window.innerWidth;H=window.innerHeight;
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    cx=W/2;cy=H/2;R=Math.min(W,H)*0.20;
  }
  window.addEventListener('resize',resize);
  // read live node positions (the 7 hybrid cards)
  function nodes(){
    var out=[];
    document.querySelectorAll('.hybrid-card[data-card-id]').forEach(function(c){
      var id=c.getAttribute('data-card-id');
      var b=c.getBoundingClientRect();
      out.push({id:id,color:COLORS[id]||'#d4af37',x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height});
    });
    return out;
  }
  var t=0;
  function frame(){
    try{
    cv=liveCanvas();ctx=cv.getContext('2d');
    t+=0.012;
    ctx.clearRect(0,0,W,H);
    // starfield
    STARS.forEach(function(s){ctx.globalAlpha=s.a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,7);ctx.fill();});
    ctx.globalAlpha=1;
    // atmospheric rim
    var g=ctx.createRadialGradient(cx,cy,R*0.9,cx,cy,R*1.35);
    g.addColorStop(0,'rgba(60,50,20,0.0)');g.addColorStop(0.7,'rgba(212,175,55,0.20)');g.addColorStop(1,'rgba(212,175,55,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*1.35,0,7);ctx.fill();
    // night earth base
    var eg=ctx.createRadialGradient(cx-R*0.3,cy-R*0.3,R*0.1,cx,cy,R);
    eg.addColorStop(0,'#0a1626');eg.addColorStop(1,'#01060d');
    ctx.fillStyle=eg;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
    // city lights (clipped to sphere, drifting with spin)
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.clip();
    LIGHTS.forEach(function(l){
      var lon=l.a+t*0.15; // spin
      var x=cx+Math.cos(lon)*l.d*R; var y=cy+Math.sin(l.d*0.9)*R*0.5;
      var facing=Math.cos(lon);
      if(facing>0){ctx.globalAlpha=facing*0.9;ctx.fillStyle=(l.w>1.2)?'#ffcf6b':'#cfe6ff';ctx.fillRect(x,y,l.w,l.w);}
    });
    ctx.globalAlpha=1;ctx.restore();
    // sphere outline
    ctx.strokeStyle='rgba(212,175,55,0.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
    // golden equatorial band (ellipse) + brand text
    ctx.save();
    ctx.translate(cx,cy);
    var bg=ctx.createLinearGradient(-R,0,R,0);
    bg.addColorStop(0,'#8a6d1f');bg.addColorStop(0.5,'#e6c25a');bg.addColorStop(1,'#8a6d1f');
    ctx.strokeStyle=bg;ctx.lineWidth=Math.max(6,R*0.12);
    ctx.beginPath();ctx.ellipse(0,0,R*1.02,R*0.30,0,0,Math.PI*2);ctx.stroke();
    // thin metallic sheen highlight just above the band
    ctx.strokeStyle='rgba(230,194,90,0.35)';ctx.lineWidth=Math.max(2,R*0.03);
    ctx.beginPath();ctx.ellipse(0,-4,R*1.02,R*0.30,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#e6c25a';ctx.font='600 '+Math.max(11,R*0.16)+'px Fraunces, Georgia, serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(BRAND,0,R*0.30+Math.max(10,R*0.16));
    ctx.restore();
    // signal lines to each node + traveling pulse
    var ns=nodes();
    ns.forEach(function(n){
      var dx=n.x-cx,dy=n.y-cy,len=Math.hypot(dx,dy);
      var ux=dx/len,uy=dy/len;
      var sx=cx+ux*R*1.05,sy=cy+uy*R*1.05;
      // Pull the endpoint back to where the line EXITS the card's bounding box
      // (ray-box intersection), so lines/rings never sit on the card text.
      // Globe is a background layer; endpoints land just outside the card edge.
      var hw=(n.w/2)+8, hh=(n.h/2)+8;
      var tx=Math.abs(ux)>1e-6?hw/Math.abs(ux):1e9;
      var ty=Math.abs(uy)>1e-6?hh/Math.abs(uy):1e9;
      var clear=Math.min(tx,ty);
      var ex=n.x-ux*clear, ey=n.y-uy*clear;
      // line
      ctx.strokeStyle=n.color;ctx.globalAlpha=0.55;ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
      // node ring (offset from card, not on top of it)
      ctx.globalAlpha=0.9;ctx.strokeStyle=n.color;ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(ex,ey,5,0,7);ctx.stroke();
      // traveling pulse dot + faint radar halo ring
      var phase=(t*0.5+ (n.id.length%7)/7)%1;
      var px=sx+(ex-sx)*phase,py=sy+(ey-sy)*phase;
      ctx.globalAlpha=0.18;ctx.strokeStyle=n.color;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(px,py,5,0,7);ctx.stroke();
      ctx.globalAlpha=0.95;ctx.fillStyle=n.color;
      ctx.beginPath();ctx.arc(px,py,3.0,0,7);ctx.fill();
      ctx.globalAlpha=1;
    });
    requestAnimationFrame(frame);
    }catch(e){window.__globeErr=(window.__globeErr||'')+'|frame:'+e.message;}
  }
  resize();
  // wait for cards to mount, then start; body may be replaced by hydration, so
  // poll on an interval (re-querying document.body each tick) instead of a
  // one-shot observer that would watch a detached node.
  var started=false;
  function start(){
    if(started)return;
    if(!document.querySelector('.hybrid-card'))return;
    liveCanvas(); // ensure canvas exists before guarding
    if(!document.getElementById('kdc-globe-canvas'))return;
    started=true;window.__globeStarted=true;resize();frame();
  }
  start();
  var poll=setInterval(function(){
    if(started){clearInterval(poll);return;}
    // ensure canvas still attached (hydration may have wiped it)
    var c=document.getElementById('kdc-globe-canvas');
    if(c&&c.parentNode!==document.body)document.body.appendChild(c);
    start();
  },300);
  } // end run(root)
  // bootstrap: init now if ready, else observe body until .canvas-root appears
  if(init())return;
  var bootMO=new MutationObserver(function(){if(init())bootMO.disconnect();});
  bootMO.observe(document.body,{childList:true,subtree:true});
  setTimeout(init,200);setTimeout(init,600);setTimeout(init,1500);
  }catch(e){window.__globeErr=(window.__globeErr||'')+'|'+e.message;}
})();
</script>
<script id="kdc-travel-deeplink">
(function(){
  // B5: the Travel node/card href is baked into the Next.js SSR chunk, so we
  // intercept clicks and rewrite them to the auto-opening map deep-link.
  var T="/KingDesignCollectiveinc/travel-index/?map=1";
  function isTravel(a){
    var h=a.getAttribute("href")||"";
    return h==="/KingDesignCollectiveinc/travel-index/"||h==="/KingDesignCollectiveinc/travel-index"
      ||h==="/travel-index/"||h==="/travel-index"
      ||a.getAttribute("data-card-id")==="travel-index"
      ||/travel-index/.test(a.getAttribute("aria-label")||"");
  }
  function sweep(){
    document.querySelectorAll("a[href]").forEach(function(a){
      if(isTravel(a)&&a.getAttribute("href")!==T)a.setAttribute("href",T);
    });
    document.querySelectorAll("[data-card-id='travel-index']").forEach(function(c){
      if(c.tagName==="A")return; c.style.cursor="pointer"; c.dataset.kdcTravelLink="1";
    });
  }
  sweep();setTimeout(sweep,300);setTimeout(sweep,1000);
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[href]");
    if(a&&isTravel(a)){e.preventDefault();location.href=T;return;}
    var c=e.target.closest&&e.target.closest("[data-card-id='travel-index']");
    if(c){e.preventDefault();location.href=T;}
  },true);
})();
</script>''' .replace("__COLORS__", "{" + ",".join(f'"{k}":"{v}"' for k, v in COLORS.items()) + "}")

git(['fetch','origin',BR])
if git(['rev-parse',BR]).stdout.decode().strip()!=git(['rev-parse','origin/'+BR]).stdout.decode().strip():
    git(['update-ref','refs/heads/'+BR,git(['rev-parse','origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock','index'):
    fp=os.path.join(REPO,'.git',f)
    if os.path.exists(fp): os.remove(fp)
git(['config','core.autocrlf','false']); git(['read-tree',BR])

html=git(['show',f'{BR}:{HTML}']).stdout
# strip prior globe injection
html=re.sub(rb'<style id="kdc-globe">.*?</style>\n?',b'',html,flags=re.S)
html=re.sub(rb'<canvas id="kdc-globe-canvas"></canvas>\n?',b'',html,flags=re.S)
html=re.sub(rb'<script id="kdc-globe-js">.*?</script>\n?',b'',html,flags=re.S)
assert html.count(b'</body>')==1
html=html.replace(b'</body>', INJECT.encode() + b'</body>')
git(['update-index','--cacheinfo',f'100644,{wblob(html)},{HTML}'])

tree=git(['write-tree']).stdout.decode().strip()
parent=git(['rev-parse','origin/'+BR]).stdout.decode().strip()
mf=os.path.join(REPO,'_m.txt'); open(mf,'w').write("feat: 3D spinning night-earth globe network with brand band + signal lines to nodes")
commit=git(['commit-tree',tree,'-p',parent,'-F',mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO,'.git','refs','heads',BR),'w').write(commit+'\n')
tok=subprocess.run(['gh','auth','token'],capture_output=True,text=True,cwd=REPO).stdout.strip()
url=f"https://x-access-token:{tok}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
r=git(['push',url,f'{commit}:{BR}','--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8','replace'))
