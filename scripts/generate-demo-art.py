"""Generates DUKES demo product imagery.

- Leather-goods illustrations (sandals, chappal, belts, wallets) as original SVG
  "studio plates" that match the grey studio backdrop of the licensed shoe photos.
- Colorway variants of the two licensed Unsplash dress-shoe photographs.

All output is DEMO imagery. Replace with real DUKES photography before launch.
Run: python3 scripts/generate-demo-art.py
"""
import math
import os

from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "images")
OUT = os.path.join(ROOT, "products")
os.makedirs(OUT, exist_ok=True)

COLORS = {
    "cognac": ("#8a4a22", "#b06a38", "#5e2f14"),
    "noir": ("#1a1614", "#4a403a", "#070605"),
    "oxblood": ("#5a1d1d", "#7c2d2a", "#3a1010"),
    "tan": ("#a8703f", "#c99261", "#7a4d27"),
    "chocolate": ("#4a2c1e", "#6b4330", "#2e1a11"),
}
BRASS = ("#c7a76a", "#8d6f3b")


def shell(body, view="0 0 800 1000", extra_defs=""):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a332c"/><stop offset=".6" stop-color="#25201b"/><stop offset="1" stop-color="#15120f"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".38" r=".55"><stop offset="0" stop-color="#f2c35a" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
{extra_defs}
</defs>
<rect width="800" height="1000" fill="url(#bg)"/><rect width="800" height="1000" fill="url(#glow)"/>
{body}
</svg>"""


def leather_defs(key, base, light, dark):
    return f"""<linearGradient id="lt-{key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{light}"/><stop offset=".55" stop-color="{base}"/><stop offset="1" stop-color="{dark}"/></linearGradient>
<linearGradient id="insole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b98e"/><stop offset="1" stop-color="#b48b5e"/></linearGradient>
<linearGradient id="br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{BRASS[0]}"/><stop offset=".5" stop-color="#e8d3a2"/><stop offset="1" stop-color="{BRASS[1]}"/></linearGradient>"""


SOLE = "M0,-270 C72,-270 108,-205 108,-122 C108,-40 84,22 82,84 C80,152 94,205 72,244 C52,276 -52,276 -72,244 C-90,207 -82,152 -84,84 C-86,12 -108,-60 -103,-132 C-98,-214 -62,-270 0,-270 Z"


def foot(content, x, y, rot, mirror=False):
    s = "scale(-1,1)" if mirror else ""
    return f'<g transform="translate({x},{y}) rotate({rot}) {s}">{content}</g>'


def sole_layers(key, base, light, dark, insole):
    return f"""<path d="{SOLE}" transform="translate(0,10)" fill="#2a1d14"/>
<path d="{SOLE}" fill="{dark}"/>
<path d="{SOLE}" transform="scale(.93)" fill="url(#insole)"/>
<path d="{SOLE}" transform="scale(.93)" fill="none" stroke="{dark}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="5 6"/>
<path d="{SOLE}" transform="scale(.93)" filter="url(#grain)" fill="#000"/>"""


def peshawari(key, base, light, dark):
    insole = light
    upper = f"""<path d="M-96,-150 C-96,-232 -58,-262 0,-262 C58,-262 100,-232 100,-150 C100,-92 92,-52 88,-28 C40,-6 -40,-6 -86,-28 C-92,-60 -96,-100 -96,-150 Z" fill="url(#lt-{key})"/>
<path d="M-92,-150 C-92,-226 -56,-254 0,-254 C56,-254 96,-226 96,-150" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="6 6"/>
<path d="M-70,-40 C-60,-120 60,-120 70,-40" fill="none" stroke="{dark}" stroke-width="3"/>
<path d="M-62,-48 C-52,-112 52,-112 62,-48" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="5 5"/>
<path d="M-50,-180 L0,-118 L50,-180" fill="none" stroke="{dark}" stroke-width="3"/>
<path d="M-40,-190 L0,-140 L40,-190" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="4 5"/>
<path d="M-96,-150 C-96,-232 -58,-262 0,-262 C58,-262 100,-232 100,-150 C100,-92 92,-52 88,-28 C40,-6 -40,-6 -86,-28 C-92,-60 -96,-100 -96,-150 Z" filter="url(#grain)" fill="#000"/>
<path d="M-80,150 C-90,232 -40,282 0,284 C40,282 90,232 80,150" fill="none" stroke="{dark}" stroke-width="30" stroke-linecap="round"/>
<path d="M-80,150 C-90,232 -40,282 0,284 C40,282 90,232 80,150" fill="none" stroke="url(#lt-{key})" stroke-width="24" stroke-linecap="round"/>
<rect x="68" y="168" width="30" height="40" rx="4" fill="none" stroke="url(#br)" stroke-width="6" transform="rotate(-18 83 188)"/>"""
    return sole_layers(key, base, light, dark, insole) + upper


def norozi(key, base, light, dark):
    upper = f"""<path d="M-98,-60 C-60,-150 60,-150 98,-60 C70,-40 -70,-40 -98,-60 Z" fill="url(#lt-{key})"/>
