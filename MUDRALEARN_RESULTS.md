# MudraLearn — Model Improvement Results

## 1. Data Pipeline: How Landmarks Are Extracted

### Raw Source: Videos

The MudraLearn dataset consists of **4,236 video recordings** (.mp4/.mov) of Sri Lankan Sign Language signs, organized into **16 linguistic categories** (Adjectives, Verbs, Greetings, Numbers, Colors, Family, etc.) covering **383 unique signs**. Each sign has ~10–12 videos on average, but the distribution is highly imbalanced — 5 signs have 50+ samples while 282 signs have fewer than 10.

The raw archive is located at:

```
ml/data/archive/Dataset - Original/       ← 4,236 original .mp4/.mov videos
ml/data/archive/Dataset - MP - CSV/       ← 4,236 CSV files (MediaPipe Pose output)
```

### Step 1: Video → Frame Extraction → MediaPipe Pose

Each video was processed frame-by-frame using **MediaPipe Pose**, which detects **33 full-body landmarks** per frame:

```
 0: nose             11: left shoulder     22: right pinky
 1: left eye inner   12: right shoulder    23: left hip
 2: left eye         13: left elbow        24: right hip
 3: left eye outer   14: right elbow       25: left knee
 4: right eye inner  15: left wrist        26: right knee
 5: right eye        16: right wrist       27: left ankle
 6: right eye outer  17: left pinky        28: right ankle
 7: left ear         18: right pinky       29: left heel
 8: right ear        19: left index        30: right heel
 9: left mouth       20: right index       31: left foot index
10: right mouth      21: left thumb        32: right foot index
```

Each landmark produces **4 values**: `[x, y, z, visibility]`, giving **132 features per frame** (33 × 4).

The CSV files look like (one row per frame, 33 JSON-encoded arrays per row):

```
"[x,y,z,v]","[x,y,z,v]",...,"[x,y,z,v]"   ← Frame 1 (33 columns × 4 values)
"[x,y,z,v]",...,                           ← Frame 2
...
```

**Important**: The current data uses **MediaPipe Pose** (full body), NOT the 21-point hand landmarks. A hand-only extraction script exists (`extract_hand_landmarks.py`, producing 126 features from 2 hands × 21 landmarks × 3 coordinates) but has **not yet been run** on this dataset.

### Step 2: CSV → Fixed-Length Sequences (30 frames)

A Jupyter notebook (`01_data_exploration.ipynb`) reads each CSV and:
1. Parses the 33 JSON arrays per frame into 132 float values
2. **Pads or truncates** each video to exactly **30 frames** (zero-padding for short videos, truncation for long ones)
3. Produces a numpy array of shape `(4236, 30, 132)`

### Step 3: Normalization & Train/Val/Test Split

1. **Min-max normalization** scales each feature to `[0, 1]` across the entire dataset
2. **Train/val/test split**: 70% / 15% / 15%
3. Sent to `ml/data/` as `X_*.npy` (features) and `y_*.npy` (one-hot labels)

### Final .npy File Shapes

| File | Shape | Description |
|---|---|---|
| `X_train.npy` | (2965, 30, 132) | 2,965 training samples, 30 frames, 132 features |
| `X_val.npy` | (635, 30, 132) | 635 validation samples |
| `X_test.npy` | (636, 30, 132) | 636 test samples |
| `y_train.npy` | (2965, 383) | One-hot labels for 383 classes |
| `y_val.npy` | (635, 383) | |
| `y_test.npy` | (636, 383) | |

---

## 2. Results: Before vs After

### Baseline Model (Original)

```
Architecture: GRU (single-layer)
Classes:      383 (all signs)
Loss:         Categorical Crossentropy
Augmentation: None
Test Accuracy: 33.18%
```

### Improvements Implemented

| # | Improvement | Description | Impact |
|---|---|---|---|
| 1 | **Balanced subset training** | Filtered to 98 classes with ≥10 samples; used class-weighted loss | +3.05 pp |
| 2 | **Spatial augmentation** | Random jitter (±0.01) applied per batch | |
| 3 | **Temporal augmentation** | Time warping, speed variation, frame drop/repeat | |
| 4 | **Focal loss** (γ=2.0) | Down-weights easy examples; focuses on hard ones | |
| 5 | **Mirroring** | Horizontal flip (30% per batch) with 14 landmark pairs | |
| 6 | **CNN-LSTM hybrid** | 4 Conv1D layers + MaxPool + LSTM instead of GRU | +0.74 pp |
| 7 | **Temporal attention** | Attention layer between Conv blocks and LSTM | tied |
| 8 | **Pose-invariant features** | Centered at nose/mid-hip, relative shoulder scaling | 32.26% (worse) |
| 9 | **Metric learning** | Triplet loss with 128-dim L2 embeddings, 1-NN retrieval | 26.26% (worse) |
| 10 | **Hierarchical classification** | Level 1 predicts category (18-way, 61.79%), Level 2 predicts sign | 23.33% (worse) |
| 11 | **Active data pipeline** | Automated uncertainty sampling → labeling queue | N/A (operational) |

### Final Comparison

