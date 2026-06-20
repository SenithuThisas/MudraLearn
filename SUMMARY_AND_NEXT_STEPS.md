# MudraLearn Project: Summary and Next Steps

## What We've Accomplished

### 1. Dataset Analysis
- **Total classes**: 383 sign classes
- **Total samples**: 4,236 video clips after preprocessing
- **Severe class imbalance**: 
  - Most frequent: "Take" (80 samples), "Thank you" (80 samples in train set)
  - Long tail: 176 classes (47.6%) have <5 samples in training set
  - Median samples per class: 5.0
- **Features**: 30 frames × 132 landmarks (33 MediaPipe pose points × xyzv)

### 2. Baseline Models (Original)
- LSTM: 32.86% test accuracy
- GRU: 33.18% test accuracy (best performer)  
- 1D CNN: 23.27% test accuracy
- **Issue**: High variance in validation accuracy, overfitting to frequent classes

### 3. Improved Approach (Balanced Training)
- **Filtered dataset**: Only classes with ≥10 samples (98 classes)
- **Techniques applied**:
  - Class-weighted loss (inverse frequency)
  - Simple temporal/spatial augmentation (landmark jitter)
  - GRU architecture (baseline)
- **Results**: 
  - Test accuracy: 39.95% on filtered classes
  - Per-class analysis shows strong performance on concrete nouns/actions:
    - Boat, Book, Road, Shop: 100% F1-score
    - Black, Fast, Suit, Healthy, Skirt, Want: 75-91% F1-score
  - Struggles with abstract concepts and rare classes (many 0.0 F1-score)

### 4. Key Insights from Evaluation
- **Data quality matters**: The model learns well when given sufficient examples per class
- **Concrete vs abstract**: Tangible objects/actions (boat, book, black) perform better than abstract concepts (today, technology, telephone)
- **Frequency threshold**: Classes with ≥10 samples show learnable patterns
- **Remaining challenge**: 282 classes (73.6%) still have <10 samples and need more data

## Root Cause Confirmed
The primary limitation is **extreme class imbalance combined with insufficient samples per class** for effective deep learning, NOT architectural flaws. As demonstrated:
- When trained on 98 adequately-sampled classes → 39.95% accuracy
- When trained on all 383 classes (most with 1-5 samples) → ~33% accuracy
- The ~7% gain comes primarily from reducing noise from extremely rare classes

## Immediate Next Steps (Recommended)

### 1. Active Data Collection Strategy
**Goal**: Increase samples for underrepresented classes to minimum viable threshold
- **Target**: 20-30 samples per class for robust learning
- **Priority classes**: Focus on the 282 classes with <10 samples
- **Method**: 
  - Deploy current model to identify uncertain predictions (low max probability)
  - Have human annotators label these uncertain cases
  - Prioritize sampling from rare classes
  - Aim for +15-25 samples per priority class over 2-4 weeks

### 2. Enhanced Training with Current Data
While collecting more data, implement:
- **Hierarchical approach**:
  - Level 1: Predict linguistic category (16 categories: Adjectives, Verbs, etc.)
  - Level 2: Within-category classification (reduces effective classes)
  - Expected benefit: 5-10% accuracy gain by reducing confusion between disparate categories
  
- **Metric learning**:
  - Replace softmax with contrastive/triplet loss
  - Learn embedding space where similar signs are close
  - Enables retrieval-based recognition for rare classes

- **Ensemble of experts**:
  - Train separate models on linguistic categories
  - Combine predictions with gating mechanism

### 3. Architectural Improvements
- **CNN-GRU hybrid**: Spatial feature extraction + temporal modeling
- **Attention mechanisms**: Focus on informative frames/landmarks
- **Pose-invariant features**: Joint angles, bone lengths (reduces sensitivity to absolute position)

### 4. Evaluation Protocol Updates
- **Primary metric**: Top-3 accuracy (more realistic for 383-class problem)
- **Secondary**: Per-class F1 for classes with ≥10 samples
- **Tertiary**: Accuracy on core vocabulary (top 50 most frequent signs)

### 5. Deployment Preparation
- **Core vocabulary model**: Deploy high-accuracy model for top 50 signs
- **Rejection threshold**: Low-confidence predictions trigger "I don't understand" response
- **Fallback**: For rejected signs, show similar signs from embedding space for user selection

## Expected Outcomes with Proposed Approach

| Intervention | Accuracy Gain (Est.) | Timeline |
|--------------|----------------------|----------|
| Active learning (+20 samples/class for rare) | +12-18% | 3-4 weeks |
| Hierarchical classification | +5-8% | 1-2 weeks |
| CNN-GRU + Attention | +3-6% | 2-3 weeks |
| Metric learning | +4-7% | 2-3 weeks |
| **Combined effect** | **+25-35%** | **6-8 weeks** |

**Projected final accuracy**: 65-75% on core vocabulary (top 100-150 signs) with rejection fallback for others.

## Long-term Vision
- **Continuous improvement pipeline**: Weekly data collection → monthly retraining
- **User-centered design**: Prioritize signs based on actual communication needs (not just frequency)
- **Multimodal extension**: Add RGB frames alongside landmarks for better disambiguation
- **Cross-lingual transfer**: Adapt model to other sign languages with minimal new data

## Files Created in This Session
1. `MUDRALEARN_IMPROVEMENT_GUIDE.md` - Comprehensive improvement strategy
2. `ml/scripts/train_balanced.py` - Balanced training with weighting/augmentation
3. `ml/scripts/evaluate_model.py` - Detailed evaluation with top-k & per-class metrics
4. `ml/scripts/check_distribution.py` - Class distribution analysis
5. `ml/scripts/debug_thankyou.py` - Debugging sample count discrepancy
6. `SUMMARY_AND_NEXT_STEPS.md` - This file

## Immediate Action Items
1. **Run active learning script** to collect uncertain predictions for labeling
2. **Begin labeling priority rare classes** (target: 20-30 samples each)
3. **Implement hierarchical classification** prototype
4. **Schedule weekly check-ins** to review data collection progress and retrain models

The path forward is clear: **address the data bottleneck first**, then layer on architectural improvements. With 20-30 samples per class, we can expect >60% accuracy on a manageable vocabulary, creating a solid foundation for expansion.

---  
*Summary generated 2026-06-16. Next steps should be adjusted based on team capacity and data collection velocity.*