<path d="M-90,-62 C-55,-136 55,-136 90,-62" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="6 6"/>
<path d="M-98,-60 C-60,-150 60,-150 98,-60 C70,-40 -70,-40 -98,-60 Z" filter="url(#grain)" fill="#000"/>
<path d="M-40,-150 L0,-110 L40,-150" fill="none" stroke="{dark}" stroke-width="3"/>
<circle cx="0" cy="-205" r="20" fill="none" stroke="url(#lt-{key})" stroke-width="12"/>
<path d="M0,-185 L0,-128" stroke="url(#lt-{key})" stroke-width="14" stroke-linecap="round"/>"""
    return sole_layers(key, base, light, dark, light) + upper


def slide(key, base, light, dark):
    upper = f"""<path d="M-102,-130 C-60,-170 60,-170 104,-130 L100,-40 C60,-20 -60,-20 -98,-40 Z" fill="url(#lt-{key})"/>
<path d="M-90,-124 C-55,-156 55,-156 92,-124 M-88,-48 C-55,-32 55,-32 90,-48" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="6 6"/>
<path d="M-102,-130 C-60,-170 60,-170 104,-130 L100,-40 C60,-20 -60,-20 -98,-40 Z" filter="url(#grain)" fill="#000"/>
<path d="M-98,-86 C-50,-104 50,-104 102,-86" fill="none" stroke="{dark}" stroke-width="3"/>"""
    return sole_layers(key, base, light, dark, light) + upper


def cross(key, base, light, dark):
    upper = f"""<path d="M-100,-160 L96,-30 L80,4 L-104,-126 Z" fill="url(#lt-{key})"/>
<path d="M100,-160 L-96,-30 L-82,4 L104,-126 Z" fill="url(#lt-{key})"/>
<path d="M-100,-160 L96,-30 M100,-160 L-96,-30" stroke="{light}" stroke-width="2" stroke-dasharray="6 6" fill="none" transform="translate(0,10)"/>
<path d="M-82,140 C-92,230 -40,280 0,282 C40,280 92,230 82,140" fill="none" stroke="url(#lt-{key})" stroke-width="22" stroke-linecap="round"/>
<rect x="70" y="150" width="26" height="34" rx="3" fill="none" stroke="url(#br)" stroke-width="5" transform="rotate(-14 83 167)"/>"""
    return sole_layers(key, base, light, dark, light) + upper


def footwear_pair(fn, key):
    base, light, dark = COLORS[key]
    shape = fn(key, base, light, dark)
    body = f"""<ellipse cx="400" cy="560" rx="330" ry="360" fill="url(#floor)" filter="url(#soft)" opacity=".55"/>
<g transform="translate(400,500) scale(1.22) translate(-400,-500)">{foot(shape, 300, 520, -9, mirror=True)}
{foot(shape, 505, 470, 7)}</g>"""
    return shell(body, extra_defs=leather_defs(key, base, light, dark))


def spiral_path(turns=2.6, r0=95, gap=78, steps=240):
    pts = []
    total = turns * 2 * math.pi
    for i in range(steps + 1):
        t = total * i / steps
        r = r0 + gap * t / (2 * math.pi)
        pts.append((400 + r * math.cos(t + math.pi), 500 + r * math.sin(t + math.pi) * 0.92))
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return d, pts[-1], pts[-2]


def belt(key, buckle="brass"):
    base, light, dark = COLORS[key]
    d, end, prev = spiral_path()
    ang = math.degrees(math.atan2(end[1] - prev[1], end[0] - prev[0]))
    metal = "url(#br)" if buckle == "brass" else "url(#steel)"
    holes = "".join(f'<circle cx="{-40 - i * 34}" cy="0" r="5" fill="#1a120c"/>' for i in range(5))
    tail = f"""<g transform="translate({end[0]:.1f},{end[1]:.1f}) rotate({ang:.1f})">
