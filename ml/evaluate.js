const path = require('path')
const {
  LABELS,
  MODELS_DIR,
  PROCESSED_DIR,
  REPORTS_DIR,
  ensureDir,
  readJson,
  writeJson,
} = require('./lib/common')

function sigmoid(value) {
  if (value < -35) return 0
  if (value > 35) return 1
  return 1 / (1 + Math.exp(-value))
}

function dot(a, b) {
  let total = 0
  for (let i = 0; i < a.length; i++) total += a[i] * b[i]
  return total
}

function predictProbability(model, features) {
  const x = features.map((value, index) => (value - model.scaler.mean[index]) / model.scaler.std[index])
  return sigmoid(model.bias + dot(model.weights, x))
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator
}

function main() {
  ensureDir(REPORTS_DIR)

  const model = readJson(path.join(MODELS_DIR, 'focus-logreg.json'))
  const testSet = readJson(path.join(PROCESSED_DIR, 'test.json'))
  const records = testSet.records || []

  if (records.length === 0) {
    throw new Error('No test records found. Add more images or lower --train-ratio during preprocessing.')
  }

  const predictions = records.map((record) => {
    const probabilityFocused = predictProbability(model, record.features)
    const predictedLabel = probabilityFocused >= model.threshold ? LABELS.focused : LABELS.distracted
    return {
      id: record.id,
      imagePath: record.imagePath,
      actual: record.labelName,
      predicted: predictedLabel === LABELS.focused ? 'focused' : 'distracted',
      probabilityFocused: Number(probabilityFocused.toFixed(6)),
    }
  })

  let tp = 0
  let tn = 0
  let fp = 0
  let fn = 0

  for (const prediction of predictions) {
    if (prediction.actual === 'focused' && prediction.predicted === 'focused') tp++
    if (prediction.actual === 'distracted' && prediction.predicted === 'distracted') tn++
    if (prediction.actual === 'distracted' && prediction.predicted === 'focused') fp++
    if (prediction.actual === 'focused' && prediction.predicted === 'distracted') fn++
  }

  const accuracy = safeDivide(tp + tn, records.length)
  const precision = safeDivide(tp, tp + fp)
  const recall = safeDivide(tp, tp + fn)
  const f1 = safeDivide(2 * precision * recall, precision + recall)

  const report = {
    createdAt: new Date().toISOString(),
    modelPath: 'ml/models/focus-logreg.json',
    testCount: records.length,
    metrics: {
      accuracy: Number(accuracy.toFixed(4)),
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
    },
    confusionMatrix: {
      truePositive: tp,
      trueNegative: tn,
      falsePositive: fp,
      falseNegative: fn,
    },
    predictions,
  }

  writeJson(path.join(REPORTS_DIR, 'evaluation-report.json'), report)

  console.log(`Evaluation complete: ${records.length} test images`)
  console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`)
  console.log(`Precision: ${precision.toFixed(4)}, recall: ${recall.toFixed(4)}, F1: ${f1.toFixed(4)}`)
}

try {
  main()
} catch (err) {
  console.error(`Evaluation failed: ${err.message}`)
  process.exit(1)
}
