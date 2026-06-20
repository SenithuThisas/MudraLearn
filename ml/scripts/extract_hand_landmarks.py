"""
Extract hand landmarks from all original .mov files.
Uses the modern MediaPipe Tasks API (compatible with mediapipe 0.10.35).
Output mirrors the folder structure of Dataset - Original
but saves .csv files instead of .mov files.
"""

import cv2
import csv
import pathlib
import urllib.request
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

SEQUENCE_LEN = 30
NUM_FEATURES = 126  # 21 landmarks x 3 coords x 2 hands
SRC_ROOT = pathlib.Path('data/archive/Dataset - Original')
DST_ROOT = pathlib.Path('data/archive/Dataset - Hand - CSV')

MODEL_PATH = pathlib.Path('scripts/hand_landmarker.task')
MODEL_URL = (
    'https://storage.googleapis.com/mediapipe-models/'
    'hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
)

# ■■ Download model if not present ■■■■■■■■■■■■■■■■■■■■■■■■
def ensure_model():
    if not MODEL_PATH.exists():
        print('Downloading HandLandmarker model...')
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print('Model downloaded.')

# ■■ Wrist-relative normalisation ■■■■■■■■■■■■■■■■■■■■■■■■
def normalise_hand(landmarks_21):
    """
    Subtract wrist position so hand is centred at origin.
    Divide by palm size so scale is invariant.
    landmarks_21: list of 21 landmark objects with .x .y .z
    Returns: flat list of 63 floats
    """
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks_21])
    wrist = pts[0].copy()
    pts = pts - wrist                          # translate to origin
    scale = np.linalg.norm(pts[9]) + 1e-8     # landmark 9 = middle MCP
    pts = pts / scale                          # scale invariant
    return pts.flatten().tolist()              # 63 floats

# ■■ Temporal interpolation to exactly SEQUENCE_LEN frames ■■
def interpolate_to_fixed(frames, target=SEQUENCE_LEN):
    arr = np.array(frames, dtype=np.float32)
    actual = arr.shape[0]
    if actual == 0:
        return np.zeros((target, NUM_FEATURES), dtype=np.float32)
    if actual == target:
        return arr
    old_t = np.linspace(0, actual - 1, num=actual)
    new_t = np.linspace(0, actual - 1, num=target)
    result = np.zeros((target, NUM_FEATURES), dtype=np.float32)
    for f in range(NUM_FEATURES):
        result[:, f] = np.interp(new_t, old_t, arr[:, f])
    return result

# ■■ Frame extraction ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
def extract_from_video(video_path, landmarker):
    cap = cv2.VideoCapture(str(video_path))
    frames = []
    timestamp_ms = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)
        timestamp_ms += 33  # ~30fps

        left  = [0.0] * 63
        right = [0.0] * 63

        if result.hand_landmarks:
            for i, hand_landmarks in enumerate(result.hand_landmarks):
                label = result.handedness[i][0].category_name
                flat  = normalise_hand(hand_landmarks)
                if label == 'Left':
                    left  = flat
                else:
                    right = flat

        frames.append(left + right)  # 126 values

    cap.release()
    return frames

# ■■ Main loop ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
def main():
    ensure_model()

    base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    video_exts = {'.mp4', '.avi', '.mov', '.mkv'}
    all_videos = [p for p in SRC_ROOT.rglob('*')
                  if p.suffix.lower() in video_exts]
    print(f'Found {len(all_videos)} videos...')

    skipped = 0

    with vision.HandLandmarker.create_from_options(options) as landmarker:
        for i, vid in enumerate(all_videos):
            rel = vid.relative_to(SRC_ROOT)
            dst = (DST_ROOT / rel).with_suffix('.csv')

            if dst.exists():
                continue

            dst.parent.mkdir(parents=True, exist_ok=True)

            raw_frames = extract_from_video(vid, landmarker)

            if len(raw_frames) < 5:
                skipped += 1
                continue

            seq = interpolate_to_fixed(raw_frames)

            with open(dst, 'w', newline='') as f:
                csv.writer(f).writerows(seq.tolist())

            if (i + 1) % 100 == 0:
                print(f'  {i+1}/{len(all_videos)} processed')

    print(f'Done. Skipped {skipped} videos (no hands detected).')
    print(f'Output: {DST_ROOT}')

if __name__ == '__main__':
    main()