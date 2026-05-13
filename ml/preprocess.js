const path = require('path')
const {
  DATASET_DIR,
  FEATURE_NAMES,
  LABELS,
  LABEL_NAMES,
  PROCESSED_DIR,
  ensureDir,
  extractFeatures,
  listImages,
  parseOption,
  shuffle,
  toProjectPath,
  writeJson,
} = require('./lib/common')

async function main() {
  ensureDir(PROCESSED_DIR)

  const splitRatio = Number(parseOption('train-ratio', '0.8'))
  const seed = Number(parseOption('seed', '42'))
  const records = []
  const classCounts = {}

  for (const labelName of LABEL_NAMES) {
    const labelDir = path.join(DATASET_DIR, labelName)
    const images = listImages(labelDir)
    classCounts[labelName] = images.length

    for (const imagePath of images) {
      const features = await extractFeatures(imagePath)
      records.push({
        id: `${labelName}/${path.basename(imagePath)}`,
        imagePath: toProjectPath(imagePath),
        label: LABELS[labelName],
        labelName,
        features,
      })
    }
  }

  if (records.length === 0) {
    throw new Error(`No dataset images found. Add screenshots to ${toProjectPath(DATASET_DIR)}/focused and ${toProjectPath(DATASET_DIR)}/distracted.`)
  }

  const train = []
  const test = []

  for (const labelName of LABEL_NAMES) {
    const items = shuffle(records.filter((item) => item.labelName === labelName), seed)
    const testCount = items.length >= 5 ? Math.max(1, Math.round(items.length * (1 - splitRatio))) : 0
    const trainCount = items.length - testCount
    train.push(...items.slice(0, trainCount))
    test.push(...items.slice(trainCount))
  }

  const dataset = {
    createdAt: new Date().toISOString(),
    datasetDir: toProjectPath(DATASET_DIR),
    imageSize: { width: 64, height: 36 },
    labels: LABELS,
    featureNames: FEATURE_NAMES,
    records,
  }

  const split = {
    createdAt: dataset.createdAt,
    seed,
    trainRatio: splitRatio,
    classCounts,
    total: records.length,
    trainCount: train.length,
    testCount: test.length,
    train,
    test,
  }

  writeJson(path.join(PROCESSED_DIR, 'dataset.json'), dataset)
  writeJson(path.join(PROCESSED_DIR, 'train.json'), { featureNames: FEATURE_NAMES, records: train })
  writeJson(path.join(PROCESSED_DIR, 'test.json'), { featureNames: FEATURE_NAMES, records: test })
  writeJson(path.join(PROCESSED_DIR, 'preprocessing-report.json'), split)

  console.log(`Preprocessing complete: ${records.length} images`)
  console.log(`Focused: ${classCounts.focused}, distracted: ${classCounts.distracted}`)
  console.log(`Train: ${train.length}, test: ${test.length}`)
}

main().catch((err) => {
  console.error(`Preprocessing failed: ${err.message}`)
  process.exit(1)
})
