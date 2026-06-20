"""
Hierarchical classification training.
Level 1: Predict category (numbers, colors, actions, etc.)
Level 2: For each category, predict specific sign.

Usage:
    python train_hierarchical.py
"""

import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model, Input
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from train_balanced import focal_loss, add_spatial_jitter, augment_batch
from hierarchical_labels import build_label_to_category, CATEGORY_NAMES

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')
HIER_DIR = os.path.join(SAVED_DIR, 'hierarchical')
os.makedirs(HIER_DIR, exist_ok=True)

EPOCHS = 100
BATCH_SIZE = 64
PATIENCE = 15


def load_data():
    X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
    X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
    X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
    y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
    y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))
    y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))

    # Load compact mapping to filter to balanced subset
    cm_path = os.path.join(SAVED_DIR, 'class_mapping.json')
    if os.path.exists(cm_path):
        with open(cm_path) as f:
            cm_raw = json.load(f)
        compact_mapping = {int(k): int(v) for k, v in cm_raw.items()}
        # Build reverse: original_idx -> compact_idx
        orig_to_compact = {int(k): int(v) for k, v in cm_raw.items()}
        allowed_orig = set(orig_to_compact.keys())

        def filter_and_remap(X, y):
            """Filter to allowed classes and remap y to compact (0..n-1)."""
            n_compact = len(allowed_orig)
            mask = np.array([np.argmax(y[i]) in allowed_orig for i in range(len(y))])
            X_f = X[mask]
            y_f = np.zeros((mask.sum(), n_compact), dtype=np.float32)
            for i, idx in enumerate(np.where(mask)[0]):
                orig = np.argmax(y[idx])
                comp = orig_to_compact[orig]
                y_f[i, comp] = 1.0
            return X_f, y_f, mask.sum()

        X_train, y_train, _ = filter_and_remap(X_train, y_train)
        X_val, y_val, n_val = filter_and_remap(X_val, y_val)
        X_test, y_test, n_test = filter_and_remap(X_test, y_test)
        print(f"  Filtered to {len(allowed_orig)} classes: train {X_train.shape}, val {X_val.shape}, test {X_test.shape}")

    return X_train, X_val, X_test, y_train, y_val, y_test


def build_level1_model(input_shape, n_categories):
    inputs = Input(shape=input_shape, name='level1_input')
    x = layers.GRU(256, return_sequences=True, name='l1_gru1')(inputs)
    x = layers.Dropout(0.3)(x)
    x = layers.GRU(128, return_sequences=False, name='l1_gru2')(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu', name='l1_dense')(x)
    outputs = layers.Dense(n_categories, activation='softmax', name='l1_output')(x)
    return Model(inputs, outputs, name='level1_model')


def build_level2_model(input_shape, n_classes, category_name):
    inputs = Input(shape=input_shape, name=f'l2_{category_name}_input')
    x = layers.GRU(256, return_sequences=True, name=f'l2_{category_name}_gru1')(inputs)
    x = layers.Dropout(0.3)(x)
    x = layers.GRU(128, return_sequences=False, name=f'l2_{category_name}_gru2')(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu', name=f'l2_{category_name}_dense')(x)
    outputs = layers.Dense(n_classes, activation='softmax', name=f'l2_{category_name}_output')(x)
    return Model(inputs, outputs, name=f'level2_{category_name}')


def convert_to_category_labels(y, compact_mapping, category_map, category_names):
    """Convert one-hot class labels (compact) to one-hot category labels."""
    # Build reverse map: compact_idx -> original_idx
    rev_map = {v: k for k, v in compact_mapping.items()}
    n_categories = len(category_names)
    cat_name_to_idx = {name: i for i, name in enumerate(category_names)}
    y_cat = np.zeros((y.shape[0], n_categories), dtype=np.float32)
    for i in range(y.shape[0]):
        compact_idx = np.argmax(y[i])
        orig_idx = rev_map.get(compact_idx, compact_idx)
        cat_name = category_map.get(orig_idx, 'misc')
        cat_idx = cat_name_to_idx[cat_name]
        y_cat[i, cat_idx] = 1.0
    return y_cat


def filter_by_category(X, y, class_indices, compact_mapping):
    """
    Filter X and y to only include samples whose class is in class_indices.
    Remaps y to be compact (0..n_classes_in_category).
    """
    keep_mask = np.zeros(y.shape[0], dtype=bool)
    new_y = np.zeros((y.shape[0], len(class_indices)), dtype=np.float32)

    for orig_class_idx in class_indices:
        # Find which compact index this maps to
        if orig_class_idx not in compact_mapping:
            continue
        compact_idx_old = compact_mapping[orig_class_idx]
        samples = np.where(np.argmax(y, axis=1) == compact_idx_old)[0]
        keep_mask[samples] = True
        new_compact_idx = class_indices.index(orig_class_idx)
        new_y[samples, new_compact_idx] = 1.0

    X_filt = X[keep_mask]
    y_filt = new_y[keep_mask]
    return X_filt, y_filt


def plot_training(history, save_path, title='Training History'):
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history.get('accuracy', history.history.get('cat_accuracy', [])), label='Train')
    val_key = 'val_accuracy' if 'val_accuracy' in history.history else 'val_cat_accuracy'
    plt.plot(history.history.get(val_key, []), label='Val')
    plt.title(f'{title} — Accuracy')
    plt.legend()
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train')
    plt.plot(history.history['val_loss'], label='Val')
    plt.title('Loss')
    plt.legend()
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"  Plot saved: {save_path}")


