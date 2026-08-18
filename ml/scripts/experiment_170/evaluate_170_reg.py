#!/usr/bin/env python3
"""
evaluate_170_reg.py
====================
Evaluates bigru_attn_170_reg_best.keras (the regularized retrain) on the same
experiment_170 test set, using the same gate thresholds as evaluate_170.py.
Writes per_class_report_170_reg.csv, gate_check_170_reg.txt, and appends a
three-way comparison (canonical v3 / 171-baseline / 171-regularized) to
EXPERIMENT_REPORT.md.

Usage:
    cd ml
    python scripts/experiment_170/evaluate_170_reg.py
"""

import pathlib
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report

DATA_DIR  = pathlib.Path("data/experiment_170")
MODEL_DIR = pathlib.Path("saved_models/experiment_170")

MIN_TOP1, MIN_TOP3, MIN_TOP5 = 0.55, 0.75, 0.85
MAX_F1_ZERO_FRAC, MIN_MEDIAN_F1 = 0.30, 0.40

CANONICAL = {
    "top1": 0.6157, "top3": 0.7866, "top5": 0.8406,
    "f1_zero_frac": 0.4808, "median_f1": 0.3095,
}


def main():
    model = tf.keras.models.load_model(str(MODEL_DIR / "bigru_attn_170_reg_best.keras"))
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

    rows = []
    for c in class_names:
        r = report[c]
        rows.append({
            "class": c, "precision": r["precision"], "recall": r["recall"],
            "f1_score": r["f1-score"], "support": r["support"],
        })
    pd.DataFrame(rows).to_csv(MODEL_DIR / "per_class_report_170_reg.csv", index=False)

    gate_lines = [
        f"Top-1: {top1*100:.2f}%  Top-3: {top3*100:.2f}%  Top-5: {top5*100:.2f}%",
        f"Classes F1=0: {n_zero}/{len(f1s)} ({f1_zero_frac*100:.1f}%)",
        f"Median F1: {median_f1:.3f}",
    ]
    for c, passed in criteria.items():
        gate_lines.append(f"  {'PASS' if passed else 'FAIL'}  {c}")
    gate_lines.append(f"GATE: {'PASS' if gate_pass else 'FAIL'}")
    gate_text = "\n".join(gate_lines)
    (MODEL_DIR / "gate_check_170_reg.txt").write_text(gate_text + "\n")

    # ── Append three-way comparison to EXPERIMENT_REPORT.md ──────────────────
    with open(MODEL_DIR / "model_card_170.json") as f:
        base_card = json.load(f)
    with open(MODEL_DIR / "model_card_170_reg.json") as f:
        reg_card = json.load(f)
    with open(MODEL_DIR / "history_170.json") as f:
        base_hist = json.load(f)
    with open(MODEL_DIR / "history_170_reg.json") as f:
        reg_hist = json.load(f)

    base_best_ep = base_card["best_epoch"]
    reg_best_ep = reg_card["best_epoch"]
    base_gap = base_hist["accuracy"][base_best_ep - 1] - base_hist["val_accuracy"][base_best_ep - 1]
    reg_gap = reg_hist["accuracy"][reg_best_ep - 1] - reg_hist["val_accuracy"][reg_best_ep - 1]

    verdict_acc = "improved" if top1 > base_card["test_top1"] / 100 else "did not improve"
    addendum = f"""

---

## Addendum — Regularization retrain (label_smoothing=0.1, +dropout, AdamW wd=1e-4)

Same 171-class data (`data/experiment_170/`, unchanged), same architecture shape and
training schedule as the baseline above. Three changes: `label_smoothing=0.1`, dropout
raised (0.3→0.4, 0.4→0.5, 0.3→0.4) plus a new 0.2 dropout after bigru_2, and
`AdamW(weight_decay=1e-4)` instead of plain `Adam`. Written to separate files —
the baseline `bigru_attn_170_best.keras` above is untouched.

| Metric | Canonical v3 (312cls) | 171-baseline | 171-regularized |
|---|---|---|---|
| Top-1 | {CANONICAL['top1']*100:.2f}% | {base_card['test_top1']:.2f}% | {top1*100:.2f}% |
| Top-3 | {CANONICAL['top3']*100:.2f}% | {base_card['test_top3']:.2f}% | {top3*100:.2f}% |
| Top-5 | {CANONICAL['top5']*100:.2f}% | {base_card['test_top5']:.2f}% | {top5*100:.2f}% |
| F1=0 classes | {CANONICAL['f1_zero_frac']*100:.1f}% | 9.9% | {f1_zero_frac*100:.1f}% |
| Median F1 | {CANONICAL['median_f1']:.3f} | 0.667 | {median_f1:.3f} |
| Train/val gap @ best epoch | ~34.2pt | {base_gap*100:.1f}pt | {reg_gap*100:.1f}pt |
| Best epoch | 58 | {base_best_ep} | {reg_best_ep} |
| Training time | 47.8 min | {base_card['training_time_min']} min | {reg_card['training_time_min']} min |
| Gate | FAIL | PASS | {"PASS" if gate_pass else "FAIL"} |

```
{gate_text}
```

**Verdict:** Regularization {verdict_acc} Top-1 accuracy versus the 171-class baseline
({base_card['test_top1']:.2f}% → {top1*100:.2f}%); train/val gap went from
{base_gap*100:.1f}pt to {reg_gap*100:.1f}pt.
"""

    report_path = MODEL_DIR / "EXPERIMENT_REPORT.md"
    with open(report_path, "a") as f:
        f.write(addendum)

    print(f"Wrote: {MODEL_DIR / 'per_class_report_170_reg.csv'}")
    print(f"Wrote: {MODEL_DIR / 'gate_check_170_reg.txt'}")
    print(f"Appended addendum to: {report_path}")
    print(f"\nGATE: {'PASS' if gate_pass else 'FAIL'}")
    print(f"Top-1: base={base_card['test_top1']:.2f}%  reg={top1*100:.2f}%")
    print(f"Train/val gap: base={base_gap*100:.1f}pt  reg={reg_gap*100:.1f}pt")


if __name__ == "__main__":
    main()
