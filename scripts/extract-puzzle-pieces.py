from __future__ import annotations

import json
import math
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SCALE_WIDTH = 900
EXPECTED_PIECE_COUNTS = {
    "homem": 6,
    "perfil": 7,
    "elefante": 6,
    "casa": 9,
    "borboleta": 7,
}


def build_detection_mask(image: Image.Image, stem: str) -> np.ndarray:
    pixels = np.asarray(image.convert("RGB"), dtype=np.int16)
    r = pixels[:, :, 0]
    g = pixels[:, :, 1]
    b = pixels[:, :, 2]

    if stem in {"homem", "perfil"}:
        mask = (r > 155) & (g > 155) & (b < 220) & ((r + g - (2 * b)) > 45)
    elif stem == "borboleta":
        mask = (r > 140) & (g < 120) & (b < 120) & ((r - g) > 40)
    elif stem == "casa":
        mask = (b > 120) & (r < 120) & (g > 110) & (((2 * b) - r - g) > 30)
    elif stem == "elefante":
        maxc = np.maximum.reduce([r, g, b])
        minc = np.minimum.reduce([r, g, b])
        mask = (maxc < 240) & ((maxc - minc) < 35)
    else:
        raise ValueError(f"Unsupported puzzle source: {stem}")

    mask[:3, :] = False
    mask[-3:, :] = False
    mask[:, :3] = False
    mask[:, -3:] = False
    return mask


def split_mask_regions(
    mask: np.ndarray,
    min_gap: int = 8,
    min_area: int = 80,
    x0: int = 0,
    y0: int = 0,
) -> list[tuple[int, int, int, int, int]]:
    ys = np.where(mask.sum(axis=1) > 0)[0]
    xs = np.where(mask.sum(axis=0) > 0)[0]

    if len(xs) == 0 or len(ys) == 0:
        return []

    mask = mask[ys[0] : ys[-1] + 1, xs[0] : xs[-1] + 1]
    x0 += int(xs[0])
    y0 += int(ys[0])

    if int(mask.sum()) < min_area:
        return []

    def find_gaps(occupied: np.ndarray) -> list[tuple[int, int]]:
        gaps: list[tuple[int, int]] = []
        start = None

        for index, is_gap in enumerate(~occupied):
            if is_gap and start is None:
                start = index
            elif not is_gap and start is not None:
                if index - start >= min_gap:
                    gaps.append((start, index))
                start = None

        if start is not None and len(occupied) - start >= min_gap:
            gaps.append((start, len(occupied)))

        return gaps

    row_gaps = find_gaps(mask.sum(axis=1) > 0)
    col_gaps = find_gaps(mask.sum(axis=0) > 0)

    if row_gaps or col_gaps:
        use_rows = bool(row_gaps) and (
            not col_gaps or max(end - start for start, end in row_gaps)
            >= max(end - start for start, end in col_gaps)
        )
        spans = row_gaps if use_rows else col_gaps
        regions: list[tuple[int, int, int, int, int]] = []
        previous = 0
        total = mask.shape[0] if use_rows else mask.shape[1]

        for start, end in spans:
            if start - previous > 0:
                sub_mask = mask[previous:start, :] if use_rows else mask[:, previous:start]
                regions.extend(
                    split_mask_regions(
                        sub_mask,
                        min_gap=min_gap,
                        min_area=min_area,
                        x0=x0,
                        y0=y0 + previous if use_rows else y0,
                    )
                    if use_rows
                    else split_mask_regions(
                        sub_mask,
                        min_gap=min_gap,
                        min_area=min_area,
                        x0=x0 + previous,
                        y0=y0,
                    )
                )
            previous = end

        if total - previous > 0:
            sub_mask = mask[previous:, :] if use_rows else mask[:, previous:]
            regions.extend(
                split_mask_regions(
                    sub_mask,
                    min_gap=min_gap,
                    min_area=min_area,
                    x0=x0,
                    y0=y0 + previous if use_rows else y0,
                )
                if use_rows
                else split_mask_regions(
                    sub_mask,
                    min_gap=min_gap,
                    min_area=min_area,
                    x0=x0 + previous,
                    y0=y0,
                )
            )

        return regions

    return [(x0, y0, mask.shape[1], mask.shape[0], int(mask.sum()))]


