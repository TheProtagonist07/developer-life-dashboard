#!/usr/bin/env python3
"""Generate the menu bar tray icon (template image) and the app icon.

macOS menu bar template images are pure black + alpha; the OS recolors them
for light/dark menu bars. We draw a small 3x3 "contribution grid" glyph.

Run: python3 scripts/generate-tray-icons.py
"""
from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
os.makedirs(ASSETS, exist_ok=True)

BLACK = (0, 0, 0, 255)


def tray(size):
    """A 3x3 rounded-cell grid glyph, black on transparent (template image)."""
    s = size * 8
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cells = 3
    gap = int(s * 0.10)
    pad = int(s * 0.08)
    cell = (s - pad * 2 - gap * (cells - 1)) // cells
    r = max(1, int(cell * 0.22))

    # A couple of cells omitted to read as a "heatmap", still legible at 16px.
    skip = {(0, 2), (2, 0)}
    for row in range(cells):
        for col in range(cells):
            if (row, col) in skip:
                continue
            x = pad + col * (cell + gap)
            y = pad + row * (cell + gap)
            d.rounded_rectangle([x, y, x + cell, y + cell], radius=r, fill=BLACK)

    return img.resize((size, size), Image.LANCZOS)


def app_icon(size):
    """Full-color app icon (reuses the web heatmap-grid style)."""
    bg = (13, 17, 23)
    levels = [(14, 68, 41), (0, 109, 50), (38, 166, 65), (57, 211, 83)]
    pattern = [
        [0, 1, 2, 1, 0],
        [1, 2, 3, 2, 1],
        [2, 3, 3, 3, 2],
        [1, 2, 3, 2, 1],
        [0, 1, 2, 1, 0],
    ]
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=bg)

    cells = 5
    gap = int(s * 0.03)
    cell = (s - gap * (cells - 1) - int(s * 0.30)) // cells
    grid = cell * cells + gap * (cells - 1)
    o = (s - grid) // 2
    r = max(2, int(cell * 0.18))
    for row in range(cells):
        for col in range(cells):
            x = o + col * (cell + gap)
            y = o + row * (cell + gap)
            d.rounded_rectangle([x, y, x + cell, y + cell], radius=r, fill=levels[pattern[row][col]])

    return img.resize((size, size), Image.LANCZOS)


def main():
    tray(16).save(os.path.join(ASSETS, "trayTemplate.png"))
    tray(32).save(os.path.join(ASSETS, "trayTemplate@2x.png"))
    app_icon(512).save(os.path.join(ASSETS, "icon.png"))
    print("Generated trayTemplate.png, trayTemplate@2x.png, icon.png in assets/")


if __name__ == "__main__":
    main()
