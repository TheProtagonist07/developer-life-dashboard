#!/usr/bin/env python3
"""Generate PWA app icons for Developer Life Dashboard.

Renders a rounded-square icon with a heatmap-grid motif and a streak flame
accent, in the app's signature dark + emerald palette. Outputs the full set
of sizes the manifest and Apple touch icons need.

Run: python3 scripts/generate-icons.py
"""
from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (13, 17, 23)            # #0d1117 GitHub dark
PANEL = (22, 27, 34)         # #161b22
LEVELS = [
    (14, 68, 41),            # #0e4429
    (0, 109, 50),            # #006d32
    (38, 166, 65),           # #26a641
    (57, 211, 83),           # #39d353
]

# A small 5x5 "contribution" pattern — values index into LEVELS, -1 = empty panel.
PATTERN = [
    [0, 1, 2, 1, 0],
    [1, 2, 3, 2, 1],
    [2, 3, 3, 3, 2],
    [1, 2, 3, 2, 1],
    [0, 1, 2, 1, 0],
]


def rounded(size, radius, fill):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=fill)
    return img


def render(size, maskable=False):
    # Supersample 4x for crisp edges, then downscale.
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Maskable icons need a safe zone — keep art within the centre 80%.
    pad = int(s * 0.14) if maskable else 0
    corner = 0 if maskable else int(s * 0.22)

    # Background tile (full-bleed for maskable so the platform can crop).
    if maskable:
        draw.rectangle([0, 0, s, s], fill=BG)
    else:
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=corner, fill=BG)

    # Heatmap grid centred in the art area.
    art = s - pad * 2
    cells = 5
    gap = int(art * 0.03)
    cell = (art - gap * (cells - 1) - int(art * 0.18)) // cells
    grid_w = cell * cells + gap * (cells - 1)
    ox = pad + (art - grid_w) // 2
    oy = pad + (art - grid_w) // 2
    r = max(2, int(cell * 0.18))

    for row in range(cells):
        for col in range(cells):
            x = ox + col * (cell + gap)
            y = oy + row * (cell + gap)
            v = PATTERN[row][col]
            fill = LEVELS[v] if v >= 0 else PANEL
            draw.rounded_rectangle([x, y, x + cell, y + cell], radius=r, fill=fill)

    img = img.resize((size, size), Image.LANCZOS)
    return img


def main():
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    for sz in sizes:
        render(sz).save(os.path.join(OUT, f"icon-{sz}.png"))

    # Maskable (Android adaptive)
    for sz in [192, 512]:
        render(sz, maskable=True).save(os.path.join(OUT, f"maskable-{sz}.png"))

    # Apple touch icon — solid bg, no transparency, 180px is the iOS standard.
    apple = render(180)
    bg = Image.new("RGB", (180, 180), BG)
    bg.paste(apple, (0, 0), apple)
    bg.save(os.path.join(OUT, "apple-touch-icon.png"))

    # Favicon
    render(32).save(os.path.join(OUT, "favicon-32.png"))

    print(f"Generated {len(sizes) + 5} icons in {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
