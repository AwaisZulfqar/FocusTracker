const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..', '..')
const ML_ROOT = path.join(ROOT, 'ml')
const DATASET_DIR = process.env.ML_DATASET_DIR || path.join(ML_ROOT, 'dataset', 'raw')
const PROCESSED_DIR = process.env.ML_PROCESSED_DIR || path.join(ML_ROOT, 'processed')
const MODELS_DIR = process.env.ML_MODELS_DIR || path.join(ML_ROOT, 'models')
const REPORTS_DIR = process.env.ML_REPORTS_DIR || path.join(ML_ROOT, 'reports')

const LABELS = {
  distracted: 0,
  focused: 1,
}

const LABEL_NAMES = Object.keys(LABELS)
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'])
const IMAGE_WIDTH = 64
const IMAGE_HEIGHT = 36
const GRID_COLS = 8
const GRID_ROWS = 6

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

function toProjectPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function fromProjectPath(projectPath) {
  return path.join(ROOT, projectPath)
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const images = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      images.push(...listImages(fullPath))
      continue
    }

    if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      images.push(fullPath)
    }
  }

  return images.sort((a, b) => a.localeCompare(b))
}

function seededRandom(seed = 42) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function shuffle(items, seed = 42) {
  const rand = seededRandom(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function std(values, avg = mean(values)) {
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function safeRatio(count, total) {
  return total === 0 ? 0 : count / total
}

function makeFeatureNames() {
  const names = [
    'mean_r',
    'mean_g',
    'mean_b',
    'std_r',
    'std_g',
    'std_b',
    'mean_brightness',
    'std_brightness',
    'dark_pixel_ratio',
    'bright_pixel_ratio',
    'mean_saturation',
    'std_saturation',
    'edge_energy',
    'colorfulness',
  ]

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      names.push(`grid_${row}_${col}`)
    }
  }

  for (let i = 0; i < 8; i++) names.push(`brightness_bin_${i}`)
  for (let i = 0; i < 4; i++) names.push(`saturation_bin_${i}`)

  return names
}

const FEATURE_NAMES = makeFeatureNames()

async function extractFeatures(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixelCount = info.width * info.height
  const red = []
  const green = []
  const blue = []
  const brightness = []
  const saturation = []
  const grid = Array.from({ length: GRID_ROWS * GRID_COLS }, () => [])
  const brightnessHist = Array(8).fill(0)
  const saturationHist = Array(4).fill(0)
  let darkCount = 0
  let brightCount = 0

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * info.channels
    const r = data[offset] / 255
    const g = data[offset + 1] / 255
    const b = data[offset + 2] / 255
    const maxChannel = Math.max(r, g, b)
    const minChannel = Math.min(r, g, b)
    const bright = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const sat = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel

    red.push(r)
    green.push(g)
    blue.push(b)
    brightness.push(bright)
    saturation.push(sat)

    if (bright < 0.2) darkCount++
    if (bright > 0.8) brightCount++

    brightnessHist[Math.min(7, Math.floor(bright * 8))]++
    saturationHist[Math.min(3, Math.floor(sat * 4))]++

    const x = i % info.width
    const y = Math.floor(i / info.width)
    const gridCol = Math.min(GRID_COLS - 1, Math.floor((x / info.width) * GRID_COLS))
    const gridRow = Math.min(GRID_ROWS - 1, Math.floor((y / info.height) * GRID_ROWS))
    grid[gridRow * GRID_COLS + gridCol].push(bright)
  }

  let edgeTotal = 0
  let edgeCount = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const current = brightness[y * info.width + x]
      if (x + 1 < info.width) {
        edgeTotal += Math.abs(current - brightness[y * info.width + x + 1])
        edgeCount++
      }
      if (y + 1 < info.height) {
        edgeTotal += Math.abs(current - brightness[(y + 1) * info.width + x])
        edgeCount++
      }
    }
  }

  const meanR = mean(red)
  const meanG = mean(green)
  const meanB = mean(blue)
  const stdR = std(red, meanR)
  const stdG = std(green, meanG)
  const stdB = std(blue, meanB)
  const meanBrightness = mean(brightness)
  const stdBrightness = std(brightness, meanBrightness)
  const meanSaturation = mean(saturation)
  const stdSaturation = std(saturation, meanSaturation)

  const features = [
    meanR,
    meanG,
    meanB,
    stdR,
    stdG,
    stdB,
    meanBrightness,
    stdBrightness,
    safeRatio(darkCount, pixelCount),
    safeRatio(brightCount, pixelCount),
    meanSaturation,
    stdSaturation,
    safeRatio(edgeTotal, edgeCount),
    Math.sqrt(stdR ** 2 + stdG ** 2 + stdB ** 2),
    ...grid.map((cell) => (cell.length === 0 ? 0 : mean(cell))),
    ...brightnessHist.map((count) => safeRatio(count, pixelCount)),
    ...saturationHist.map((count) => safeRatio(count, pixelCount)),
  ]

  return features.map((value) => Number(value.toFixed(6)))
}

function parseOption(name, fallback) {
  const prefix = `--${name}=`
  const found = process.argv.find((arg) => arg.startsWith(prefix))
  if (!found) return fallback
  return found.slice(prefix.length)
}

module.exports = {
  DATASET_DIR,
  FEATURE_NAMES,
  LABELS,
  LABEL_NAMES,
  ML_ROOT,
  MODELS_DIR,
  PROCESSED_DIR,
  REPORTS_DIR,
  ensureDir,
  extractFeatures,
  fromProjectPath,
  listImages,
  parseOption,
  readJson,
  shuffle,
  toProjectPath,
  writeJson,
}
