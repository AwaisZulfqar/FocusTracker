const { ipcMain } = require('electron')
const bcrypt = require('bcryptjs')
const keytar = require('keytar')
const { getPrisma } = require('../services/prisma')

const SERVICE = 'focus-tracker'
const ACCOUNT = 'current-user'

ipcMain.handle('auth:signup', async (_, { email, password, username }) => {
  const prisma = getPrisma()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email already registered' }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, username: username || null, passwordHash } })

  await keytar.setPassword(SERVICE, ACCOUNT, String(user.id))
  return { success: true, userId: user.id, email: user.email, username: user.username }
})

ipcMain.handle('auth:login', async (_, { email, password }) => {
  const prisma = getPrisma()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: 'Invalid email or password' }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return { error: 'Invalid email or password' }

  await keytar.setPassword(SERVICE, ACCOUNT, String(user.id))
  return { success: true, userId: user.id, email: user.email, username: user.username }
})

ipcMain.handle('auth:logout', async () => {
  await keytar.deletePassword(SERVICE, ACCOUNT)
  return { success: true }
})

ipcMain.handle('auth:getUser', async () => {
  const userId = await keytar.getPassword(SERVICE, ACCOUNT)
  if (!userId) return null

  const prisma = getPrisma()
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, username: true },
  })
  return user
})