<path d="M-200,-31 L10,-31 C40,-31 52,0 52,0 C52,0 40,31 10,31 L-200,31 Z" fill="url(#lt-{key})"/>
<path d="M-200,-24 L10,-24 C34,-24 44,0 44,0 C44,0 34,24 10,24 L-200,24" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="6 6"/>
{holes}</g>"""
    body = f"""<ellipse cx="400" cy="560" rx="330" ry="300" fill="url(#floor)" filter="url(#soft)" opacity=".5"/>
<g transform="translate(400,500) scale(1.12) translate(-400,-500)"><path d="{d}" transform="translate(0,12)" fill="none" stroke="#2a1d14" stroke-width="62" stroke-linecap="butt"/>
<path d="{d}" fill="none" stroke="url(#lt-{key})" stroke-width="62"/>
<path d="{d}" fill="none" stroke="{light}" stroke-width="50" stroke-dasharray="6 6" stroke-opacity=".9"/>
<path d="{d}" fill="none" stroke="{base}" stroke-width="47"/>
<path d="{d}" fill="none" stroke="url(#lt-{key})" stroke-width="47" stroke-opacity=".6"/>
<path d="{d}" fill="none" stroke="#000" stroke-width="62" filter="url(#grain)"/>
{tail}
<g transform="translate(305,500) rotate(-90)">
<rect x="-58" y="-44" width="116" height="88" rx="14" fill="none" stroke="#3a2a1a" stroke-width="18" transform="translate(0,6)" opacity=".5"/>
<rect x="-58" y="-44" width="116" height="88" rx="14" fill="none" stroke="{metal}" stroke-width="16"/>
<path d="M-50,0 L40,0" stroke="{metal}" stroke-width="9" stroke-linecap="round"/>
</g></g>"""
    defs = leather_defs(key, base, light, dark) + '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ea1a3"/><stop offset=".5" stop-color="#eef0f1"/><stop offset="1" stop-color="#6d7072"/></linearGradient>'
    return shell(body, extra_defs=defs)


def wallet(key, kind="bifold"):
    base, light, dark = COLORS[key]
    if kind == "bifold":
        w, h = 420, 330
    else:
        w, h = 300, 210
    stamp = '<text x="0" y="12" text-anchor="middle" font-family="Georgia,serif" font-size="22" letter-spacing="8" fill="#000" fill-opacity=".28">DUKES</text>'
    piece = f"""<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" rx="16" transform="translate(0,14)" fill="#2a1d14" opacity=".55"/>
