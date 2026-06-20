"""
Evaluate the trained model with additional metrics:
- Top-K accuracy (K=1,3,5)
- Per-class precision, recall, F1-score
- Confusion matrix analysis
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.metrics import classification_report, confusion_matrix, top_k_accuracy_score
import json
import matplotlib.pyplot as plt
import seaborn as sns

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), '../saved_models')

# Load test data
X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
print(f"Test data shape: X={X_test.shape}, y={y_test.shape}")

# Load the balanced model (trained on filtered classes)
model_path = os.path.join(SAVED_MODEL_DIR, 'gru_balanced_best.keras')
if not os.path.exists(model_path):
    # Fallback to original model
    model_path = os.path.join(SAVED_MODEL_DIR, 'mudralearn_model.keras')
    print(f"Using original model: {model_path}")
else:
    print(f"Using balanced model: {model_path}")

model = load_model(model_path)
print(f"Model loaded from {model_path}")

# Load class mapping if exists (for balanced model)
mapping_path = os.path.join(SAVED_MODEL_DIR, 'class_mapping.json')
if os.path.exists(mapping_path):
    with open(mapping_path, 'r') as f:
        class_map = json.load(f)
    # Convert keys back to int for mapping
    class_map = {int(k): int(v) for k, v in class_map.items()}
    # Create inverse mapping for filtered classes -> original indices
    inv_map = {v: k for k, v in class_map.items()}
    print(f"Loaded class mapping for {len(class_map)} filtered classes")
else:
    class_map = None
    inv_map = None
    print("No class mapping found - using full class set")

# Load label map for human-readable class names
label_map_path = os.path.join(SAVED_MODEL_DIR, 'label_map.json')
if os.path.exists(label_map_path):
    with open(label_map_path, 'r') as f:
        label_map = json.load(f)
    # Convert keys to int
    label_map = {int(k): v for k, v in label_map.items()}
    print(f"Loaded label map with {len(label_map)} classes")
else:
    label_map = {}
    print("Warning: label_map.json not found")

# Get predictions
print("Generating predictions...")
y_pred_proba = model.predict(X_test, verbose=0)
y_pred = np.argmax(y_pred_proba, axis=1)
y_true = np.argmax(y_test, axis=1)

# If using filtered classes, we need to map predictions back to original label space
if class_map is not None:
    # y_pred contains indices in filtered space (0..N-1)
    # Map back to original class indices
    y_pred_original = np.vectorize(inv_map.get)(y_pred)
    # For y_true, we need to filter to only those classes that are in our filtered set
    # and then remap them to filtered space for consistent evaluation
    # First, identify which test samples belong to filtered classes
    filtered_class_indices = set(class_map.keys())
    mask = np.isin(y_true, list(filtered_class_indices))
    print(f"Test samples in filtered classes: {mask.sum()}/{len(y_true)} ({mask.mean()*100:.1f}%)")

    # For evaluation on filtered classes only:
    y_true_filtered = y_true[mask]
    y_pred_filtered = y_pred_original[mask]
    # Remap to filtered space for consistent labeling
    y_true_filtered_mapped = np.vectorize(class_map.get)(y_true_filtered)
    y_pred_filtered_mapped = np.vectorize(class_map.get)(y_pred_filtered)

    num_classes_eval = len(class_map)
    print(f"Evaluating on {num_classes_eval} filtered classes")
else:
    # Full class evaluation
    y_true_filtered = y_true
    y_pred_filtered = y_pred
    y_true_filtered_mapped = y_true
    y_pred_filtered_mapped = y_pred
    mask = np.ones_like(y_true, dtype=bool)
    num_classes_eval = y_test.shape[1]

# Compute Top-K accuracy
print("\n=== Top-K Accuracy ===")
for k in [1, 3, 5]:
    if k <= num_classes_eval:
        # top_k_accuracy_score expects probabilities and true labels in [0, n_classes)
        # We need to use the filtered probability space
        if class_map is not None:
            # Need to get probabilities for filtered classes only
            # This is tricky - we'd need to renormalize or extract subset
            # For simplicity, we'll compute top-k on the full space but only for filtered class samples
            top_k = tf.keras.metrics.TopKCategoricalAccuracy(k=k)
            # Create one-hot for filtered classes in original space
            y_true_onehot_filtered = np.zeros_like(y_test)
            y_true_onehot_filtered[np.arange(len(y_true)), y_true] = 1
            # Only evaluate on samples that are in filtered classes
            top_k.update_state(y_true_onehot_filtered[mask], y_pred_proba[mask])
        else:
            top_k = tf.keras.metrics.TopKCategoricalAccuracy(k=k)
            y_true_onehot = np.zeros_like(y_test)
            y_true_onehot[np.arange(len(y_true)), y_true] = 1
            top_k.update_state(y_true_onehot, y_pred_proba)
        print(f"Top-{k} Accuracy: {top_k.result().numpy()*100:.2f}%")

# Standard accuracy
accuracy = np.mean(y_pred_filtered == y_true_filtered)
print(f"\nStandard Accuracy (filtered classes): {accuracy*100:.2f}%")

# Classification report (per-class precision, recall, f1)
print("\n=== Classification Report (Filtered Classes) ===")
# Get class names for the filtered classes
if class_map is not None:
    filtered_class_names = [label_map.get(i, f"Class_{i}") for i in sorted(class_map.keys())]
else:
    filtered_class_names = [label_map.get(i, f"Class_{i}") for i in range(num_classes_eval)]

report = classification_report(
    y_true_filtered_mapped,
    y_pred_filtered_mapped,
    labels=list(range(num_classes_eval)),
    target_names=filtered_class_names,
    digits=3
)
print(report)

# Save report to file
report_path = os.path.join(SAVED_MODEL_DIR, 'evaluation_report.txt')
with open(report_path, 'w') as f:
    f.write("MudraLearn Model Evaluation Report\n")
    f.write("="*50 + "\n\n")
    f.write(f"Model: {model_path}\n")
    f.write(f"Test samples: {len(y_test)}\n")
    if class_map is not None:
        f.write(f"Filtered classes: {len(class_map)} (from {y_test.shape[1]} total)\n")
        f.write(f"Samples in filtered classes: {mask.sum()}/{len(y_true)} ({mask.mean()*100:.1f}%)\n\n")
    f.write("Top-K Accuracy:\n")
    for k in [1, 3, 5]:
        if k <= num_classes_eval:
            # Recompute for saving
            top_k = tf.keras.metrics.TopKCategoricalAccuracy(k=k)
            if class_map is not None:
                y_true_onehot_filtered = np.zeros_like(y_test)
                y_true_onehot_filtered[np.arange(len(y_true)), y_true] = 1
                top_k.update_state(y_true_onehot_filtered[mask], y_pred_proba[mask])
            else:
                y_true_onehot = np.zeros_like(y_test)
                y_true_onehot[np.arange(len(y_true)), y_true] = 1
                top_k.update_state(y_true_onehot, y_pred_proba)
            f.write(f"  Top-{k}: {top_k.result().numpy()*100:.2f}%\n")
    f.write(f"\nStandard Accuracy: {accuracy*100:.2f}%\n\n")
    f.write("Classification Report:\n")
    f.write(report)
print(f"Evaluation report saved to {report_path}")

# Plot confusion matrix for top N classes (by support)
print("\nGenerating confusion matrix...")
# Compute confusion matrix
cm = confusion_matrix(y_true_filtered_mapped, y_pred_filtered_mapped, labels=list(range(num_classes_eval)))
# Get support (number of true instances per class)
support = np.sum(y_test[mask], axis=0) if class_map is not None else np.sum(y_test, axis=0)
if class_map is not None:
    # Map support to filtered class order
    support_filtered = support[list(class_map.keys())]
else:
    support_filtered = support

# Select top N classes by support for visualization
N_VIS = min(20, num_classes_eval)
top_indices = np.argsort(support_filtered)[-N_VIS:][::-1]  # descending order
cm_top = cm[np.ix_(top_indices, top_indices)]
support_top = support_filtered[top_indices]
class_names_top = [filtered_class_names[i] for i in top_indices]

plt.figure(figsize=(12, 10))
sns.heatmap(cm_top, annot=True, fmt='d', cmap='Blues',
            xticklabels=class_names_top,
            yticklabels=class_names_top)
plt.title(f'Confusion Matrix (Top {N_VIS} Classes by Support)')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
cm_path = os.path.join(SAVED_MODEL_DIR, 'confusion_matrix_top20.png')
plt.savefig(cm_path, dpi=150)
plt.close()
print(f"Confusion matrix saved to {cm_path}")

# Also save per-class metrics to JSON for easy viewing
from sklearn.metrics import precision_recall_fscore_support
precision, recall, f1, _ = precision_recall_fscore_support(
    y_true_filtered_mapped, y_pred_filtered_mapped,
    labels=list(range(num_classes_eval)),
    average=None
)

per_class_metrics = []
for i in range(num_classes_eval):
    per_class_metrics.append({
        "class_index": int(i),
        "class_name": filtered_class_names[i],
        "precision": float(precision[i]),
        "recall": float(recall[i]),
        "f1_score": float(f1[i]),
        "support": int(support_filtered[i]) if 'support_filtered' in locals() else int(np.sum(y_test[:, i]))
    })

# Sort by F1 score descending
per_class_metrics.sort(key=lambda x: x['f1_score'], reverse=True)

metrics_path = os.path.join(SAVED_MODEL_DIR, 'per_class_metrics.json')
with open(metrics_path, 'w') as f:
    json.dump(per_class_metrics, f, indent=2)
print(f"Per-class metrics saved to {metrics_path}")

# Print top 10 and bottom 10 classes by F1
print("\n=== Top 10 Classes by F1-Score ===")
for m in per_class_metrics[:10]:
    print(f"{m['class_name']:20s} F1={m['f1_score']:.3f}  P={m['precision']:.3f}  R={m['recall']:.3f}  supp={m['support']}")

print("\n=== Bottom 10 Classes by F1-Score ===")
for m in per_class_metrics[-10:]:
    print(f"{m['class_name']:20s} F1={m['f1_score']:.3f}  P={m['precision']:.3f}  R={m['recall']:.3f}  supp={m['support']}")

print("\nEvaluation complete!")