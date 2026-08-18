#!/usr/bin/env python3
"""
prepare_data_170.py
====================
Isolated copy of 04_hand_data_prep.ipynb's Cells 4-8, with MIN_SAMPLES_PER_CLASS
raised from 3 (canonical, 312 classes) to 8 (this experiment, 171 classes).

Reads the same shared, read-only CSV dataset as the canonical pipeline
(data/archive/Dataset - Hand - CSV). Writes ONLY into data/experiment_170/ and
saved_models/experiment_170/ — never touches data/hand_v3/ or saved_models/v3/.

Usage:
    cd ml
    python scripts/experiment_170/prepare_data_170.py
"""

import pathlib
import json
import pickle
import random
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# ── Constants ────────────────────────────────────────────────────────────────
RANDOM_SEED  = 42
SEQUENCE_LEN = 60
NUM_FEATURES = 126
TRAIN_SIZE   = 0.70
VAL_SIZE     = 0.10
TEST_SIZE    = 0.20

MIN_SAMPLES_PER_CLASS = 8   # canonical v3 uses 3 — this is the experiment variable

CSV_ROOT = pathlib.Path("data/archive/Dataset - Hand - CSV")   # shared, read-only
OUT_DIR  = pathlib.Path("data/experiment_170")
MODEL_DIR = pathlib.Path("saved_models/experiment_170")

OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


def main():
    print(f"CSV source : {CSV_ROOT}")
    print(f"Output dir : {OUT_DIR}")
    print(f"MIN_SAMPLES_PER_CLASS = {MIN_SAMPLES_PER_CLASS}\n")

    # ── Load all sequences ────────────────────────────────────────────────────
    X_list, y_list, skipped = [], [], []
    for csv_path in sorted(CSV_ROOT.rglob("*.csv")):
        try:
            df = pd.read_csv(csv_path, header=None)
            if df.shape != (SEQUENCE_LEN, NUM_FEATURES):
                skipped.append((str(csv_path), f"wrong shape {df.shape}"))
                continue
            X_list.append(df.values.astype(np.float32))
            y_list.append(csv_path.parent.name)
        except Exception as e:
            skipped.append((str(csv_path), str(e)))

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)
    print(f"Total loaded  : {len(X)}")
    print(f"Total skipped : {len(skipped)}")
    print(f"Unique classes (raw): {len(np.unique(y))}")
    print(f"X shape       : {X.shape}\n")

    # ── Exclude thin classes ──────────────────────────────────────────────────
    class_counts = Counter(y)
    excluded_classes = {c for c, n in class_counts.items() if n < MIN_SAMPLES_PER_CLASS}
    print(f"Classes excluded (< {MIN_SAMPLES_PER_CLASS} samples): {len(excluded_classes)}")

    eligible_mask = np.array([label not in excluded_classes for label in y])
    X_elig, y_elig = X[eligible_mask], y[eligible_mask]
    print(f"Classes kept: {len(set(y_elig))}  Samples kept: {len(X_elig)}\n")

    # ── Stratified 70/10/20 split (identical algorithm to 04_hand_data_prep.ipynb) ──
    X_train, X_temp, y_train, y_temp = train_test_split(
        X_elig, y_elig,
        test_size=(VAL_SIZE + TEST_SIZE),
        random_state=RANDOM_SEED,
        stratify=y_elig,
    )

    temp_counts = Counter(y_temp)
    temp_single_mask = np.array([temp_counts[label] == 1 for label in y_temp])
    X_temp_single, y_temp_single = X_temp[temp_single_mask], y_temp[temp_single_mask]
    X_temp_multi, y_temp_multi = X_temp[~temp_single_mask], y_temp[~temp_single_mask]

    if temp_single_mask.sum():
        print(f"Temp single-sample items (forced to train): {temp_single_mask.sum()}")

    val_relative = VAL_SIZE / (VAL_SIZE + TEST_SIZE)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp_multi, y_temp_multi,
        test_size=(1 - val_relative),
        random_state=RANDOM_SEED,
        stratify=y_temp_multi,
    )

    X_train = np.concatenate([X_train, X_temp_single], axis=0)
    y_train = np.concatenate([y_train, y_temp_single], axis=0)

    print(f"\nSplit sizes:")
    print(f"  Train : {len(X_train):5d} ({len(X_train)/len(X_elig)*100:.1f}%)")
    print(f"  Val   : {len(X_val):5d} ({len(X_val)/len(X_elig)*100:.1f}%)")
    print(f"  Test  : {len(X_test):5d} ({len(X_test)/len(X_elig)*100:.1f}%)")

    train_classes, val_classes, test_classes = set(y_train), set(y_val), set(y_test)
    train_only = train_classes - val_classes - test_classes
    print(f"Classes train-only (post-threshold rounding orphans): {len(train_only)}")
    assert train_classes >= val_classes, "Val has classes not in train!"
    assert train_classes >= test_classes, "Test has classes not in train!"

    with open(MODEL_DIR / "excluded_classes_170.json", "w") as f:
        json.dump(sorted(excluded_classes), f, indent=2)

    # ── Label encoding (fit on train only) ────────────────────────────────────
    le = LabelEncoder()
    le.fit(y_train)
    NUM_CLASSES = len(le.classes_)
    print(f"\nNumber of classes: {NUM_CLASSES}")

    oov_val  = set(y_val)  - set(le.classes_)
    oov_test = set(y_test) - set(le.classes_)
    if oov_val:
        print(f"WARNING: OOV labels in val: {oov_val}")
    if oov_test:
        print(f"WARNING: OOV labels in test: {oov_test}")

    def to_onehot(y_int, num_classes):
        out = np.zeros((len(y_int), num_classes), dtype=np.float32)
        out[np.arange(len(y_int)), y_int] = 1.0
        return out

    y_train_oh = to_onehot(le.transform(y_train), NUM_CLASSES)
    y_val_oh   = to_onehot(le.transform(y_val),   NUM_CLASSES)
    y_test_oh  = to_onehot(le.transform(y_test),  NUM_CLASSES)

    with open(MODEL_DIR / "label_encoder_170.pkl", "wb") as f:
        pickle.dump(le, f)
    label_map = {int(i): name for i, name in enumerate(le.classes_)}
    with open(MODEL_DIR / "label_map_170.json", "w") as f:
        json.dump(label_map, f, indent=2)

    # ── Save arrays ────────────────────────────────────────────────────────────
    files_to_save = {
        "X_train_hand.npy": X_train, "X_val_hand.npy": X_val, "X_test_hand.npy": X_test,
        "y_train_hand.npy": y_train_oh, "y_val_hand.npy": y_val_oh, "y_test_hand.npy": y_test_oh,
    }
    print(f"\nSaving arrays to: {OUT_DIR}")
    for filename, arr in files_to_save.items():
        path = OUT_DIR / filename
        np.save(path, arr)
        print(f"  {filename:<20} {str(arr.shape):<20} {path.stat().st_size/1e6:.1f} MB")

    print("\n" + "=" * 50)
    print("PREPARE_DATA_170 SUMMARY")
    print("=" * 50)
    print(f"Raw classes          : {len(np.unique(y))}")
    print(f"Classes kept (T={MIN_SAMPLES_PER_CLASS})     : {NUM_CLASSES}")
    print(f"Train / Val / Test   : {len(X_train)} / {len(X_val)} / {len(X_test)}")
    print(f"Classes train-only   : {len(train_only)}")
    print("=" * 50)


if __name__ == "__main__":
    main()
