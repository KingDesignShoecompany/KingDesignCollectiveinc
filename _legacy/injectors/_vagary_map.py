#!/usr/bin/env python3
"""
Inject the interactive Vagary Index DOT MAP into the travel-index pages.

Approach: equirectangular projection. No world GeoJSON/SVG exists offline and
only ~32 of 250 countries currently carry lat/lon, so we plot each country that
HAS a latitude/longitude as a positioned dot, colored by visit-state
(visited=gold #d4af37, want=red #e63946, unvisited=teal #2a9d8f). The map grows
automatically as more countries get coordinates.

Data: reads the live Vagary API (http://localhost:8080, configurable via
window.__VAGARY_API__) for the roster, per-country coords, visit-state, POIs and
heat rasters. If the API is unreachable (e.g. on GitHub Pages, which cannot hit
localhost), it falls back to a small baked-in list of located countries so the
map is NEVER blank, shows an "offline" note, and disables the mark-visited
buttons.

React hydration wipes injected DOM nodes inside its managed tree, so the map
container/toggle are CREATED IN JS and mounted on document.body, and re-appended
on an interval + MutationObserver (self-heal). Id-guarded "kdc-vagary-map";
prior injection stripped before re-injection. Idempotent.

Targets: travel-index/index.html and travel-index/countries.html.
"""
import subprocess, os, hashlib, zlib, re, json

REPO = r"C:\Users\young\agents"
BR = "gh-pages"
REPO_URL = "https://github.com/KingDesignShoecompany/KingDesignCollectiveinc.git"
TARGETS = ["travel-index/index.html", "travel-index/countries.html"]