def component_regions(mask: np.ndarray, min_area: int = 80) -> list[tuple[int, int, int, int, int]]:
    height, width = mask.shape
    visited = np.zeros((height, width), dtype=bool)
    regions: list[tuple[int, int, int, int, int]] = []

    for y in range(height):
        xs = np.where(mask[y] & ~visited[y])[0]
        for x in xs:
            if visited[y, x] or not mask[y, x]:
                continue

            queue = deque([(x, y)])
            visited[y, x] = True
            min_x = max_x = x
            min_y = max_y = y
            area = 0

            while queue:
                current_x, current_y = queue.popleft()
                area += 1

                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)

                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if (
                        0 <= next_x < width
                        and 0 <= next_y < height
                        and mask[next_y, next_x]
                        and not visited[next_y, next_x]
                    ):
                        visited[next_y, next_x] = True
                        queue.append((next_x, next_y))

            if area >= min_area:
                regions.append((min_x, min_y, max_x - min_x + 1, max_y - min_y + 1, area))

    return regions


def sort_regions(regions: list[tuple[int, int, int, int, int]]) -> list[tuple[int, int, int, int, int]]:
    return sorted(regions, key=lambda region: (region[1], region[0]))


def scale_region(
    region: tuple[int, int, int, int, int],
    source_width: int,
    source_height: int,
    scaled_width: int,
    scaled_height: int,
    padding: int = 24,
) -> tuple[int, int, int, int]:
    x, y, width, height, _ = region
    scale_x = source_width / scaled_width
    scale_y = source_height / scaled_height

    left = max(0, int(math.floor(x * scale_x)) - padding)
    top = max(0, int(math.floor(y * scale_y)) - padding)
    right = min(source_width, int(math.ceil((x + width) * scale_x)) + padding)
    bottom = min(source_height, int(math.ceil((y + height) * scale_y)) + padding)
    return left, top, right, bottom


