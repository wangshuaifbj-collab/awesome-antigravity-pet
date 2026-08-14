#!/usr/bin/env python3
"""Inspect a pet atlas for chroma-key matte fringe pixels.

This is a review aid, not an automatic cleaner. A highlighted pixel means
"look here before accepting", not "delete this color everywhere".
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLUMNS = 8
ROWS = 9
CELL_WIDTH = 192
CELL_HEIGHT = 208
LABEL_HEIGHT = 22
EDGE_ALPHA = 16
USED_COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6]
ROW_NAMES = [
    "idle",
    "running-right",
    "running-left",
    "waving",
    "jumping",
    "failed",
    "waiting",
    "running",
    "review",
]
FAMILY_COLORS = {
    "green": (0, 255, 0, 220),
    "magenta": (255, 0, 255, 220),
    "cyan": (0, 220, 255, 220),
}


def checker(size: tuple[int, int], square: int = 16) -> Image.Image:
    image = Image.new("RGB", size, "#ffffff")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], square):
        for x in range(0, size[0], square):
            if (x // square + y // square) % 2:
                draw.rectangle((x, y, x + square - 1, y + square - 1), fill="#e8e8e8")
    return image


def is_edge_pixel(alpha, x: int, y: int) -> bool:
    if alpha.getpixel((x, y)) <= EDGE_ALPHA:
        return False
    width, height = alpha.size
    for yy in range(max(0, y - 1), min(height, y + 2)):
        for xx in range(max(0, x - 1), min(width, x + 2)):
            if xx == x and yy == y:
                continue
            if alpha.getpixel((xx, yy)) <= EDGE_ALPHA:
                return True
    return False


def color_family(red: int, green: int, blue: int) -> str | None:
    if green >= 80 and green - max(red, blue) >= 28:
        return "green"
    if green >= 90 and blue >= 90 and min(green, blue) - red >= 24:
        return "cyan"
    if red >= 90 and blue >= 90 and min(red, blue) - green >= 24:
        return "magenta"
    return None


def inspect_cell(cell: Image.Image) -> tuple[Counter[str], Image.Image]:
    rgba = cell.convert("RGBA")
    alpha = rgba.getchannel("A")
    overlay = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    overlay_pixels = overlay.load()
    counts: Counter[str] = Counter()

    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if not is_edge_pixel(alpha, x, y):
                continue
            red, green, blue, _alpha = pixels[x, y]
            family = color_family(red, green, blue)
            if family is None:
                continue
            counts[family] += 1
            overlay_pixels[x, y] = FAMILY_COLORS[family]
    return counts, overlay


def build_review_image(
    atlas: Image.Image,
    overlays: dict[tuple[int, int], Image.Image],
    cell_counts: dict[tuple[int, int], Counter[str]],
    output: Path,
    scale: float,
) -> None:
    cell_w = max(1, round(CELL_WIDTH * scale))
    cell_h = max(1, round(CELL_HEIGHT * scale))
    width = COLUMNS * cell_w
    height = ROWS * (cell_h + LABEL_HEIGHT)
    sheet = Image.new("RGB", (width, height), "#f7f7f7")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for row in range(ROWS):
        y = row * (cell_h + LABEL_HEIGHT)
        draw.rectangle((0, y, width, y + LABEL_HEIGHT - 1), fill="#111111")
        draw.text((6, y + 5), f"row {row}: {ROW_NAMES[row]}", fill="#ffffff", font=font)
        for column in range(COLUMNS):
            left = column * CELL_WIDTH
            top = row * CELL_HEIGHT
            crop = atlas.crop((left, top, left + CELL_WIDTH, top + CELL_HEIGHT))
            crop = crop.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            bg = checker((cell_w, cell_h))
            bg.paste(crop, (0, 0), crop)
            x = column * cell_w
            sheet.paste(bg, (x, y + LABEL_HEIGHT))

            overlay = overlays.get((row, column))
            counts = cell_counts.get((row, column), Counter())
            if overlay is not None and counts:
                resized_overlay = overlay.resize((cell_w, cell_h), Image.Resampling.NEAREST)
                sheet.paste(resized_overlay, (x, y + LABEL_HEIGHT), resized_overlay)
                label = ",".join(f"{key[0]}:{value}" for key, value in sorted(counts.items()))
                draw.rectangle((x, y + LABEL_HEIGHT, x + cell_w - 1, y + LABEL_HEIGHT + 12), fill="#111111")
                draw.text((x + 3, y + LABEL_HEIGHT + 2), label, fill="#ffffff", font=font)

            outline = "#18a058" if column < USED_COUNTS[row] else "#cc3344"
            if counts:
                outline = "#ffcc00"
            draw.rectangle(
                (x, y + LABEL_HEIGHT, x + cell_w - 1, y + LABEL_HEIGHT + cell_h - 1),
                outline=outline,
            )

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("atlas")
    parser.add_argument("--json-out")
    parser.add_argument("--review-image")
    parser.add_argument("--scale", type=float, default=0.5)
    parser.add_argument(
        "--min-cell-pixels",
        type=int,
        default=8,
        help="Minimum suspect edge pixels in a used cell before it is listed for review.",
    )
    args = parser.parse_args()

    atlas_path = Path(args.atlas).expanduser().resolve()
    with Image.open(atlas_path) as opened:
        atlas = opened.convert("RGBA")

    cell_counts: dict[tuple[int, int], Counter[str]] = {}
    overlays: dict[tuple[int, int], Image.Image] = {}
    review_cells: list[dict[str, object]] = []
    totals: Counter[str] = Counter()

    for row in range(ROWS):
        for column in range(USED_COUNTS[row]):
            left = column * CELL_WIDTH
            top = row * CELL_HEIGHT
            cell = atlas.crop((left, top, left + CELL_WIDTH, top + CELL_HEIGHT))
            counts, overlay = inspect_cell(cell)
            if not counts:
                continue
            cell_counts[(row, column)] = counts
            overlays[(row, column)] = overlay
            totals.update(counts)
            if sum(counts.values()) >= args.min_cell_pixels:
                review_cells.append(
                    {
                        "state": ROW_NAMES[row],
                        "row": row,
                        "column": column,
                        "suspect_pixels": dict(sorted(counts.items())),
                    }
                )

    result = {
        "ok": True,
        "file": str(atlas_path),
        "needs_review": bool(review_cells),
        "note": (
            "Review-listed pixels are chroma-key-colored edge candidates only. "
            "Do not remove a color globally; inspect the review image and repair the smallest visible scope."
        ),
        "thresholds": {
            "edge_alpha": EDGE_ALPHA,
            "min_cell_pixels": args.min_cell_pixels,
        },
        "totals": dict(sorted(totals.items())),
        "review_cells": review_cells,
    }

    if args.review_image:
        review_image = Path(args.review_image).expanduser().resolve()
        build_review_image(atlas, overlays, cell_counts, review_image, args.scale)
        result["review_image"] = str(review_image)

    if args.json_out:
        Path(args.json_out).expanduser().resolve().write_text(
            json.dumps(result, indent=2) + "\n", encoding="utf-8"
        )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
