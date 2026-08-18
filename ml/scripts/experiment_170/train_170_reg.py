#!/usr/bin/env python3
"""
train_170_reg.py
====================
Regularized variant of train_170.py — same 171-class data (data/experiment_170/,
unchanged, reused as-is), same architecture shape and training schedule, three
targeted regularization changes to close the remaining train/val overfitting gap:

  1. label_smoothing=0.1 on the loss
  2. Increased dropout (+ one new dropout layer after bigru_2)
  3. AdamW with mild weight_decay=1e-4 instead of plain Adam

Writes to SEPARATE filenames from train_170.py's outputs — the existing
gate-passing bigru_attn_170_best.keras baseline is not overwritten, so the two
runs can be compared directly.

Usage:
    cd ml
    python scripts/experiment_170/train_170_reg.py
"""

import pathlib
import json
import time
import datetime
import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras import layers, callbacks

# ── Constants (identical to train_170.py except where noted) ─────────────────
RANDOM_SEED   = 42
SEQUENCE_LEN  = 60
NUM_FEATURES  = 126
BATCH_SIZE    = 32
EPOCHS        = 150
LR            = 5e-4
WEIGHT_DECAY  = 1e-4     # NEW — AdamW
LABEL_SMOOTH  = 0.1      # NEW

DATA_DIR  = pathlib.Path("data/experiment_170")
MODEL_DIR = pathlib.Path("saved_models/experiment_170")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

tf.random.set_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


def build_bigru_attention_reg(sequence_len, num_features, num_classes):
    inp = keras.Input(shape=(sequence_len, num_features), name="input")

    x = layers.Bidirectional(layers.GRU(128, return_sequences=True), name="bigru_1")(inp)
    x = layers.BatchNormalization(name="bn_1")(x)
    x = layers.Dropout(0.4, name="drop_1")(x)          # was 0.3

    x = layers.Bidirectional(layers.GRU(64, return_sequences=True), name="bigru_2")(x)
    x = layers.BatchNormalization(name="bn_2")(x)
    x = layers.Dropout(0.2, name="drop_1b")(x)          # NEW — bigru_2 had no dropout before
    bigru_out = x

    attn_out = layers.MultiHeadAttention(num_heads=4, key_dim=32, name="mha")(x, x)

    x = layers.Add(name="residual")([bigru_out, attn_out])
    x = layers.LayerNormalization(name="layer_norm")(x)
    x = layers.GlobalAveragePooling1D(name="gap")(x)

    x = layers.Dense(256, activation="relu", name="dense_1")(x)
    x = layers.Dropout(0.5, name="drop_2")(x)           # was 0.4
    x = layers.Dense(128, activation="relu", name="dense_2")(x)
    x = layers.Dropout(0.4, name="drop_3")(x)           # was 0.3
    out = layers.Dense(num_classes, activation="softmax", name="output")(x)

    return keras.Model(inputs=inp, outputs=out, name="bigru_attention_170_reg")


def topk_accuracy(model, X, y, k):
    preds = model.predict(X, verbose=0)
    true_labels = np.argmax(y, axis=1)
    topk_preds = np.argsort(preds, axis=1)[:, -k:]
    correct = sum(t in p for t, p in zip(true_labels, topk_preds))
    return correct / len(true_labels)


