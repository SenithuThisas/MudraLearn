#!/usr/bin/env python3
"""
augment_sequences.py
====================
Generate synthetic training data via 4 augmentation strategies:
  1. Gaussian noise   — simulates hand tremor / detection jitter
  2. Temporal stretch  — simulates signing speed variation
  3. Spatial jitter    — simulates slight hand position offset
  4. Hand mirroring    — simulates left-handed vs right-handed signing

Produces AUG_FACTOR synthetic copies of every training sample.
Val and test sets are NEVER touched.

Usage:
    cd ml
    python scripts/augment_sequences.py
"""

import pathlib
import numpy as np
from scipy.interpolate import interp1d

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
DATA_DIR   = pathlib.Path("data/hand_v2")
AUG_FACTOR = 5       # 5 synthetic copies per real sample → 6× total
SEED       = 42
SEQUENCE_LEN = 60
FEATURES_PER_HAND = 63  # 21 landmarks × 3 coords

# Augmentation hyperparameters
NOISE_STD       = 0.008     # Gaussian noise std (0.8% of palm size)
STRETCH_MIN     = 0.80      # Temporal stretch factor lower bound
STRETCH_MAX     = 1.20      # Temporal stretch factor upper bound
JITTER_MAX      = 0.02      # Spatial jitter max shift (2% of palm size)


# ──────────────────────────────────────────────────────────────────────────────
# Augmentation functions
# ──────────────────────────────────────────────────────────────────────────────

def aug_gaussian_noise(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Add small Gaussian noise to every coordinate in every frame.
    Simulates natural hand tremor and MediaPipe detection jitter.
    """
    noise = rng.normal(0, NOISE_STD, size=sequence.shape).astype(np.float32)
    return sequence + noise


def aug_temporal_stretch(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Resample the time axis with a random stretch factor.
    Factor < 1.0 = faster signing (compress then resample back).
    Factor > 1.0 = slower signing (stretch then resample back).
    """
    factor = rng.uniform(STRETCH_MIN, STRETCH_MAX)
    n_frames = sequence.shape[0]

    # Compute how many frames the stretched version would have
    stretched_len = max(2, int(n_frames * factor))

    # Create stretched version
    original_indices = np.linspace(0, 1, n_frames)
    stretched_indices = np.linspace(0, 1, stretched_len)
    interpolator = interp1d(original_indices, sequence, axis=0, kind="linear")
    stretched = interpolator(stretched_indices)

    # Resample back to original length
    back_indices = np.linspace(0, 1, stretched_len)
    target_indices = np.linspace(0, 1, n_frames)
    interpolator2 = interp1d(back_indices, stretched, axis=0, kind="linear")
    result = interpolator2(target_indices)

    return result.astype(np.float32)


def aug_spatial_jitter(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Add a small constant offset to all coordinates throughout the sequence.
    Simulates the signer's hand being slightly off-centre.
    """
    # Same offset applied to every frame (spatial shift, not noise)
    offset = rng.uniform(-JITTER_MAX, JITTER_MAX, size=(1, sequence.shape[1])).astype(np.float32)
    return sequence + offset


def aug_hand_mirror(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Swap left-hand features (indices 0:63) with right-hand features (indices 63:126).
    Simulates left-handed signing.
    """
    mirrored = sequence.copy()
    mirrored[:, :FEATURES_PER_HAND], mirrored[:, FEATURES_PER_HAND:] = (
        sequence[:, FEATURES_PER_HAND:].copy(),
        sequence[:, :FEATURES_PER_HAND].copy(),
    )
    return mirrored


# All augmentation functions
AUGMENTATIONS = [
    aug_gaussian_noise,
    aug_temporal_stretch,
    aug_spatial_jitter,
    aug_hand_mirror,
]


def augment_single(sequence: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Apply a random combination of augmentations to a single sequence.
    Each augmentation is independently applied with 50% probability,
    except at least one is always applied.
    """
    result = sequence.copy()

    # Randomly select which augmentations to apply
    apply_mask = rng.random(len(AUGMENTATIONS)) < 0.5

    # Ensure at least one augmentation is applied
    if not apply_mask.any():
        apply_mask[rng.integers(len(AUGMENTATIONS))] = True

    for aug_fn, apply in zip(AUGMENTATIONS, apply_mask):
        if apply:
            result = aug_fn(result, rng)

    return result


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    rng = np.random.default_rng(SEED)

    # Load training data
    X_train_path = DATA_DIR / "X_train_hand.npy"
    y_train_path = DATA_DIR / "y_train_hand.npy"

    print(f"Loading training data from {DATA_DIR}...")
    X_train = np.load(X_train_path)
    y_train = np.load(y_train_path)

    n_train = X_train.shape[0]
    print(f"Original training size: {n_train}")
    print(f"Original shape: {X_train.shape}")
    print(f"Augmentation factor: {AUG_FACTOR} (total will be {AUG_FACTOR + 1}× originals)")

    # Generate augmented samples
    X_aug_list = [X_train]  # Start with originals
    y_aug_list = [y_train]

    for aug_idx in range(AUG_FACTOR):
        print(f"  Generating augmentation pass {aug_idx + 1}/{AUG_FACTOR}...")
        X_augmented = np.zeros_like(X_train)

        for i in range(n_train):
            X_augmented[i] = augment_single(X_train[i], rng)

        X_aug_list.append(X_augmented)
        y_aug_list.append(y_train.copy())

    # Concatenate all
    X_train_aug = np.concatenate(X_aug_list, axis=0)
    y_train_aug = np.concatenate(y_aug_list, axis=0)

    # Shuffle
    shuffle_idx = rng.permutation(len(X_train_aug))
    X_train_aug = X_train_aug[shuffle_idx]
    y_train_aug = y_train_aug[shuffle_idx]

    print(f"\nAugmented training size: {X_train_aug.shape[0]} ({X_train_aug.shape[0] / n_train:.1f}× original)")
    print(f"Augmented shape: {X_train_aug.shape}")

    # Sanity checks
    assert X_train_aug.shape[0] == n_train * (AUG_FACTOR + 1), "Shape mismatch!"
    assert X_train_aug.shape[1:] == (SEQUENCE_LEN, X_train.shape[2]), "Feature shape mismatch!"
    assert len(y_train_aug) == len(X_train_aug), "Label count mismatch!"

    # Check value range
    vmin, vmax = X_train_aug.min(), X_train_aug.max()
    print(f"Value range: [{vmin:.3f}, {vmax:.3f}]")
    if abs(vmin) > 10 or abs(vmax) > 10:
        print("WARNING: Values out of expected range (-5 to +5). Check augmentation parameters.")

    # Save
    X_aug_path = DATA_DIR / "X_train_aug.npy"
    y_aug_path = DATA_DIR / "y_train_aug.npy"

    np.save(X_aug_path, X_train_aug)
    np.save(y_aug_path, y_train_aug)

    print(f"\nSaved: {X_aug_path} — shape {X_train_aug.shape}")
    print(f"Saved: {y_aug_path} — shape {y_train_aug.shape}")
    print("Done!")


if __name__ == "__main__":
    main()
