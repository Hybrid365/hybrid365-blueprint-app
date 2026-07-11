#!/usr/bin/env python3
"""Generate transparent iPhone UI cutouts for the homepage from source screenshots.

Source (unchanged): public/images/homepage/ui-screens/
Output: public/homepage/ui-mockups/

Requires: pip install Pillow
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "public/images/homepage/ui-screens"
OUT_DIR = ROOT / "public/homepage/ui-mockups"


def process_phone_mockup(
    input_path: Path,
    output_path: Path,
    *,
    tolerance: int = 28,
    padding: int = 4,
) -> tuple[int, int]:
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    px = img.load()

    def is_bg(r: int, g: int, b: int) -> bool:
        if r <= tolerance and g <= tolerance and b <= tolerance:
            return True
        if r >= 245 and g >= 245 and b >= 245:
            return True
        return False

    visited: set[tuple[int, int]] = set()
    stack: list[tuple[int, int]] = []

    for x in range(w):
        for y in (0, h - 1):
            if is_bg(*px[x, y][:3]):
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(*px[x, y][:3]):
                stack.append((x, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        r, g, b, _a = px[x, y]
        if not is_bg(r, g, b):
            continue
        visited.add((x, y))
        px[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 10:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(w - 1, max_x + padding)
    max_y = min(h - 1, max_y + padding)

    cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_path, "PNG", optimize=True)
    return cropped.size


def main() -> None:
    files = sorted(SRC_DIR.glob("*.png"))
    if not files:
        raise SystemExit(f"No source files in {SRC_DIR}")

    for src in files:
        out = OUT_DIR / src.name
        size = process_phone_mockup(src, out)
        print(f"{src.name} -> {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