# Baked fallback: countries that currently carry lat/lon in the API country
# data. Rendered (teal / unvisited) when the API is unreachable so the map is
# never blank. Grows as more countries get coordinates — this is just the seed.
FALLBACK = [
    {"code":"ABW","name":"Aruba","lat":12.5167,"lon":-70.0167,"capital":"Oranjestad","region":"Latin America & Caribbean"},
    {"code":"AFG","name":"Afghanistan","lat":34.5228,"lon":69.1761,"capital":"Kabul","region":"MENA"},
    {"code":"AGO","name":"Angola","lat":-8.81155,"lon":13.242,"capital":"Luanda","region":"Sub-Saharan Africa"},
    {"code":"ALB","name":"Albania","lat":41.3317,"lon":19.8172,"capital":"Tirane","region":"Europe & Central Asia"},
    {"code":"AND","name":"Andorra","lat":42.5075,"lon":1.5218,"capital":"Andorra la Vella","region":"Europe & Central Asia"},
    {"code":"ARE","name":"United Arab Emirates","lat":24.4764,"lon":54.3705,"capital":"Abu Dhabi","region":"MENA"},
    {"code":"ARG","name":"Argentina","lat":-34.6118,"lon":-58.4173,"capital":"Buenos Aires","region":"Latin America & Caribbean"},
    {"code":"ARM","name":"Armenia","lat":40.1596,"lon":44.509,"capital":"Yerevan","region":"Europe & Central Asia"},
    {"code":"ASM","name":"American Samoa","lat":-14.2846,"lon":-170.691,"capital":"Pago Pago","region":"East Asia & Pacific"},
    {"code":"ATG","name":"Antigua and Barbuda","lat":17.1175,"lon":-61.8456,"capital":"Saint John's","region":"Latin America & Caribbean"},
    {"code":"AUS","name":"Australia","lat":-35.282,"lon":149.129,"capital":"Canberra","region":"East Asia & Pacific"},
    {"code":"AUT","name":"Austria","lat":48.2201,"lon":16.3798,"capital":"Vienna","region":"Europe & Central Asia"},
    {"code":"AZE","name":"Azerbaijan","lat":40.3834,"lon":49.8932,"capital":"Baku","region":"Europe & Central Asia"},
    {"code":"BDI","name":"Burundi","lat":-3.3784,"lon":29.3639,"capital":"Bujumbura","region":"Sub-Saharan Africa"},
    {"code":"BEL","name":"Belgium","lat":50.8371,"lon":4.36761,"capital":"Brussels","region":"Europe & Central Asia"},
    {"code":"BEN","name":"Benin","lat":6.4779,"lon":2.6323,"capital":"Porto-Novo","region":"Sub-Saharan Africa"},
    {"code":"BFA","name":"Burkina Faso","lat":12.3605,"lon":-1.53395,"capital":"Ouagadougou","region":"Sub-Saharan Africa"},
    {"code":"BGD","name":"Bangladesh","lat":23.7055,"lon":90.4113,"capital":"Dhaka","region":"South Asia"},
    {"code":"BGR","name":"Bulgaria","lat":42.7105,"lon":23.3238,"capital":"Sofia","region":"Europe & Central Asia"},
    {"code":"BHR","name":"Bahrain","lat":26.1921,"lon":50.5354,"capital":"Manama","region":"MENA"},
    {"code":"BHS","name":"Bahamas, The","lat":25.0661,"lon":-77.339,"capital":"Nassau","region":"Latin America & Caribbean"},
    {"code":"BIH","name":"Bosnia and Herzegovina","lat":43.8607,"lon":18.4214,"capital":"Sarajevo","region":"Europe & Central Asia"},
    {"code":"BLR","name":"Belarus","lat":53.9678,"lon":27.5766,"capital":"Minsk","region":"Europe & Central Asia"},
    {"code":"BLZ","name":"Belize","lat":17.2534,"lon":-88.7713,"capital":"Belmopan","region":"Latin America & Caribbean"},
    {"code":"BMU","name":"Bermuda","lat":32.3293,"lon":-64.706,"capital":"Hamilton","region":"North America"},
    {"code":"BOL","name":"Bolivia","lat":-13.9908,"lon":-66.1936,"capital":"La Paz","region":"Latin America & Caribbean"},
    {"code":"BRA","name":"Brazil","lat":-15.7801,"lon":-47.9292,"capital":"Brasilia","region":"Latin America & Caribbean"},
    {"code":"BRB","name":"Barbados","lat":13.0935,"lon":-59.6105,"capital":"Bridgetown","region":"Latin America & Caribbean"},
    {"code":"BRN","name":"Brunei Darussalam","lat":4.94199,"lon":114.946,"capital":"Bandar Seri Begawan","region":"East Asia & Pacific"},
    {"code":"BTN","name":"Bhutan","lat":27.5768,"lon":89.6177,"capital":"Thimphu","region":"South Asia"},
    {"code":"BWA","name":"Botswana","lat":-24.6544,"lon":25.9201,"capital":"Gaborone","region":"Sub-Saharan Africa"},
    {"code":"CAF","name":"Central African Republic","lat":5.63056,"lon":21.6407,"capital":"Bangui","region":"Sub-Saharan Africa"},
]

env = os.environ.copy()
env.update({'GIT_AUTHOR_NAME':'KingDesign Shoe Company','GIT_AUTHOR_EMAIL':'king@kingdesigncompany.com',
            'GIT_COMMITTER_NAME':'KingDesign Shoe Company','GIT_COMMITTER_EMAIL':'king@kingdesigncompany.com'})
def git(a, inp=None): return subprocess.run(['git']+a, capture_output=True, cwd=REPO, timeout=240, input=inp, env=env)
def wblob(data):
    full=b'blob '+str(len(data)).encode()+b'\x00'+data; sha=hashlib.sha1(full).hexdigest()
    d=os.path.join(REPO,'.git','objects',sha[:2]); p=os.path.join(d,sha[2:]); os.makedirs(d,exist_ok=True)
    if not os.path.exists(p): open(p,'wb').write(zlib.compress(full))
    return sha

