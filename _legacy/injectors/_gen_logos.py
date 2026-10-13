#!/usr/bin/env python3
"""Generate the 7 subsidiary portal logo PNGs (deterministic, Pillow-drawn).

Palette matches portal.css: accent #d4af37. Icons are simple, high-contrast
vector-style glyphs rendered at 256x256 via a 4x supersampled pass for smooth
edges. shoe-brand reuses the real LOGOKDSC.png if present.
"""
from PIL import Image, ImageDraw
import os, math

OUT = r"C:/Users/young/agents/KingDesignCollectiveinc/assets/logos"
os.makedirs(OUT, exist_ok=True)
GOLD = (212, 175, 55, 255)
GOLD_SOFT = (212, 175, 55, 90)
S, K = 256, 4
N = S * K

def new_canvas():
    return Image.new("RGBA", (N, N), (0, 0, 0, 0))

def save(img, name):
    img = img.resize((S, S), Image.LANCZOS)
    p = os.path.join(OUT, name)
    img.save(p, "PNG")
    print(f"  wrote {name} ({os.path.getsize(p)} bytes)")

def c(v):
    return int(v * K)

def ring(d, cx, cy, r, w):
    d.ellipse([c(cx-r), c(cy-r), c(cx+r), c(cy+r)], outline=GOLD, width=c(w))

# ---- glyphs (coords in 0..256 space) ----
def globe(d):
    cx, cy, r = 128, 128, 102
    ring(d, cx, cy, r, 7)
    for f in (0.35, 0.72):
        d.ellipse([c(cx-r*f), c(cy-r), c(cx+r*f), c(cy+r)], outline=GOLD, width=c(5))
    d.line([c(cx-r), c(cy), c(cx+r), c(cy)], fill=GOLD, width=c(5))
    for f in (-0.5, 0.5):
        yy = cy + r*f
        d.line([c(cx-r), c(yy), c(cx+r), c(yy)], fill=GOLD, width=c(4))

def shoe(d):
    pts = [(42,150),(62,120),(97,112),(112,132),(152,120),(182,96),(212,98),(224,120),(230,150),(224,170),(50,170)]
    d.polygon([(c(x), c(y)) for x, y in pts], outline=GOLD, width=c(7))
    d.line([c(62), c(170), c(222), c(170)], fill=GOLD, width=c(9))
    d.line([c(112), c(132), c(142), c(162)], fill=GOLD, width=c(4))

def hexcrest(d):
    cx, cy, r = 128, 128, 110
    hp = [(cx + r*math.cos(math.radians(60*i-30)), cy + r*math.sin(math.radians(60*i-30))) for i in range(6)]
    d.polygon([(c(x), c(y)) for x, y in hp], outline=GOLD, width=c(7))
    d.polygon([(c(128), c(86)), (c(154), c(143)), (c(108), c(143))], fill=GOLD)

def book(d):
    cx = 128
    d.line([c(cx), c(76), c(cx), c(180)], fill=GOLD, width=c(6))
    d.polygon([(c(cx),c(76)),(c(60),c(102)),(c(60),c(168)),(c(cx),c(180))], outline=GOLD, width=c(6))
    d.polygon([(c(cx),c(76)),(c(196),c(102)),(c(196),c(168)),(c(cx),c(180))], outline=GOLD, width=c(6))
    # star
    st = [(128,44),(135,62),(154,62),(138,74),(143,92),(128,81),(113,92),(118,74),(102,62),(121,62)]
    d.polygon([(c(x),c(y)) for x,y in st], fill=GOLD)

def bulb(d):
    cy = 116
    d.ellipse([c(76), c(58), c(180), c(162)], outline=GOLD, width=c(7))
    d.rectangle([c(112), c(162), c(144), c(186)], outline=GOLD, width=c(6))
    d.line([c(112), c(196), c(144), c(196)], fill=GOLD, width=c(6))
    d.line([c(118), c(178), c(138), c(178)], fill=GOLD, width=c(5))
    for a in range(0, 360, 45):
        x0 = 128 + 108*math.cos(math.radians(a)); y0 = cy + 108*math.sin(math.radians(a))
        x1 = 128 + 132*math.cos(math.radians(a)); y1 = cy + 132*math.sin(math.radians(a))
        d.line([c(x0), c(y0), c(x1), c(y1)], fill=GOLD_SOFT, width=c(4))

def recycle(d):
    cx, cy, r = 128, 128, 96
    verts = [(cx + r*math.cos(math.radians(90+120*i)), cy - r*math.sin(math.radians(90+120*i))) for i in range(3)]
    for i in range(3):
        x0,y0 = verts[i]; x1,y1 = verts[(i+1)%3]
        # shorten so arrowheads fit
        mx,my = (x0+x1)/2,(y0+y1)/2
        ang = math.atan2(y1-y0, x1-x0)
        sx,sy = x0+18*math.cos(ang), y0+18*math.sin(ang)
        ex,ey = x1-18*math.cos(ang), y1-18*math.sin(ang)
        d.line([c(sx),c(sy),c(ex),c(ey)], fill=GOLD, width=c(11))
        # arrowhead at end
        for s in (2.5,-2.5):
            d.line([c(ex),c(ey),c(ex+30*math.cos(ang+s)),c(ey+30*math.sin(ang+s))], fill=GOLD, width=c(8))

def atom(d):
    img = new_canvas()
    base = ImageDraw.Draw(img)
    base.ellipse([c(112),c(112),c(144),c(144)], fill=GOLD)
    for rot in (0, 60, 120):
        layer = new_canvas()
        ld = ImageDraw.Draw(layer)
        ld.ellipse([c(20),c(104),c(236),c(152)], outline=GOLD, width=c(6))
        layer = layer.rotate(rot, resample=Image.BICUBIC, center=(N/2,N/2))
        img = Image.alpha_composite(img, layer)
    return img

def shoe_real(d):
    src = r"C:/Users/young/agents/corporate_runtime/documents/shoe_brand/images/KingDesignCollective/LOGOKDSC.png"
    if not os.path.exists(src):
        return None
    logo = Image.open(src).convert("RGBA")
    logo.thumbnail((int(N*0.8), int(N*0.8)), Image.LANCZOS)
    bg = new_canvas()
    bg.alpha_composite(logo, (int((N-logo.width)/2), int((N-logo.height)/2)))
    return bg

def build(name, fn):
    # fn either draws onto a fresh canvas (glyph) or returns a full image (atom/shoe_real).
    out = fn(None) if fn in (atom, shoe_real) else None
    if out is None:
        out = new_canvas()
        fn(ImageDraw.Draw(out))
    save(out, name)

print("Generating logos ->", OUT)
build("travel-index.png", globe)
build("shoe-brand.png", shoe_real)
build("game-design.png", hexcrest)
build("kids-channel.png", book)
build("innovation-hub.png", bulb)
build("ewaste-recycling.png", recycle)
build("quantum-wearables.png", atom)
print("done")
