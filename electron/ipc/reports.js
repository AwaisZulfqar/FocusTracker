const { ipcMain } = require('electron')
const keytar = require('keytar')
const { getPrisma } = require('../services/prisma')

ipcMain.handle('reports:get', async (_, days = 7) => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user')
  if (!userId) return []

  const prisma = getPrisma()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const sessions = await prisma.session.findMany({
    where: {
      userId: Number(userId),
      completedAt: { gte: since },
    },
    orderBy: { completedAt: 'desc' },
    include: { todo: { select: { durationMinutes: true } } },
  })

  const byDate = {}
  for (const s of sessions) {
    if (!s.completedAt) continue
    const date = s.completedAt.toISOString().split('T')[0]
    if (!byDate[date]) byDate[date] = { date, sessions: [], totalScore: 0, count: 0 }
    byDate[date].sessions.push({ ...s, durationMinutes: s.todo?.durationMinutes })
    byDate[date].totalScore += s.focusScore || 0
    byDate[date].count++
  }

  return Object.values(byDate)
    .map(d => ({ ...d, avg_focus: d.count > 0 ? d.totalScore / d.count : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
})
