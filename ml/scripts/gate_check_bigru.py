import pathlib, json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report

DATA_DIR  = pathlib.Path("data/hand_v3")
MODEL_DIR = pathlib.Path("saved_models/v3")

MIN_TOP1, MIN_TOP3, MIN_TOP5 = 0.55, 0.75, 0.85
MAX_F1_ZERO_FRAC, MIN_MEDIAN_F1 = 0.30, 0.40

model = tf.keras.models.load_model(str(MODEL_DIR / "bigru_attn_v2_best.keras"))
X_test = np.load(DATA_DIR / "X_test_hand.npy")
y_test = np.load(DATA_DIR / "y_test_hand.npy")

with open(MODEL_DIR / "label_map_v2.json") as f:
    label_map = json.load(f)
class_names = [label_map[str(i)] for i in range(len(label_map))]

probs = model.predict(X_test, verbose=0)
y_true = np.argmax(y_test, axis=1)
y_pred = np.argmax(probs, axis=1)

top1 = np.mean(y_true == y_pred)
def topk(probs, true, k):
    tk = np.argsort(probs, axis=1)[:, -k:]
    return sum(t in p for t, p in zip(true, tk)) / len(true)
top3, top5 = topk(probs, y_true, 3), topk(probs, y_true, 5)

report = classification_report(y_true, y_pred, labels=list(range(len(class_names))),
                                target_names=class_names, output_dict=True, zero_division=0)
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

print(f"Top-1: {top1*100:.2f}%  Top-3: {top3*100:.2f}%  Top-5: {top5*100:.2f}%")
print(f"Classes F1=0: {n_zero}/{len(f1s)} ({f1_zero_frac*100:.1f}%)")
print(f"Median F1: {median_f1:.3f}")
for c, passed in criteria.items():
    print(f"  {'PASS' if passed else 'FAIL'}  {c}")
print(f"GATE: {'PASS' if all(criteria.values()) else 'FAIL'}")
