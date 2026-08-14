#!/usr/bin/env python3
"""Extract generated horizontal row strips into 192x208 sprite frames."""

from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

from PIL import Image

CELL_WIDTH = 192
CELL_HEIGHT = 208
KEY_DOMINANCE_THRESHOLD = 16.0
ALPHA_NOISE_FLOOR = 24
ROW_FRAME_COUNTS = {
    "idle": 6,
    "running-right": 8,
    "running-left": 8,
    "waving": 4,
    "jumping": 5,
    "failed": 8,
    "waiting": 6,
    "running": 6,
    "review": 6,
}


def parse_states(raw: str) -> list[str]:
    if raw.strip().lower() == "all":
        return list(ROW_FRAME_COUNTS)
    states = [item.strip() for item in raw.split(",") if item.strip()]
    unknown = sorted(set(states) - set(ROW_FRAME_COUNTS))
    if unknown:
        raise SystemExit(f"unknown state(s): {', '.join(unknown)}")
    return states


def parse_hex_color(value: str) -> tuple[int, int, int]:
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise SystemExit(f"invalid chroma key color: {value}; expected #RRGGBB")
    return tuple(int(value[index : index + 2], 16) for index in (1, 3, 5))


def load_chroma_key(decoded_dir: Path, override: str | None) -> tuple[int, int, int]:
    if override:
        return parse_hex_color(override)
    request_path = decoded_dir.parent / "pet_request.json"
    if request_path.is_file():
        request = json.loads(request_path.read_text(encoding="utf-8"))
        chroma_key = request.get("chroma_key")
        if isinstance(chroma_key, dict) and isinstance(chroma_key.get("hex"), str):
            return parse_hex_color(chroma_key["hex"])
    return parse_hex_color("#00FF00")


def color_distance(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
) -> float:
    return math.sqrt((red - key[0]) ** 2 + (green - key[1]) ** 2 + (blue - key[2]) ** 2)


def channel_distance(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
) -> int:
    return max(abs(red - key[0]), abs(green - key[1]), abs(blue - key[2]))


def clamp_channel(value: float) -> int:
    return max(0, min(255, int(round(value))))


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def spill_channels(key: tuple[int, int, int]) -> list[int]:
    key_max = max(key)
    if key_max < 128:
        return []
    return [index for index, value in enumerate(key) if value >= key_max - 16 and value >= 128]


def key_channel_dominance(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
) -> float:
    channels = [float(red), float(green), float(blue)]
    key_channels = spill_channels(key)
    if not key_channels:
        return 0.0

    other_channels = [index for index in range(3) if index not in key_channels]
    key_strength = (
        min(channels[index] for index in key_channels)
        if len(key_channels) > 1
        else channels[key_channels[0]]
    )
    other_strength = max((channels[index] for index in other_channels), default=0.0)
    return key_strength - other_strength


def looks_key_colored(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
    distance: int,
) -> bool:
    if distance <= 32:
        return True
    return key_channel_dominance(red, green, blue, key) >= KEY_DOMINANCE_THRESHOLD


def soft_alpha(distance: int, transparent_threshold: float, opaque_threshold: float) -> int:
    if distance <= transparent_threshold:
        return 0
    if distance >= opaque_threshold:
        return 255
    ratio = (float(distance) - transparent_threshold) / (
        opaque_threshold - transparent_threshold
    )
    return clamp_channel(255.0 * smoothstep(ratio))


def dominance_alpha(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
) -> int:
    channels = [float(red), float(green), float(blue)]
    key_channels = spill_channels(key)
    if not key_channels:
        return 255

    other_channels = [index for index in range(3) if index not in key_channels]
    key_strength = (
        min(channels[index] for index in key_channels)
        if len(key_channels) > 1
        else channels[key_channels[0]]
    )
    other_strength = max((channels[index] for index in other_channels), default=0.0)
    dominance = key_strength - other_strength
    if dominance <= 0:
        return 255

    denominator = max(1.0, float(max(key)) - other_strength)
    alpha = 1.0 - min(1.0, dominance / denominator)
    return clamp_channel(alpha * 255.0)


def cleanup_spill(
    red: int,
    green: int,
    blue: int,
    key: tuple[int, int, int],
    alpha: int,
) -> tuple[int, int, int]:
    if alpha >= 252:
        return red, green, blue

    channels = [float(red), float(green), float(blue)]
    key_channels = spill_channels(key)
    if not key_channels:
        return red, green, blue

    other_channels = [index for index in range(3) if index not in key_channels]
    if other_channels:
        anchor = max(channels[index] for index in other_channels)
        cap = max(0.0, anchor - 1.0)
        for index in key_channels:
            if channels[index] > cap:
                channels[index] = cap

    return (
        clamp_channel(channels[0]),
        clamp_channel(channels[1]),
        clamp_channel(channels[2]),
    )


