"""
Debug why Thank you appears to have only 1 sample
"""
import os
import numpy as np
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')

# Load data
X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
print(f"Training data shape: X={X_train.shape}, y={y_train.shape}")

# Load label map
label_map_path = os.path.join(SAVED_MODEL_DIR, 'label_map.json')
with open(label_map_path, 'r') as f:
    label_map = json.load(f)
label_map = {int(k): v for k, v in label_map.items()}
print(f"Loaded label map with {len(label_map)} classes")

# Find index for "Thank you"
thankyou_idx = None
hellow_idx = None
for idx, name in label_map.items():
    if name == "Thank you":
        thankyou_idx = idx
    if name == "Hello":
        hellow_idx = idx

print(f"'Thank you' index: {thankyou_idx}")
print(f"'Hello' index: {hellow_idx}")

# Count occurrences in training set
y_train_idx = np.argmax(y_train, axis=1)

thankyou_count = np.sum(y_train_idx == thankyou_idx)
hello_count = np.sum(y_train_idx == hellow_idx)

print(f"'Thank you' samples in train: {thankyou_count}")
print(f"'Hello' samples in train: {hello_count}")

# Let's also check the raw counts from the CSV files to verify
import pathlib
data_root = pathlib.Path("../data/archive/Dataset - MP - CSV")
categories = sorted([d.name for d in data_root.iterdir() if d.is_dir()])

print("\n=== Raw CSV counts ===")
for cat in categories:
    cat_path = data_root / cat
    for sign_folder in cat_path.iterdir():
        if not sign_folder.is_dir():
            continue
        csv_count = len(list(sign_folder.glob("*.csv")))
        if csv_count > 0:
            sign_name = sign_folder.name
            if sign_name in ["Thank you", "Hello"]:
                print(f"{sign_name}: {csv_count} CSV files")

# Also check what happened in the preprocessing - maybe some classes got dropped?
print("\n=== Checking unique labels in y_train ===")
unique_train = np.unique(y_train_idx)
print(f"Unique classes in train: {len(unique_train)}")
print(f"Is {thankyou_idx} in unique_train? {thankyou_idx in unique_train}")
print(f"Is {hellow_idx} in unique_train? {hellow_idx in unique_train}")

# If they are in unique_train, let's see their counts via bincount
counts = np.bincount(y_train_idx, minlength=len(label_map))
print(f"\nCount for Thank you ({thankyou_idx}): {counts[thankyou_idx]}")
print(f"Count for Hello ({hellow_idx}): {counts[hellow_idx]}")

# Let's also look at the first few rows of y_train to see what's there
print(f"\nFirst 20 training labels (as indices): {y_train_idx[:20]}")
print(f"First 20 training labels (as names): {[label_map.get(idx, 'UNKNOWN') for idx in y_train_idx[:20]]}")