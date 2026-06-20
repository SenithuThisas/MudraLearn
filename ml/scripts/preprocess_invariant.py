"""
Preprocess landmark data into pose-invariant representations.
Saves new .npy files that can be used with any training script.
"""

import os
import numpy as np
from pose_features import preprocess_invariant

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
OUT_DIR = os.path.join(os.path.dirname(__file__), '../data_invariant')
os.makedirs(OUT_DIR, exist_ok=True)

STRATEGY = 'center_nose'  # safe for normalized data; use 'relative_shoulder' for raw coords

files = [
    ('X_train.npy', 'X_train.npy'),
    ('X_val.npy',   'X_val.npy'),
    ('X_test.npy',  'X_test.npy'),
]

for src, dst in files:
    src_path = os.path.join(DATA_DIR, src)
    data = np.load(src_path)
    print(f"Loading {src}: {data.shape}, range=[{data.min():.4f}, {data.max():.4f}]")

    transformed = preprocess_invariant(data, strategy=STRATEGY)
    dst_path = os.path.join(OUT_DIR, dst)
    np.save(dst_path, transformed)

    print(f"  → Saved {dst}: {transformed.shape}, range=[{transformed.min():.4f}, {transformed.max():.4f}]")

# Copy label files (unchanged)
import shutil
for f in ['y_train.npy', 'y_val.npy', 'y_test.npy']:
    shutil.copy2(os.path.join(DATA_DIR, f), os.path.join(OUT_DIR, f))
    print(f"  Copied {f}")

print(f"\nDone. Invariant features saved to {OUT_DIR}/")
print(f"Train with: update DATA_DIR in training scripts to '{OUT_DIR}'")
