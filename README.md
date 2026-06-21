<div align="center">

# MudraLearn

### AI-Powered Sign Language Recognition & Learning Platform

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-blue?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev)

> A full-stack web application that uses computer vision and deep learning to recognise over **200 sign language gestures** in real-time through your webcam.

</div>

---

## ✨ Features

- 🎥 **Live Translation** — Sign to your webcam and get instant AI predictions
- 🧠 **BiGRU + Attention Model** — State-of-the-art sequence model trained on 2,477 sign language videos
- 📖 **Dictionary** — Browse and learn all 204 supported signs
- 🏋️ **Practice Mode** — Guided practice sessions with feedback
- ⚡ **Real-time Processing** — 60 frames captured in ~2 seconds via MediaPipe HandLandmarker
- 🌙 **Dark Mode** — Full dark mode support out of the box

---

## 📊 Model Performance

| Metric | Score |
|--------|-------|
| **Top-1 Accuracy** | **63.31%** |
| **Top-3 Accuracy** | **79.84%** |
| **Top-5 Accuracy** | **84.68%** |
| **Dataset** | SSL400 (2,477 videos, 204 classes) |
| **Architecture** | BiGRU(128) + BiGRU(64) + MultiHeadAttention |

> **Improvement**: From a 33% baseline (V1 Pose landmarks) to 63.31% (V2 Hand landmarks) — a **91% relative improvement** in Top-1 accuracy.

---

## 🏗️ Architecture

```
MudraLearn/
├── frontend/               # React + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── hooks/
│       │   └── useHandLandmarker.ts   # MediaPipe hook with normalisation
│       ├── pages/
│       │   ├── TranslatePage.tsx      # Live webcam translation
│       │   ├── DictionaryPage.tsx     # Sign dictionary browser
│       │   └── PracticePage.tsx       # Guided practice mode
│       └── components/
│           └── Navigation.tsx
│
├── backend/                # Python + FastAPI + PostgreSQL
│   └── app/
│       ├── routers/
│       │   └── predict.py             # POST /api/predict endpoint
│       ├── services/
│       │   └── inference.py           # Model loading & prediction
│       └── models/                    # SQLAlchemy DB models
│
└── ml/                     # Machine Learning pipeline
    ├── scripts/
    │   ├── extract_hand_landmarks.py  # Feature extraction from videos
    │   └── augment_sequences.py       # 5× data augmentation
    ├── notebooks/
    │   ├── 04_hand_data_prep.ipynb    # Data preparation & splits
    │   ├── 05_augmentation.ipynb      # Augmentation verification
    │   ├── 06_bigru_attention_train.ipynb  # Model training
    │   ├── 07_ensemble.ipynb          # Ensemble training
    │   └── 08_evaluation.ipynb        # Final evaluation & gate check
    └── saved_models/
        ├── mudralearn_model.keras     # Production model (v2)
        └── label_map.json             # 204-class label map
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 16
- **Redis**

### 1. Clone the Repository

```bash
git clone https://github.com/SenithuThisas/MudraLearn.git
cd MudraLearn
```

### 2. Set Up the Python Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r ml/requirements_v2.txt
pip install -r backend/requirements.txt
```

### 3. Start Background Services

```bash
brew services start postgresql@16 && brew services start redis
# Or on Linux: sudo service postgresql start && sudo service redis-server start
```

### 4. Configure the Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

### 5. Run the Full Stack

Open **three separate terminal tabs**:

```bash
# Tab 1 — Backend API
cd backend && source ../.venv/bin/activate
uvicorn app.main:app --reload
# Runs at http://localhost:8000

# Tab 2 — Frontend
cd frontend && npm install
npm run dev
# Runs at http://localhost:5173

# Tab 3 — (Optional) Jupyter for ML notebooks
cd ml && source ../.venv/bin/activate
jupyter notebook
```

---

## 🧠 How It Works

### Feature Extraction Pipeline

