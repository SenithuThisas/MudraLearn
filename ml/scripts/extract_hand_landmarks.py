#!/usr/bin/env python3
"""
extract_hand_landmarks.py
=========================
Re-extract hand landmarks from original SSL400 .mp4 videos using
MediaPipe HandLandmarker (21 landmarks × 3 coords × 2 hands = 126 features).

Applies per-frame normalisation:
  1. Subtract wrist (landmark 0) → hand centred at origin
  2. Divide by ||wrist → middle-finger MCP (landmark 9)|| → palm size = 1.0

Resamples every video to exactly SEQUENCE_LEN frames via linear interpolation.
Outputs one CSV per video, mirroring the folder structure of the source dataset.

Usage:
    cd ml
    python scripts/extract_hand_landmarks.py
"""

import pathlib
import logging
import csv
import sys
import time

import cv2
import numpy as np
from scipy.interpolate import interp1d

import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

# ──────────────────────────────────────────────────────────────────────────────
# Constants — all tuneable, all at the top
# ──────────────────────────────────────────────────────────────────────────────
SEQUENCE_LEN   = 60        # full 3 seconds at 20 fps
NUM_LANDMARKS  = 21        # per hand
NUM_COORDS     = 3         # x, y, z
FEATURES_PER_HAND = NUM_LANDMARKS * NUM_COORDS  # 63
NUM_FEATURES   = FEATURES_PER_HAND * 2           # 126 (left + right)
MIN_RAW_FRAMES = 5         # skip videos with fewer detected frames

SRC_ROOT = pathlib.Path("data/archive/Dataset - Original")
DST_ROOT = pathlib.Path("data/archive/Dataset - Hand - CSV")
LOG_FILE = pathlib.Path("logs/extract_hand_landmarks.log")

# MediaPipe HandLandmarker model path — downloaded automatically
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
MODEL_PATH = pathlib.Path("scripts/hand_landmarker.task")

# ──────────────────────────────────────────────────────────────────────────────
# Logging setup
# ──────────────────────────────────────────────────────────────────────────────
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, mode="w"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────────────────────────────────────

def download_model_if_needed():
    """Download the HandLandmarker model if not already present."""
    if MODEL_PATH.exists():
        log.info(f"Model already exists at {MODEL_PATH}")
        return
    log.info(f"Downloading HandLandmarker model to {MODEL_PATH}...")
    import urllib.request
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    log.info("Download complete.")


def normalise_hand(landmarks_21x3: np.ndarray) -> np.ndarray:
    """
    Wrist-relative + palm-scale normalisation for a single hand.

    Args:
        landmarks_21x3: shape (21, 3) — raw x, y, z from MediaPipe

    Returns:
        Flattened array of shape (63,) — normalised coordinates
    """
    pts = landmarks_21x3.copy()

    # 1. Centre at wrist (landmark 0)
    wrist = pts[0].copy()
    pts -= wrist

    # 2. Scale by wrist-to-middle-finger-MCP distance (landmark 9)
    scale = np.linalg.norm(pts[9]) + 1e-8
    pts /= scale

    return pts.flatten()  # (63,)


def extract_hand_features_from_result(result) -> np.ndarray:
    """
    Extract 126-dimensional feature vector from a HandLandmarker result.

    Returns:
        np.ndarray of shape (126,) — [left_hand(63) | right_hand(63)]
    """
    left_hand = np.zeros(FEATURES_PER_HAND, dtype=np.float32)
    right_hand = np.zeros(FEATURES_PER_HAND, dtype=np.float32)

    if result.hand_landmarks:
        for i, hand_landmarks in enumerate(result.hand_landmarks):
            handedness = result.handedness[i][0].category_name

            # Convert landmarks to (21, 3) array
            pts = np.array(
                [[lm.x, lm.y, lm.z] for lm in hand_landmarks],
                dtype=np.float32,
            )

            normalised = normalise_hand(pts)

            # MediaPipe reports handedness as mirrored (camera view)
            # "Left" in result = signer's right hand, and vice versa
            if handedness == "Left":
                right_hand = normalised
            else:
                left_hand = normalised

    return np.concatenate([left_hand, right_hand])  # (126,)


