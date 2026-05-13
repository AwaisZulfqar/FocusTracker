# FocusTracker ML Pipeline

This folder adds the academic ML pipeline required for dataset preprocessing, model training, analysis, and evaluation.

## Dataset Layout

Place labeled screenshots here:

```text
ml/dataset/raw/focused/
ml/dataset/raw/distracted/
```

Use screenshots from real focus sessions. Put task-related screens in `focused` and unrelated screens in `distracted`.

## Commands

```bash
npm run ml:preprocess
npm run ml:train
npm run ml:evaluate
npm run ml:analyze -- ml/dataset/raw/focused/example.png
npm run ml:all
```

## What Each Step Does

- `ml:preprocess`: resizes images to 64x36, extracts image features, and creates train/test JSON files.
- `ml:train`: trains a binary logistic regression model from the processed features.
- `ml:evaluate`: calculates accuracy, precision, recall, F1 score, and confusion matrix on the test set.
- `ml:analyze`: runs the trained local model on one screenshot and returns a focus prediction.

## Outputs

```text
ml/processed/dataset.json
ml/processed/train.json
ml/processed/test.json
ml/processed/preprocessing-report.json
ml/models/focus-logreg.json
ml/reports/training-report.json
ml/reports/evaluation-report.json
```

For temporary experiments, the paths can be overridden:

```bash
ML_DATASET_DIR=/tmp/focus-dataset ML_PROCESSED_DIR=/tmp/focus-processed npm run ml:preprocess
```

This local model is used by the app for live focus-session analysis and also proves the dataset preprocessing, model training, analysis, and evaluation workflow.

## Use Local Model In The App

Set this in `.env`:

```env
FOCUS_ANALYZER=local
```

Then train the model:

```bash
npm run ml:all
```

When the app runs in local mode, focus-session screenshots are saved locally and analyzed by `ml/models/focus-logreg.json`.
