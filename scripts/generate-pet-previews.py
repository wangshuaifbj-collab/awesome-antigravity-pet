#!/usr/bin/env python3
"""Generate QA sheets and web-ready animations from Codex pet spritesheets."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLUMNS = 8
V1_ROWS = 9
V2_ROWS = 11
CELL_WIDTH = 192
CELL_HEIGHT = 208
GIF_SCALE = 2
GIF_SIZE = (CELL_WIDTH * GIF_SCALE, CELL_HEIGHT * GIF_SCALE)
THUMBNAIL_SCALE = 2
THUMBNAIL_SIZE = (CELL_WIDTH * THUMBNAIL_SCALE, CELL_HEIGHT * THUMBNAIL_SCALE)
LABEL_HEIGHT = 22
WEBP_QUALITY = 90
WEBP_METHOD = 4
THUMBNAIL_WEBP_METHOD = 6
CACHE_FORMAT_VERSION = 2
CACHE_CHUNK_SIZE = 1024 * 1024

STANDARD_STATES = [
    ("idle", 0, [280, 110, 110, 140, 140, 320]),
    ("running-right", 1, [120, 120, 120, 120, 120, 120, 120, 220]),
    ("running-left", 2, [120, 120, 120, 120, 120, 120, 120, 220]),
    ("waving", 3, [140, 140, 140, 280]),
    ("jumping", 4, [140, 140, 140, 140, 280]),
    ("failed", 5, [140, 140, 140, 140, 140, 140, 140, 240]),
    ("waiting", 6, [150, 150, 150, 150, 150, 260]),
    ("running", 7, [120, 120, 120, 120, 120, 220]),
    ("review", 8, [150, 150, 150, 150, 150, 280]),
]

LOOK_STATES = [
    ("look-000-157", 9, [160, 160, 160, 160, 160, 160, 160, 260]),
    ("look-180-337", 10, [160, 160, 160, 160, 160, 160, 160, 260]),
]


def checker(size: tuple[int, int], square: int = 16) -> Image.Image:
    image = Image.new("RGB", size, "#ffffff")
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], square):
        for x in range(0, size[0], square):
            if (x // square + y // square) % 2:
                draw.rectangle((x, y, x + square - 1, y + square - 1), fill="#e8e8e8")
    return image


def extract_frame(atlas: Image.Image, row: int, column: int) -> Image.Image:
    return atlas.crop(
        (
            column * CELL_WIDTH,
            row * CELL_HEIGHT,
            (column + 1) * CELL_WIDTH,
            (row + 1) * CELL_HEIGHT,
        )
    ).convert("RGBA")


def frame_with_background(atlas: Image.Image, row: int, column: int) -> Image.Image:
    frame = extract_frame(atlas, row, column)
    background = checker((CELL_WIDTH, CELL_HEIGHT))
    background.paste(frame, (0, 0), frame)
    return background


def make_thumbnail(atlas: Image.Image, output: Path) -> None:
    frame = extract_frame(atlas, 0, 0)
    frame = frame.resize(THUMBNAIL_SIZE, Image.Resampling.NEAREST)
    output.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output, format="WEBP", lossless=True, method=THUMBNAIL_WEBP_METHOD, exact=True)


def make_contact_sheet(
    atlas: Image.Image,
    states: list[tuple[str, int, list[int]]],
    output: Path,
    scale: float = 0.5,
) -> None:
    cell_w = max(1, round(CELL_WIDTH * scale))
    cell_h = max(1, round(CELL_HEIGHT * scale))
    width = COLUMNS * cell_w
    height = len(states) * (cell_h + LABEL_HEIGHT)
    sheet = Image.new("RGB", (width, height), "#f7f7f7")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for state, row, durations in states:
        y = row * (cell_h + LABEL_HEIGHT)
        draw.rectangle((0, y, width, y + LABEL_HEIGHT - 1), fill="#111111")
        draw.text((6, y + 5), f"row {row}: {state}", fill="#ffffff", font=font)
        draw.text((width - 92, y + 5), f"{len(durations)} frames", fill="#ffffff", font=font)

        for column in range(COLUMNS):
            frame = frame_with_background(atlas, row, column)
            frame = frame.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            x = column * cell_w
            sheet.paste(frame, (x, y + LABEL_HEIGHT))
            outline = "#18a058" if column < len(durations) else "#cc3344"
            draw.rectangle(
                (x, y + LABEL_HEIGHT, x + cell_w - 1, y + LABEL_HEIGHT + cell_h - 1),
                outline=outline,
            )
            draw.text((x + 4, y + LABEL_HEIGHT + 4), str(column), fill="#111111", font=font)

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def make_gif(atlas: Image.Image, state: str, row: int, durations: list[int], output: Path) -> None:
    frames = [extract_frame(atlas, row, column) for column in range(len(durations))]
    frames = [frame.resize(GIF_SIZE, Image.Resampling.NEAREST) for frame in frames]
    output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=False,
        disposal=2,
    )
    with Image.open(output) as generated:
        if generated.size != GIF_SIZE:
            raise ValueError(f"{output} must be {GIF_SIZE[0]}x{GIF_SIZE[1]}, got {generated.size[0]}x{generated.size[1]}")


def make_webp(atlas: Image.Image, state: str, row: int, durations: list[int], output: Path) -> None:
    frames = [extract_frame(atlas, row, column) for column in range(len(durations))]
    frames = [frame.resize(GIF_SIZE, Image.Resampling.NEAREST) for frame in frames]
    output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        lossless=False,
        quality=WEBP_QUALITY,
        method=WEBP_METHOD,
        exact=True,
    )
    with Image.open(output) as generated:
        if generated.size != GIF_SIZE:
            raise ValueError(f"{output} must be {GIF_SIZE[0]}x{GIF_SIZE[1]}, got {generated.size[0]}x{generated.size[1]}")


def states_for_pet(pet_dir: Path) -> list[tuple[str, int, list[int]]]:
    pet_json = pet_dir / "pet.json"
    metadata = json.loads(pet_json.read_text(encoding="utf-8"))
    sprite_version_number = metadata.get("spriteVersionNumber", 1)
    if sprite_version_number not in (1, 2):
        raise ValueError(f"{pet_json} spriteVersionNumber must be 1, 2, or omitted for v1")

    return STANDARD_STATES + (LOOK_STATES if sprite_version_number == 2 else [])


def source_fingerprint(pet_dir: Path, generator_digest: str, site_only: bool) -> str:
    digest = hashlib.sha256()
    mode = "site" if site_only else "full"
    digest.update(f"preview-cache-v{CACHE_FORMAT_VERSION}:{mode}".encode())
    digest.update(generator_digest.encode())
    for source in (pet_dir / "pet.json", pet_dir / "spritesheet.webp"):
        digest.update(source.name.encode())
        with source.open("rb") as stream:
            while chunk := stream.read(CACHE_CHUNK_SIZE):
                digest.update(chunk)
    return digest.hexdigest()


def expected_outputs(
    pet_dir: Path,
    preview_root: Path,
    site_only: bool,
) -> list[Path]:
    preview_dir = preview_root / pet_dir.name
    states = states_for_pet(pet_dir)
    outputs = [preview_dir / "thumbnail.webp"]
    outputs.extend(preview_dir / "webp" / f"{state}.webp" for state, _, _ in states)
    if not site_only:
        outputs.append(preview_dir / "contact-sheet.png")
        outputs.extend(preview_dir / "gifs" / f"{state}.gif" for state, _, _ in states)
    return outputs


def load_cache_manifest(path: Path, mode: str) -> dict[str, str]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if payload.get("format") != CACHE_FORMAT_VERSION or payload.get("mode") != mode:
        return {}
    pets = payload.get("pets")
    if not isinstance(pets, dict):
        return {}
    return {
        pet_id: fingerprint
        for pet_id, fingerprint in pets.items()
        if isinstance(pet_id, str) and isinstance(fingerprint, str)
    }


def write_cache_manifest(path: Path, mode: str, pets: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(f"{path.suffix}.tmp")
    temporary.write_text(
        json.dumps(
            {"format": CACHE_FORMAT_VERSION, "mode": mode, "pets": pets},
            ensure_ascii=True,
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)


def remove_stale_animations(
    output_dir: Path,
    extension: str,
    states: list[tuple[str, int, list[int]]],
) -> None:
    if not output_dir.exists():
        return
    expected_names = {f"{state}{extension}" for state, _, _ in states}
    for output in output_dir.glob(f"*{extension}"):
        if output.name not in expected_names:
            output.unlink()


def generate_for_pet(
    pet_dir: Path,
    preview_root: Path | None = None,
    site_only: bool = False,
) -> None:
    spritesheet = pet_dir / "spritesheet.webp"
    pet_json = pet_dir / "pet.json"
    if not spritesheet.exists() or not pet_json.exists():
        return

    metadata = json.loads(pet_json.read_text(encoding="utf-8"))
    sprite_version_number = metadata.get("spriteVersionNumber", 1)
    if sprite_version_number not in (1, 2):
        raise ValueError(f"{pet_json} spriteVersionNumber must be 1, 2, or omitted for v1")

    row_count = V2_ROWS if sprite_version_number == 2 else V1_ROWS
    states = states_for_pet(pet_dir)

    with Image.open(spritesheet) as opened:
        atlas = opened.convert("RGBA")

    expected_size = (COLUMNS * CELL_WIDTH, row_count * CELL_HEIGHT)
    if atlas.size != expected_size:
        raise ValueError(f"{spritesheet} must be {expected_size[0]}x{expected_size[1]}, got {atlas.size[0]}x{atlas.size[1]}")

    if preview_root is None:
        repo_root = Path(__file__).resolve().parents[1]
        preview_root = repo_root / "assets" / "previews"
    preview_dir = preview_root / pet_dir.name
    remove_stale_animations(preview_dir / "webp", ".webp", states)
    if not site_only:
        remove_stale_animations(preview_dir / "gifs", ".gif", states)
    make_thumbnail(atlas, preview_dir / "thumbnail.webp")
    if not site_only:
        make_contact_sheet(atlas, states, preview_dir / "contact-sheet.png")
    for state, row, durations in states:
        if not site_only:
            make_gif(atlas, state, row, durations, preview_dir / "gifs" / f"{state}.gif")
        make_webp(atlas, state, row, durations, preview_dir / "webp" / f"{state}.webp")

    print(f"generated previews for {pet_dir.name}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "pet_ids",
        nargs="*",
        help="Optional pet directory names. Omit to generate previews for every pet.",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Reuse complete previews whose source fingerprint has not changed.",
    )
    parser.add_argument(
        "--site-only",
        action="store_true",
        help="Generate only thumbnails and animated WebP files needed by the website.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    pets_dir = repo_root / "pets"
    preview_root = repo_root / "assets" / "previews"
    pet_dirs = (
        [pets_dir / pet_id for pet_id in args.pet_ids]
        if args.pet_ids
        else sorted(pets_dir.iterdir())
    )
    mode = "site" if args.site_only else "full"
    manifest_path = preview_root / f".preview-cache-{mode}.json"
    manifest = load_cache_manifest(manifest_path, mode) if args.incremental else {}
    next_manifest = dict(manifest) if args.pet_ids else {}
    generator_digest = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    generated = 0
    cached = 0

    for pet_dir in pet_dirs:
        if pet_dir.name.startswith("."):
            continue
        if not pet_dir.is_dir():
            raise ValueError(f"unknown pet directory: {pet_dir.name}")
        if not (pet_dir / "pet.json").exists() or not (
            pet_dir / "spritesheet.webp"
        ).exists():
            continue

        fingerprint = source_fingerprint(pet_dir, generator_digest, args.site_only)
        outputs = expected_outputs(pet_dir, preview_root, args.site_only)
        if (
            args.incremental
            and manifest.get(pet_dir.name) == fingerprint
            and all(output.exists() for output in outputs)
        ):
            print(f"reused cached previews for {pet_dir.name}")
            cached += 1
        else:
            generate_for_pet(pet_dir, preview_root, args.site_only)
            generated += 1
        next_manifest[pet_dir.name] = fingerprint

    if args.incremental:
        write_cache_manifest(manifest_path, mode, next_manifest)
        print(f"preview cache summary: generated={generated}, reused={cached}, mode={mode}")


if __name__ == "__main__":
    main()
