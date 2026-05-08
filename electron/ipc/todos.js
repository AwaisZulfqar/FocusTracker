const { ipcMain } = require('electron')
const keytar = require('keytar')
const { getPrisma } = require('../services/prisma')
const { scheduleAlarm } = require('../services/scheduler')

ipcMain.handle('todos:get', async () => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user')
  if (!userId) return []

  const prisma = getPrisma()
  return prisma.todo.findMany({
    where: { userId: Number(userId) },
    orderBy: { scheduledTime: 'asc' },
  })
})

ipcMain.handle('todos:add', async (_, { taskName, scheduledTime, durationMinutes }) => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user')
  const prisma = getPrisma()

  const todo = await prisma.todo.create({
    data: { userId: Number(userId), taskName, scheduledTime, durationMinutes },
  })

  scheduleAlarm(todo.id, taskName, scheduledTime)
  return { success: true, todo }
})

ipcMain.handle('todos:delete', async (_, id) => {
  const prisma = getPrisma()
  await prisma.todo.delete({ where: { id } })
  return { success: true }
})

ipcMain.handle('todos:complete', async (_, id) => {
  const prisma = getPrisma()
  await prisma.todo.update({ where: { id }, data: { isCompleted: true } })
  return { success: true }
})
