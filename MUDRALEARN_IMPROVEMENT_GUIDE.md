# MudraLearn Model Improvement Guide

## Overview
This guide outlines the root causes of the current model's sub-35% accuracy in the MudraLearn sign language recognition system and provides actionable recommendations for improvement across short, medium, and long-term horizons.

## Dataset Analysis
- **Total Classes**: 383 unique sign classes
- **Total Samples**: 4,236 video clips after preprocessing
- **Class Distribution**: Severe imbalance – top classes ("Hello": 102, "Thank you": 116) vs. long tail with 1-5 samples per class
- **Features**: 30 frames × 132 landmarks (33 MediaPipe pose points × xyzv)
- **Preprocessing**: Min-max normalization, label encoding, train/val/test split (70/15/15) without stratification due to insufficient samples per class

## Current Model Performance
- **LSTM**: 32.86% test accuracy
- **GRU**: 33.18% test accuracy (best performer)
- **1D CNN**: 23.27% test accuracy
- **Observation**: High variance in validation accuracy during training, indicating overfitting to frequent classes and failure to generalize to rare classes.

## Root Cause Analysis
### Primary Cause: Extreme Class Imbalance & Insufficient Samples per Class
- Majority of classes have ≤5 samples – insufficient for deep learning to learn meaningful spatiotemporal patterns.
- Model memorizes frequent class patterns but predicts near-zero for rare classes (evidenced by 0.0 precision/recall/F1 for many classes in classification report).
- Lack of stratified split warning confirms that many classes have <2 samples, making random splitting ineffective.

### Secondary Causes
1. **Overfitting**: Training accuracy rises while validation accuracy plateaus/fluctuates.
2. **Limited Temporal Diversity**: Fixed 30-frame sequences may not capture variable signing speeds adequately.
3. **Potential Landmark Noise**: MediaPipe extraction variability for occluded or rapid signs.

## Immediate Actions (Short-term – 1–2 weeks)

### 1. Create a Balanced Subset for Initial Training
   - Identify classes with ≥20 samples (or a feasible threshold).
   - Construct a balanced dataset (e.g., top 50–100 classes with equal sampling via oversampling/undersampling).
   - Train and evaluate on this subset to establish a stronger baseline (>60% accuracy expected).

### 2. Adopt Appropriate Evaluation Metrics
   - **Top-K Accuracy** (K=3,5) to measure if correct class is within top predictions.
   - **Per-class Precision/Recall/F1** for classes with sufficient samples.
   - **Confusion Matrix Analysis** to identify confusable sign pairs.

### 3. Simple Data Augmentation
   - **Temporal**: Random time warping, speed variation (0.8x–1.2x), frame dropping/repeating.
   - **Spatial**: Small random jitter to landmark coordinates (±0.01 normalized units), scaling.
   - **Mirroring**: Horizontally flip landmarks for symmetric signs (validate per class).

### 4. adjust Training Strategy
   - Use **class-weighted loss** (inverse frequency) or **focal loss** to mitigate imbalance.
   - Reduce model complexity initially (e.g., smaller LSTM layers) to avoid overfitting on limited data.

## Medium-term Improvements (1–2 months)

### 1. Enhanced Model Architectures
   - **CNN-LSTM Hybrid**: CNN layers extract spatial features per frame; LSTM models temporal dynamics.
   - **Attention Mechanisms**: Temporal or spatial attention to focus on informative frames/landmarks.
   - **Pose-Invariant Representations**: Use joint angles, bone lengths, or relative coordinates to reduce sensitivity to absolute position.

### 2. Transfer Learning & Pretraining
   - Pretrain on large public pose-based action datasets (e.g., NTU RGB+D, Kinetics) then fine-tune on MudraLearn.
   - Use **Metric Learning** (e.g., contrastive loss, triplet loss) to learn an embedding space where similar signs are close.

### 3. Semi-supervised & Few-shot Learning
   - Leverage unlabeled video data (if available) via consistency regularization or pseudo-labeling.
   - Implement prototypical networks or matching networks for rapid adaptation to new/sign rare classes.

### 4. Robust Landmark Extraction
   - Evaluate alternative pose estimators (MediaPipe Holistic, OpenPose, BlazePose) for better hand/sign coverage.
   - Apply smoothing filters (e.g., Savitzky-Golay) to landmark trajectories to reduce jitter.

## Long-term Strategy (3+ months)

### 1. Problem Reframing
   - **Core Vocabulary First**: Deploy a high-accuracy model for the top 50–100 most useful signs; use rejection/fallback for others.
   - **Retrieval-based Approach**: Learn a sign embedding space and retrieve nearest neighbors from a labeled support set (avoids large softmax over 383 classes).
   - **Hierarchical Classification**: First predict linguistic category (e.g., "Verbs"), then specific sign within category.

### 2. Active Data Collection Pipeline
   - Deploy current model to collect uncertain predictions (low max probability) for human labeling.
   - Prioritize sampling of underrepresented classes and hard examples.
   - Implement periodic rebalancing and retraining schedule.

### 3. Continuous Monitoring & MLOps
   - Track per-class precision/recall over time to detect degradation.
   - Automate dataset versioning, model retraining, and A/B testing in production.
   - Use tools like MLflow or Weights & Biases for experiment tracking.

### 4. User-centric Evaluation
   - Conduct usability studies with deaf/hard-of-hearing users to prioritize signs that improve communication efficacy.
   - Measure real-world metrics: recognition latency, user satisfaction, task success rate.

## Expected Outcomes
| Intervention | Accuracy Gain (Est.) | Effort |
|--------------|----------------------|--------|
| Balanced subset + weighting | +20–25% (on subset) | Low |
| Temporal/Spatial Augmentation | +3–5% | Low |
| CNN-LSTM + Attention | +5–10% | Medium |
| Transfer Learning | +8–15% | Medium |
| Active Learning + Reframing | +15–20% (overall) | High |

## Conclusion
The current model’s accuracy is fundamentally limited by extreme class imbalance and insufficient data per class—not architectural flaws. By first addressing the data distribution through balanced subset training, appropriate metrics, and simple augmentations, a solid foundation can be built. Subsequent architectural enhancements, transfer learning, and an active data collection pipeline will push performance toward production viability. A phased approach—starting with a manageable, well-represented vocabulary—ensures measurable progress while laying groundwork for full-scale deployment.

---  
*Guide generated 2026-06-16. Adjust thresholds and timelines based on team capacity and data availability.*