STYLE = """<style id="kdc-vagary-map">
#kdc-vagary-map-wrap{position:fixed;z-index:2147483000;font-family:Inter,system-ui,sans-serif}
#kdc-vagary-map-btn{position:fixed;right:16px;bottom:16px;z-index:2147483001;background:#0d0f11;color:#d4af37;
  border:1px solid #d4af37;border-radius:999px;padding:10px 16px;font-size:.82rem;font-weight:600;cursor:pointer;
  box-shadow:0 6px 24px rgba(0,0,0,.5);letter-spacing:.3px}
#kdc-vagary-map-btn:hover{background:#15181b}
#kdc-vagary-map-panel{position:fixed;right:16px;bottom:64px;z-index:2147483000;width:min(720px,94vw);max-height:88vh;
  overflow:auto;background:#0d0f11;border:1px solid rgba(212,175,55,.35);border-radius:14px;padding:16px;
  color:#e8e8e8;box-shadow:0 18px 60px rgba(0,0,0,.6);display:none}
#kdc-vagary-map-wrap.kdc-vm-open #kdc-vagary-map-panel{display:block}
.kdc-vm-title{font-family:Fraunces,Georgia,serif;font-size:1.15rem;font-weight:700;color:#f0f0f0;margin:0 0 2px}
.kdc-vm-sub{font-size:.72rem;color:#9aa0a6;margin-bottom:10px}
.kdc-vm-note{display:none;background:rgba(230,57,70,.12);border:1px solid rgba(230,57,70,.5);color:#ffb3ba;
  border-radius:8px;padding:7px 10px;font-size:.74rem;margin-bottom:10px}
.kdc-vm-note.kdc-on{display:block}
.kdc-vm-stats{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:.76rem;color:#cfd3d7;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:8px 12px;margin-bottom:10px}
.kdc-vm-stats b{color:#f0f0f0}
.kdc-vm-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
.kdc-vm-mapwrap{position:relative;background:radial-gradient(120% 120% at 50% 0%,#10151c 0%,#080b0f 100%);
  border:1px solid rgba(255,255,255,.07);border-radius:10px;overflow:hidden}
#kdc-vagary-map-canvas{display:block;width:100%;height:300px;cursor:crosshair}
.kdc-vm-legend{position:absolute;top:8px;left:8px;background:rgba(8,11,15,.72);border:1px solid rgba(255,255,255,.08);
  border-radius:8px;padding:7px 9px;font-size:.68rem;color:#d7dbe0;line-height:1.7;backdrop-filter:blur(4px)}
.kdc-vm-tip{position:absolute;pointer-events:none;background:rgba(8,11,15,.95);border:1px solid rgba(212,175,55,.4);
  color:#f0f0f0;font-size:.7rem;padding:4px 8px;border-radius:6px;transform:translate(-50%,-130%);white-space:nowrap;display:none;z-index:5}
.kdc-vm-loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.75rem;color:#9aa0a6}
.kdc-vm-detail{margin-top:12px;border-top:1px solid rgba(255,255,255,.08);padding-top:12px}
.kdc-vm-dhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.kdc-vm-dname{font-family:Fraunces,Georgia,serif;font-size:1.05rem;font-weight:700;color:#f0f0f0}
.kdc-vm-dmeta{font-size:.72rem;color:#9aa0a6;margin-top:2px}
.kdc-vm-btns{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.kdc-vm-btn2{border:1px solid rgba(255,255,255,.18);background:transparent;color:#d7dbe0;border-radius:8px;
  padding:6px 12px;font-size:.74rem;cursor:pointer}
.kdc-vm-btn2:hover{border-color:#d4af37;color:#d4af37}
.kdc-vm-btn2.kdc-active{border-color:#d4af37;color:#d4af37;background:rgba(212,175,55,.14)}
.kdc-vm-btn2[disabled]{opacity:.45;cursor:not-allowed}
.kdc-vm-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.kdc-vm-tile{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px}
.kdc-vm-tile h4{margin:0 0 6px;font-size:.72rem;letter-spacing:.8px;text-transform:uppercase;color:#d4af37;font-weight:700}
.kdc-vm-tile .kdc-empty{font-size:.74rem;color:#7d838a}
.kdc-vm-photos{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.kdc-vm-photos img{width:100%;height:60px;object-fit:cover;border-radius:6px;display:block}
.kdc-vm-photos .kdc-cap{font-size:.6rem;color:#8b9096;margin-top:2px;line-height:1.3}
.kdc-vm-raster{width:100%;border-radius:8px;display:block;border:1px solid rgba(255,255,255,.08)}
.kdc-vm-list{list-style:none;margin:0;padding:0;font-size:.74rem;color:#cfd3d7}
.kdc-vm-list li{padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.kdc-vm-list li .kdc-coord{color:#8b9096;font-size:.66rem}
.kdc-vm-span2{grid-column:1 / -1}
@media (max-width:560px){.kdc-vm-tiles{grid-template-columns:1fr}}
</style>"""

