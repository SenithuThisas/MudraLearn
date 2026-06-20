"""
Check class distribution in datasets
"""
import os
import numpy as np
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')

# Load data
X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))
X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))

def analyze_distribution(y, name):
    y_idx = np.argmax(y, axis=1)
    unique, counts = np.unique(y_idx, return_counts=True)
    print(f"{name}: {len(unique)} classes present")
    print(f"  Min samples: {counts.min()}")
    print(f"  Max samples: {counts.max()}")
    print(f"  Mean samples: {counts.mean():.2f}")
    print(f"  Median samples: {np.median(counts):.2f}")
    # Count classes with < N samples
    for thresh in [1, 5, 10, 20]:
        n_rare = np.sum(counts < thresh)
        print(f"  Classes with < {thresh} samples: {n_rare} ({n_rare/len(unique)*100:.1f}%)")
    return counts

print("=== TRAINING SET ===")
train_counts = analyze_distribution(y_train, "Train")
print("\n=== VALIDATION SET ===")
val_counts = analyze_distribution(y_val, "Val")
print("\n=== TEST SET ===")
test_counts = analyze_distribution(y_test, "Test")

# Load label map for class names
label_map_path = os.path.join(SAVED_MODEL_DIR, 'label_map.json')
if os.path.exists(label_map_path):
    with open(label_map_path, 'r') as f:
        label_map = json.load(f)
    label_map = {int(k): v for k, v in label_map.items()}
else:
    label_map = {}

# Show rarest classes in train
print("\n=== RAREST 20 CLASSES IN TRAINING ===")
rarest_idx = np.argsort(train_counts)[:20]
for idx in rarest_idx:
    count = train_counts[idx]
    name = label_map.get(idx, f"Class_{idx}")
    print(f"  {name:20s}: {count} samples")

print("\n=== MOST COMMON 20 CLASSES IN TRAINING ===")
common_idx = np.argsort(train_counts)[-20:][::-1]
for idx in common_idx:
    count = train_counts[idx]
    name = label_map.get(idx, f"Class_{idx}")
    print(f"  {name:20s}: {count} samples")

# Check what classes have >=10 samples
min_sample_threshold = 10
adequate_classes = np.where(train_counts >= min_sample_threshold)[0]
print(f"\n=== CLASSES WITH >= {min_sample_threshold} SAMPLES (TRAIN) ===")
print(f"Count: {len(adequate_classes)} / {len(train_counts)}")
if len(adequate_classes) > 0:
    adequate_counts = train_counts[adequate_classes]
    print(f"  Min in adequate set: {adequate_counts.min()}")
    print(f"  Max in adequate set: {adequate_counts.max()}")
    print(f"  Mean in adequate set: {adequate_counts.mean():.2f}")