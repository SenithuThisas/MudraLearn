#!/usr/bin/env python3
"""
evaluate_170.py
====================
Isolated evaluation + report generator, mirroring 08_evaluation.ipynb's metrics
and gate_check_bigru.py's exact promotion-gate thresholds. Runs on the
experiment_170 test set only. Writes results to files, not the terminal.

Usage:
    cd ml
    python scripts/experiment_170/evaluate_170.py
"""

import pathlib
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report

DATA_DIR  = pathlib.Path("data/experiment_170")
MODEL_DIR = pathlib.Path("saved_models/experiment_170")

# Same gate thresholds as ml/scripts/gate_check_bigru.py — unmodified.
MIN_TOP1, MIN_TOP3, MIN_TOP5 = 0.55, 0.75, 0.85
MAX_F1_ZERO_FRAC, MIN_MEDIAN_F1 = 0.30, 0.40

# Canonical v3 numbers, for the side-by-side comparison in the report.
CANONICAL = {
    "num_classes": 312,
    "top1": 0.6157, "top3": 0.7866, "top5": 0.8406,
    "f1_zero_frac": 0.4808, "median_f1": 0.3095,
    "train_acc_at_best": 0.973, "best_val_acc": 0.6314, "best_epoch": 58,
}


def main():
    model = tf.keras.models.load_model(str(MODEL_DIR / "bigru_attn_170_best.keras"))
    X_test = np.load(DATA_DIR / "X_test_hand.npy")
    y_test = np.load(DATA_DIR / "y_test_hand.npy")

    with open(MODEL_DIR / "label_map_170.json") as f:
        label_map = json.load(f)
    class_names = [label_map[str(i)] for i in range(len(label_map))]

    probs = model.predict(X_test, verbose=0)
    y_true = np.argmax(y_test, axis=1)
    y_pred = np.argmax(probs, axis=1)

    top1 = float(np.mean(y_true == y_pred))

    def topk(probs, true, k):
        tk = np.argsort(probs, axis=1)[:, -k:]
        return sum(t in p for t, p in zip(true, tk)) / len(true)

    top3, top5 = topk(probs, y_true, 3), topk(probs, y_true, 5)

    report = classification_report(
        y_true, y_pred, labels=list(range(len(class_names))),
        target_names=class_names, output_dict=True, zero_division=0,
    )
    f1s = np.array([report[c]["f1-score"] for c in class_names])
    n_zero = int((f1s == 0).sum())
    f1_zero_frac = n_zero / len(f1s)
    median_f1 = float(np.median(f1s))

    criteria = {
        "Top-1 >= 55%": top1 >= MIN_TOP1,
        "Top-3 >= 75%": top3 >= MIN_TOP3,
        "Top-5 >= 85%": top5 >= MIN_TOP5,
        "F1=0 classes < 30%": f1_zero_frac < MAX_F1_ZERO_FRAC,
        f"Median F1 >= {MIN_MEDIAN_F1}": median_f1 >= MIN_MEDIAN_F1,
    }
    gate_pass = all(criteria.values())

    # ── per_class_report_170.csv ──────────────────────────────────────────────
    rows = []
    for c in class_names:
        r = report[c]
        rows.append({
            "class": c, "precision": r["precision"], "recall": r["recall"],
            "f1_score": r["f1-score"], "support": r["support"],
        })
    pd.DataFrame(rows).to_csv(MODEL_DIR / "per_class_report_170.csv", index=False)

    # ── gate_check_170.txt ────────────────────────────────────────────────────
    gate_lines = [
        f"Top-1: {top1*100:.2f}%  Top-3: {top3*100:.2f}%  Top-5: {top5*100:.2f}%",
        f"Classes F1=0: {n_zero}/{len(f1s)} ({f1_zero_frac*100:.1f}%)",
        f"Median F1: {median_f1:.3f}",
    ]
    for c, passed in criteria.items():
        gate_lines.append(f"  {'PASS' if passed else 'FAIL'}  {c}")
    gate_lines.append(f"GATE: {'PASS' if gate_pass else 'FAIL'}")
    gate_text = "\n".join(gate_lines)
    (MODEL_DIR / "gate_check_170.txt").write_text(gate_text + "\n")

    # ── EXPERIMENT_REPORT.md ──────────────────────────────────────────────────
    with open(MODEL_DIR / "model_card_170.json") as f:
        card = json.load(f)
    with open(MODEL_DIR / "history_170.json") as f:
        hist = json.load(f)
    with open(MODEL_DIR / "excluded_classes_170.json") as f:
        excluded = json.load(f)

    train_acc = hist["accuracy"]
    val_acc = hist["val_accuracy"]
    best_ep = card["best_epoch"]
    n_epochs_run = len(train_acc)

    def fmt_epoch_row(i):
        return f"| {i+1} | {train_acc[i]*100:.2f}% | {val_acc[i]*100:.2f}% | {hist['loss'][i]:.3f} | {hist['val_loss'][i]:.3f} |"

    sample_epochs = sorted(set([0, 9, 19, 29, best_ep - 1, n_epochs_run - 1]))
    sample_epochs = [e for e in sample_epochs if 0 <= e < n_epochs_run]

    report_md = f"""# Threshold Experiment 170 — Report

**Branch:** `experiment/threshold-170class` (isolated — never merged)
**Hypothesis:** raising `MIN_SAMPLES_PER_CLASS` from 3 (canonical, 312 classes) to 8
(this experiment, 171 classes) fixes the promotion-gate failures caused by
severe class imbalance, without changing architecture/hyperparameters.

## Dataset

| | Canonical v3 (T=3) | Experiment 170 (T=8) |
|---|---|---|
| Classes kept | 312 | {card['num_classes']} |
| Classes dropped | 71 | {len(excluded)} (vs. 383 raw; 141 more than canonical) |
| Train / Val / Test | 2958 / 388 / 778 | see model_card_170.json |

## Model

Identical architecture and hyperparameters to canonical v3 (`06_bigru_attention_train.ipynb`):
BiGRU(128)→BN→Dropout(0.3)→BiGRU(64)→BN→MultiHeadAttention(4 heads)+residual→
LayerNorm→GAP→Dense(256)→Dropout(0.4)→Dense(128)→Dropout(0.3)→softmax.
Adam(lr={card['learning_rate']}), batch={card['batch_size']}, EarlyStopping(patience=20, monitor=val_accuracy).

## Training curve (train vs val accuracy — overfitting check)

| Epoch | Train Acc | Val Acc | Train Loss | Val Loss |
|---|---|---|---|---|
""" + "\n".join(fmt_epoch_row(e) for e in sample_epochs) + f"""

Best epoch: **{best_ep}** (val_accuracy {card['best_val_acc']}%, restored by EarlyStopping)
Total epochs run: {n_epochs_run} (stopped by EarlyStopping patience=20)
Training time: {card['training_time_min']} min

**Overfitting gap at best epoch:** train {train_acc[best_ep-1]*100:.2f}% vs. val {val_acc[best_ep-1]*100:.2f}%
(canonical v3 comparison: train ~97.3% vs. val 63.14% — a ~34pt gap)

## Test-set results

| Metric | Canonical v3 (312 classes) | Experiment 170 (171 classes) |
|---|---|---|
| Top-1 | {CANONICAL['top1']*100:.2f}% | {top1*100:.2f}% |
| Top-3 | {CANONICAL['top3']*100:.2f}% | {top3*100:.2f}% |
| Top-5 | {CANONICAL['top5']*100:.2f}% | {top5*100:.2f}% |
| F1=0 classes | {CANONICAL['f1_zero_frac']*100:.1f}% | {f1_zero_frac*100:.1f}% |
| Median F1 | {CANONICAL['median_f1']:.3f} | {median_f1:.3f} |

## Promotion gate ({"PASS" if gate_pass else "FAIL"})

```
{gate_text}
```

Canonical v3 gate result: **FAIL** (3/5 criteria — Top-5, F1=0 frac, median F1 all failed).

## Files produced (all under `ml/saved_models/experiment_170/` and `ml/data/experiment_170/`)

- `bigru_attn_170_best.keras` — trained model checkpoint
- `model_card_170.json` — hyperparameters + final metrics
- `history_170.json` — full per-epoch train/val accuracy & loss
- `label_map_170.json`, `label_encoder_170.pkl`, `excluded_classes_170.json`
- `per_class_report_170.csv` — per-class precision/recall/F1/support
- `gate_check_170.txt` — raw gate-check output

## Scope note

This experiment supports **{card['num_classes']} of the original 383 signs** ({len(excluded)} more
excluded than the canonical 312-class model). Nothing here has been merged, pushed
beyond this experiment branch, or used to update `backend/.env`, `GROUND_TRUTH.md`,
or any canonical `ml/saved_models/v3/` or `ml/saved_models/` artifact.
"""

    (MODEL_DIR / "EXPERIMENT_REPORT.md").write_text(report_md)

    print(f"Wrote: {MODEL_DIR / 'per_class_report_170.csv'}")
    print(f"Wrote: {MODEL_DIR / 'gate_check_170.txt'}")
    print(f"Wrote: {MODEL_DIR / 'EXPERIMENT_REPORT.md'}")
    print(f"\nGATE: {'PASS' if gate_pass else 'FAIL'}")


if __name__ == "__main__":
    main()
