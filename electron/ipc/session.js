const { ipcMain } = require('electron')
const path = require('path')
const keytar = require('keytar')
const { getPrisma } = require('../services/prisma')
const { captureAndUpload } = require('../services/screenshot')
const { getWindow, setSessionActive } = require('../main')
const { Worker } = require('worker_threads')

let sessionState = null
let screenshotTimeouts = []
let tickInterval = null

// Plan random screenshot times: 3 per minute, one per 20s window, random offset within window.
function planScreenshotTimes(totalSeconds) {
  const times = []
  const minutes = Math.floor(totalSeconds / 60)
  for (let m = 0; m < minutes; m++) {
    for (let w = 0; w < 3; w++) {
      const offset = w * 20 + Math.random() * 20
      const t = m * 60 + offset
      if (t < totalSeconds) times.push(t)
    }
  }
  // Tail seconds (<60s leftover): proportional shots
  const tail = totalSeconds - minutes * 60
  if (tail >= 20) {
    const extras = Math.floor(tail / 20)
    for (let w = 0; w < extras; w++) {
      times.push(minutes * 60 + w * 20 + Math.random() * 20)
    }
  }
  return times
}

function clearScreenshotTimeouts() {
  for (const id of screenshotTimeouts) clearTimeout(id)
  screenshotTimeouts = []
}

ipcMain.handle('session:start', async (_, todoId) => {
  if (sessionState) return { error: 'Session already active' }

  const userId = await keytar.getPassword('focus-tracker', 'current-user')
  const prisma = getPrisma()
  const todo = await prisma.todo.findUnique({ where: { id: todoId } })
  if (!todo) return { error: 'Todo not found' }

  const session = await prisma.session.create({
    data: {
      userId: Number(userId),
      todoId,
      taskName: todo.taskName,
      startedAt: new Date(),
    },
  })

  const totalSeconds = todo.durationMinutes * 60

  sessionState = {
    sessionId: session.id,
    userId: Number(userId),
    todoId,
    taskName: todo.taskName,
    durationMinutes: todo.durationMinutes,
    remainingSeconds: totalSeconds,
    screenshotUrls: [],
    screenshotIndex: 0,
  }

  setSessionActive(true)

  tickInterval = setInterval(() => {
    if (!sessionState) return
    sessionState.remainingSeconds--
    getWindow()?.webContents.send('session:tick', sessionState.remainingSeconds)

    if (sessionState.remainingSeconds <= 0) {
      clearInterval(tickInterval)
      clearScreenshotTimeouts()
      tickInterval = null
      endSession()
    }
  }, 1000)

  const times = planScreenshotTimes(totalSeconds)
  sessionState.plannedShots = times.length
  for (const t of times) {
    const id = setTimeout(async () => {
      if (!sessionState) return
      const sid = sessionState.sessionId
      const idx = sessionState.screenshotIndex++
      try {
        const url = await captureAndUpload(sid, idx)
        if (url && sessionState && sessionState.sessionId === sid) {
          sessionState.screenshotUrls.push(url)
          getWindow()?.webContents.send('session:screenshot', sessionState.screenshotUrls.length)
        }
      } catch (err) {
        console.error('[session] screenshot tick failed:', err.message)
      }
    }, Math.round(t * 1000))
    screenshotTimeouts.push(id)
  }

  return { success: true, task: todo.taskName, totalSeconds, plannedShots: times.length }
})

ipcMain.handle('session:status', () => {
  if (!sessionState) return null
  return {
    taskName: sessionState.taskName,
    remainingSeconds: sessionState.remainingSeconds,
  }
})

async function endSession() {
  if (!sessionState) return

  clearScreenshotTimeouts()
  setSessionActive(false)

  const { sessionId, todoId, taskName, screenshotUrls } = sessionState
  sessionState = null

  const worker = new Worker(path.join(__dirname, '../services/ai-worker.js'), {
    workerData: { screenshotUrls, taskName, sessionId },
    env: process.env,
  })

  worker.on('message', async (result) => {
    const prisma = getPrisma()

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        focusScore: result.focusScore,
        totalScreenshots: result.total,
        focusedCount: result.focused,
        distractedCount: result.distracted,
        aiSummary: result.summary,
        distractionDetails: result.distractionDetails,
        screenshotUrls,
        completedAt: new Date(),
      },
    })

    await prisma.todo.update({ where: { id: todoId }, data: { isCompleted: true } })

    getWindow()?.webContents.send('analysis:complete', result)
  })

  worker.on('error', async (err) => {
    console.error('AI worker error:', err)
    const prisma = getPrisma()
    await prisma.session.update({
      where: { id: sessionId },
      data: { completedAt: new Date(), aiSummary: `Analysis failed: ${err.message}` },
    })
    getWindow()?.webContents.send('analysis:complete', {
      focusScore: 0, total: 0, focused: 0, distracted: 0,
      summary: 'Analysis failed. Check console for details.',
      distractionDetails: 'N/A',
    })
  })
}