<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" rx="16" fill="url(#lt-{key})"/>
<rect x="{-w/2+14}" y="{-h/2+14}" width="{w-28}" height="{h-28}" rx="9" fill="none" stroke="{light}" stroke-width="2" stroke-dasharray="7 6"/>
<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" rx="16" filter="url(#grain)" fill="#000"/>
<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" rx="16" fill="none" stroke="{dark}" stroke-width="3"/>"""
    if kind == "bifold":
        piece += f'<path d="M{-w/2+4},{-h/2+3} C-60,{-h/2-6} 60,{-h/2-6} {w/2-4},{-h/2+3}" stroke="{light}" stroke-opacity=".7" stroke-width="5" fill="none"/>'
        piece += f'<g transform="translate(0,{h/2-70})">{stamp}</g>'
    else:
        piece += "".join(
            f'<path d="M{-w/2+18},{-h/2+40+i*42} C-40,{-h/2+55+i*42} 40,{-h/2+55+i*42} {w/2-18},{-h/2+40+i*42}" stroke="{dark}" stroke-width="3" fill="none"/>'
            for i in range(3))
        piece += f'<g transform="translate(0,{h/2-40})">{stamp}</g>'
    second_card = ""
    if kind == "card":
        second_card = f'<rect x="-120" y="-160" width="240" height="150" rx="10" fill="#ece6dc" transform="translate(410,330) rotate(10)"/>'
    body = f"""<ellipse cx="400" cy="560" rx="300" ry="240" fill="url(#floor)" filter="url(#soft)" opacity=".55"/>
<g transform="translate(400,520) rotate(-7) scale({1.3 if kind == "bifold" else 1.55})">{piece}</g>"""
    return shell(body, extra_defs=leather_defs(key, base, light, dark))


def detail(svg, view):
    return svg.replace('viewBox="0 0 800 1000"', f'viewBox="{view}"', 1)


ART = {
    "chappal-peshawari": (lambda k: footwear_pair(peshawari, k), ["cognac", "noir", "chocolate"], "390 120 330 412"),
    "chappal-norozi": (lambda k: footwear_pair(norozi, k), ["tan", "noir"], "400 60 320 400"),
    "sandal-slide": (lambda k: footwear_pair(slide, k), ["cognac", "noir", "oxblood"], "390 140 330 412"),
    "sandal-cross": (lambda k: footwear_pair(cross, k), ["tan", "chocolate"], "390 120 330 412"),
    "belt-brass": (lambda k: belt(k, "brass"), ["noir", "cognac", "oxblood"], "190 330 330 412"),
    "belt-steel": (lambda k: belt(k, "steel"), ["noir", "chocolate"], "190 330 330 412"),
    "wallet-bifold": (lambda k: wallet(k, "bifold"), ["noir", "cognac", "oxblood"], "230 300 340 425"),
    "wallet-card": (lambda k: wallet(k, "card"), ["noir", "tan", "oxblood"], "270 340 300 375"),
}

for name, (fn, keys, view) in ART.items():
    for k in keys:
        svg = fn(k)
        open(os.path.join(OUT, f"{name}-{k}.svg"), "w").write(svg)
        open(os.path.join(OUT, f"{name}-{k}-detail.svg"), "w").write(detail(svg, view))


# Colorway versions of the licensed dress-shoe photographs (demo only).
def tone(img, key):
    if key == "original":
        return img
    if key == "noir":
        g = ImageOps.grayscale(img)
        g = ImageEnhance.Contrast(g).enhance(1.25)
        g = ImageEnhance.Brightness(g).enhance(0.72)
        return ImageOps.colorize(g, "#0d0b0a", "#d9d6d2", mid="#4a4744")
    if key == "oxblood":
        g = ImageOps.grayscale(img)
        g = ImageEnhance.Contrast(g).enhance(1.15)
        col = ImageOps.colorize(g, "#140808", "#dcd8d4", mid="#6a2a26")
        return Image.blend(col, img, 0.18)
    return img


def recolor(img, key):
    """Recolor only the leather: mask by the original's saturation so the grey studio stays grey."""
    from PIL import ImageFilter
    sat = img.convert("HSV").split()[1]
    mask = sat.point(lambda v: 0 if v < 55 else min(255, (v - 55) * 4)).filter(ImageFilter.GaussianBlur(3))
    return Image.composite(tone(img, key), img, mask)


def crop(img, box):
    w, h = img.size
    return img.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


PHOTOS = {
    "brogue": ("formal.jpg", (0, 0.06, 1, 0.98), (0.22, 0.42, 0.72, 0.84)),
    "loafer": ("loafers.jpg", (0, 0.12, 1, 0.98), (0.24, 0.30, 0.86, 0.66)),
}
for name, (src, main_box, detail_box) in PHOTOS.items():
    img = Image.open(os.path.join(ROOT, src)).convert("RGB")
    for key in ["original", "noir", "oxblood"]:
        t = recolor(img, key) if key != "original" else img
        label = {"original": "cognac"}.get(key, key)
        m = crop(t, main_box)
        m = m.resize((1200, int(1200 * m.height / m.width)), Image.LANCZOS)
        # normalise to 4:5
        target_h = 1500
        if m.height > target_h:
            top = (m.height - target_h) // 2
            m = m.crop((0, top, 1200, top + target_h))
        m.save(os.path.join(OUT, f"{name}-{label}.jpg"), quality=84, optimize=True, progressive=True)
        d = crop(t, detail_box)
        d = d.resize((1200, int(1200 * d.height / d.width)), Image.LANCZOS)
        d.save(os.path.join(OUT, f"{name}-{label}-detail.jpg"), quality=84, optimize=True, progressive=True)

# Editorial hero (wide) from the brogue photo
img = Image.open(os.path.join(ROOT, "formal.jpg")).convert("RGB")
hero = crop(img, (0, 0.30, 1, 0.92)).resize((1600, 0 or int(1600 * 0.62 * 2400 / 1600)), Image.LANCZOS)
hero.save(os.path.join(ROOT, "hero-brogue.jpg"), quality=82, optimize=True, progressive=True)
print("done", len(os.listdir(OUT)), "files")
