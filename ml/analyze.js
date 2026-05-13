const path = require('path')
const {
  MODELS_DIR,
  fromProjectPath,
  parseOption,
} = require('./lib/common')
const { loadModel, predictImage } = require('./lib/predictor')

async function main() {
  const imageArg = process.argv[2] || parseOption('image', '')
  if (!imageArg) {
    throw new Error('Usage: npm run ml:analyze -- path/to/screenshot.png')
  }

  const model = loadModel(path.join(MODELS_DIR, 'focus-logreg.json'))
  const imagePath = path.isAbsolute(imageArg) ? imageArg : fromProjectPath(imageArg)
  const prediction = await predictImage(model, imagePath)

  console.log(JSON.stringify({
    imagePath: imageArg,
    predicted: prediction.predicted,
    probabilityFocused: Number(prediction.probabilityFocused.toFixed(6)),
    focusScore: Number(prediction.focusScore.toFixed(2)),
  }, null, 2))
}

main().catch((err) => {
  console.error(`Analysis failed: ${err.message}`)
  process.exit(1)
})