JS = r"""(function(){
  window.__vagaryBoot=(window.__vagaryBoot||0)+1;
  var API=(window.__VAGARY_API__||"http://localhost:8080");
  var GOLD="#d4af37",RED="#e63946",TEAL="#2a9d8f";
  var FALLBACK=__FALLBACK__;
  var located={};           // code -> {code,name,lat,lon,capital,region}
  FALLBACK.forEach(function(c){located[c.code]=c;});
  var visited={};           // code -> "visited"|"want"
  var total=250;
  var online=false;
  var loadedRoster=false;
  var selected=null;        // currently selected code
  var P=null,CV=null,CTX=null,TIP=null,DET=null,NOTE=null,STATS=null,LOAD=null;

  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
  function state(c){return visited[c]||"unvisited";}
  function color(c){var s=state(c);return s==="visited"?GOLD:(s==="want"?RED:TEAL);}
  function jget(url,ms){
    return new Promise(function(res,rej){
      var to=setTimeout(function(){rej(new Error("timeout"));},ms||6000);
      fetch(url,{headers:{"Accept":"application/json"}}).then(function(r){
        clearTimeout(to);if(!r.ok)throw new Error("http "+r.status);return r.json();
      }).then(res,function(e){clearTimeout(to);rej(e);});
    });
  }
  function locatedArr(){var a=[];for(var k in located)a.push(located[k]);return a;}
  function num(v){var n=parseFloat(v);return isFinite(n)?n:null;}

  // ---- build panel once ----
  function build(){
    if(P && P.dataset.built==="1")return P;
    P=el("div");P.id="kdc-vagary-map-panel";P.dataset.built="1";
    var t=el("div","kdc-vm-title","Vagary Index — World Map");
    var sub=el("div","kdc-vm-sub","Equirectangular dot map · visit-state coloured · tap a dot for details");
    NOTE=el("div","kdc-vm-note");
    NOTE.textContent="Vagary data offline — showing static view (mark-visited disabled).";
    STATS=el("div","kdc-vm-stats");
    var mw=el("div","kdc-vm-mapwrap");
    CV=document.createElement("canvas");CV.id="kdc-vagary-map-canvas";
    var lg=el("div","kdc-vm-legend");
    lg.innerHTML='<span class="kdc-vm-dot" style="background:'+GOLD+'"></span>BEEN THERE&nbsp;&nbsp;'+
      '<span class="kdc-vm-dot" style="background:'+RED+'"></span>WANT TO VISIT&nbsp;&nbsp;'+
      '<span class="kdc-vm-dot" style="background:'+TEAL+'"></span>UNVISITED';
    TIP=el("div","kdc-vm-tip");
    LOAD=el("div","kdc-vm-loading","loading…");
    mw.appendChild(CV);mw.appendChild(lg);mw.appendChild(TIP);mw.appendChild(LOAD);
    DET=el("div","kdc-vm-detail");
    P.appendChild(t);P.appendChild(sub);P.appendChild(NOTE);P.appendChild(STATS);P.appendChild(mw);P.appendChild(DET);
    CTX=CV.getContext("2d");
    CV.addEventListener("click",onCanvasClick);
    CV.addEventListener("mousemove",onCanvasMove);
    CV.addEventListener("mouseleave",function(){if(TIP)TIP.style.display="none";});
    return P;
  }

  function wrap(){
    var w=document.getElementById("kdc-vagary-map-wrap");
    if(!w){
      w=el("div");w.id="kdc-vagary-map-wrap";
      var btn=el("button");btn.id="kdc-vagary-map-btn";btn.type="button";btn.textContent="\u{1F5FA}\uFE0F  Vagary Map";
      w.appendChild(btn);w.appendChild(build());
      document.body.appendChild(w);
      btn.addEventListener("click",function(){w.classList.toggle("kdc-vm-open");if(w.classList.contains("kdc-vm-open"))draw();});
    }else if(w.parentNode!==document.body){document.body.appendChild(w);}
    autoOpen(w);
    return w;
  }

  // B5 deep-link: travel-index/?map=1 (or #map) opens the map expanded with no
  // click. Guarded by a dataset flag on the wrapper so it is idempotent per
  // wrapper instance and re-arms itself if React hydration rebuilds the wrap.
  function autoOpen(w){
    try{
      if(!w||w.dataset.kdcAutoOpen==="1")return;
      var s=location.search||"",h=location.hash||"";
      var hit=(/[?&]map=1(?:[&=]|$)/.test(s))||(/(^|[#&])map(?:[#&]|$)/.test(h));
      if(!hit)return;
      w.dataset.kdcAutoOpen="1";
      w.classList.add("kdc-vm-open");
      if(typeof draw==="function")draw();
    }catch(e){}
  }

  // ---- projection (equirectangular) ----
  function proj(c){var W=CV.clientWidth,H=CV.clientHeight;return{x:(c.lon+180)/360*W,y:(90-c.lat)/180*H};}
  function dotAt(px,py){
    var best=null,bd=1e9,arr=locatedArr();
    for(var i=0;i<arr.length;i++){var p=proj(arr[i]);var d=Math.hypot(p.x-px,p.y-py);if(d<bd){bd=d;best=arr[i];}}
    return (bd<=12)?best:null;
  }

  function drawGraticule(){
    var W=CV.clientWidth,H=CV.clientHeight;
    CTX.clearRect(0,0,W,H);
    CTX.strokeStyle="rgba(255,255,255,0.05)";CTX.lineWidth=1;
    for(var lon=-180;lon<=180;lon+=30){var x=(lon+180)/360*W;CTX.beginPath();CTX.moveTo(x,0);CTX.lineTo(x,H);CTX.stroke();}
    for(var lat=-90;lat<=90;lat+=30){var y=(90-lat)/180*H;CTX.beginPath();CTX.moveTo(0,y);CTX.lineTo(W,y);CTX.stroke();}
    // equator + prime meridian slightly brighter
    CTX.strokeStyle="rgba(212,175,55,0.12)";
    CTX.beginPath();CTX.moveTo(0,H/2);CTX.lineTo(W,H/2);CTX.stroke();
    CTX.beginPath();CTX.moveTo(W/2,0);CTX.lineTo(W/2,H);CTX.stroke();
  }
  function draw(){
    if(!CV||!CTX)return;
    var DPR=Math.min(window.devicePixelRatio||1,2);
    var W=CV.clientWidth,H=CV.clientHeight;
    CV.width=W*DPR;CV.height=H*DPR;CTX.setTransform(DPR,0,0,DPR,0,0);
    drawGraticule();
    var arr=locatedArr();
    for(var i=0;i<arr.length;i++){
      var c=arr[i];if(c.lat==null||c.lon==null)continue;
      var p=proj(c);var sel=(selected===c.code);
      var r=sel?9:7;
      CTX.beginPath();CTX.arc(p.x,p.y,r,0,7);CTX.fillStyle=color(c.code);CTX.globalAlpha=0.9;CTX.fill();
      CTX.globalAlpha=1;CTX.lineWidth=sel?2:1;CTX.strokeStyle=sel?"#fff":"rgba(0,0,0,0.4)";CTX.stroke();
    }
    if(LOAD)LOAD.style.display=loadedRoster?"none":"block";
    renderStats();
  }
  function renderStats(){
    if(!STATS)return;
    var arr=locatedArr(),v=0,wa=0;
    arr.forEach(function(c){var s=state(c.code);if(s==="visited")v++;else if(s==="want")wa++;});
    var un=arr.length-v-wa;
    STATS.innerHTML='<span><b>'+v+'</b> visited</span>'+
      '<span style="color:#5a6067">·</span><span><b>'+wa+'</b> planning</span>'+
      '<span style="color:#5a6067">·</span><span><b>'+un+'</b> unvisited</span>'+
      '<span style="color:#5a6067">·</span><span>located <b>'+arr.length+'</b></span>'+
      '<span style="color:#5a6067">·</span><span>roster <b>'+total+'</b>/250</span>';
  }

  function onCanvasMove(ev){
    var b=CV.getBoundingClientRect();var c=dotAt(ev.clientX-b.left,ev.clientY-b.top);
    if(c&&TIP){TIP.style.display="block";TIP.style.left=proj(c).x+"px";TIP.style.top=proj(c).y+"px";TIP.textContent=c.name;CV.style.cursor="pointer";}
    else if(TIP){TIP.style.display="none";CV.style.cursor="crosshair";}
  }
  function onCanvasClick(ev){
    var b=CV.getBoundingClientRect();var c=dotAt(ev.clientX-b.left,ev.clientY-b.top);
    if(c){selected=c.code;draw();renderDetail(c);}
  }

  // ---- detail panel ----
  function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):"";}
  function renderDetail(c){
    DET.innerHTML="";
    var head=el("div","kdc-vm-dhead");
    var nm=el("div");nm.className="kdc-vm-dname";nm.textContent=c.name||c.code;
    var meta=el("div","kdc-vm-dmeta");
    meta.textContent=[c.code,c.capital?("capital: "+c.capital):"",c.region||""].filter(Boolean).join(" · ");
    head.appendChild(nm);head.appendChild(meta);DET.appendChild(head);

    var btns=el("div","kdc-vm-btns");
    var bV=el("button","kdc-vm-btn2","✓ Mark visited");
    var bW=el("button","kdc-vm-btn2","☆ Want to visit");
    var bC=el("button","kdc-vm-btn2","Clear");
    [bV,bW,bC].forEach(function(b){b.type="button";if(!online)b.disabled=true;});
    function sync(){bV.classList.toggle("kdc-active",state(c.code)==="visited");bW.classList.toggle("kdc-active",state(c.code)==="want");}
    bV.addEventListener("click",function(){setState(c.code,"visited");});
    bW.addEventListener("click",function(){setState(c.code,"want");});
    bC.addEventListener("click",function(){setState(c.code,null);});
    btns.appendChild(bV);btns.appendChild(bW);btns.appendChild(bC);DET.appendChild(btns);sync();

    var tiles=el("div","kdc-vm-tiles");DET.appendChild(tiles);
    var pT=el("div","kdc-vm-tile");pT.appendChild(el("h4",null,"Photos"));pT.appendChild(el("div","kdc-empty","loading…"));tiles.appendChild(pT);
    var wT=el("div","kdc-vm-tile");wT.appendChild(el("h4",null,"Weather Heat"));var rimg=document.createElement("img");rimg.className="kdc-vm-raster";rimg.alt="heat raster";wT.appendChild(rimg);tiles.appendChild(wT);
    var gT=el("div","kdc-vm-tile");gT.appendChild(el("h4",null,"Gas Stations"));gT.appendChild(el("div","kdc-empty","loading…"));tiles.appendChild(gT);
    var aT=el("div","kdc-vm-tile kdc-vm-span2");aT.appendChild(el("h4",null,"Attractions & Top Experiences"));aT.appendChild(el("div","kdc-empty","loading…"));tiles.appendChild(aT);

    // weather raster
    rimg.onerror=function(){wT.querySelector("h4").nextSibling&&(wT.removeChild(rimg));wT.appendChild(el("div","kdc-empty","no raster yet"));};
    if(online)rimg.src=API+"/raster/"+c.code+"/1";else{rimg.remove();wT.appendChild(el("div","kdc-empty","offline"));}

    if(online){
      jget(API+"/pois/"+c.code,7000).then(function(p){
        var ph=p.photos||[];
        pT.innerHTML="";pT.appendChild(el("h4",null,"Photos"));
        if(!ph.length){pT.appendChild(el("div","kdc-empty","no local photos yet"));}
        else{var g=el("div","kdc-vm-photos");ph.slice(0,4).forEach(function(x){var im=document.createElement("img");im.src=x.url||"";im.alt=x.caption||"";g.appendChild(im);var cp=el("div","kdc-cap");cp.textContent=x.caption||"";g.appendChild(cp);});pT.appendChild(g);}
        var gas=p.gas||[];
        gT.innerHTML="";gT.appendChild(el("h4",null,"Gas Stations"));
        if(!gas.length){gT.appendChild(el("div","kdc-empty","no gas data yet"));}
        else{var ul=el("ul","kdc-vm-list");gas.slice(0,8).forEach(function(x){var li=el("li");li.innerHTML="";var s=document.createElement("span");s.textContent=x.name||"station";li.appendChild(s);var co=el("span","kdc-coord");co.textContent="  "+num(x.lat)+", "+num(x.lon);li.appendChild(co);ul.appendChild(li);});gT.appendChild(ul);}
      },function(){pT.innerHTML="";pT.appendChild(el("h4",null,"Photos"));pT.appendChild(el("div","kdc-empty","no local data yet"));
        gT.innerHTML="";gT.appendChild(el("h4",null,"Gas Stations"));gT.appendChild(el("div","kdc-empty","no local data yet"));});
      jget(API+"/countries/"+c.code,8000).then(function(d){
        aT.innerHTML="";aT.appendChild(el("h4",null,"Attractions & Top Experiences"));
        var items=[];
        (d.attractions||[]).forEach(function(x){items.push(typeof x==="string"?x:(x.name||x.title||""));});
        (d.top10_experiences||[]).forEach(function(x){items.push(typeof x==="string"?x:(x.name||x.title||""));});
        items=items.filter(Boolean).slice(0,10);
        if(!items.length){aT.appendChild(el("div","kdc-empty","no attractions listed yet"));}
        else{var ul=el("ul","kdc-vm-list");items.forEach(function(s){var li=el("li");li.textContent=s;ul.appendChild(li);});aT.appendChild(ul);}
        // refresh meta if API has richer capital/region
        if(d.capitalCity&&!c.capital){c.capital=d.capitalCity;}
        if(d.region&&!c.region){c.region=d.region;}
      },function(){aT.innerHTML="";aT.appendChild(el("h4",null,"Attractions & Top Experiences"));aT.appendChild(el("div","kdc-empty","no local data yet"));});
    }else{
      pT.querySelector(".kdc-empty").textContent="offline";
      gT.querySelector(".kdc-empty").textContent="offline";
      aT.querySelector(".kdc-empty").textContent="offline";
    }
  }

  function setState(code,st){
    if(!online)return;
    var done=function(){draw();if(selected===code&&DET){var c=located[code];if(c)syncButtons();}};
    function syncButtons(){var b=DET.querySelectorAll(".kdc-vm-btn2");if(b[0])b[0].classList.toggle("kdc-active",state(code)==="visited");if(b[1])b[1].classList.toggle("kdc-active",state(code)==="want");}
    var p;
    if(st===null){p=fetch(API+"/visited?code="+code,{method:"DELETE"}).then(function(r){return r.json();});}
    else{p=fetch(API+"/visited",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code,state:st})}).then(function(r){return r.json();});}
    p.then(function(){return refreshVisited();}).then(done,done);
  }

  function refreshVisited(){
    return jget(API+"/visited",5000).then(function(v){visited=v||{};},function(){});
  }

  // ---- load live data ----
  function load(){
    if(!CV)return;
    jget(API+"/countries",7000).then(function(d){
      online=true;loadedRoster=true;
      if(NOTE)NOTE.classList.remove("kdc-on");
      total=(d&&d.count)||total;
      var items=(d&&d.items)||[];
      // fetch each roster country's full JSON (bounded concurrency) to collect
      // those that actually carry lat/lon -> dots grow as data grows.
      var codes=items.map(function(x){return x.code;}).filter(Boolean);
      var idx=0,CONC=10;
      function worker(){
        return Promise.resolve().then(function(){
          while(idx<codes.length){
            var code=codes[idx++];
            if(located[code]&&located[code].lat!=null)continue;
            return jget(API+"/countries/"+code,6000).then(function(dd,cc){
              var la=num(dd.latitude),lo=num(dd.longitude);
              if(la!=null&&lo!=null){located[cc]={code:cc,name:dd.country_name||cc,lat:la,lon:lo,capital:dd.capitalCity||"",region:dd.region||""};}
            },function(){}).then(worker);
          }
        });
      }
      var ws=[];for(var i=0;i<CONC;i++)ws.push(worker());
      return Promise.all(ws);
    }).then(function(){
      return refreshVisited();
    }).then(function(){
      draw();
    }).catch(function(){
      online=false;loadedRoster=true;
      if(NOTE)NOTE.classList.add("kdc-on");
      if(LOAD)LOAD.style.display="none";
      draw(); // render baked fallback dots
    });
  }

  function boot(){
    try{wrap();}catch(e){window.__vagaryErr=(window.__vagaryErr||'')+'|wrap:'+e.message;}
  }
  boot();
  // self-heal against React hydration wiping our body-mounted nodes
  var tries=0;
  var heal=setInterval(function(){
    tries++;
    try{
      var w=document.getElementById("kdc-vagary-map-wrap");
      if(!w){boot();}
      else if(w.parentNode!==document.body){document.body.appendChild(w);}
    }catch(e){}
    if(tries>40)clearInterval(heal);
  },500);
  if(window.MutationObserver){
    var mo=new MutationObserver(function(){try{
      if(!document.getElementById("kdc-vagary-map-wrap"))boot();
    }catch(e){}});
    mo.observe(document.body,{childList:true,subtree:true});
  }
  // kick off data load shortly after mount (open or closed; dots render when opened)
  setTimeout(load,400);
})();
""".replace("__FALLBACK__", json.dumps(FALLBACK, ensure_ascii=False))

