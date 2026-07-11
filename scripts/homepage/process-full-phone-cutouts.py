#!/usr/bin/env python3
"""Process homepage iPhone UI PNGs into transparent full-phone cutouts.

Handles checkerboard and flat black/white canvas backgrounds.
Preserves full device bezel, shadow and UI detail.

Source mapping: scripts/homepage/phone-source-map.json
Output: public/images/homepage/ui/
Manifest: app/lib/homepage/phoneScreenManifest.json

Requires: pip install Pillow
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MAP_FILE = ROOT / "scripts/homepage/phone-source-map.json"
OUT_DIR = ROOT / "public/images/homepage/ui"
SRC_ARCHIVE = ROOT / "public/images/homepage/ui/sources"
MANIFEST = ROOT / "app/lib/homepage/phoneScreenManifest.json"

PADDING = 6


def is_background(r: int, g: int, b: int, *, tolerance: int = 32) -> bool:
    # Flat black canvas
    if r <= tolerance and g <= tolerance and b <= tolerance:
        return True
    # Flat white canvas
    if r >= 245 and g >= 245 and b >= 245:
        return True
    # Checkerboard / neutral light greys (ChatGPT export backgrounds)
    if r >= 195 and g >= 195 and b >= 195 and max(r, g, b) - min(r, g, b) <= 18:
        return True
    return False


def remove_background(img: Image.Image, *, tolerance: int = 32) -> Image.Image:
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


def content_bounds(img: Image.Image, *, alpha_threshold: int = 8) -> tuple[int, int, int, int]:
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


def process_full_phone(input_path: Path, output_path: Path) -> tuple[int, int]:
    img = remove_background(Image.open(input_path))
    min_x, min_y, max_x, max_y = content_bounds(img)

    crop_left = max(0, min_x - PADDING)
    crop_top = max(0, min_y - PADDING)
    crop_right = min(img.size[0] - 1, max_x + PADDING)
    crop_bottom = min(img.size[1] - 1, max_y + PADDING)

    cropped = img.crop((crop_left, crop_top, crop_right + 1, crop_bottom + 1))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_path, "PNG", compress_level=3)
    return cropped.size


def main() -> None:
    mapping: dict[str, str] = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    SRC_ARCHIVE.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, dict[str, int]] = {}

    for screen_id, source_rel in mapping.items():
        source = ROOT / source_rel
        if not source.exists():
            raise SystemExit(f"Missing source for {screen_id}: {source}")

        archive = SRC_ARCHIVE / f"{screen_id}{source.suffix}"
        shutil.copy2(source, archive)

        out = OUT_DIR / f"{screen_id}.png"
        width, height = process_full_phone(source, out)
        manifest[screen_id] = {"width": width, "height": height}
        print(f"{screen_id}: {source.name} -> {width}x{height}")

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote manifest -> {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