def contract_alpha(image: Image.Image, pixels: int) -> Image.Image:
    if pixels <= 0:
        return image

    from PIL import ImageFilter

    alpha = image.getchannel("A")
    for _ in range(pixels):
        alpha = alpha.filter(ImageFilter.MinFilter(3))
    image.putalpha(alpha)
    return image


def remove_chroma_background(
    image: Image.Image,
    chroma_key: tuple[int, int, int],
    threshold: float,
    *,
    transparent_threshold: float = 12.0,
    edge_contract: int = 1,
) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            distance = channel_distance(red, green, blue, chroma_key)
            key_like = looks_key_colored(red, green, blue, chroma_key, distance)
            output_alpha = (
                min(
                    soft_alpha(distance, transparent_threshold, threshold),
                    dominance_alpha(red, green, blue, chroma_key),
                )
                if key_like
                else 255
            )
            output_alpha = int(round(output_alpha * (alpha / 255.0)))
            if 0 < output_alpha <= ALPHA_NOISE_FLOOR:
                output_alpha = 0

            if output_alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            if key_like:
                red, green, blue = cleanup_spill(red, green, blue, chroma_key, output_alpha)
            pixels[x, y] = (red, green, blue, output_alpha)
    return contract_alpha(rgba, edge_contract)


def alpha_bbox(
    image: Image.Image,
    threshold: int = ALPHA_NOISE_FLOOR,
) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    width, height = image.size
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1

    for y in range(height):
        for x in range(width):
            if alpha.getpixel((x, y)) <= threshold:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    if max_x < min_x or max_y < min_y:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def fit_to_cell(image: Image.Image) -> Image.Image:
    bbox = alpha_bbox(image)
    target = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    if bbox is None:
        return target

    sprite = image.crop(bbox)
    max_width = CELL_WIDTH - 10
    max_height = CELL_HEIGHT - 10
    scale = min(max_width / sprite.width, max_height / sprite.height, 1.0)
    if scale != 1.0:
        sprite = sprite.resize(
            (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
            Image.Resampling.LANCZOS,
        )
    left = (CELL_WIDTH - sprite.width) // 2
    top = (CELL_HEIGHT - sprite.height) // 2
    target.alpha_composite(sprite, (left, top))
    return target


def count_nontransparent_pixels(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    return sum(1 for value in alpha.getdata() if value > 16)


def connected_components(image: Image.Image) -> list[dict[str, object]]:
    alpha = image.getchannel("A")
    width, height = image.size
    data = alpha.tobytes()
    visited = bytearray(width * height)
    components: list[dict[str, object]] = []

    for start, alpha_value in enumerate(data):
        if alpha_value <= 16 or visited[start]:
            continue

        stack = [start]
        visited[start] = 1
        pixels: list[int] = []
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0

        while stack:
            current = stack.pop()
            pixels.append(current)
            x = current % width
            y = current // width
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

            if x > 0:
                neighbor = current - 1
                if not visited[neighbor] and data[neighbor] > 16:
                    visited[neighbor] = 1
                    stack.append(neighbor)
            if x + 1 < width:
                neighbor = current + 1
                if not visited[neighbor] and data[neighbor] > 16:
                    visited[neighbor] = 1
                    stack.append(neighbor)
            if y > 0:
                neighbor = current - width
                if not visited[neighbor] and data[neighbor] > 16:
                    visited[neighbor] = 1
                    stack.append(neighbor)
            if y + 1 < height:
                neighbor = current + width
                if not visited[neighbor] and data[neighbor] > 16:
                    visited[neighbor] = 1
                    stack.append(neighbor)

        components.append(
            {
                "pixels": pixels,
                "area": len(pixels),
                "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                "center_x": (min_x + max_x + 1) / 2,
            }
        )

    return components


def component_group_image(
    source: Image.Image,
    components: list[dict[str, object]],
    padding: int = 4,
) -> Image.Image:
    width, height = source.size
    min_x = max(0, min(component["bbox"][0] for component in components) - padding)
    min_y = max(0, min(component["bbox"][1] for component in components) - padding)
    max_x = min(width, max(component["bbox"][2] for component in components) + padding)
    max_y = min(height, max(component["bbox"][3] for component in components) + padding)

    output = Image.new("RGBA", (max_x - min_x, max_y - min_y), (0, 0, 0, 0))
    source_pixels = source.load()
    output_pixels = output.load()
    for component in components:
        for pixel_index in component["pixels"]:
            x = pixel_index % width
            y = pixel_index // width
            output_pixels[x - min_x, y - min_y] = source_pixels[x, y]
    return output


def extract_component_frames(strip: Image.Image, frame_count: int) -> list[Image.Image] | None:
    components = connected_components(strip)
    if not components:
        return None

    largest_area = max(component["area"] for component in components)
    seed_threshold = max(120, largest_area * 0.20)
    seeds = [component for component in components if component["area"] >= seed_threshold]
    if len(seeds) < frame_count:
        seeds = sorted(components, key=lambda component: component["area"], reverse=True)[
            :frame_count
        ]
    if len(seeds) < frame_count:
        return None

    seeds = sorted(
        sorted(seeds, key=lambda component: component["area"], reverse=True)[:frame_count],
        key=lambda component: component["center_x"],
    )
    seed_ids = {id(seed) for seed in seeds}
    groups: list[list[dict[str, object]]] = [[seed] for seed in seeds]
    noise_threshold = max(12, largest_area * 0.002)

    for component in components:
        if id(component) in seed_ids or component["area"] < noise_threshold:
            continue
        nearest_index = min(
            range(len(seeds)),
            key=lambda index: abs(seeds[index]["center_x"] - component["center_x"]),
        )
        groups[nearest_index].append(component)

    return [fit_to_cell(component_group_image(strip, group)) for group in groups]


def extract_slot_frames(strip: Image.Image, frame_count: int) -> list[Image.Image]:
    slot_width = strip.width / frame_count
    frames = []
    for index in range(frame_count):
        left = round(index * slot_width)
        right = round((index + 1) * slot_width)
        crop = strip.crop((left, 0, right, strip.height))
        frames.append(fit_to_cell(crop))
    return frames


def extract_state(
    strip_path: Path,
    state: str,
    output_root: Path,
    chroma_key: tuple[int, int, int],
    threshold: float,
    method: str,
) -> dict[str, object]:
    frame_count = ROW_FRAME_COUNTS[state]
    with Image.open(strip_path) as opened:
        strip = remove_chroma_background(opened, chroma_key, threshold)

    state_dir = output_root / state
    state_dir.mkdir(parents=True, exist_ok=True)

    frames = None
    used_method = method
    if method in {"auto", "components"}:
        frames = extract_component_frames(strip, frame_count)
        if frames is None and method == "components":
            raise SystemExit(f"could not find {frame_count} sprite components in {strip_path}")
        if frames is not None and method == "auto":
            used_pixels = sorted(count_nontransparent_pixels(frame) for frame in frames)
            if used_pixels:
                median = used_pixels[len(used_pixels) // 2]
                smallest = used_pixels[0]
                largest = used_pixels[-1]
                if median > 0 and (
                    smallest < median * 0.35 or largest > median * 2.75
                ):
                    frames = None
        if frames is not None:
            used_method = "components"

    if frames is None:
        frames = extract_slot_frames(strip, frame_count)
        used_method = "slots"

    outputs = []
    for index, frame in enumerate(frames):
        output = state_dir / f"{index:02d}.png"
        frame.save(output)
        outputs.append(str(output))
    return {"state": state, "frames": outputs, "method": used_method}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--decoded-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--states", default="all")
    parser.add_argument("--chroma-key", help="Override chroma key as #RRGGBB.")
    parser.add_argument("--key-threshold", type=float, default=96.0)
    parser.add_argument(
        "--method",
        choices=("auto", "components", "slots"),
        default="auto",
        help="Use connected sprite components when possible, or fixed equal slots.",
    )
    args = parser.parse_args()

    decoded_dir = Path(args.decoded_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    chroma_key = load_chroma_key(decoded_dir, args.chroma_key)
    states = parse_states(args.states)
    manifest = []
    for state in states:
        strip_path = decoded_dir / f"{state}.png"
        if not strip_path.is_file():
            raise SystemExit(f"missing generated strip for {state}: {strip_path}")
        manifest.append(
            extract_state(
                strip_path,
                state,
                output_dir,
                chroma_key,
                args.key_threshold,
                args.method,
            )
        )

    (output_dir / "frames-manifest.json").write_text(
        json.dumps(
            {
                "ok": True,
                "chroma_key": {
                    "hex": f"#{chroma_key[0]:02X}{chroma_key[1]:02X}{chroma_key[2]:02X}",
                    "rgb": list(chroma_key),
                    "threshold": args.key_threshold,
                },
                "rows": manifest,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"ok": True, "frames_root": str(output_dir), "states": states}, indent=2))


if __name__ == "__main__":
    main()
