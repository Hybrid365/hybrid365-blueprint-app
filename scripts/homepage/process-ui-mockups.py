#!/usr/bin/env python3
"""Generate transparent UI screen crops from original uploaded homepage screenshots.

Source (unchanged): public/images/homepage/ui-screens/
Output: public/homepage/ui-mockups/

Crops the inner screen region at NATIVE resolution — no upscaling, no redesign.
All dashboard detail from the original uploads is preserved pixel-for-pixel.

Requires: pip install Pillow
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "public/images/homepage/ui-screens"
OUT_DIR = ROOT / "public/homepage/ui-mockups"
MANIFEST = ROOT / "app/lib/homepage/phoneScreenManifest.json"

# Tight inner-screen crop inside detected phone bounds.
SCREEN_INSET_X = 0.072
SCREEN_INSET_TOP = 0.102
SCREEN_INSET_BOTTOM = 0.048


def is_background(r: int, g: int, b: int, *, tolerance: int = 28) -> bool:
    if r <= tolerance and g <= tolerance and b <= tolerance:
        return True
    if r >= 245 and g >= 245 and b >= 245:
        return True
    return False


def remove_background(img: Image.Image, *, tolerance: int = 28) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    visited: set[tuple[int, int]] = set()
    stack: list[tuple[int, int]] = []

    for x in range(w):
        for y in (0, h - 1):
            if is_background(*px[x, y][:3], tolerance=tolerance):
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_background(*px[x, y][:3], tolerance=tolerance):
                stack.append((x, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        r, g, b, _a = px[x, y]
        if not is_background(r, g, b, tolerance=tolerance):
            continue
        visited.add((x, y))
        px[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return rgba


def content_bounds(img: Image.Image, *, alpha_threshold: int = 10) -> tuple[int, int, int, int]:
    w, h = img.size
    px = img.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > alpha_threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    return min_x, min_y, max_x, max_y


def process_phone_mockup(input_path: Path, output_path: Path) -> tuple[int, int]:
    img = remove_background(Image.open(input_path))
    min_x, min_y, max_x, max_y = content_bounds(img)

    phone_w = max_x - min_x + 1
    phone_h = max_y - min_y + 1

    screen_left = min_x + int(phone_w * SCREEN_INSET_X)
    screen_right = max_x - int(phone_w * SCREEN_INSET_X)
    screen_top = min_y + int(phone_h * SCREEN_INSET_TOP)
    screen_bottom = max_y - int(phone_h * SCREEN_INSET_BOTTOM)

    screen = img.crop((screen_left, screen_top, screen_right + 1, screen_bottom + 1))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    screen.save(output_path, "PNG", compress_level=3)
    return screen.size


def main() -> None:
    files = sorted(SRC_DIR.glob("*.png"))
    if not files:
        raise SystemExit(f"No source files in {SRC_DIR}")

    manifest: dict[str, dict[str, int]] = {}
    for src in files:
        out = OUT_DIR / src.name
        width, height = process_phone_mockup(src, out)
        manifest[src.stem] = {"width": width, "height": height}
        print(f"{src.name} -> {width}x{height} (native crop)")

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote manifest -> {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
