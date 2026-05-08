const schedule = require('node-schedule')
const { getWindow } = require('../main')

const jobs = new Map()

function scheduleAlarm(todoId, taskName, scheduledTime) {
  const [hour, minute] = scheduledTime.split(':').map(Number)

  const job = schedule.scheduleJob({ hour, minute }, () => {
    const win = getWindow()
    if (win) {
      win.show()
      win.focus()
      win.webContents.send('alarm:trigger', { todoId, taskName })
    }
  })

  jobs.set(todoId, job)
}

function cancelAlarm(todoId) {
  jobs.get(todoId)?.cancel()
  jobs.delete(todoId)
}

module.exports = { scheduleAlarm, cancelAlarm }