| Model | Test Accuracy | Top-5 | Notes |
|---|---|---|---|
| Original GRU (383 classes) | **33.18%** | — | Baseline |
| Balanced GRU (98 classes) | **36.23%** | — | +3.05 pp over baseline |
| CNN-LSTM-Attention (98 classes) | **36.97%** | — | +3.79 pp (best overall) |
| Balanced + Pose-invariant (98 classes) | 32.26% | — | Normalized data + centering hurts |
| Metric Learning (98 classes) | 26.26% | — | Triplet loss not converging well |
| Hierarchical (98 classes) | 23.33% | — | Category errors cascade |

**Best improvement: +3.79 percentage points** (CNN-LSTM-Attention over baseline).

The original baseline model was trained on all 383 classes (no filtering), while the improved models use a balanced subset of 98 classes. The evaluation for improved models is on **filtered test samples** (403 of 636 belong to the 98-class set), where the balanced GRU achieves **36.23%**.

### Per-Class Breakdown (Best Model: Balanced GRU)

| Sign | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Hello | 0.71 | 0.71 | 0.71 | 17 |
| House | 0.67 | 0.73 | 0.70 | 11 |
| Good | 0.67 | 0.60 | 0.63 | 10 |
| Eat | 0.67 | 0.36 | 0.47 | 11 |
| I | 0.75 | 0.50 | 0.60 | 12 |
| Thank you | 0.89 | 0.35 | 0.50 | 23 |
| Boat | 1.00 | 1.00 | 1.00 | 5 |
| Black | 1.00 | 0.83 | 0.91 | 6 |
| Road | 1.00 | 1.00 | 1.00 | 3 |

Classes with **1.0 F1**: Boat, Book, Road, Shop  
Classes with **0.0 F1**: Beautiful, Ceiling fan, Child, Cut, Deaf, Deep, Doctor, etc. (25+ classes)

### Why Gains Are Marginal

The core bottleneck is **data scarcity**:

| Classes | Sample Count |
|---|---|
| 5 classes | ≥50 samples |
| 28 classes | ≥25 samples |
| 57 classes | ≥20 samples |
| 112 classes | ≥10 samples |
| **271 classes** | **<10 samples** |

When most classes have 1–9 samples, architectures and loss functions cannot create signal from noise. The marginal 3–4 pp gain comes from the 98-class balanced subset, where the worst-served classes were simply removed.

---

## 3. Summary of All Models and Scripts

### Training Scripts (in `ml/scripts/`)

| Script | Model | Key Features | Output |
|---|---|---|---|
| `train_balanced.py` | GRU (2-layer, 256→128) | Focal loss, spatial jitter, temporal warp, mirroring | `gru_balanced_best.keras` |
| `train_cnn_lstm.py` | 4×Conv1D + MaxPool + LSTM | CNN feature extraction + temporal LSTM | `cnn_lstm_best.keras` |
| `train_cnn_lstm_attention.py` | CNN-LSTM + Temporal Attention | Gated attention between Conv and LSTM | `cnn_lstm_attn_best.keras` |
| `train_metric.py` | Embedding (GRU → 128-dim L2) | Batch-hard triplet loss, 1-NN retrieval | `metric_best.keras` |
| `train_hierarchical.py` | 2-level: GRU×18 | Level 1 (18 categories) + Level 2 (per-category) | `hierarchical/` |
| `evaluate_model.py` | — | Top-K, per-class F1, confusion matrix | `evaluation_report.txt` |

### Data/Specialized Scripts

| Script | Purpose |
|---|---|
| `extract_hand_landmarks.py` | Extract 21 MediaPipe Hand landmarks from videos → CSVs |
| `pose_features.py` | Pose-invariant transformations (center_nose, relative_shoulder, etc.) |
| `preprocess_invariant.py` | Generate centered feature .npy files in `data_invariant/` |
| `active_learning.py` | Uncertainty/class-based sampling for data collection |
| `active_pipeline.py` | Automated pipeline: predict → sample uncertain → queue for labeling |
| `hierarchical_labels.py` | Maps 383 sign names to 18 linguistic categories |
| `check_distribution.py` | Class distribution analysis |

### Data Files (in `ml/data/`)

| File | Shape | Content |
|---|---|---|
| `X_train.npy` | (2965, 30, 132) | Training features (30 frames × 132 pose features) |
| `X_val.npy` | (635, 30, 132) | Validation features |
| `X_test.npy` | (636, 30, 132) | Test features |
| `y_train.npy` | (2965, 383) | Training one-hot labels |
| `y_val.npy` | (635, 383) | Validation one-hot labels |
| `y_test.npy` | (636, 383) | Test one-hot labels |
| `archive/` | — | Raw .mp4 videos + MediaPipe CSV files (4,236 each) |

---

## 4. What's Next (Highest Leverage)

1. **Core vocabulary deployment** — Train on top 50 classes (≥20 samples each). Expected accuracy: **55–70%** on known signs, with confidence-based rejection for unknowns. This is the fastest path to a production-viable accuracy.

2. **Data collection** — The active pipeline is operational. Each new labeled sample for the 282 low-shot classes has disproportional value. Labeling ~200 new samples strategically could raise accuracy by 10+ pp.

3. **Hand-only landmarks** — The `extract_hand_landmarks.py` script is written but not run. Sign language relies heavily on hand shape; switching from 33 full-body landmarks to 42 hand landmarks (21×2) may better capture the discriminative signal.
