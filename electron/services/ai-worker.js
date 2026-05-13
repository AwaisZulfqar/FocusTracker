const fs = require('fs')
const path = require('path')
const { workerData, parentPort } = require('worker_threads')
const { loadModel, predictImage } = require('../../ml/lib/predictor')

function sampleEvenly(arr, n) {
  if (arr.length <= n) return arr
  const step = arr.length / n
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)])
}

function isUrl(value) {
  return /^https?:\/\//i.test(value)
}

function useLocalAnalyzer() {
  return process.env.FOCUS_ANALYZER === 'local' || !process.env.HF_TOKEN
}

function emptyResult() {
  return {
    focusScore: 0,
    total: 0,
    focused: 0,
    distracted: 0,
    summary: 'No screenshots captured during this session.',
    distractionDetails: 'N/A',
    analyzer: 'local',
  }
}

async function analyzeWithLocalModel(screenshotPaths, taskName) {
  const modelPath = process.env.LOCAL_MODEL_PATH || path.resolve(__dirname, '../../ml/models/focus-logreg.json')

  if (!fs.existsSync(modelPath)) {
    throw new Error(`Local model not found at ${modelPath}. Run: npm run ml:preprocess && npm run ml:train`)
  }

  const localPaths = screenshotPaths.filter((item) => !isUrl(item) && fs.existsSync(item))

  if (localPaths.length === 0) {
    throw new Error('Local analyzer needs local screenshot files, but none were found.')
  }

  const model = loadModel(modelPath)
  const predictions = []

  for (const imagePath of localPaths) {
    predictions.push(await predictImage(model, imagePath))
  }

  const focused = predictions.filter((item) => item.predicted === 'focused').length
  const distracted = predictions.length - focused
  const focusScore = predictions.length === 0 ? 0 : (focused / predictions.length) * 100
  const lowConfidence = predictions.filter((item) => {
    const confidence = item.predicted === 'focused'
      ? item.probabilityFocused
      : 1 - item.probabilityFocused
    return confidence < 0.65
  }).length

  const distractedIndexes = predictions
    .map((item, index) => ({ ...item, index: index + 1 }))
    .filter((item) => item.predicted === 'distracted')
    .map((item) => `#${item.index} (${(100 - item.focusScore).toFixed(0)}% distracted)`)

  return {
    focusScore: Number(focusScore.toFixed(2)),
    total: predictions.length,
    focused,
    distracted,
    summary: `Local trained model analyzed ${predictions.length} screenshots for "${taskName}". It classified ${focused} as focused and ${distracted} as distracted.`,
    distractionDetails: distractedIndexes.length > 0
      ? `Likely distracted screenshots: ${distractedIndexes.join(', ')}.`
      : `None detected by the local model${lowConfidence > 0 ? `; ${lowConfidence} predictions were low confidence.` : '.'}`,
    analyzer: 'local',
    modelPath,
  }
}

async function analyzeWithHuggingFace(screenshotUrls, taskName) {
  const { InferenceClient } = require('@huggingface/inference')
  const client = new InferenceClient(process.env.HF_TOKEN)

  const sampled = sampleEvenly(screenshotUrls, 10)
  const imageContents = sampled.map(url => ({
    type: 'image_url',
    image_url: { url },
  }))

  const prompt = `You are a productivity analyst. The user's assigned task was: "${taskName}".
You are given ${screenshotUrls.length} screenshots taken every 30 seconds during a focus session.

For each screenshot, determine if the user was:
- FOCUSED: actively working on "${taskName}" (coding, writing, reading related material, relevant research)
- DISTRACTED: doing something unrelated (social media, games, entertainment, unrelated browsing, idle)

Return ONLY valid JSON with no extra text:
{
  "focused": <number>,
  "distracted": <number>,
  "focus_percentage": <number 0-100>,
  "summary": "<2-3 sentence objective summary of what was observed>",
  "distraction_details": "<what specific distractions were noticed, or 'None' if fully focused>"
}`

  const response = await client.chatCompletion({
    model: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    messages: [{
      role: 'user',
      content: [...imageContents, { type: 'text', text: prompt }],
    }],
    max_tokens: 512,
  })

  const raw = response.choices[0].message.content
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in AI response')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    focusScore: parsed.focus_percentage,
    total: screenshotUrls.length,
    focused: parsed.focused,
    distracted: parsed.distracted,
    summary: parsed.summary,
    distractionDetails: parsed.distraction_details,
    analyzer: 'huggingface',
  }
}

async function analyzeScreenshots() {
  const { screenshotUrls, taskName } = workerData

  if (screenshotUrls.length === 0) {
    parentPort.postMessage(emptyResult())
    return
  }

  try {
    const result = useLocalAnalyzer()
      ? await analyzeWithLocalModel(screenshotUrls, taskName)
      : await analyzeWithHuggingFace(screenshotUrls, taskName)

    parentPort.postMessage(result)
  } catch (err) {
    console.error('[ai-worker] analysis error:', {
      message: err.message,
      stack: err.stack,
    })
    parentPort.postMessage({
      focusScore: 0,
      total: screenshotUrls.length,
      focused: 0,
      distracted: screenshotUrls.length,
      summary: `Analysis failed: ${err.message}`,
      distractionDetails: 'Analysis unavailable',
      analyzer: useLocalAnalyzer() ? 'local' : 'huggingface',
    })
  }
}

analyzeScreenshots()
