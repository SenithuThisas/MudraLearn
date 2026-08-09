#!/usr/bin/env python3
"""
threshold_tradeoff.py
======================
Post-hoc sweep of MIN_SAMPLES_PER_CLASS against the ALREADY-TRAINED
bigru_attn_v2_best.keras model and the existing test set. No retraining.

Caveat: the model was trained once, on the current 312-class label space
(MIN_SAMPLES_PER_CLASS=3). Raising the threshold here only changes which
classes are INCLUDED when recomputing metrics below -- it does not simulate
what the model's weights would look like if it had never seen the excluded
classes during training. This answers "how much would the currently-failing
gate criteria improve if we only counted classes with at least T raw
samples", not "what would happen if we actually retrained with a higher
threshold". Use it to decide whether an actual retrain at a higher threshold
is worth attempting.

Usage:
    cd ml
    python scripts/threshold_tradeoff.py
"""

import pathlib
import json
from collections import Counter

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report

DATA_DIR  = pathlib.Path("data/hand_v3")
MODEL_DIR = pathlib.Path("saved_models/v3")
CSV_ROOT  = pathlib.Path("data/archive/Dataset - Hand - CSV")

MIN_TOP1, MIN_TOP3, MIN_TOP5   = 0.55, 0.75, 0.85
MAX_F1_ZERO_FRAC, MIN_MEDIAN_F1 = 0.30, 0.40

THRESHOLDS = [3, 4, 5, 6, 8, 10, 15]


def topk_hit(probs_row, true_idx, k):
    return true_idx in np.argsort(probs_row)[-k:]


def main():
    # Original per-class sample counts, straight from the CSV tree
    # (identical logic to 04_hand_data_prep.ipynb Cells 4-5, re-derived read-only).
    raw_counts = Counter(p.parent.name for p in CSV_ROOT.rglob("*.csv"))
    print(f"Raw classes on disk : {len(raw_counts)}")
    print(f"Raw CSVs on disk    : {sum(raw_counts.values())}")

    model = tf.keras.models.load_model(str(MODEL_DIR / "bigru_attn_v2_best.keras"))
    X_test = np.load(DATA_DIR / "X_test_hand.npy")
    y_test = np.load(DATA_DIR / "y_test_hand.npy")
    with open(MODEL_DIR / "label_map_v2.json") as f:
        label_map = json.load(f)
    class_names = [label_map[str(i)] for i in range(len(label_map))]
    n_classes_current = len(class_names)

    probs = model.predict(X_test, verbose=0)
    y_true = np.argmax(y_test, axis=1)

    # Per-class test-set support in the CURRENT 312-class split (for the
    # mechanical-zero count at each threshold).
    test_support = np.bincount(y_true, minlength=n_classes_current)

    print(f"Currently-trainable classes (T=3): {n_classes_current}")
    print(f"Classes with ZERO test support today: {(test_support == 0).sum()}\n")

    header = (f"{'T':>4} {'kept':>6} {'lost':>6} {'test N':>8} "
              f"{'mech-0':>7} {'Top-1':>8} {'Top-3':>8} {'Top-5':>8} "
              f"{'F1=0%':>8} {'median F1':>10} {'gate 3/3?':>10}")
    print(header)
    print("-" * len(header))

    rows = []
    for T in THRESHOLDS:
        kept_idx = [i for i, name in enumerate(class_names) if raw_counts.get(name, 0) >= T]
        kept_set = set(kept_idx)
        mech_zero = sum(1 for i in kept_idx if test_support[i] == 0)

        sample_mask = np.array([t in kept_set for t in y_true])
        n_samples = int(sample_mask.sum())
        if n_samples == 0:
            continue

        y_true_f = y_true[sample_mask]
        probs_f  = probs[sample_mask]
        y_pred_f = np.argmax(probs_f, axis=1)

        top1 = float(np.mean(y_true_f == y_pred_f))
        top3 = float(np.mean([topk_hit(p, t, 3) for p, t in zip(probs_f, y_true_f)]))
        top5 = float(np.mean([topk_hit(p, t, 5) for p, t in zip(probs_f, y_true_f)]))

        report = classification_report(
            y_true_f, y_pred_f, labels=kept_idx,
            target_names=[class_names[i] for i in kept_idx],
            output_dict=True, zero_division=0,
        )
        f1s = np.array([report[class_names[i]]["f1-score"] for i in kept_idx])
        f1_zero_frac = float((f1s == 0).sum() / len(f1s))
        median_f1 = float(np.median(f1s))

        criteria_met = sum([
            top1 >= MIN_TOP1,
            f1_zero_frac < MAX_F1_ZERO_FRAC,
            median_f1 >= MIN_MEDIAN_F1,
        ])
        n_lost = n_classes_current - len(kept_idx)

        print(f"{T:>4} {len(kept_idx):>6} {n_lost:>6} {n_samples:>8} "
              f"{mech_zero:>7} {top1*100:>7.2f}% {top3*100:>7.2f}% {top5*100:>7.2f}% "
              f"{f1_zero_frac*100:>7.1f}% {median_f1:>10.3f} {criteria_met:>8}/3")

        rows.append({
            "min_samples_per_class": T,
            "classes_kept": len(kept_idx),
            "classes_lost_vs_current_312": n_lost,
            "n_test_samples": n_samples,
            "mechanical_zero_classes_kept": mech_zero,
            "top1": top1, "top3": top3, "top5": top5,
            "f1_zero_frac": f1_zero_frac,
            "median_f1": median_f1,
            "criteria_met_of_3": criteria_met,
        })

    print("\nCAVEAT: predictions come from the model as already trained on all 312 classes")
    print("(not retrained per threshold) -- see module docstring. This table shows what the")
    print("gate criteria would look like if evaluation were restricted to classes with >= T")
    print("raw samples; it is NOT a substitute for an actual retrain at a higher threshold.")
    print("'mech-0' = classes that would still have zero test coverage even after raising T")
    print("(a genuine retrain at that T might redistribute those samples differently).")

    out_path = MODEL_DIR / "threshold_tradeoff.csv"
    pd.DataFrame(rows).to_csv(out_path, index=False)
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()
