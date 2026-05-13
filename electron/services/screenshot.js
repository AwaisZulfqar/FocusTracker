const { app } = require('electron')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const sharp = require('sharp')
const { uploadScreenshot } = require('./r2')

const execFileP = promisify(execFile)

async function captureNativeLinux(rawPath) {
  const tools = [
    ['gnome-screenshot', ['-f', rawPath]],
    ['scrot', ['-o', rawPath]],
    ['import', ['-window', 'root', rawPath]],
    ['grim', [rawPath]],
  ]
  let lastErr
  for (const [cmd, args] of tools) {
    try {
      const { stdout, stderr } = await execFileP(cmd, args, { timeout: 5000 })
      if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 0) {
        console.log(`[screenshot] captured via ${cmd}`)
        return true
      }
      console.warn(`[screenshot] ${cmd} ran but produced no file. stdout=${stdout} stderr=${stderr}`)
    } catch (e) {
      lastErr = e
      console.warn(`[screenshot] ${cmd} failed: ${e.message}`)
    }
  }
  throw lastErr || new Error('No native screenshot tool succeeded')
}

async function captureViaElectron(rawPath) {
  const { desktopCapturer } = require('electron')
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1280, height: 720 },
  })
  if (sources.length === 0) return false
  fs.writeFileSync(rawPath, sources[0].thumbnail.toPNG())
  return true
}

function isLocalAnalyzerMode() {
  return process.env.FOCUS_ANALYZER === 'local' || !process.env.HF_TOKEN
}

function hasR2Config() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

function saveLocalScreenshot(outPath, sessionId, index) {
  const sessionDir = path.join(app.getPath('userData'), 'focus-screenshots', 'sessions', String(sessionId))
  fs.mkdirSync(sessionDir, { recursive: true })

  const finalPath = path.join(sessionDir, `screenshot_${String(index).padStart(3, '0')}.jpg`)
  fs.copyFileSync(outPath, finalPath)
  fs.unlinkSync(outPath)

  return finalPath
}

async function captureAndUpload(sessionId, index) {
  const rawPath = path.join(app.getPath('temp'), `ft_raw_${Date.now()}.png`)
  const outPath = path.join(app.getPath('temp'), `ft_cap_${Date.now()}.jpg`)

  try {
    if (process.platform === 'linux') {
      // Linux: native tools only. No Electron fallback — that path triggers Wayland portal prompt.
      await captureNativeLinux(rawPath)
    } else {
      const ok = await captureViaElectron(rawPath)
      if (!ok) return null
    }

    await sharp(rawPath).resize(1280, 720, { fit: 'inside' }).jpeg({ quality: 70 }).toFile(outPath)

    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

    if (isLocalAnalyzerMode() || !hasR2Config()) {
      return saveLocalScreenshot(outPath, sessionId, index)
    }

    return await uploadScreenshot(outPath, sessionId, index)
  } catch (err) {
    console.error('[screenshot] capture failed:', err.message)
    if (fs.existsSync(rawPath)) try { fs.unlinkSync(rawPath) } catch {}
    if (fs.existsSync(outPath)) try { fs.unlinkSync(outPath) } catch {}
    return null
  }
}

module.exports = { captureAndUpload }
