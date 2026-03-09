from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

GENERATED_FRAME_PREFIX = "__derived-segment-"


def trim_image(image: Image.Image, threshold: int = 245) -> Image.Image:
    grayscale = np.array(ImageOps.grayscale(image))
    mask = grayscale < threshold
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return image
    return image.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def fingerprint(image: Image.Image, size: tuple[int, int] = (240, 240)) -> np.ndarray:
    trimmed = trim_image(image)
    inverted = ImageOps.invert(ImageOps.grayscale(trimmed)).resize(size)
    pixels = np.array(inverted, dtype=np.float32) / 255.0
    return (pixels - pixels.mean()) / (pixels.std() + 1e-6)


def segment_guide(guide: Image.Image, frame_count: int) -> list[tuple[int, int]]:
    grayscale = np.array(ImageOps.grayscale(guide), dtype=np.float32)
    ink = 255.0 - grayscale
    column_density = ink.mean(axis=0)
    occupied = column_density > 2.0

    regions: list[tuple[int, int]] = []
    start = None

    for index, has_ink in enumerate(occupied):
        if has_ink and start is None:
            start = index
        elif not has_ink and start is not None:
            if index - start > 20:
                regions.append((start, index - 1))
            start = None

    if start is not None:
        regions.append((start, len(occupied) - 1))

    if len(regions) < frame_count:
        raise RuntimeError(
            f"Expected at least {frame_count} occupied regions, found {len(regions)}."
        )

    gaps = [
        (regions[index + 1][0] - regions[index][1] - 1, index)
        for index in range(len(regions) - 1)
    ]
    split_after = sorted(
        index for _, index in sorted(gaps, reverse=True)[: frame_count - 1]
    )

    segments: list[tuple[int, int]] = []
    start_region = 0
    for index in split_after:
        segments.append((regions[start_region][0], regions[index][1]))
        start_region = index + 1
    segments.append((regions[start_region][0], regions[-1][1]))

    if len(segments) != frame_count:
        raise RuntimeError(f"Expected {frame_count} guide segments, found {len(segments)}.")

    return segments


def derive_order(story_dir: Path, guide_name: str, frame_names: list[str]) -> list[str]:
    guide = Image.open(story_dir / guide_name)
    segments = segment_guide(guide, len(frame_names))
    segment_images = [guide.crop((start, 0, end + 1, guide.height)) for start, end in segments]
    segment_prints = [fingerprint(segment_image) for segment_image in segment_images]
    frame_images = {
        frame_name: Image.open(story_dir / frame_name)
        for frame_name in frame_names
    }
    frame_prints = {
        frame_name: fingerprint(frame_image)
        for frame_name, frame_image in frame_images.items()
    }
    has_composite_source = any(
        (frame_image.width / frame_image.height) > 1.6
        for frame_image in frame_images.values()
    )
    non_composite_frames = [
        frame_name
        for frame_name, frame_image in frame_images.items()
        if (frame_image.width / frame_image.height) <= 1.6
    ]

    if has_composite_source:
        generated_frames: list[str] = []
        for index, segment_image in enumerate(segment_images, start=1):
            generated_name = f"{GENERATED_FRAME_PREFIX}{index}.jpg"
            segment_image.save(story_dir / generated_name, format="JPEG", quality=95)
            generated_frames.append(generated_name)
        return generated_frames

    ordered_frames: list[str] = []
    used_frames: set[str] = set()

    for index, segment_print in enumerate(segment_prints, start=1):
        available_frames = [
            frame_name
            for frame_name in non_composite_frames
            if frame_name not in used_frames
        ]
        if not available_frames:
            available_frames = [
                frame_name for frame_name in frame_names if frame_name not in used_frames
            ]

        scored_frames = sorted(
            (
                float(((segment_print - frame_print) ** 2).mean()),
                frame_name,
            )
            for frame_name, frame_print in frame_prints.items()
            if frame_name in available_frames
        )
        matched_frame_name = scored_frames[0][1]
        used_frames.add(matched_frame_name)

        matched_image = frame_images[matched_frame_name]
        aspect_ratio = matched_image.width / matched_image.height

        if aspect_ratio > 1.6:
            generated_name = f"{GENERATED_FRAME_PREFIX}{index}.jpg"
            segment_images[index - 1].save(story_dir / generated_name, format="JPEG", quality=95)
            ordered_frames.append(generated_name)
            continue

        ordered_frames.append(matched_frame_name)

    return ordered_frames


def main() -> int:
    if len(sys.argv) < 4:
        raise SystemExit(
            "Usage: derive-sequence-order.py <story_dir> <guide_name> <frame_name> [<frame_name>...]"
        )

    story_dir = Path(sys.argv[1])
    guide_name = sys.argv[2]
    frame_names = sys.argv[3:]
    ordered_frames = derive_order(story_dir, guide_name, frame_names)
    sys.stdout.write(json.dumps(ordered_frames))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