def largest_component(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    visited = np.zeros((height, width), dtype=bool)
    largest_pixels: list[tuple[int, int]] = []

    for y in range(height):
        xs = np.where(mask[y] & ~visited[y])[0]
        for x in xs:
            if visited[y, x] or not mask[y, x]:
                continue

            queue = deque([(x, y)])
            visited[y, x] = True
            component_pixels: list[tuple[int, int]] = []

            while queue:
                current_x, current_y = queue.popleft()
                component_pixels.append((current_x, current_y))

                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if (
                        0 <= next_x < width
                        and 0 <= next_y < height
                        and mask[next_y, next_x]
                        and not visited[next_y, next_x]
                    ):
                        visited[next_y, next_x] = True
                        queue.append((next_x, next_y))

            if len(component_pixels) > len(largest_pixels):
                largest_pixels = component_pixels

    output = np.zeros_like(mask, dtype=bool)
    for x, y in largest_pixels:
        output[y, x] = True
    return output


def build_foreground_mask(crop: Image.Image, stem: str) -> np.ndarray:
    detection_mask = build_detection_mask(crop, stem)
    expanded_detection = np.asarray(
        Image.fromarray((detection_mask.astype(np.uint8) * 255), mode="L").filter(
            ImageFilter.MaxFilter(7)
        )
    ) > 0

    if stem != "casa":
        return largest_component(expanded_detection)

    protection = Image.fromarray((detection_mask.astype(np.uint8) * 255), mode="L").filter(
        ImageFilter.MaxFilter(5)
    )
    protected_mask = np.asarray(protection) > 0

    pixels = np.asarray(crop.convert("RGB"), dtype=np.int16)
    maxc = np.maximum.reduce([pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]])
    minc = np.minimum.reduce([pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]])
    background_like = (minc > 185) & ((maxc - minc) < 40)
    walkable = background_like & ~protected_mask

    height, width = walkable.shape
    background = np.zeros_like(walkable, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if walkable[0, x]:
            queue.append((x, 0))
            background[0, x] = True
        if walkable[height - 1, x]:
            queue.append((x, height - 1))
            background[height - 1, x] = True

    for y in range(height):
        if walkable[y, 0]:
            queue.append((0, y))
            background[y, 0] = True
        if walkable[y, width - 1]:
            queue.append((width - 1, y))
            background[y, width - 1] = True

    while queue:
        current_x, current_y = queue.popleft()
        for next_x, next_y in (
            (current_x - 1, current_y),
            (current_x + 1, current_y),
            (current_x, current_y - 1),
            (current_x, current_y + 1),
        ):
            if (
                0 <= next_x < width
                and 0 <= next_y < height
                and walkable[next_y, next_x]
                and not background[next_y, next_x]
            ):
                background[next_y, next_x] = True
                queue.append((next_x, next_y))

    foreground = ~background
    if not foreground.any():
        foreground = expanded_detection

    return largest_component(foreground)


def refine_piece(
    image: Image.Image,
    stem: str,
    region: tuple[int, int, int, int],
) -> tuple[Image.Image, dict[str, int]]:
    left, top, right, bottom = region
    crop = image.crop((left, top, right, bottom)).convert("RGBA")
    foreground = build_foreground_mask(crop, stem)

    ys = np.where(foreground.sum(axis=1) > 0)[0]
    xs = np.where(foreground.sum(axis=0) > 0)[0]
    if len(xs) == 0 or len(ys) == 0:
        raise RuntimeError(f"Could not isolate a foreground crop for {stem}.")

    trimmed_left = int(xs[0])
    trimmed_top = int(ys[0])
    trimmed_right = int(xs[-1]) + 1
    trimmed_bottom = int(ys[-1]) + 1

    trimmed_crop = crop.crop((trimmed_left, trimmed_top, trimmed_right, trimmed_bottom))
    trimmed_foreground = foreground[trimmed_top:trimmed_bottom, trimmed_left:trimmed_right]
    trimmed_crop.putalpha(Image.fromarray(trimmed_foreground.astype(np.uint8) * 255, mode="L"))

    return trimmed_crop, {
        "x": left + trimmed_left,
        "y": top + trimmed_top,
        "width": trimmed_crop.width,
        "height": trimmed_crop.height,
    }


def extract_regions(image: Image.Image, stem: str) -> list[tuple[int, int, int, int, int]]:
    scaled_width = SCALE_WIDTH
    scaled_height = int(round((image.height / image.width) * scaled_width))
    scaled = image.resize((scaled_width, scaled_height), Image.Resampling.NEAREST)
    mask = build_detection_mask(scaled, stem)

    if stem == "borboleta":
        regions = component_regions(mask)
    else:
        regions = split_mask_regions(mask)

    return sort_regions(regions)


def process_image(source_path: Path, output_dir: Path) -> dict[str, object]:
    image = Image.open(source_path)
    stem = source_path.stem.lower()
    challenge_id = f"puzzle-{stem}"
    piece_output_dir = output_dir / challenge_id
    piece_output_dir.mkdir(parents=True, exist_ok=True)

    regions = extract_regions(image, stem)
    expected_count = EXPECTED_PIECE_COUNTS[stem]
    if len(regions) != expected_count:
        raise RuntimeError(
            f'{source_path.name}: expected {expected_count} pieces, detected {len(regions)}.'
        )

    pieces: list[dict[str, object]] = []
    scaled_width = SCALE_WIDTH
    scaled_height = int(round((image.height / image.width) * scaled_width))

    for index, region in enumerate(regions, start=1):
        scaled_region = scale_region(
            region,
            source_width=image.width,
            source_height=image.height,
            scaled_width=scaled_width,
            scaled_height=scaled_height,
        )
        piece_image, source_box = refine_piece(image, stem, scaled_region)
        piece_file_name = f"piece-{index}.png"
        piece_path = piece_output_dir / piece_file_name
        piece_image.save(piece_path, format="PNG")

        pieces.append(
            {
                "pieceSrc": f"/assets/puzzles/generated/{challenge_id}/{piece_file_name}",
                "sourceBox": source_box,
                "renderWidthPct": round((source_box["width"] / image.width) * 100, 4),
                "renderHeightPct": round((source_box["height"] / image.height) * 100, 4),
            }
        )

    return {
        "challengeId": challenge_id,
        "sheetWidth": image.width,
        "sheetHeight": image.height,
        "pieces": pieces,
    }


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract-puzzle-pieces.py <source_dir> <output_dir>")

    source_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    image_paths = sorted(
        path for path in source_dir.glob("*.jpg") if path.stem.lower() in EXPECTED_PIECE_COUNTS
    )

    manifest = [process_image(image_path, output_dir) for image_path in image_paths]
    sys.stdout.write(json.dumps(manifest))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
