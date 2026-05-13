const path = require('path')
const {
  MODELS_DIR,
  extractFeatures,
  readJson,
} = require('./common')

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

function loadModel(modelPath = path.join(MODELS_DIR, 'focus-logreg.json')) {
  return readJson(modelPath)
}

function predictProbability(model, features) {
  const x = features.map((value, index) => (value - model.scaler.mean[index]) / model.scaler.std[index])
  return sigmoid(model.bias + dot(model.weights, x))
}

async function predictImage(model, imagePath) {
  const features = await extractFeatures(imagePath)
  const probabilityFocused = predictProbability(model, features)
  const predicted = probabilityFocused >= model.threshold ? 'focused' : 'distracted'

  return {
    imagePath,
    predicted,
    probabilityFocused,
    focusScore: probabilityFocused * 100,
  }
}

module.exports = {
  loadModel,
  predictImage,
  predictProbability,
}