def main():
    print("=" * 50)
    print("HIERARCHICAL CLASSIFICATION")
    print("=" * 50)

    # 1. Load data
    X_train, X_val, X_test, y_train, y_val, y_test = load_data()
    print(f"Data: train {X_train.shape}, val {X_val.shape}, test {X_test.shape}")

    # 2. Load label map
    label_map_path = os.path.join(SAVED_DIR, 'label_map.json')
    with open(label_map_path) as f:
        label_map_raw = json.load(f)
    label_map = {int(k): v for k, v in label_map_raw.items()}
    print(f"Loaded {len(label_map)} classes from label_map")

    # 3. Build category mapping
    category_map, category_to_indices = build_label_to_category(label_map)
    n_categories = len(CATEGORY_NAMES)
    print(f"Categories: {n_categories}")
    for cat in CATEGORY_NAMES:
        n = len(category_to_indices.get(cat, []))
        print(f"  {cat}: {n} classes")

    # Build compact mapping: original_class_index -> compact index in y (0..97 or 0..382)
    # y is one-hot over all classes. Need to figure out the compact mapping.
    # For the balanced subset (98 classes), compact_mapping maps original index -> column position
    # This is defined by class_mapping.json
    class_mapping_path = os.path.join(SAVED_DIR, 'class_mapping.json')
    if os.path.exists(class_mapping_path):
        with open(class_mapping_path) as f:
            cm_raw = json.load(f)
        compact_mapping = {int(k): int(v) for k, v in cm_raw.items()}
        print(f"Loaded class mapping: {len(compact_mapping)} classes")
    else:
        # Assume all 383 classes in sequential order
        compact_mapping = {i: i for i in range(len(label_map))}
        print("No class_mapping found; assuming full 383-class one-hot")

    # 4. Convert y to category labels for level 1
    category_names_list = CATEGORY_NAMES
    y_train_cat = convert_to_category_labels(y_train, compact_mapping, category_map, category_names_list)
    y_val_cat = convert_to_category_labels(y_val, compact_mapping, category_map, category_names_list)
    y_test_cat = convert_to_category_labels(y_test, compact_mapping, category_map, category_names_list)
    print(f"\nCategory labels: train {y_train_cat.shape}, val {y_val_cat.shape}")

    # 5. Train Level 1 (category classifier)
    print("\n" + "=" * 50)
    print("TRAINING LEVEL 1 — Category Classifier")
    print("=" * 50)

    input_shape = X_train.shape[1:]
    l1_model = build_level1_model(input_shape, n_categories)
    l1_model.compile(
        optimizer=tf.keras.optimizers.AdamW(learning_rate=1e-3, weight_decay=1e-4),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    l1_model.summary()

    l1_callbacks = [
        EarlyStopping(monitor='val_accuracy', patience=PATIENCE, restore_best_weights=True, mode='max'),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=8, min_lr=1e-6),
        ModelCheckpoint(os.path.join(HIER_DIR, 'level1_best.keras'),
                        monitor='val_accuracy', save_best_only=True, mode='max'),
    ]

    l1_history = l1_model.fit(
        X_train, y_train_cat,
        validation_data=(X_val, y_val_cat),
        epochs=EPOCHS, batch_size=BATCH_SIZE,
        callbacks=l1_callbacks, verbose=1,
    )
    plot_training(l1_history, os.path.join(HIER_DIR, 'level1_training.png'), 'Level 1 — Category')

    l1_test_loss, l1_test_acc = l1_model.evaluate(X_test, y_test_cat, verbose=0)
    print(f"\nLevel 1 Test Accuracy: {l1_test_acc*100:.2f}%")

    # 6. Train Level 2 models (per-category)
    print("\n" + "=" * 50)
    print("TRAINING LEVEL 2 — Per-Category Classifiers")
    print("=" * 50)

    l2_models = {}
    l2_results = {}

    for cat_name in CATEGORY_NAMES:
        class_indices = category_to_indices.get(cat_name, [])
        if len(class_indices) < 2:
            print(f"\n  Skipping {cat_name}: only {len(class_indices)} class(es)")
            l2_models[cat_name] = None
            l2_results[cat_name] = {'accuracy': 0, 'n_classes': len(class_indices)}
            continue

        print(f"\n  Training {cat_name} ({len(class_indices)} classes)...")

        X_train_cat, y_train_cat_filtered = filter_by_category(
            X_train, y_train, class_indices, compact_mapping)
        X_val_cat, y_val_cat_filtered = filter_by_category(
            X_val, y_val, class_indices, compact_mapping)
        X_test_cat, y_test_cat_filtered = filter_by_category(
            X_test, y_test, class_indices, compact_mapping)

        if X_train_cat.shape[0] < 10:
            print(f"    Too few training samples ({X_train_cat.shape[0]}), skipping")
            l2_models[cat_name] = None
            l2_results[cat_name] = {'accuracy': 0, 'n_classes': len(class_indices)}
            continue

        print(f"    Train: {X_train_cat.shape[0]}, Val: {X_val_cat.shape[0]}, Test: {X_test_cat.shape[0]}")

        l2_model = build_level2_model(input_shape, len(class_indices), cat_name)
        l2_model.compile(
            optimizer=tf.keras.optimizers.AdamW(learning_rate=1e-3, weight_decay=1e-4),
            loss='categorical_crossentropy',
            metrics=['accuracy'],
        )

        l2_callbacks = [
            EarlyStopping(monitor='val_accuracy', patience=PATIENCE, restore_best_weights=True, mode='max'),
            ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=8, min_lr=1e-6),
            ModelCheckpoint(os.path.join(HIER_DIR, f'level2_{cat_name}_best.keras'),
                            monitor='val_accuracy', save_best_only=True, mode='max'),
        ]

        l2_history = l2_model.fit(
            X_train_cat, y_train_cat_filtered,
            validation_data=(X_val_cat, y_val_cat_filtered),
            epochs=min(EPOCHS, 50),
            batch_size=BATCH_SIZE,
            callbacks=l2_callbacks, verbose=0,
        )

        # Augmented fine-tuning
        print(f"    Fine-tuning with augmentation...")
        aug_callbacks = [
            EarlyStopping(monitor='val_accuracy', patience=10, restore_best_weights=True, mode='max'),
            ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6),
        ]
        l2_model.compile(
            optimizer=tf.keras.optimizers.AdamW(learning_rate=1e-4, weight_decay=1e-5),
            loss=focal_loss(),
            metrics=['accuracy'],
        )

        def aug_generator():
            while True:
                idxs = np.random.permutation(len(X_train_cat))
                for start in range(0, len(X_train_cat), BATCH_SIZE):
                    batch_idxs = idxs[start:start + BATCH_SIZE]
                    X_batch = X_train_cat[batch_idxs].copy()
                    y_batch = y_train_cat_filtered[batch_idxs]
                    X_batch = augment_batch(X_batch)
                    yield X_batch, y_batch

        steps_per_epoch = max(1, len(X_train_cat) // BATCH_SIZE)
        l2_history_aug = l2_model.fit(
            aug_generator(),
            validation_data=(X_val_cat, y_val_cat_filtered),
            epochs=min(EPOCHS, 50),
            steps_per_epoch=steps_per_epoch,
            callbacks=aug_callbacks, verbose=0,
        )

        l2_test_loss, l2_test_acc = l2_model.evaluate(X_test_cat, y_test_cat_filtered, verbose=0)
        l2_results[cat_name] = {
            'accuracy': float(l2_test_acc),
            'n_classes': len(class_indices),
            'n_train': int(X_train_cat.shape[0]),
            'n_test': int(X_test_cat.shape[0]),
        }
        l2_models[cat_name] = l2_model
        print(f"    Test accuracy: {l2_test_acc*100:.2f}%")

        l2_model.save(os.path.join(HIER_DIR, f'level2_{cat_name}_final.keras'))

    # 7. Hierarchical evaluation on test set
    print("\n" + "=" * 50)
    print("HIERARCHICAL EVALUATION")
    print("=" * 50)

    cat_name_to_idx = {name: i for i, name in enumerate(category_names_list)}
    y_pred_cat = l1_model.predict(X_test, verbose=0)
    y_pred_cat_idx = np.argmax(y_pred_cat, axis=1)

    correct_hier = 0
    correct_l1_only = 0
    total = y_test.shape[0]

    # Build reverse map: compact_idx -> original label name
    rev_map = {v: k for k, v in compact_mapping.items()}
    # Build name -> original index
    name_to_orig = {v: k for k, v in label_map.items()}

    per_category_hits = {cat: {'correct': 0, 'total': 0} for cat in CATEGORY_NAMES}

    for i in range(total):
        true_class_compact = np.argmax(y_test[i])
        # Map to original class index
        true_orig_idx = None
        for orig, comp in compact_mapping.items():
            if comp == true_class_compact:
                true_orig_idx = orig
                break
        if true_orig_idx is None:
            continue

        true_cat_name = category_map.get(true_orig_idx, 'misc')
        true_cat_idx = cat_name_to_idx[true_cat_name]

        # Level 1 prediction
        pred_cat_idx = y_pred_cat_idx[i]
        pred_cat_name = category_names_list[pred_cat_idx]

        if pred_cat_idx == true_cat_idx:
            correct_l1_only += 1

        # Level 2 prediction
        l2_model = l2_models.get(pred_cat_name)
        if l2_model is None:
            continue

        l2_class_indices = category_to_indices.get(pred_cat_name, [])
        if len(l2_class_indices) < 2:
            # Only one class in category, predict it
            if pred_cat_name == true_cat_name:
                correct_hier += 1
            continue

        # Predict within category
        X_sample = X_test[i:i+1]
        l2_pred = l2_model.predict(X_sample, verbose=0)
        l2_pred_idx = np.argmax(l2_pred, axis=1)[0]

        # Map back: l2_pred_idx -> original class index
        if l2_pred_idx < len(l2_class_indices):
            pred_orig_idx = l2_class_indices[l2_pred_idx]
            pred_compact = compact_mapping.get(pred_orig_idx)
            if pred_compact == true_class_compact:
                correct_hier += 1
                per_category_hits[true_cat_name]['correct'] += 1

        per_category_hits[true_cat_name]['total'] += 1

    print(f"\nLevel 1 (Category) Accuracy: {correct_l1_only/total*100:.2f}%")
    print(f"Hierarchical (Full) Accuracy: {correct_hier/total*100:.2f}%")

    print(f"\nPer-category accuracy:")
    per_cat_accs = {}
    for cat, hits in sorted(per_category_hits.items()):
        if hits['total'] > 0:
            acc = hits['correct'] / hits['total'] * 100
            per_cat_accs[cat] = acc
            print(f"  {cat:20s}: {acc:.1f}% ({hits['correct']}/{hits['total']})")

    # Compare to flat model accuracy
    # Load flat model if available
    flat_model_path = os.path.join(SAVED_DIR, 'gru_balanced_best.keras')
    if os.path.exists(flat_model_path):
        flat_model = tf.keras.models.load_model(flat_model_path, compile=False)
        flat_pred = flat_model.predict(X_test, verbose=0)
        flat_acc = np.mean(np.argmax(flat_pred, axis=1) == np.argmax(y_test, axis=1))
        print(f"\nFlat model accuracy: {flat_acc*100:.2f}%")
        print(f"Hierarchical improvement: {correct_hier/total*100 - flat_acc*100:+.2f}%")

    # 8. Save results
    results = {
        'level1_test_accuracy': float(l1_test_acc),
        'hierarchical_test_accuracy': correct_hier / total,
        'per_category': l2_results,
        'per_category_eval': per_cat_accs,
        'n_categories': n_categories,
    }
    with open(os.path.join(HIER_DIR, 'results.json'), 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {os.path.join(HIER_DIR, 'results.json')}")


if __name__ == '__main__':
    main()
