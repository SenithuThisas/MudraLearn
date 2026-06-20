"""
Active learning script to identify uncertain predictions for labeling.
This helps prioritize data collection for underrepresented or confusing classes.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
import argparse

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')

def load_data_and_model(model_path=None):
    """Load test data and model."""
    # Load test data
    X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
    y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
    print(f"Loaded test data: X={X_test.shape}, y={y_test.shape}")

    # Load label map
    label_map_path = os.path.join(SAVED_MODEL_DIR, 'label_map.json')
    with open(label_map_path, 'r') as f:
        label_map = json.load(f)
    label_map = {int(k): v for k, v in label_map.items()}

    # Load model
    if model_path is None:
        # Try balanced model first, then fallback
        balanced_path = os.path.join(SAVED_MODEL_DIR, 'gru_balanced_best.keras')
        original_path = os.path.join(SAVED_MODEL_DIR, 'mudralearn_model.keras')
        if os.path.exists(balanced_path):
            model_path = balanced_path
            print(f"Using balanced model: {model_path}")
        else:
            model_path = original_path
            print(f"Using original model: {model_path}")

    model = load_model(model_path)
    print(f"Model loaded from {model_path}")

    return X_test, y_test, model, label_map

def get_uncertain_predictions(model, X, y_true, label_map, top_n=50):
    """
    Get top-N most uncertain predictions.

    Uncertainty measured by: 1 - max_prediction_probability
    (Lower max probability = higher uncertainty)
    """
    print("Generating predictions...")
    y_pred_proba = model.predict(X, verbose=0)
    y_pred = np.argmax(y_pred_proba, axis=1)
    y_true_idx = np.argmax(y_true, axis=1)

    # Calculate confidence (max probability) and uncertainty
    max_probas = np.max(y_pred_proba, axis=1)
    uncertainty = 1 - max_probas

    # Get indices sorted by uncertainty (highest first)
    uncertain_indices = np.argsort(uncertainty)[::-1][:top_n]

    results = []
    for idx in uncertain_indices:
        true_class = label_map[y_true_idx[idx]]
        pred_class = label_map[y_pred[idx]]
        confidence = max_probas[idx]
        uncertainty_score = uncertainty[idx]

        results.append({
            'sample_index': int(idx),
            'true_class': true_class,
            'predicted_class': pred_class,
            'confidence': float(confidence),
            'uncertainty': float(uncertainty_score),
            'correct': true_class == pred_class
        })

    return results, y_pred_proba[uncertain_indices]

def get_class_samples(X, y, label_map, target_classes, samples_per_class=5):
    """
    Get samples from specific target classes (e.g., rare classes).
    """
    y_idx = np.argmax(y, axis=1)
    results = []

    for class_name in target_classes:
        # Find index for this class name
        class_idx = None
        for idx, name in label_map.items():
            if name == class_name:
                class_idx = idx
                break

        if class_idx is None:
            print(f"Warning: Class '{class_name}' not found in label map")
            continue

        # Find samples of this class
        class_samples = np.where(y_idx == class_idx)[0]

        if len(class_samples) == 0:
            print(f"Warning: No samples found for class '{class_name}'")
            continue

        # Select up to samples_per_class
        selected = class_samples[:min(samples_per_class, len(class_samples))]

        # Get predictions for these samples
        # Note: We need the model for this, so we'll do prediction later
        # For now, just return the indices
        for idx in selected:
            results.append({
                'sample_index': int(idx),
                'class_name': class_name,
                'class_index': int(class_idx),
                'needs_prediction': True  # Flag to get prediction later
            })

    return results

def main():
    parser = argparse.ArgumentParser(description='Active learning for MudraLearn')
    parser.add_argument('--mode', choices=['uncertain', 'by_class'], default='uncertain',
                      help='Mode: uncertain (most uncertain predictions) or by_class (specific classes)')
    parser.add_argument('--model', type=str, default=None,
                      help='Path to model file (default: best available)')
    parser.add_argument('--top_n', type=int, default=50,
                      help='Number of uncertain samples to return')
    parser.add_argument('--output', type=str, default='active_learning_samples.json',
                      help='Output file path')
    parser.add_argument('--classes', type=str, nargs='+',
                      help='List of class names to sample (for --mode by_class)')

    args = parser.parse_args()

    # Load data and model
    X_test, y_test, model, label_map = load_data_and_model(args.model)

    if args.mode == 'uncertain':
        # Get most uncertain predictions
        print(f"Finding top {args.top_n} most uncertain predictions...")
        results, _ = get_uncertain_predictions(model, X_test, y_test, label_map, args.top_n)

        # Add actual data samples for review
        for i, r in enumerate(results):
            idx = r['sample_index']
            # We could save the actual landmark sequence here if needed
            # For now, just the metadata

        # Sort by uncertainty (highest first)
        results.sort(key=lambda x: x['uncertainty'], reverse=True)

    elif args.mode == 'by_class':
        if not args.classes:
            print("Error: --classes required for --mode by_class")
            return

        print(f"Getting samples for classes: {args.classes}")
        results = get_class_samples(X_test, y_test, label_map, args.classes, samples_per_class=10)

        # Now get predictions for these samples
        sample_indices = [r['sample_index'] for r in results]
        X_selected = X_test[sample_indices]
        y_pred_proba = model.predict(X_selected, verbose=0)
        y_pred = np.argmax(y_pred_proba, axis=1)
        max_probas = np.max(y_pred_proba, axis=1)

        # Add predictions to results
        for i, r in enumerate(results):
            idx = r['sample_index']
            true_idx = np.argmax(y_test[idx])
            pred_idx = y_pred[i]
            true_class = label_map[true_idx]
            pred_class = label_map[pred_idx]
            confidence = max_probas[i]

            r.update({
                'true_class': true_class,
                'predicted_class': pred_class,
                'confidence': float(confidence),
                'correct': true_class == pred_class
            })

    # Save results
    output_path = os.path.join(SAVED_MODEL_DIR, args.output)
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Results saved to {output_path}")

    # Print summary
    if args.mode == 'uncertain':
        correct_count = sum(1 for r in results if r['correct'])
        print(f"\nSummary:")
        print(f"  Total samples analyzed: {len(results)}")
        print(f"  Correctly classified: {correct_count} ({correct_count/len(results)*100:.1f}%)")
        print(f"  Average confidence: {np.mean([r['confidence'] for r in results]):.3f}")
        print(f"  Average uncertainty: {np.mean([r['uncertainty'] for r in results]):.3f}")

        # Show top 10 most uncertain
        print(f"\nTop 10 most uncertain samples:")
        for i, r in enumerate(results[:10]):
            status = "✓" if r['correct'] else "✗"
            print(f"  {i+1:2d}. {status} True: {r['true_class']:20s} | Pred: {r['predicted_class']:20s} | "
                  f"Conf: {r['confidence']:.3f}")
    else:
        correct_count = sum(1 for r in results if r['correct'])
        print(f"\nSummary for {len(results)} samples:")
        print(f"  Correctly classified: {correct_count} ({correct_count/len(results)*100:.1f}%)")

        # Group by class
        from collections import defaultdict
        class_stats = defaultdict(lambda: {'correct': 0, 'total': 0, 'confidences': []})
        for r in results:
            class_stats[r['true_class']]['total'] += 1
            if r['correct']:
                class_stats[r['true_class']]['correct'] += 1
            class_stats[r['true_class']]['confidences'].append(r['confidence'])

        print(f"\nPer-class accuracy:")
        for class_name, stats in sorted(class_stats.items()):
            acc = stats['correct'] / stats['total'] if stats['total'] > 0 else 0
            avg_conf = np.mean(stats['confidences']) if stats['confidences'] else 0
            print(f"  {class_name:20s}: {acc*100:5.1f}% ({stats['correct']}/{stats['total']}) | "
                  f"Avg conf: {avg_conf:.3f}")

if __name__ == '__main__':
    main()
