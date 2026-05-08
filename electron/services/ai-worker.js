const { workerData, parentPort } = require('worker_threads')
const { InferenceClient } = require('@huggingface/inference')

function sampleEvenly(arr, n) {
  if (arr.length <= n) return arr
  const step = arr.length / n
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)])
}

async function analyzeScreenshots() {
  const { screenshotUrls, taskName } = workerData

  if (screenshotUrls.length === 0) {
    parentPort.postMessage({
      focusScore: 0, total: 0, focused: 0, distracted: 0,
      summary: 'No screenshots captured during this session.',
      distractionDetails: 'N/A',
    })
    return
  }

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

  try {
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

    parentPort.postMessage({
      focusScore: parsed.focus_percentage,
      total: screenshotUrls.length,
      focused: parsed.focused,
      distracted: parsed.distracted,
      summary: parsed.summary,
      distractionDetails: parsed.distraction_details,
    })
  } catch (err) {
    console.error('[ai-worker] HF inference error:', {
      message: err.message,
      status: err.status,
      response: err.response,
      cause: err.cause,
      stack: err.stack,
    })
    parentPort.postMessage({
      focusScore: 0,
      total: screenshotUrls.length,
      focused: 0,
      distracted: screenshotUrls.length,
      summary: `AI analysis failed: ${err.message}`,
      distractionDetails: 'Analysis unavailable',
    })
  }
}

analyzeScreenshots()
