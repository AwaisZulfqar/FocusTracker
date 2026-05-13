const path = require('path')
const {
  LABELS,
  MODELS_DIR,
  PROCESSED_DIR,
  REPORTS_DIR,
  ensureDir,
  parseOption,
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

function standardize(records) {
  const featureCount = records[0].features.length
  const mean = Array(featureCount).fill(0)
  const std = Array(featureCount).fill(0)

  for (const record of records) {
    for (let i = 0; i < featureCount; i++) mean[i] += record.features[i]
  }
  for (let i = 0; i < featureCount; i++) mean[i] /= records.length

  for (const record of records) {
    for (let i = 0; i < featureCount; i++) std[i] += (record.features[i] - mean[i]) ** 2
  }
  for (let i = 0; i < featureCount; i++) std[i] = Math.sqrt(std[i] / records.length) || 1

  const transformed = records.map((record) => ({
    ...record,
    x: record.features.map((value, index) => (value - mean[index]) / std[index]),
  }))

  return { mean, std, transformed }
}

function predictProbability(model, features) {
  const x = features.map((value, index) => (value - model.scaler.mean[index]) / model.scaler.std[index])
  return sigmoid(model.bias + dot(model.weights, x))
}

function score(model, records) {
  let correct = 0
  let loss = 0

  for (const record of records) {
    const p = predictProbability(model, record.features)
    const y = record.label
    const prediction = p >= model.threshold ? LABELS.focused : LABELS.distracted
    if (prediction === y) correct++
    loss += -(y * Math.log(Math.max(p, 1e-9)) + (1 - y) * Math.log(Math.max(1 - p, 1e-9)))
  }

  return {
    accuracy: records.length === 0 ? 0 : correct / records.length,
    loss: records.length === 0 ? 0 : loss / records.length,
  }
}

function trainLogisticRegression(records, featureNames) {
  const { mean, std, transformed } = standardize(records)
  const featureCount = transformed[0].x.length
  const weights = Array(featureCount).fill(0)
  let bias = 0

  const learningRate = Number(parseOption('learning-rate', '0.08'))
  const epochs = Number(parseOption('epochs', '1000'))
  const l2 = Number(parseOption('l2', '0.001'))
  const history = []

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const gradW = Array(featureCount).fill(0)
    let gradB = 0
    let loss = 0

    for (const record of transformed) {
      const y = record.label
      const p = sigmoid(bias + dot(weights, record.x))
      const error = p - y
      gradB += error
      loss += -(y * Math.log(Math.max(p, 1e-9)) + (1 - y) * Math.log(Math.max(1 - p, 1e-9)))

      for (let i = 0; i < featureCount; i++) {
        gradW[i] += error * record.x[i] + l2 * weights[i]
      }
    }

    for (let i = 0; i < featureCount; i++) {
      weights[i] -= learningRate * (gradW[i] / transformed.length)
    }
    bias -= learningRate * (gradB / transformed.length)

    if (epoch === 1 || epoch % 100 === 0 || epoch === epochs) {
      history.push({ epoch, loss: Number((loss / transformed.length).toFixed(6)) })
    }
  }

  return {
    modelType: 'binary_logistic_regression',
    createdAt: new Date().toISOString(),
    labels: { distracted: 0, focused: 1 },
    positiveLabel: 'focused',
    threshold: 0.5,
    featureNames,
    scaler: { mean, std },
    weights,
    bias,
    training: { epochs, learningRate, l2, history },
  }
}

function main() {
  ensureDir(MODELS_DIR)
  ensureDir(REPORTS_DIR)

  const trainSet = readJson(path.join(PROCESSED_DIR, 'train.json'))
  const records = trainSet.records || []
  const labels = new Set(records.map((record) => record.label))

  if (records.length < 2 || labels.size < 2) {
    throw new Error('Training needs at least one focused image and one distracted image after preprocessing.')
  }

  const model = trainLogisticRegression(records, trainSet.featureNames)
  const trainingMetrics = score(model, records)

  const report = {
    createdAt: model.createdAt,
    trainCount: records.length,
    accuracy: Number(trainingMetrics.accuracy.toFixed(4)),
    loss: Number(trainingMetrics.loss.toFixed(6)),
    modelPath: 'ml/models/focus-logreg.json',
  }

  writeJson(path.join(MODELS_DIR, 'focus-logreg.json'), model)
  writeJson(path.join(REPORTS_DIR, 'training-report.json'), report)

  console.log(`Training complete: ${records.length} images`)
  console.log(`Training accuracy: ${(trainingMetrics.accuracy * 100).toFixed(2)}%`)
  console.log('Model saved to ml/models/focus-logreg.json')
}

try {
  main()
} catch (err) {
  console.error(`Training failed: ${err.message}`)
  process.exit(1)
}
