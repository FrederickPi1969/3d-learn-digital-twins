#!/usr/bin/env python3
"""Generate small, original loopable MP4 artworks for the in-world media screens.

The generated clips are project-owned demo assets. They intentionally avoid external
footage so the starter stays offline-capable and redistributable.
"""
from __future__ import annotations

import math
import subprocess
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "media" / "exhibition"
WIDTH = 960
HEIGHT = 540
FPS = 24
DURATION = 6
FRAME_COUNT = FPS * DURATION


def ffmpeg_writer(path: Path) -> subprocess.Popen[bytes]:
    command = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(path),
    ]
    return subprocess.Popen(command, stdin=subprocess.PIPE)


def add_title(frame: np.ndarray, eyebrow: str, title: str, index: int) -> None:
    overlay = frame.copy()
    cv2.rectangle(overlay, (34, 31), (326, 111), (5, 14, 28), -1)
    cv2.addWeighted(overlay, 0.58, frame, 0.42, 0, frame)
    cv2.line(frame, (34, 30), (326, 30), (255, 226, 120), 2, cv2.LINE_AA)
    cv2.putText(frame, eyebrow, (52, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.43, (185, 213, 231), 1, cv2.LINE_AA)
    cv2.putText(frame, title, (51, 91), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (245, 250, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, f"LIVE / {index:03d}", (820, 506), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (181, 221, 241), 1, cv2.LINE_AA)


def aurora_frame(t: float, index: int) -> np.ndarray:
    y, x = np.mgrid[0:HEIGHT, 0:WIDTH]
    nx = x / WIDTH
    ny = y / HEIGHT
    phase = 2 * math.pi * t

    base = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float32)
    base[..., 0] = 12 + 20 * (1 - ny)
    base[..., 1] = 20 + 44 * (1 - ny)
    base[..., 2] = 38 + 74 * (1 - ny)

    ribbons = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    for ribbon in range(5):
        center = 0.22 + ribbon * 0.13 + 0.08 * np.sin(nx * (5.0 + ribbon * 0.55) + phase + ribbon)
        thickness = 0.018 + ribbon * 0.004
        ribbons += np.exp(-((ny - center) ** 2) / (2 * thickness**2)) * (0.55 + ribbon * 0.13)

    radial = np.exp(-(((nx - (0.73 + 0.09 * math.sin(phase))) / 0.25) ** 2 + ((ny - 0.46) / 0.46) ** 2))
    stars = (
        np.sin(nx * 171 + ny * 93 + phase * 3.0)
        * np.sin(nx * 287 - ny * 121 - phase * 1.5)
    )
    stars = np.clip((stars - 0.92) * 8.5, 0, 1)

    base[..., 0] += ribbons * 92 + radial * 58 + stars * 160
    base[..., 1] += ribbons * 186 + radial * 84 + stars * 195
    base[..., 2] += ribbons * 210 + radial * 192 + stars * 210

    frame = np.clip(base, 0, 255).astype(np.uint8)
    for line_index in range(9):
        points = []
        for px in range(0, WIDTH + 20, 20):
            py = int(356 + line_index * 15 + math.sin(px * 0.018 + phase * 1.2 + line_index) * (7 + line_index * 0.7))
            points.append((px, py))
        cv2.polylines(frame, [np.array(points)], False, (84, 138 + line_index * 6, 197 + line_index * 4), 1, cv2.LINE_AA)

    add_title(frame, "GENERATIVE LIGHT STUDY", "AURORA FIELD", index)
    return frame


def kinetic_frame(t: float, index: int) -> np.ndarray:
    frame = np.full((HEIGHT, WIDTH, 3), (239, 241, 242), dtype=np.uint8)
    phase = 2 * math.pi * t

    for row in range(-4, 9):
        y0 = row * 72 + int((math.sin(phase) * 28))
        for column in range(-2, 13):
            x0 = column * 88 + int(math.sin(phase + row * 0.7) * 34)
            parity = (row + column) % 2
            angle = phase * (1 if parity else -1) + row * 0.42
            radius = 27 + 8 * math.sin(phase * 2 + column)
            pts = []
            for corner in range(4):
                theta = angle + corner * math.pi / 2
                pts.append((int(x0 + math.cos(theta) * radius), int(y0 + math.sin(theta) * radius)))
            color = (9, 18, 27) if parity else (12, 136, 208)
            cv2.polylines(frame, [np.array(pts)], True, color, 4, cv2.LINE_AA)

    sweep_x = int((0.5 + 0.5 * math.sin(phase)) * WIDTH)
    overlay = frame.copy()
    cv2.rectangle(overlay, (sweep_x - 90, 0), (sweep_x + 90, HEIGHT), (255, 188, 43), -1)
    cv2.addWeighted(overlay, 0.13, frame, 0.87, 0, frame)

    for y in range(0, HEIGHT, 36):
        cv2.line(frame, (0, y), (WIDTH, y), (204, 209, 212), 1)

    add_title(frame, "KINETIC TYPOLOGY", "MOTION MATRIX", index)
    return frame


def flux_frame(t: float, index: int) -> np.ndarray:
    y, x = np.mgrid[0:HEIGHT, 0:WIDTH]
    nx = (x - WIDTH / 2) / WIDTH
    ny = (y - HEIGHT / 2) / HEIGHT
    phase = 2 * math.pi * t

    angle = np.arctan2(ny, nx)
    radius = np.sqrt(nx**2 + ny**2)
    spiral = np.sin(28 * radius - 5 * angle - phase * 3.0)
    waves = np.sin(nx * 34 + np.sin(ny * 8 + phase) * 5 - phase * 2.0)
    pulse = np.sin((radius * 18 - phase * 2.0))

    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float32)
    frame[..., 0] = 20 + (spiral + 1) * 56 + (pulse + 1) * 28
    frame[..., 1] = 16 + (waves + 1) * 42 + (1 - radius) * 96
    frame[..., 2] = 34 + (1 - spiral) * 70 + (waves + 1) * 34

    glow = np.exp(-((radius - (0.21 + 0.035 * math.sin(phase))) ** 2) / 0.0018)
    frame[..., 0] += glow * 160
    frame[..., 1] += glow * 124
    frame[..., 2] += glow * 210
    frame = np.clip(frame, 0, 255).astype(np.uint8)

    for ring in range(4):
        radius_px = int((96 + ring * 62) * (1 + 0.035 * math.sin(phase + ring)))
        cv2.ellipse(frame, (WIDTH // 2, HEIGHT // 2), (radius_px, int(radius_px * 0.54)), int(phase * 9), 0, 360, (204, 226, 255), 1, cv2.LINE_AA)

    add_title(frame, "SPATIAL COMPUTATION", "CHROMATIC FLUX", index)
    return frame


def render_video(filename: str, frame_factory) -> None:
    path = OUTPUT / filename
    writer = ffmpeg_writer(path)
    assert writer.stdin is not None
    try:
        for index in range(FRAME_COUNT):
            t = index / FRAME_COUNT
            frame = frame_factory(t, index)
            if index == 0:
                cv2.imwrite(str(path.with_suffix(".jpg")), frame, [cv2.IMWRITE_JPEG_QUALITY, 91])
            writer.stdin.write(frame.tobytes())
    finally:
        writer.stdin.close()
    return_code = writer.wait()
    if return_code != 0:
        raise RuntimeError(f"ffmpeg failed for {filename} with code {return_code}")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    render_video("aurora-field.mp4", aurora_frame)
    render_video("motion-matrix.mp4", kinetic_frame)
    render_video("chromatic-flux.mp4", flux_frame)
    print(f"Generated {len(list(OUTPUT.glob('*.mp4')))} exhibition media loops in {OUTPUT}")


if __name__ == "__main__":
    main()
