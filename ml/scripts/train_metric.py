"""
Metric learning with triplet loss for MudraLearn.
Learns an embedding space where same-sign sequences are close,
different-sign sequences are far apart. Enables retrieval-based
recognition for rare classes.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (Conv1D, MaxPool1D, LSTM, Dense, Dropout,
                                     BatchNormalization, Input, Lambda,
                                     Multiply, GlobalAveragePooling1D)
from tensorflow.keras.callbacks import Callback
from tensorflow.keras.utils import to_categorical
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')
os.makedirs(SAVED_MODEL_DIR, exist_ok=True)

from train_balanced import (add_spatial_jitter, time_warp, speed_variation,
                             horizontal_flip, frame_drop_repeat, augment_batch)


# ---------------------------------------------------------------------------
# Custom L2 Normalization layer (safe for serialization)
# ---------------------------------------------------------------------------

class L2Normalize(tf.keras.layers.Layer):
    """L2-normalize the input along the last axis."""
    def call(self, x):
        return tf.math.l2_normalize(x, axis=-1)

    def get_config(self):
        return super().get_config()


# ---------------------------------------------------------------------------
# Embedding model (backbone)
# ---------------------------------------------------------------------------

def build_embedding_model(seq_len, features, embedding_dim=128):
    """CNN-LSTM-Attention backbone that outputs L2-normalized embeddings."""
    inputs = Input(shape=(seq_len, features), name='landmarks')

    x = Conv1D(64, kernel_size=3, padding='same', activation='relu')(inputs)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)
    x = Conv1D(64, kernel_size=3, padding='same', activation='relu')(x)
    x = BatchNormalization()(x)
    x = MaxPool1D(pool_size=2)(x)

    x = Conv1D(128, kernel_size=3, padding='same', activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)
    x = Conv1D(128, kernel_size=3, padding='same', activation='relu')(x)
    x = BatchNormalization()(x)
    x = MaxPool1D(pool_size=2)(x)

    # Temporal attention
    score = Dense(1, activation='sigmoid')(x)
    score = tf.keras.layers.Softmax(axis=1)(score)
    x = Multiply()([x, score])

    x = LSTM(128, return_sequences=False)(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    x = Dense(embedding_dim, activation=None)(x)
    # L2-normalize so embeddings lie on the unit hypersphere
    embeddings = L2Normalize()(x)

    return Model(inputs=inputs, outputs=embeddings, name='embedding_model')


# ---------------------------------------------------------------------------
# Triplet loss
# ---------------------------------------------------------------------------

def batch_hard_triplet_loss(y_true, embeddings, margin=0.5):
    """
    Batch-hard triplet loss.
    For each anchor in the batch, finds the hardest positive and hardest
    negative within the batch, then computes the triplet margin loss.
    """
    batch_size = tf.shape(embeddings)[0]
    y_true = tf.cast(y_true, tf.int32)

    # Pairwise cosine distance (embeddings are L2-normalized)
    similarity = tf.matmul(embeddings, embeddings, transpose_b=True)
    distances = 1.0 - similarity

    # Mask: same class pairs
    same_class = tf.equal(y_true[:, None], y_true[None, :])
    same_class = tf.cast(same_class, tf.float32)
    # Remove diagonal (self-similarity)
    same_class = same_class - tf.eye(batch_size)

    # Hardest positive: max distance among same-class pairs
    hard_positive = tf.reduce_max(distances * same_class + 1e9 * (1.0 - same_class), axis=-1)

    # Hardest negative: min distance among different-class pairs
    diff_class = 1.0 - same_class - tf.eye(batch_size)
    hard_negative = tf.reduce_min(distances + 1e9 * (1.0 - diff_class), axis=-1)

    # Triplet loss: max(0, pos - neg + margin)
    loss = tf.maximum(hard_positive - hard_negative + margin, 0.0)
    return tf.reduce_mean(loss)


# ---------------------------------------------------------------------------
# Data generator with triplet mining
# ---------------------------------------------------------------------------

def triplet_generator(X, y_idx, batch_size=48, augment=False):
    """
    Yields batches where each class has at least 2 samples (anchor + positive).
    Falls back to random sampling when not enough classes have pairs.
    """
    n = X.shape[0]
    classes = np.unique(y_idx)

    # Precompute indices per class
    class_indices = {c: np.where(y_idx == c)[0] for c in classes}

    while True:
        # Shuffle classes and pick those with ≥2 samples
        np.random.shuffle(classes)
        valid_classes = [c for c in classes if len(class_indices[c]) >= 2]

        if len(valid_classes) * 2 < batch_size:
            # Fallback: random batch (will have some triplets)
            indices = np.random.choice(n, size=batch_size, replace=False)
            x_batch = X[indices]
            y_batch = y_idx[indices]
        else:
            # Sample classes for anchor-positive pairs
            n_pairs = batch_size // 2
            selected = np.random.choice(valid_classes, size=n_pairs, replace=False)
            batch_indices = []
            for c in selected:
                pair = np.random.choice(class_indices[c], size=2, replace=False)
                batch_indices.extend(pair)
            x_batch = X[batch_indices]
            y_batch = y_idx[batch_indices]

        if augment:
            x_batch = augment_batch(x_batch)

        yield x_batch, y_batch


# ---------------------------------------------------------------------------
# Evaluation callback
# ---------------------------------------------------------------------------

class EmbeddingEvalCallback(Callback):
    """Compute retrieval accuracy on validation set each epoch."""

    def __init__(self, X_val, y_val_idx, period=5):
        super().__init__()
        self.X_val = X_val
        self.y_val_idx = y_val_idx
        self.period = period

    def on_epoch_end(self, epoch, logs=None):
        if (epoch + 1) % self.period != 0:
            return
        embeddings = self.model.predict(self.X_val, verbose=0)
        # 1-NN accuracy
        correct = 0
        n = len(self.X_val)
        for i in range(n):
            query = embeddings[i:i+1]
            dists = np.linalg.norm(embeddings - query, axis=1)
            dists[i] = np.inf
            nearest = np.argmin(dists)
            if self.y_val_idx[nearest] == self.y_val_idx[i]:
                correct += 1
        acc = correct / n * 100
        print(f"\n  Val 1-NN accuracy: {acc:.2f}%")


# ---------------------------------------------------------------------------
# Main training
# ---------------------------------------------------------------------------

def main():
    X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
    X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
    X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
    y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
    y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))
    y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))

    y_train_idx = np.argmax(y_train, axis=1)
    y_val_idx = np.argmax(y_val, axis=1)
    y_test_idx = np.argmax(y_test, axis=1)

    print(f"Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
    print(f"Classes: {y_train.shape[1]}, Train samples: {len(X_train)}")

    SEQ_LEN = X_train.shape[1]
    FEATURES = X_train.shape[2]

    model = build_embedding_model(SEQ_LEN, FEATURES, embedding_dim=128)
    model.summary()

    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)

    BATCH_SIZE = 48
    steps_per_epoch = max(1, len(X_train) // BATCH_SIZE)
    val_steps = max(1, len(X_val) // BATCH_SIZE)

    # Learning rate schedule
    def lr_scheduler(epoch):
        if epoch < 20:
            return 0.001
        elif epoch < 40:
            return 0.0005
        else:
            return 0.0001

    lr_callback = tf.keras.callbacks.LearningRateScheduler(lr_scheduler)

    eval_callback = EmbeddingEvalCallback(X_val, y_val_idx, period=5)

    print(f"\nSteps per epoch: {steps_per_epoch}, BATCH_SIZE: {BATCH_SIZE}")
    print("Training with batch-hard triplet loss...")

    # Custom training loop
    best_val_acc = 0.0
    for epoch in range(60):
        lr = lr_scheduler(epoch)
        optimizer.learning_rate.assign(lr)

        total_loss = 0.0
        batches = 0

        gen = triplet_generator(X_train, y_train_idx, batch_size=BATCH_SIZE, augment=True)
        for _ in range(steps_per_epoch):
            x_batch, y_batch = next(gen)
            with tf.GradientTape() as tape:
                emb = model(x_batch, training=True)
                loss = batch_hard_triplet_loss(y_batch, emb)

            grads = tape.gradient(loss, model.trainable_weights)
            optimizer.apply_gradients(zip(grads, model.trainable_weights))
            total_loss += loss.numpy()
            batches += 1

        avg_loss = total_loss / batches

        # Validation retrieval accuracy
        val_emb = model.predict(X_val, verbose=0)
        correct = 0
        for i in range(len(X_val)):
            dists = np.linalg.norm(val_emb - val_emb[i:i+1], axis=1)
            dists[i] = np.inf
            if y_val_idx[np.argmin(dists)] == y_val_idx[i]:
                correct += 1
        val_acc = correct / len(X_val) * 100

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model.save(os.path.join(SAVED_MODEL_DIR, 'metric_best.keras'))

        print(f"Epoch {epoch+1:2d} | loss={avg_loss:.4f} | lr={lr:.6f} | val 1-NN={val_acc:.2f}%")

    # Final test evaluation
    print("\n--- Final Evaluation ---")
    test_emb = model.predict(X_test, verbose=0)
    support_emb = model.predict(X_train, verbose=0)
    support_labels = y_train_idx

    correct = 0
    for i in range(len(X_test)):
        dists = np.linalg.norm(support_emb - test_emb[i:i+1], axis=1)
        nearest = support_labels[np.argmin(dists)]
        if nearest == y_test_idx[i]:
            correct += 1
    test_acc = correct / len(X_test) * 100
    print(f"Test 1-NN accuracy (train as support set): {test_acc:.2f}%")

    model.save(os.path.join(SAVED_MODEL_DIR, 'metric_final.keras'))
    print(f"Model saved to {SAVED_MODEL_DIR}")

    # Save class mapping
    with open(os.path.join(SAVED_MODEL_DIR, 'label_map.json')) as f:
        label_map = json.load(f)
    label_map = {int(k): v for k, v in label_map.items()}
    mapping_path = os.path.join(SAVED_MODEL_DIR, 'class_mapping.json')
    with open(mapping_path, 'w') as f:
        json.dump({str(k): str(v) for k, v in label_map.items()}, f)
    print(f"Class mapping saved to {mapping_path}")


if __name__ == '__main__':
    main()