def resample_sequence(frames: np.ndarray, target_len: int) -> np.ndarray:
    """
    Resample a sequence of frames to target_len using linear interpolation.

    Args:
        frames: shape (N, 126) — N raw frames
        target_len: desired number of frames

    Returns:
        np.ndarray of shape (target_len, 126)
    """
    n_frames = frames.shape[0]
    if n_frames == target_len:
        return frames

    # Create interpolation function along time axis
    original_indices = np.linspace(0, 1, n_frames)
    target_indices = np.linspace(0, 1, target_len)

    interpolator = interp1d(original_indices, frames, axis=0, kind="linear")
    return interpolator(target_indices).astype(np.float32)


def process_video(video_path: pathlib.Path, detector) -> np.ndarray | None:
    """
    Process a single video file and return resampled hand landmarks.

    Returns:
        np.ndarray of shape (SEQUENCE_LEN, NUM_FEATURES) or None if failed.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        log.warning(f"Cannot open video: {video_path}")
        return None

    raw_frames = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Convert BGR → RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Detect hands
        result = detector.detect(mp_image)
        features = extract_hand_features_from_result(result)
        raw_frames.append(features)

        frame_idx += 1

    cap.release()

    if len(raw_frames) < MIN_RAW_FRAMES:
        log.warning(
            f"Too few frames ({len(raw_frames)}) in {video_path} — skipping"
        )
        return None

    raw_array = np.array(raw_frames, dtype=np.float32)  # (N, 126)
    resampled = resample_sequence(raw_array, SEQUENCE_LEN)  # (60, 126)

    return resampled


def save_csv(data: np.ndarray, csv_path: pathlib.Path):
    """Save a (60, 126) array as CSV."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        for row in data:
            writer.writerow(row.tolist())


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Hand Landmark Extraction — Starting")
    log.info(f"Source: {SRC_ROOT}")
    log.info(f"Destination: {DST_ROOT}")
    log.info(f"Sequence length: {SEQUENCE_LEN}")
    log.info(f"Features per frame: {NUM_FEATURES}")
    log.info("=" * 60)

    # Download model
    download_model_if_needed()

    # Collect all video files
    video_files = sorted(SRC_ROOT.rglob("*.mp4"))
    total_videos = len(video_files)
    log.info(f"Found {total_videos} .mp4 files")

    if total_videos == 0:
        log.error("No .mp4 files found. Check SRC_ROOT path.")
        sys.exit(1)

    # Create HandLandmarker detector
    base_options = mp_tasks.BaseOptions(model_asset_path=str(MODEL_PATH))
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
    )
    detector = vision.HandLandmarker.create_from_options(options)

    processed = 0
    skipped = 0
    errors = 0
    start_time = time.time()

    for i, video_path in enumerate(video_files):
        # Build output path mirroring folder structure
        relative = video_path.relative_to(SRC_ROOT)
        csv_path = DST_ROOT / relative.with_suffix(".csv")

        # Skip if already processed
        if csv_path.exists():
            processed += 1
            if (i + 1) % 100 == 0:
                log.info(f"[{i+1}/{total_videos}] Already exists: {csv_path}")
            continue

        try:
            data = process_video(video_path, detector)

            if data is None:
                skipped += 1
                continue

            save_csv(data, csv_path)
            processed += 1

            if (i + 1) % 50 == 0:
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                remaining = (total_videos - i - 1) / rate
                log.info(
                    f"[{i+1}/{total_videos}] Processed: {processed}, "
                    f"Skipped: {skipped}, Errors: {errors} | "
                    f"Rate: {rate:.1f} vid/s | ETA: {remaining/60:.1f} min"
                )

        except Exception as e:
            errors += 1
            log.error(f"Error processing {video_path}: {e}")

    detector.close()

    elapsed = time.time() - start_time
    log.info("=" * 60)
    log.info("Extraction Complete")
    log.info(f"Total videos: {total_videos}")
    log.info(f"Processed: {processed}")
    log.info(f"Skipped (too few frames): {skipped}")
    log.info(f"Errors: {errors}")
    log.info(f"Skip rate: {skipped/total_videos*100:.1f}%")
    log.info(f"Time: {elapsed/60:.1f} minutes")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