def inject(html: bytes) -> bytes:
    html = re.sub(rb'<style id="kdc-vagary-map">.*?</style>\n?', b'', html, flags=re.S)
    html = re.sub(rb'<script id="kdc-vagary-map-js">.*?</script>\n?', b'', html, flags=re.S)
    assert html.count(b'</body>') == 1, "expected exactly one </body>"
    return html.replace(b'</body>', STYLE.encode() + b'<script id="kdc-vagary-map-js">' + JS.encode() + b'</script></body>')

# sync
git(['fetch','origin',BR])
if git(['rev-parse',BR]).stdout.decode().strip() != git(['rev-parse','origin/'+BR]).stdout.decode().strip():
    git(['update-ref','refs/heads/'+BR, git(['rev-parse','origin/'+BR]).stdout.decode().strip()])
for f in ('index.lock','index'):
    fp = os.path.join(REPO,'.git',f)
    if os.path.exists(fp): os.remove(fp)
git(['config','core.autocrlf','false']); git(['read-tree',BR])

updated=[]
for path in TARGETS:
    r = git(['show', f'{BR}:{path}'])
    if r.returncode != 0:
        print(f"SKIP {path}: not in {BR}")
        continue
    html = inject(r.stdout)
    git(['update-index','--cacheinfo', f'100644,{wblob(html)},{path}'])
    updated.append(path)
print("injected Vagary map into:", ", ".join(updated))

tree_sha = git(['write-tree']).stdout.decode().strip()
parent = git(['rev-parse','origin/'+BR]).stdout.decode().strip()
mf = os.path.join(REPO,'_m.txt')
open(mf,'w').write("feat: interactive Vagary Index dot-map (equirectangular, live API + baked offline fallback) on travel-index pages")
commit = git(['commit-tree',tree_sha,'-p',parent,'-F',mf]).stdout.decode().strip(); os.remove(mf)
open(os.path.join(REPO,'.git','refs','heads',BR),'w').write(commit+'\n')
tok = subprocess.run(['gh','auth','token'],capture_output=True,text=True,cwd=REPO).stdout.strip()
url = f"https://x-access-token:{tok}@{REPO_URL.split('//',1)[1]}"
r = git(['push',url,f'{commit}:{BR}','--force'])
print(f"commit {commit[:10]} push rc={r.returncode}")
if r.returncode: print(r.stderr.decode('utf-8','replace'))