1. **Video Input** — Raw `.mp4` video files from the SSL400 dataset
2. **Hand Detection** — MediaPipe `HandLandmarker` detects 21 landmarks (x, y, z) per hand per frame
3. **Normalisation** — Applied per frame:
   - **Wrist-relative**: Subtract wrist (landmark 0) to centre the hand at the origin
   - **Palm-scale**: Divide by the wrist-to-middle-MCP distance so hand size is invariant
4. **Temporal Resampling** — Every video is resampled to exactly **60 frames** via linear interpolation
5. **Feature Vector** — Each frame becomes `[left_hand(63) + right_hand(63)]` = **126 features**
6. **Sequence Shape** — Final input tensor: `(60, 126)`

### Model Architecture

```
Input (60, 126)
    │
    ├── BiGRU(128) → BiGRU(64) → MultiHeadAttention(4 heads)
    │                                          │
    │                              GlobalAveragePooling
    │                                          │
    └───────────────────────────────────── Dense(204, softmax)
                                                │
                                         Top-K Prediction
```

### Data Augmentation (5× training data)
- **Gaussian Noise** — Small perturbations to landmark coordinates
- **Temporal Stretch** — Randomly speed up or slow down the gesture
- **Spatial Jitter** — Randomly shift hand position
- **Horizontal Mirror** — Flip gesture to simulate signing from different angles

### Real-time Inference Flow

```
Webcam → MediaPipe HandLandmarker → Normalise Landmarks
       → Buffer 60 frames → POST /api/predict
       → FastAPI → Keras model inference
       → Top-3 predictions + confidence scores → UI
```

---

## 🔌 API Reference

### `POST /api/predict`

Accepts a 60-frame hand landmark sequence and returns sign predictions.

**Request Body:**
```json
{
  "sequence": [[0.0, 0.1, ...], ...]  // 60 frames × 126 features
}
```

**Response:**
```json
{
  "top_sign": "Hello",
  "confidence": 0.87,
  "top3": [
    { "sign": "Hello", "confidence": 0.87 },
    { "sign": "Thank you", "confidence": 0.08 },
    { "sign": "Sorry", "confidence": 0.05 }
  ],
  "feedback": "good"
}
```

---

## 📁 ML Notebooks Guide

| Notebook | Purpose | Run Order |
|----------|---------|-----------|
| `01_data_exploration.ipynb` | *(V1 — archived)* Original Pose data exploration | — |
| `02_lstm_train.ipynb` | *(V1 — archived)* Original LSTM training | — |
| `03_compare_models.ipynb` | *(V1 — archived)* Original model comparison | — |
| `04_hand_data_prep.ipynb` | **V2** — Load CSVs, create train/val/test splits | 1st |
| `05_augmentation.ipynb` | **V2** — Apply and verify 5× augmentation | 2nd |
| `06_bigru_attention_train.ipynb` | **V2** — Train the BiGRU + Attention model | 3rd |
| `07_ensemble.ipynb` | **V2** — Train ensemble + promote best candidate | 4th |
| `08_evaluation.ipynb` | **V2** — Final evaluation metrics & gate check | 5th |

> **Note**: Notebooks `01`, `02`, and `03` are archived reference material from the V1 pipeline. You only need to run notebooks `04`–`08` for the current V2 pipeline.

---

## 🔖 Version History

| Tag | Description | Top-1 Accuracy |
|-----|------------|----------------|
| `v1.0-baseline` | MediaPipe Pose, 30 frames, basic GRU | ~33% |
| `v2.0-hand-landmarks` | MediaPipe Hand, 60 frames, BiGRU + Attention | **63.31%** |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **State Management** | Zustand, TanStack Query |
| **Hand Tracking** | MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) |
| **Backend** | FastAPI, Python 3.10+ |
| **ML Framework** | TensorFlow / Keras |
| **Database** | PostgreSQL 16, SQLAlchemy, Alembic |
| **Cache** | Redis |
| **Dataset** | SSL400 Sign Language Dataset |

---

## 📄 License

This project is developed as a BSc Final Year Project.

---

<div align="center">
  Built with ❤️ using MediaPipe, TensorFlow, and FastAPI
</div>
