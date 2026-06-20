"""
Active data collection pipeline.
Automates: load model → predict → compute uncertainty → queue uncertain samples
for human labeling → track labeling progress.

Usage:
    python active_pipeline.py                          # use test set as unlabeled pool
    python active_pipeline.py --source unlabeled_csvs/  # custom data directory
    python active_pipeline.py --schedule                # run once, log for cron
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from pathlib import Path
from datetime import datetime
import argparse

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')
PIPELINE_DIR = os.path.join(os.path.dirname(__file__), '../active_pipeline_data')
os.makedirs(PIPELINE_DIR, exist_ok=True)

QUEUE_FILE = os.path.join(PIPELINE_DIR, 'labeling_queue.json')
LABELED_FILE = os.path.join(PIPELINE_DIR, 'labeled_log.json')
METRICS_FILE = os.path.join(PIPELINE_DIR, 'pipeline_metrics.json')

UNCERTAINTY_METHODS = ['least_confidence', 'margin', 'entropy']


def load_best_model():
    """Try metric model first, then balanced GRU, then original."""

    # Custom layer needed for metric model deserialization
    class L2Normalize(tf.keras.layers.Layer):
        def call(self, x):
            return tf.math.l2_normalize(x, axis=-1)
        def get_config(self):
            return super().get_config()

    candidates = [
        (os.path.join(SAVED_MODEL_DIR, 'gru_balanced_best.keras'), {}),
        (os.path.join(SAVED_MODEL_DIR, 'mudralearn_model.keras'), {}),
        (os.path.join(SAVED_MODEL_DIR, 'metric_best.keras'), {'L2Normalize': L2Normalize}),
    ]
    for path, custom_objs in candidates:
        if os.path.exists(path):
            try:
                model = load_model(path, custom_objects=custom_objs, safe_mode=False, compile=False)
                print(f"Loaded model: {path}")
                return model
            except Exception as e:
                print(f"  Failed to load {path}: {e}")
                continue
    raise FileNotFoundError("No model found in saved_models/")


def compute_uncertainty(y_pred_proba, method='least_confidence'):
    """
    Compute uncertainty scores for each prediction.
    Higher = more uncertain.
    """
    if method == 'least_confidence':
        return 1.0 - np.max(y_pred_proba, axis=1)
    elif method == 'margin':
        sorted_probas = np.sort(y_pred_proba, axis=1)[:, ::-1]
        return 1.0 - (sorted_probas[:, 0] - sorted_probas[:, 1])
    elif method == 'entropy':
        return -np.sum(y_pred_proba * np.log(y_pred_proba + 1e-8), axis=1)
    else:
        raise ValueError(f"Unknown method: {method}")


def load_or_create_queue():
    """Load existing labeling queue or create empty one."""
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE) as f:
            return json.load(f)
    return []


def load_or_create_labeled():
    """Load existing labeled log."""
    if os.path.exists(LABELED_FILE):
        with open(LABELED_FILE) as f:
            return json.load(f)
    return []


def save_queue(queue):
    with open(QUEUE_FILE, 'w') as f:
        json.dump(queue, f, indent=2)


def save_labeled(labeled):
    with open(LABELED_FILE, 'w') as f:
        json.dump(labeled, f, indent=2)


def save_metrics(metrics):
    with open(METRICS_FILE, 'w') as f:
        json.dump(metrics, f, indent=2)


def run_pipeline(source=None, n_samples=50, method='least_confidence',
                 min_confidence=0.1, model_path=None):
    """Main pipeline: predict → score → queue uncertain samples."""
    print("=" * 50)
    print("ACTIVE DATA COLLECTION PIPELINE")
    print("=" * 50)

    # 1. Load model
    if model_path:
        model = load_model(model_path, compile=False)
        print(f"Loaded model: {model_path}")
    else:
        model = load_best_model()

    # 2. Load data to score
    if source and os.path.isdir(source):
        # Load CSV files from directory
        print(f"Scanning {source} for CSV files...")
        csv_files = list(Path(source).rglob('*.csv'))
        print(f"Found {len(csv_files)} CSV files")
        # For now, just note this — full CSV->features pipeline not implemented here
        print("Warning: CSV loading requires preprocessing. Using test set instead.")
        source = None

    if source is None:
        X = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
        y = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
        print(f"Using test set: {X.shape}")

    # 3. Get predictions
    y_pred_proba = model.predict(X, verbose=0)
    y_pred = np.argmax(y_pred_proba, axis=1)
    y_true = np.argmax(y, axis=1)

    # 4. Load label map
    label_map_path = os.path.join(SAVED_MODEL_DIR, 'label_map.json')
    if os.path.exists(label_map_path):
        with open(label_map_path) as f:
            label_map = json.load(f)
        label_map = {int(k): v for k, v in label_map.items()}
    else:
        label_map = {}

    # 5. Compute uncertainty
    uncertainty = compute_uncertainty(y_pred_proba, method=method)
    max_probas = np.max(y_pred_proba, axis=1)

    # 6. Load existing queue (avoid re-queuing same samples)
    queue = load_or_create_queue()
    labeled = load_or_create_labeled()
    queued_indices = set(s.get('sample_index') for s in queue)
    labeled_indices = set(s.get('sample_index') for s in labeled)

    # 7. Find uncertain samples not already queued/labeled
    candidate_mask = np.ones(len(X), dtype=bool)
    candidate_mask[list(queued_indices | labeled_indices)] = False
    # Also filter out already-correct predictions with high confidence
    correct = (y_pred == y_true)
    candidate_mask[correct & (max_probas > min_confidence)] = False

    candidate_indices = np.where(candidate_mask)[0]
    if len(candidate_indices) == 0:
        print("No new uncertain samples found. All candidates already queued or labeled.")
        return

    # Sort by uncertainty (highest first)
    candidate_uncertainties = uncertainty[candidate_indices]
    sorted_order = np.argsort(candidate_uncertainties)[::-1][:n_samples]
    selected_indices = candidate_indices[sorted_order]

    # 8. Add to queue
    new_samples = []
    for idx in selected_indices:
        sample = {
            'sample_index': int(idx),
            'uncertainty': float(uncertainty[idx]),
            'confidence': float(max_probas[idx]),
            'predicted_class': label_map.get(y_pred[idx], str(y_pred[idx])),
            'true_class': label_map.get(y_true[idx], str(y_true[idx])),
            'correct': bool(y_pred[idx] == y_true[idx]),
            'queued_at': datetime.now().isoformat(),
            'labeled': False,
        }
        new_samples.append(sample)

    queue.extend(new_samples)
    save_queue(queue)

    # 9. Summary
    n_labeled = sum(1 for s in labeled if s.get('labeled'))
    n_pending = sum(1 for s in queue if not s.get('labeled'))
    correct_in_queue = sum(1 for s in new_samples if s['correct'])
    avg_uncertainty = np.mean([s['uncertainty'] for s in new_samples])

    print(f"\nResults:")
    print(f"  Samples scored:     {len(X)}")
    print(f"  New to queue:       {len(new_samples)}")
    print(f"  Pending labeling:   {n_pending}")
    print(f"  Already labeled:    {n_labeled}")
    print(f"  Correct in batch:   {correct_in_queue}/{len(new_samples)} ({correct_in_queue/len(new_samples)*100:.1f}%)")
    print(f"  Avg uncertainty:    {avg_uncertainty:.4f}")
    print(f"\nTop 10 most uncertain:")
    for s in new_samples[:10]:
        mark = '✓' if s['correct'] else '✗'
        print(f"  {mark} | True: {s['true_class']:20s} | Pred: {s['predicted_class']:20s} | "
              f"Conf: {s['confidence']:.3f} | Unc: {s['uncertainty']:.3f}")

    # 10. Save metrics
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'samples_scored': len(X),
        'new_queued': len(new_samples),
        'total_pending': n_pending,
        'total_labeled': n_labeled,
        'avg_uncertainty_new': float(avg_uncertainty),
        'correct_rate_new': correct_in_queue / len(new_samples) if new_samples else 0,
    }
    save_metrics(metrics)
    print(f"\nQueue saved to: {QUEUE_FILE}")
    print(f"Metrics saved to: {METRICS_FILE}")


def mark_labeled(sample_indices, true_labels=None):
    """Mark queue samples as labeled (call this after human labeling)."""
    queue = load_or_create_queue()
    labeled = load_or_create_labeled()

    for idx in sample_indices:
        for s in queue:
            if s['sample_index'] == idx and not s['labeled']:
                s['labeled'] = True
                s['labeled_at'] = datetime.now().isoformat()
                if true_labels and idx in true_labels:
                    s['human_label'] = true_labels[idx]
                labeled.append(s)
                break

    # Remove labeled items from queue
    queue = [s for s in queue if not s['labeled']]
    save_queue(queue)
    save_labeled(labeled)
    print(f"Marked {len(sample_indices)} samples as labeled.")
    print(f"  Queue: {len(queue)} pending")
    print(f"  Labeled log: {len(labeled)} total")


def show_status():
    """Show current pipeline status."""
    queue = load_or_create_queue()
    labeled = load_or_create_labeled()

    print("=" * 50)
    print("PIPELINE STATUS")
    print("=" * 50)
    print(f"  Pending labeling:  {sum(1 for s in queue if not s.get('labeled'))}")
    print(f"  Labeled:           {sum(1 for s in labeled if s.get('labeled'))}")
    print(f"  Total tracked:     {len(queue) + len(labeled)}")

    if os.path.exists(METRICS_FILE):
        with open(METRICS_FILE) as f:
            metrics = json.load(f)
        print(f"\n  Last run:          {metrics.get('timestamp', 'N/A')}")
        print(f"  Last scored:       {metrics.get('samples_scored', 'N/A')}")
        print(f"  Last queued:       {metrics.get('new_queued', 'N/A')}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Active data collection pipeline')
    parser.add_argument('--source', type=str, default=None,
                        help='Directory with unlabeled CSV data')
    parser.add_argument('--model', type=str, default=None,
                        help='Path to model file')
    parser.add_argument('--n', type=int, default=50,
                        help='Number of uncertain samples to queue')
    parser.add_argument('--method', choices=UNCERTAINTY_METHODS, default='least_confidence',
                        help='Uncertainty scoring method')
    parser.add_argument('--mark-labeled', type=int, nargs='+', default=None,
                        help='Mark sample indices as labeled')
    parser.add_argument('--status', action='store_true',
                        help='Show pipeline status')
    parser.add_argument('--schedule', action='store_true',
                        help='Run in non-interactive mode (for cron)')

    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.mark_labeled:
        mark_labeled(args.mark_labeled)
    else:
        run_pipeline(source=args.source, n_samples=args.n,
                     method=args.method, model_path=args.model)
