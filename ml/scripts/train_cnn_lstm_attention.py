"""
CNN-LSTM with attention for MudraLearn sign recognition.
CNN → Temporal Attention → LSTM → Classifier
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import (Conv1D, MaxPool1D, LSTM, Dense, Dropout,
                                     BatchNormalization, Input, Permute,
                                     Reshape, Multiply, GlobalAveragePooling1D)
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')
os.makedirs(SAVED_MODEL_DIR, exist_ok=True)

from train_balanced import (add_spatial_jitter, time_warp, speed_variation,
                             horizontal_flip, frame_drop_repeat, augment_batch,
                             data_generator, focal_loss)


# ---------------------------------------------------------------------------
# Temporal attention layer
# ---------------------------------------------------------------------------

def temporal_attention(inputs):
    """
    Learn a weight for each timestep, then scale the sequence.
    inputs shape: (batch, timesteps, channels)
    returns:      (batch, timesteps, channels) — same shape, but re-weighted
    """
    # Score each timestep
    score = Dense(1, activation='sigmoid')(inputs)          # (batch, timesteps, 1)
    # Normalise scores across time using a Keras layer
    score = tf.keras.layers.Softmax(axis=1)(score)          # (batch, timesteps, 1)
    # Weight the original sequence
    attended = Multiply()([inputs, score])                  # (batch, timesteps, channels)
    return attended


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

def build_cnn_lstm_attention(seq_len, features, num_classes):
    inputs = Input(shape=(seq_len, features), name='landmarks')

    # Conv blocks
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

    # Temporal attention — learn which frames matter most
    x = temporal_attention(x)

    # LSTM
    x = LSTM(128, return_sequences=False)(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    # Classifier
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=inputs, outputs=outputs, name='cnn_lstm_attention')
    return model


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def main():
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
        print("Using all classes.")

    unique_train, counts_train = np.unique(np.argmax(y_train_use, axis=1), return_counts=True)
    freq_train = np.zeros(num_classes_use, dtype=int)
    freq_train[unique_train] = counts_train
    freq_train[freq_train == 0] = 1
    class_weights = 1.0 / freq_train.astype(float)
    class_weights /= class_weights.sum()
    class_weights *= num_classes_use
    print(f"Class weights: min={class_weights.min():.4f}, max={class_weights.max():.4f}")

    sample_weights = np.sum(y_train_use * class_weights[np.newaxis, :], axis=1)

    SEQ_LEN = X_train_use.shape[1]
    FEATURES = X_train_use.shape[2]

    model = build_cnn_lstm_attention(SEQ_LEN, FEATURES, num_classes_use)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss=focal_loss(gamma=2.0),
        metrics=['accuracy']
    )

    model.summary()

    callbacks = [
        EarlyStopping(monitor='val_loss', patience=12, restore_best_weights=True, verbose=1),
        ModelCheckpoint(
            os.path.join(SAVED_MODEL_DIR, 'cnn_lstm_attn_best.keras'),
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

    model.save(os.path.join(SAVED_MODEL_DIR, 'cnn_lstm_attn_final.keras'))
    print(f"Model saved to {SAVED_MODEL_DIR}")

    if len(valid_classes) < num_classes:
        mapping_path = os.path.join(SAVED_MODEL_DIR, 'class_mapping.json')
        with open(mapping_path, 'w') as f:
            json.dump({str(k): int(v) for k, v in class_map.items()}, f)
        print(f"Class mapping saved to {mapping_path}")


if __name__ == '__main__':
    main()
