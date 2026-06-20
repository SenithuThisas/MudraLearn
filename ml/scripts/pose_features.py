"""
Pose-invariant feature transformations for MediaPipe Pose landmarks.

Transforms absolute (x, y, z) coordinates into representations that are
invariant to body size, camera distance, and frame position.
"""

import numpy as np
import tensorflow as tf

# MediaPipe Pose landmark indices
NOSE = 0
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24

# Features layout: 33 landmarks × 4 (x, y, z, v) = 132 per frame
NUM_LANDMARKS = 33
LANDMARK_STRIDE = 4  # x, y, z, v


def to_landmarks_array(x):
    """Reshape (batch, seq_len, 132) -> (batch, seq_len, 33, 4)."""
    return x.reshape(*x.shape[:2], NUM_LANDMARKS, LANDMARK_STRIDE)


def from_landmarks_array(x_r):
    """Reshape (batch, seq_len, 33, 4) -> (batch, seq_len, 132)."""
    return x_r.reshape(*x_r.shape[:2], NUM_LANDMARKS * LANDMARK_STRIDE)


def get_midpoint(landmarks, idx_a, idx_b):
    """Midpoint between two landmarks. landmarks shape: (..., 4)."""
    return (landmarks[..., idx_a, :3] + landmarks[..., idx_b, :3]) / 2.0


def center_at_nose(data):
    """
    Translate all landmarks so nose (idx 0) is at origin.
    Visibility (v) is preserved unchanged.
    data shape: (batch, seq_len, 132) or (seq_len, 132)
    """
    x_r = to_landmarks_array(data)
    nose_xyz = x_r[..., NOSE, :3]                     # shape: (..., 3)
    x_r[..., :3] = x_r[..., :3] - nose_xyz[..., np.newaxis, :]
    return from_landmarks_array(x_r)


def center_at_midhip(data):
    """
    Translate all landmarks so the midpoint of the hips is at origin.
    """
    x_r = to_landmarks_array(data)
    mid_hip = get_midpoint(x_r, LEFT_HIP, RIGHT_HIP)  # (..., 3)
    x_r[..., :3] = x_r[..., :3] - mid_hip[..., np.newaxis, :]
    return from_landmarks_array(x_r)


def scale_by_torso_height(data):
    """
    Divide all xyz by the distance between mid-hip and mid-shoulder.
    Makes the features invariant to body size and camera distance.
    """
    x_r = to_landmarks_array(data)
    mid_shoulder = get_midpoint(x_r, LEFT_SHOULDER, RIGHT_SHOULDER)
    mid_hip = get_midpoint(x_r, LEFT_HIP, RIGHT_HIP)
    torso = np.linalg.norm(mid_shoulder - mid_hip, axis=-1, keepdims=True)
    torso = np.maximum(torso, 1e-8)                    # avoid division by zero
    x_r[..., :3] = x_r[..., :3] / torso[..., np.newaxis, np.newaxis]
    return from_landmarks_array(x_r)


def relative_to_shoulder_center(data, scale=True):
    """
    Express each landmark position relative to the shoulder center.
    data should be raw (un-normalized) landmark coordinates for scale=True.
    If data is already normalized to [0,1], use scale=False.

    Centering: translation invariance (position in frame).
    Scaling:   body-size invariance (tall vs short signer).
    """
    x_r = to_landmarks_array(data)
    mid_shoulder = get_midpoint(x_r, LEFT_SHOULDER, RIGHT_SHOULDER)
    x_r[..., :3] = x_r[..., :3] - mid_shoulder[..., np.newaxis, :]

    if scale:
        shoulder_width = np.linalg.norm(
            x_r[..., LEFT_SHOULDER, :3] - x_r[..., RIGHT_SHOULDER, :3],
            axis=-1, keepdims=True
        )
        shoulder_width = np.maximum(shoulder_width, 1e-8)
        x_r[..., :3] = x_r[..., :3] / shoulder_width[..., np.newaxis]

    return from_landmarks_array(x_r)


def preprocess_invariant(data, strategy='center_nose'):
    """
    Apply pose-invariant transformations.

    Parameters
    ----------
    data : np.ndarray, shape (batch, seq_len, 132) or (seq_len, 132)
    strategy : str
        'none'              — original coordinates
        'center_nose'       — centered at nose (recommended for normalized data)
        'center_midhip'     — centered at mid-hip
        'relative_shoulder' — centered at shoulder + scaled by shoulder width
    """
    if strategy == 'none':
        return data.copy()
    elif strategy == 'center_nose':
        return center_at_nose(data)
    elif strategy == 'center_midhip':
        return center_at_midhip(data)
    elif strategy == 'relative_shoulder':
        return relative_to_shoulder_center(data, scale=True)
    else:
        raise ValueError(f"Unknown strategy: {strategy}")


# ---------------------------------------------------------------------------
# Keras layer for on-the-fly transformation
# ---------------------------------------------------------------------------

class PoseInvariantLayer(tf.keras.layers.Layer):
    """Apply pose-invariant normalization inside a Keras model."""

    def __init__(self, strategy='relative_shoulder', **kwargs):
        super().__init__(**kwargs)
        self.strategy = strategy

    def call(self, inputs):
        # tf.numpy_function to apply numpy transformations
        def transform(x):
            return preprocess_invariant(x.numpy(), strategy=self.strategy)

        return tf.numpy_function(transform, [inputs], tf.float32)

    def get_config(self):
        config = super().get_config()
        config['strategy'] = self.strategy
        return config