def main():
    print(f"TensorFlow : {tf.__version__}")
    print(f"Keras      : {keras.__version__}")
    gpus = tf.config.list_physical_devices("GPU")
    print(f"GPUs       : {gpus if gpus else 'none — running on CPU'}\n")

    X_train = np.load(DATA_DIR / "X_train_aug.npy")
    y_train = np.load(DATA_DIR / "y_train_aug.npy")
    X_val   = np.load(DATA_DIR / "X_val_hand.npy")
    y_val   = np.load(DATA_DIR / "y_val_hand.npy")
    X_test  = np.load(DATA_DIR / "X_test_hand.npy")
    y_test  = np.load(DATA_DIR / "y_test_hand.npy")

    NUM_CLASSES = y_train.shape[1]
    print(f"X_train : {X_train.shape}   y_train : {y_train.shape}")
    print(f"X_val   : {X_val.shape}     y_val   : {y_val.shape}")
    print(f"X_test  : {X_test.shape}    y_test  : {y_test.shape}")
    print(f"Classes : {NUM_CLASSES}\n")

    model = build_bigru_attention_reg(SEQUENCE_LEN, NUM_FEATURES, NUM_CLASSES)
    model.summary()

    model.compile(
        optimizer=keras.optimizers.AdamW(learning_rate=LR, weight_decay=WEIGHT_DECAY),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTH),
        metrics=["accuracy"],
    )

    CHECKPOINT_PATH = MODEL_DIR / "bigru_attn_170_reg_best.keras"

    cb_list = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=20, restore_best_weights=True, verbose=1),
        callbacks.ModelCheckpoint(filepath=str(CHECKPOINT_PATH), monitor="val_accuracy", save_best_only=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=7, min_lr=1e-6, verbose=1),
    ]

    print(f"Model checkpoint will be saved to: {CHECKPOINT_PATH}\n")

    start_time = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=cb_list,
        verbose=1,
    )
    elapsed = time.time() - start_time
    print(f"\nTraining complete. Time: {elapsed / 60:.1f} minutes")

    best_epoch = int(np.argmax(history.history["val_accuracy"])) + 1
    best_val_acc = max(history.history["val_accuracy"])
    print(f"Best val accuracy: {best_val_acc * 100:.2f}% at epoch {best_epoch}")

    history_path = MODEL_DIR / "history_170_reg.json"
    with open(history_path, "w") as f:
        json.dump({k: [float(v) for v in vals] for k, vals in history.history.items()}, f, indent=2)
    print(f"Saved: {history_path}")

    # ── Test-set evaluation on best checkpoint ────────────────────────────────
    best_model = keras.models.load_model(str(CHECKPOINT_PATH))
    test_loss, test_top1 = best_model.evaluate(X_test, y_test, verbose=0)
    top3 = topk_accuracy(best_model, X_test, y_test, k=3)
    top5 = topk_accuracy(best_model, X_test, y_test, k=5)

    print(f"Test Top-1 Accuracy : {test_top1 * 100:.2f}%")
    print(f"Test Top-3 Accuracy : {top3 * 100:.2f}%")
    print(f"Test Top-5 Accuracy : {top5 * 100:.2f}%")

    model_card = {
        "model_name"        : "bigru_attn_170_reg",
        "architecture"      : "BiGRU + MultiHeadAttention, regularized (+dropout, label_smoothing=0.1, AdamW wd=1e-4)",
        "feature_type"      : "MediaPipe HandLandmarker (wrist-relative, palm-scale normalised)",
        "min_samples_per_class": 8,
        "sequence_length"   : SEQUENCE_LEN,
        "num_features"      : NUM_FEATURES,
        "num_classes"       : NUM_CLASSES,
        "batch_size"        : BATCH_SIZE,
        "learning_rate"     : LR,
        "weight_decay"      : WEIGHT_DECAY,
        "label_smoothing"   : LABEL_SMOOTH,
        "best_epoch"        : best_epoch,
        "best_val_acc"      : round(best_val_acc * 100, 2),
        "test_top1"         : round(test_top1 * 100, 2),
        "test_top3"         : round(top3 * 100, 2),
        "test_top5"         : round(top5 * 100, 2),
        "training_time_min" : round(elapsed / 60, 1),
        "training_date"     : datetime.datetime.now().isoformat(),
        "checkpoint"        : str(CHECKPOINT_PATH),
    }
    card_path = MODEL_DIR / "model_card_170_reg.json"
    with open(card_path, "w") as f:
        json.dump(model_card, f, indent=2)
    print(f"Saved: {card_path}")

    print("\n" + "=" * 50)
    print("TRAIN_170_REG FINDINGS SUMMARY")
    print("=" * 50)
    print(f"Best val accuracy : {best_val_acc * 100:.2f}% at epoch {best_epoch}")
    print(f"Test Top-1        : {test_top1 * 100:.2f}%")
    print(f"Test Top-3        : {top3 * 100:.2f}%")
    print(f"Test Top-5        : {top5 * 100:.2f}%")
    print(f"Training time     : {elapsed / 60:.1f} min")
    print(f"Model saved       : {CHECKPOINT_PATH}")
    print("=" * 50)


if __name__ == "__main__":
    main()
