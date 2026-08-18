#!/usr/bin/env python3
"""
augment_170.py
====================
Isolated copy of augment_sequences.py, pointed at data/experiment_170/ instead
of data/hand_v3/. Logic is identical to the canonical script — only DATA_DIR
changes — so this experiment isolates the MIN_SAMPLES_PER_CLASS variable alone.

Usage:
    cd ml
    python scripts/experiment_170/augment_170.py
"""

import pathlib
import numpy as np
from scipy.interpolate import interp1d

# ──────────────────────────────────────────────────────────────────────────────
DATA_DIR   = pathlib.Path("data/experiment_170")
AUG_FACTOR = 5
SEED       = 42
SEQUENCE_LEN = 60
FEATURES_PER_HAND = 63

NOISE_STD   = 0.008
STRETCH_MIN = 0.80
STRETCH_MAX = 1.20
JITTER_MAX  = 0.02


def aug_factor_for(n_samples: int) -> int:
    if n_samples <= 4:
        return 15
    if n_samples <= 9:
        return 8
    return 5


def aug_gaussian_noise(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    noise = rng.normal(0, NOISE_STD, size=sequence.shape).astype(np.float32)
    return sequence + noise


def aug_temporal_stretch(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    factor = rng.uniform(STRETCH_MIN, STRETCH_MAX)
    n_frames = sequence.shape[0]
    stretched_len = max(2, int(n_frames * factor))
    original_indices = np.linspace(0, 1, n_frames)
    stretched_indices = np.linspace(0, 1, stretched_len)
    interpolator = interp1d(original_indices, sequence, axis=0, kind="linear")
    stretched = interpolator(stretched_indices)
    back_indices = np.linspace(0, 1, stretched_len)
    target_indices = np.linspace(0, 1, n_frames)
    interpolator2 = interp1d(back_indices, stretched, axis=0, kind="linear")
    result = interpolator2(target_indices)
    return result.astype(np.float32)


def aug_spatial_jitter(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    offset = rng.uniform(-JITTER_MAX, JITTER_MAX, size=(1, sequence.shape[1])).astype(np.float32)
    return sequence + offset


def aug_hand_mirror(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    mirrored = sequence.copy()
    mirrored[:, :FEATURES_PER_HAND], mirrored[:, FEATURES_PER_HAND:] = (
        sequence[:, FEATURES_PER_HAND:].copy(),
        sequence[:, :FEATURES_PER_HAND].copy(),
    )
    mirrored[:, 0::3] *= -1
    return mirrored


AUGMENTATIONS = [aug_gaussian_noise, aug_temporal_stretch, aug_spatial_jitter, aug_hand_mirror]


def augment_single(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    result = sequence.copy()
    apply_mask = rng.random(len(AUGMENTATIONS)) < 0.5
    if not apply_mask.any():
        apply_mask[rng.integers(len(AUGMENTATIONS))] = True
    for aug_fn, apply in zip(AUGMENTATIONS, apply_mask):
        if apply:
            result = aug_fn(result, rng)
    return result


def main():
    rng = np.random.default_rng(SEED)

    X_train_path = DATA_DIR / "X_train_hand.npy"
    y_train_path = DATA_DIR / "y_train_hand.npy"

    print(f"Loading training data from {DATA_DIR}...")
    X_train = np.load(X_train_path)
    y_train = np.load(y_train_path)

    n_train = X_train.shape[0]
    print(f"Original training size: {n_train}")
    print(f"Original shape: {X_train.shape}")

    class_idx = np.argmax(y_train, axis=1)
    unique_classes, class_counts = np.unique(class_idx, return_counts=True)
    print(f"Classes: {len(unique_classes)}  "
          f"(per-class augmentation factor via aug_factor_for: "
          f"≤4→15×, 5-9→8×, >9→{AUG_FACTOR}×)")

    X_aug_list = [X_train]
    y_aug_list = [y_train]

    for cls, n_cls in zip(unique_classes, class_counts):
        factor = aug_factor_for(int(n_cls))
        cls_mask = class_idx == cls
        X_cls = X_train[cls_mask]
        y_cls = y_train[cls_mask]

        for aug_idx in range(factor):
            X_augmented = np.zeros_like(X_cls)
            for i in range(len(X_cls)):
                X_augmented[i] = augment_single(X_cls[i], rng)
            X_aug_list.append(X_augmented)
            y_aug_list.append(y_cls.copy())

    X_train_aug = np.concatenate(X_aug_list, axis=0)
    y_train_aug = np.concatenate(y_aug_list, axis=0)

    shuffle_idx = rng.permutation(len(X_train_aug))
    X_train_aug = X_train_aug[shuffle_idx]
    y_train_aug = y_train_aug[shuffle_idx]

    print(f"\nAugmented training size: {X_train_aug.shape[0]} ({X_train_aug.shape[0] / n_train:.1f}× original)")
    print(f"Augmented shape: {X_train_aug.shape}")

    expected_total = sum(
        int(n_cls) * (aug_factor_for(int(n_cls)) + 1)
        for n_cls in class_counts
    )
    assert X_train_aug.shape[0] == expected_total, "Shape mismatch!"
    assert X_train_aug.shape[1:] == (SEQUENCE_LEN, X_train.shape[2]), "Feature shape mismatch!"
    assert len(y_train_aug) == len(X_train_aug), "Label count mismatch!"

    vmin, vmax = X_train_aug.min(), X_train_aug.max()
    print(f"Value range: [{vmin:.3f}, {vmax:.3f}]")
    if abs(vmin) > 10 or abs(vmax) > 10:
        print("WARNING: Values out of expected range (-5 to +5). Check augmentation parameters.")

    aug_class_idx = np.argmax(y_train_aug, axis=1)
    _, aug_class_counts = np.unique(aug_class_idx, return_counts=True)

    print("\n" + "=" * 50)
    print("AUGMENTATION SUMMARY (experiment_170)")
    print("=" * 50)
    print(f"Total original samples  : {n_train}")
    print(f"Total augmented samples : {X_train_aug.shape[0]}")
    print(f"Samples/class (post-aug): "
          f"min={aug_class_counts.min()}  "
          f"max={aug_class_counts.max()}  "
          f"mean={aug_class_counts.mean():.1f}")
    print("=" * 50)

    X_aug_path = DATA_DIR / "X_train_aug.npy"
    y_aug_path = DATA_DIR / "y_train_aug.npy"
    np.save(X_aug_path, X_train_aug)
    np.save(y_aug_path, y_train_aug)

    print(f"\nSaved: {X_aug_path} — shape {X_train_aug.shape}")
    print(f"Saved: {y_aug_path} — shape {y_train_aug.shape}")
    print("Done!")


if __name__ == "__main__":
    main()
