const { ipcMain } = require('electron')
const keytar = require('keytar')
const { getPrisma } = require('../services/prisma')
const { scheduleAlarm, schedulePendingAlarms, cancelAlarm } = require('../services/scheduler')

ipcMain.handle('todos:get', async () => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user')
  if (!userId) return []

  const prisma = getPrisma()
  const todos = await prisma.todo.findMany({
    where: { userId: Number(userId) },
    orderBy: { scheduledTime: 'asc' },
  })

  schedulePendingAlarms(todos)
  return todos
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
  cancelAlarm(id)
  await prisma.todo.delete({ where: { id } })
  return { success: true }
})

ipcMain.handle('todos:complete', async (_, id) => {
  const prisma = getPrisma()
  cancelAlarm(id)
  await prisma.todo.update({ where: { id }, data: { isCompleted: true } })
  return { success: true }
})
