const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const focusedDir = path.resolve(__dirname, 'dataset/raw/focused')
const distractedDir = path.resolve(__dirname, 'dataset/raw/distracted')

fs.mkdirSync(focusedDir, { recursive: true })
fs.mkdirSync(distractedDir, { recursive: true })

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function lineItems(items, x, y, color = '#dbeafe', size = 15, gap = 24) {
  return items.map((item, index) => (
    `<text x="${x}" y="${y + index * gap}" fill="${color}" font-size="${size}" font-family="Arial, sans-serif">${escapeXml(item)}</text>`
  )).join('\n')
}

function focusedSvg(index) {
  const variants = [
    {
      title: 'VS Code - FocusTracker',
      subtitle: 'src/pages/FocusSession.jsx',
      code: ['function startSession(todoId) {', '  const result = await api.startSession(todoId)', '  if (result.success) setActiveSession(result)', '}', '', 'useEffect(() => {', '  api.onAnalysisComplete(setResult)', '}, [])'],
      accent: '#22c55e',
    },
    {
      title: 'Research Notes',
      subtitle: 'Machine Learning Evaluation',
      code: ['Dataset preprocessing completed', 'Train/Test split: 80/20', 'Model: Logistic Regression', 'Metrics: Accuracy, Precision, Recall, F1', 'Observation: focused class needs more samples'],
      accent: '#38bdf8',
    },
    {
      title: 'Terminal',
      subtitle: 'npm run ml:all',
      code: ['$ npm run ml:preprocess', 'Preprocessing complete: 100 images', '$ npm run ml:train', 'Training complete', '$ npm run ml:evaluate', 'Accuracy: 92.00%'],
      accent: '#a7f3d0',
    },
    {
      title: 'Assignment Draft',
      subtitle: 'Project Documentation',
      code: ['1. Introduction', '2. System Architecture', '3. Dataset Preprocessing', '4. Model Training', '5. Evaluation Results', '6. Conclusion'],
      accent: '#facc15',
    },
    {
      title: 'Database Schema',
      subtitle: 'prisma/schema.prisma',
      code: ['model Session {', '  id Int @id @default(autoincrement())', '  focusScore Float?', '  focusedCount Int?', '  distractedCount Int?', '}'],
      accent: '#c4b5fd',
    },
  ]

  const variant = variants[index % variants.length]
  const sidebar = index % 2 === 0 ? '#0f172a' : '#111827'
  const panel = index % 3 === 0 ? '#172554' : '#1e293b'

  return `
  <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#020617"/>
    <rect x="0" y="0" width="1280" height="34" fill="#0f172a"/>
    <circle cx="22" cy="17" r="6" fill="#ef4444"/>
    <circle cx="44" cy="17" r="6" fill="#f59e0b"/>
    <circle cx="66" cy="17" r="6" fill="#22c55e"/>
    <text x="610" y="22" fill="#cbd5e1" font-size="13" font-family="Arial, sans-serif">${escapeXml(variant.title)}</text>
    <rect x="0" y="34" width="230" height="686" fill="${sidebar}"/>
    <rect x="230" y="34" width="1050" height="686" fill="#0b1120"/>
    <rect x="260" y="70" width="980" height="590" rx="10" fill="${panel}" stroke="#334155"/>
    <text x="282" y="108" fill="${variant.accent}" font-size="22" font-weight="700" font-family="Arial, sans-serif">${escapeXml(variant.title)}</text>
    <text x="282" y="136" fill="#94a3b8" font-size="15" font-family="Arial, sans-serif">${escapeXml(variant.subtitle)}</text>
    <rect x="282" y="158" width="916" height="1" fill="#334155"/>
    ${lineItems(['PROJECT', 'src', 'electron', 'ml', 'docs', 'package.json'], 28, 82, '#94a3b8', 15, 34)}
    ${lineItems(variant.code, 300, 205, '#dbeafe', 20, 42)}
    <rect x="300" y="570" width="${520 + (index % 8) * 42}" height="14" rx="7" fill="${variant.accent}" opacity="0.75"/>
    <text x="300" y="612" fill="#94a3b8" font-size="15" font-family="Arial, sans-serif">Active task: coding / study / documentation</text>
    <text x="1110" y="694" fill="#64748b" font-size="13" font-family="Arial, sans-serif">focused-${String(index + 1).padStart(2, '0')}</text>
  </svg>`
}

