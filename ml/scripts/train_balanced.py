"""
Balanced training script for MudraLearn sign recognition.
Immediate actions:
- Class-weighted loss to handle imbalance.
- Temporal/spatial augmentation (jitter, time warp, speed variation, frame drop/repeat).
- Optional: filter to classes with sufficient samples.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GRU, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical
import json

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')
os.makedirs(SAVED_MODEL_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Augmentation functions
# ---------------------------------------------------------------------------

def add_spatial_jitter(x_batch, scale=0.01):
    batch_size, seq_len, feats = x_batch.shape
    num_landmarks = feats // 4
    assert feats % 4 == 0, "Features must be divisible by 4 (xyzv)"
    x_r = x_batch.reshape(batch_size, seq_len, num_landmarks, 4)
    noise = np.random.normal(loc=0.0, scale=scale, size=x_r[:, :, :, 0:3].shape)
    x_r[:, :, :, 0:3] += noise
    return np.clip(x_r, 0.0, 1.0).reshape(batch_size, seq_len, feats)


def time_warp(x_batch, max_stretch=0.2):
    batch_size, seq_len, feats = x_batch.shape
    factor = np.random.uniform(1.0 - max_stretch, 1.0 + max_stretch)
    new_len = max(2, int(seq_len * factor))
    old_idx = np.linspace(0, seq_len - 1, num=seq_len)
    new_idx = np.linspace(0, seq_len - 1, num=new_len)
    warped = np.zeros((batch_size, new_len, feats), dtype=np.float32)
    for b in range(batch_size):
        for f in range(feats):
            warped[b, :, f] = np.interp(new_idx, old_idx, x_batch[b, :, f])
    old2 = np.linspace(0, new_len - 1, num=new_len)
    new2 = np.linspace(0, new_len - 1, num=seq_len)
    result = np.zeros_like(x_batch)
    for b in range(batch_size):
        for f in range(feats):
            result[b, :, f] = np.interp(new2, old2, warped[b, :, f])
    return result


def speed_variation(x_batch, min_speed=0.8, max_speed=1.2):
    batch_size, seq_len, feats = x_batch.shape
    speed = np.random.uniform(min_speed, max_speed)
    n_sample = max(2, int(seq_len / speed))
    old_idx = np.linspace(0, seq_len - 1, num=seq_len)
    sample_idx = np.linspace(0, seq_len - 1, num=n_sample)
    sampled = np.zeros((batch_size, n_sample, feats), dtype=np.float32)
    for b in range(batch_size):
        for f in range(feats):
            sampled[b, :, f] = np.interp(sample_idx, old_idx, x_batch[b, :, f])
    if n_sample >= seq_len:
        result = sampled[:, :seq_len, :]
    else:
        result = np.zeros_like(x_batch)
        result[:, :n_sample, :] = sampled
        result[:, n_sample:, :] = sampled[:, -1:, :]
    return result


# MediaPipe Pose left↔right landmark index pairs (33 landmarks, 0-indexed)
_LEFT_RIGHT_PAIRS = [
    (1, 4), (2, 5), (3, 6),    # eyes
    (7, 8),                      # ears
    (9, 10),                     # mouth
    (11, 12), (13, 14), (15, 16),  # shoulder, elbow, wrist
    (17, 18), (19, 20), (21, 22),  # pinky, index, thumb
    (23, 24), (25, 26), (27, 28),  # hip, knee, ankle
    (29, 30), (31, 32),            # heel, foot
]

def horizontal_flip(x_batch):
    """
    Horizontally flip landmarks:
    - x' = 1.0 - x  (mirror across vertical axis)
    - Swap left/right landmark pairs
    Features layout: 33 landmarks × 4 values (x, y, z, v) = 132
    """
    batch_size, seq_len, feats = x_batch.shape
    num_landmarks = feats // 4
    x_r = x_batch.reshape(batch_size, seq_len, num_landmarks, 4)

    # Flip x-coordinates (index 0 of each landmark)
    x_r[:, :, :, 0] = 1.0 - x_r[:, :, :, 0]

    # Swap left-right paired landmarks (swap all 4 values)
    for l, r in _LEFT_RIGHT_PAIRS:
        left_copy = x_r[:, :, l, :].copy()
        x_r[:, :, l, :] = x_r[:, :, r, :]
        x_r[:, :, r, :] = left_copy

    return x_r.reshape(batch_size, seq_len, feats)


def frame_drop_repeat(x_batch, drop_prob=0.1, repeat_prob=0.1):
    batch_size, seq_len, feats = x_batch.shape
    result = x_batch.copy()
    for b in range(batch_size):
        for t in range(seq_len):
            r = np.random.random()
            if r < drop_prob:
                prev = max(0, t - 1)
                nxt = min(seq_len - 1, t + 1)
                result[b, t] = (result[b, prev] + result[b, nxt]) / 2.0
            elif r < drop_prob + repeat_prob:
                prev = max(0, t - 1)
                result[b, t] = result[b, prev]
    return result


def augment_batch(x_batch):
    x = add_spatial_jitter(x_batch)
    if np.random.random() < 0.5:
        x = time_warp(x)
    if np.random.random() < 0.5:
        x = speed_variation(x)
    if np.random.random() < 0.3:
        x = horizontal_flip(x)
    if np.random.random() < 0.5:
        x = frame_drop_repeat(x)
    return x.astype(np.float32)


def data_generator(X, y, sample_weights, batch_size=32, augment=False):
    n = X.shape[0]
    while True:
        indices = np.random.permutation(n)
        for start in range(0, n, batch_size):
            end = start + batch_size
            batch_idx = indices[start:end]
            x_batch = X[batch_idx]
            y_batch = y[batch_idx]
            w_batch = sample_weights[batch_idx] if sample_weights is not None else None
            if augment:
                x_batch = augment_batch(x_batch)
            if w_batch is not None:
                yield (x_batch, y_batch, w_batch)
            else:
                yield (x_batch, y_batch)


# ---------------------------------------------------------------------------
# Loss functions
# ---------------------------------------------------------------------------

def focal_loss(gamma=2.0):
    """
    Focal loss for multi-class classification.
    Down-weights well-classified examples so the model focuses on hard ones.
    gamma = 0 is equivalent to categorical cross-entropy.
    gamma = 2 is the recommended default.
    """
    def loss(y_true, y_pred):
        epsilon = tf.keras.backend.epsilon()
        y_pred = tf.clip_by_value(y_pred, epsilon, 1.0 - epsilon)
        cross_entropy = -y_true * tf.math.log(y_pred)
        focal_weight = tf.pow(1.0 - y_pred, gamma)
        return tf.reduce_sum(focal_weight * cross_entropy, axis=-1)
    return loss


# ---------------------------------------------------------------------------
# Main training routine
# ---------------------------------------------------------------------------

def main():
    # Load preprocessed data
    X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
    X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
    X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
    y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
    y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))
    y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))

    print(f"Loaded data: Train {X_train.shape}, Val {X_val.shape}, Test {X_test.shape}")

    y_train_idx = np.argmax(y_train, axis=1)
    y_val_idx = np.argmax(y_val, axis=1)
    y_test_idx = np.argmax(y_test, axis=1)

    num_classes = y_train.shape[1]
    print(f"Number of classes: {num_classes}")

    unique, counts = np.unique(y_train_idx, return_counts=True)
    freq = np.zeros(num_classes, dtype=int)
    freq[unique] = counts
    print(f"Class frequency stats: min={freq.min()}, max={freq.max()}, mean={freq.mean():.2f}")

    MIN_SAMPLES = 10
    valid_classes = np.where(freq >= MIN_SAMPLES)[0]
    print(f"Classes with >= {MIN_SAMPLES} samples: {len(valid_classes)}")

    if len(valid_classes) < num_classes:
        def filter_data(X, y_idx):
            mask = np.isin(y_idx, valid_classes)
            return X[mask], y_idx[mask]

        X_train_f, y_train_idx_f = filter_data(X_train, y_train_idx)
        X_val_f, y_val_idx_f = filter_data(X_val, y_val_idx)
        X_test_f, y_test_idx_f = filter_data(X_test, y_test_idx)

        class_map = {old: new for new, old in enumerate(valid_classes)}
        y_train_idx_mapped = np.vectorize(class_map.get)(y_train_idx_f)
        y_val_idx_mapped = np.vectorize(class_map.get)(y_val_idx_f)
        y_test_idx_mapped = np.vectorize(class_map.get)(y_test_idx_f)

        y_train_f = to_categorical(y_train_idx_mapped, num_classes=len(valid_classes))
        y_val_f = to_categorical(y_val_idx_mapped, num_classes=len(valid_classes))
        y_test_f = to_categorical(y_test_idx_mapped, num_classes=len(valid_classes))

        X_train_use, y_train_use = X_train_f, y_train_f
        X_val_use, y_val_use = X_val_f, y_val_f
        X_test_use, y_test_use = X_test_f, y_test_f
        num_classes_use = len(valid_classes)
        print(f"After filtering: Train {X_train_use.shape}, {y_train_use.shape}")
    else:
        X_train_use, y_train_use = X_train, y_train
        X_val_use, y_val_use = X_val, y_val
        X_test_use, y_test_use = X_test, y_test
        num_classes_use = num_classes
        print("Using all classes (min samples threshold met for all).")

    unique_train, counts_train = np.unique(np.argmax(y_train_use, axis=1), return_counts=True)
    freq_train = np.zeros(num_classes_use, dtype=int)
    freq_train[unique_train] = counts_train
    freq_train[freq_train == 0] = 1
    class_weights = 1.0 / freq_train.astype(float)
    class_weights /= class_weights.sum()
    class_weights *= num_classes_use
    print(f"Class weights computed: min={class_weights.min():.4f}, max={class_weights.max():.4f}")

    sample_weights = np.sum(y_train_use * class_weights[np.newaxis, :], axis=1)

    SEQ_LEN = X_train_use.shape[1]
    FEATURES = X_train_use.shape[2]

    model = Sequential([
        GRU(128, return_sequences=True, input_shape=(SEQ_LEN, FEATURES)),
        BatchNormalization(),
        Dropout(0.3),
        GRU(64, return_sequences=False),
        BatchNormalization(),
        Dropout(0.3),
        Dense(128, activation="relu"),
        Dropout(0.2),
        Dense(num_classes_use, activation="softmax")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss=focal_loss(gamma=2.0),
        metrics=['accuracy']
    )

    model.summary()

    callbacks = [
        EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1),
        ModelCheckpoint(
            os.path.join(SAVED_MODEL_DIR, 'gru_balanced_best.keras'),
            monitor='val_accuracy', save_best_only=True, verbose=1
        ),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6, verbose=1)
    ]

    BATCH_SIZE = 32
    steps_per_epoch = int(np.ceil(X_train_use.shape[0] / BATCH_SIZE))
    validation_steps = int(np.ceil(X_val_use.shape[0] / BATCH_SIZE))

    print(f"Steps per epoch: {steps_per_epoch}, Validation steps: {validation_steps}")

    hist = model.fit(
        data_generator(X_train_use, y_train_use, sample_weights, batch_size=BATCH_SIZE, augment=True),
        steps_per_epoch=steps_per_epoch,
        epochs=100,
        validation_data=data_generator(X_val_use, y_val_use, None, batch_size=BATCH_SIZE, augment=False),
        validation_steps=validation_steps,
        callbacks=callbacks,
        verbose=1
    )

    test_loss, test_acc = model.evaluate(X_test_use, y_test_use, verbose=0)
    print(f"\nTest accuracy: {test_acc*100:.2f}%")

    model.save(os.path.join(SAVED_MODEL_DIR, 'gru_balanced_final.keras'))
    print(f"Model saved to {SAVED_MODEL_DIR}")

    if len(valid_classes) < num_classes:
        mapping_path = os.path.join(SAVED_MODEL_DIR, 'class_mapping.json')
        with open(mapping_path, 'w') as f:
            json.dump({str(k): int(v) for k, v in class_map.items()}, f)
        print(f"Class mapping saved to {mapping_path}")


if __name__ == '__main__':
    main()
