const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Auth
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  login: (data) => ipcRenderer.invoke('auth:login', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getUser: () => ipcRenderer.invoke('auth:getUser'),

  // Todos
  getTodos: () => ipcRenderer.invoke('todos:get'),
  addTodo: (data) => ipcRenderer.invoke('todos:add', data),
  deleteTodo: (id) => ipcRenderer.invoke('todos:delete', id),
  completeTodo: (id) => ipcRenderer.invoke('todos:complete', id),

  // Session
  startSession: (todoId) => ipcRenderer.invoke('session:start', todoId),
  getSessionStatus: () => ipcRenderer.invoke('session:status'),

  // Reports
  getReports: (days) => ipcRenderer.invoke('reports:get', days),

  // Event listeners
  onAlarmTrigger: (cb) => ipcRenderer.on('alarm:trigger', (_, data) => cb(data)),
  onSessionTick: (cb) => ipcRenderer.on('session:tick', (_, seconds) => cb(seconds)),
  onScreenshotCount: (cb) => ipcRenderer.on('session:screenshot', (_, count) => cb(count)),
  onAnalysisComplete: (cb) => ipcRenderer.on('analysis:complete', (_, result) => cb(result)),
})