function distractedSvg(index) {
  const variants = [
    {
      title: 'Video Stream',
      subtitle: 'Recommended entertainment videos',
      items: ['Funny clips compilation', 'Gaming highlights', 'Movie trailer', 'Music video playlist'],
      accent: '#ef4444',
    },
    {
      title: 'Social Feed',
      subtitle: 'New posts and notifications',
      items: ['12 new notifications', 'Trending post', 'Short video reel', 'Comment thread'],
      accent: '#f97316',
    },
    {
      title: 'Online Shopping',
      subtitle: 'Flash sale items',
      items: ['Wireless headphones', 'Gaming keyboard', 'Sneakers discount', 'Checkout offers'],
      accent: '#ec4899',
    },
    {
      title: 'Game Launcher',
      subtitle: 'Continue playing',
      items: ['Daily rewards available', 'Ranked match ready', 'Battle pass level up', 'Friends online'],
      accent: '#8b5cf6',
    },
    {
      title: 'Chat Window',
      subtitle: 'Unrelated messages',
      items: ['Group chat active', 'Memes shared', 'Voice call invite', 'Weekend plans'],
      accent: '#06b6d4',
    },
  ]

  const variant = variants[index % variants.length]
  const bg = index % 2 === 0 ? '#1c1917' : '#18181b'

  return `
  <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="${bg}"/>
    <rect x="0" y="0" width="1280" height="70" fill="#111827"/>
    <text x="42" y="44" fill="#f8fafc" font-size="28" font-weight="700" font-family="Arial, sans-serif">${escapeXml(variant.title)}</text>
    <text x="1000" y="44" fill="${variant.accent}" font-size="16" font-family="Arial, sans-serif">DISTRACTION</text>
    <rect x="42" y="104" width="760" height="430" rx="16" fill="#020617" stroke="${variant.accent}" stroke-width="3"/>
    <polygon points="350,214 350,424 540,319" fill="${variant.accent}" opacity="0.9"/>
    <rect x="840" y="104" width="360" height="520" rx="16" fill="#27272a"/>
    <text x="870" y="148" fill="#f8fafc" font-size="23" font-weight="700" font-family="Arial, sans-serif">${escapeXml(variant.subtitle)}</text>
    ${lineItems(variant.items, 872, 202, '#fed7aa', 20, 58)}
    <rect x="76" y="572" width="1060" height="18" rx="9" fill="#3f3f46"/>
    <rect x="76" y="572" width="${260 + (index % 10) * 55}" height="18" rx="9" fill="${variant.accent}"/>
    <text x="78" y="632" fill="#fca5a5" font-size="22" font-family="Arial, sans-serif">Unrelated activity detected pattern</text>
    <text x="1080" y="694" fill="#a1a1aa" font-size="13" font-family="Arial, sans-serif">distracted-${String(index + 1).padStart(2, '0')}</text>
  </svg>`
}

async function writeImage(filePath, svg) {
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(filePath)
}

async function main() {
  for (let i = 0; i < 50; i++) {
    const focusedPath = path.join(focusedDir, `focused_demo_${String(i + 1).padStart(2, '0')}.jpg`)
    const distractedPath = path.join(distractedDir, `distracted_demo_${String(i + 1).padStart(2, '0')}.jpg`)

    await writeImage(focusedPath, focusedSvg(i))
    await writeImage(distractedPath, distractedSvg(i))
  }

  console.log(`Generated 50 focused images in ${focusedDir}`)
  console.log(`Generated 50 distracted images in ${distractedDir}`)
}

main().catch((err) => {
  console.error(`Demo dataset generation failed: ${err.message}`)
  process.exit(1)
})
