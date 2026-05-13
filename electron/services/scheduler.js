const schedule = require('node-schedule')
const { shell } = require('electron')
const { getWindow } = require('../main')

const jobs = new Map()

function getNextAlarmDate(scheduledTime, now = new Date()) {
  const [hour, minute] = scheduledTime.split(':').map(Number)

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null
  }

  const alarmDate = new Date(now)
  alarmDate.setHours(hour, minute, 0, 0)

  const isCurrentMinute = now.getHours() === hour && now.getMinutes() === minute
  if (isCurrentMinute) {
    return new Date(now.getTime() + 1000)
  }

  if (alarmDate <= now) {
    alarmDate.setDate(alarmDate.getDate() + 1)
  }

  return alarmDate
}

function scheduleAlarm(todoId, taskName, scheduledTime) {
  cancelAlarm(todoId)

  const alarmDate = getNextAlarmDate(scheduledTime)
  if (!alarmDate) return null

  const job = schedule.scheduleJob(alarmDate, () => {
    jobs.delete(todoId)
    shell.beep()
    const win = getWindow()
    if (win) {
      win.show()
      win.focus()
      win.webContents.send('alarm:trigger', { todoId, taskName, scheduledTime })
    }
  })

  jobs.set(todoId, job)
  return job
}

function schedulePendingAlarms(todos) {
  todos
    .filter((todo) => !todo.isCompleted)
    .forEach((todo) => scheduleAlarm(todo.id, todo.taskName, todo.scheduledTime))
}

function cancelAlarm(todoId) {
  jobs.get(todoId)?.cancel()
  jobs.delete(todoId)
}

module.exports = { scheduleAlarm, schedulePendingAlarms, cancelAlarm, getNextAlarmDate }
