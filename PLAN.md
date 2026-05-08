# FocusTracker AI — Build Plan

> Semester project. Desktop productivity app with AI-powered focus analysis.
> Stack: Electron + React + Vite + Prisma + Neon (PostgreSQL) + Cloudflare R2 + HF Moondream2

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
│                                                         │
│  Renderer (React)            Main Process (Node.js)     │
│  ├── Login/Signup            ├── IPC handlers           │
│  ├── Todo + Scheduler        ├── desktopCapturer        │
│  ├── Focus Timer             ├── node-schedule          │
│  ├── Session Report          ├── Prisma Client          │
│  └── Daily Dashboard         └── AI Worker Thread       │
│                                                         │
│  ──────── IPC Bridge (contextBridge) ─────────────────  │
└─────────────────────────────────────────────────────────┘
         │                    │                  │
         ▼                    ▼                  ▼
   Neon DB               Cloudflare R2       HF Inference API
   (PostgreSQL via        (screenshot        (moondream2 vision)
    Prisma, just          storage, free
    change DATABASE_URL)  10GB tier)
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Desktop | Electron + Vite + React | Cross-platform, Node.js access |
| UI | Tailwind CSS | Fast, free |
| ORM | Prisma | Type-safe, easy migrations |
| Database | Neon PostgreSQL | Free tier, serverless Postgres |
| Screenshot store | Cloudflare R2 | Free 10GB, S3-compatible |
| AI Vision | HF moondream2 (Inference API) | Free 1000 req/day, screenshot QA |
| Charts | Recharts | Free, React-native |
| Scheduler | node-schedule | Cron-style alarms |
| Auth store | keytar | OS keychain, secure JWT storage |

---

## Environment Variables

```env
# .env (local dev + production — just swap DATABASE_URL for prod)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/focustracker?sslmode=require

# Cloudflare R2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=focus-screenshots
R2_PUBLIC_URL=https://pub-xxx.r2.dev   # public bucket URL or custom domain

# HuggingFace
HF_TOKEN=hf_your_token_here
```

> **Deploy rule**: Only `DATABASE_URL` changes between local and prod. Everything else stays same.

---

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  todos        Todo[]
  sessions     Session[]
}

model Todo {
  id              Int       @id @default(autoincrement())
  userId          Int
  taskName        String
  scheduledTime   String    // "HH:MM"
  durationMinutes Int
  isCompleted     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])
  sessions        Session[]
}

model Session {
  id               Int      @id @default(autoincrement())
  userId           Int
  todoId           Int
  taskName         String
  focusScore       Float?
  totalScreenshots Int?
  focusedCount     Int?
  distractedCount  Int?
  aiSummary        String?
  distractionDetails String?
  screenshotUrls   String[] // R2 public URLs
  startedAt        DateTime?
  completedAt      DateTime?
  user             User     @relation(fields: [userId], references: [id])
  todo             Todo     @relation(fields: [todoId], references: [id])
}
```

---

## Phase 1 — Project Setup

### 1.1 Init Vite + React

```bash
npm create vite@latest . -- --template react
npm install
```

### 1.2 Install All Dependencies

```bash
# Electron
npm install --save-dev electron electron-builder concurrently wait-on cross-env

# Prisma
npm install prisma @prisma/client
npx prisma init

# Auth + security
npm install keytar bcryptjs jsonwebtoken

# Cloud
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner  # R2 is S3-compatible
npm install @huggingface/inference

# Scheduler + utils
npm install node-schedule sharp dotenv

# UI
npm install recharts
npm install -D tailwindcss @tailwindcss/vite
```

### 1.3 Folder Structure

```
sp-focus-tracker/
├── electron/
│   ├── main.js
│   ├── preload.js
│   ├── ipc/
│   │   ├── auth.js
│   │   ├── todos.js
│   │   ├── session.js
│   │   └── reports.js
│   └── services/
│       ├── screenshot.js     # desktopCapturer → R2 upload
│       ├── r2.js             # Cloudflare R2 client
│       ├── scheduler.js      # node-schedule alarms
│       ├── ai-worker.js      # Worker thread, HF moondream2
│       └── prisma.js         # Prisma client singleton
├── prisma/
│   └── schema.prisma
├── src/
│   ├── pages/
│   │   ├── Auth.jsx
│   │   ├── Dashboard.jsx
│   │   ├── FocusSession.jsx
│   │   └── Reports.jsx
│   ├── components/
│   │   ├── TodoItem.jsx
│   │   ├── AlarmModal.jsx
│   │   ├── Timer.jsx
│   │   └── FocusChart.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

### 1.4 vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  }
})
```

### 1.5 package.json Scripts

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && electron-builder",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate"
  }
}
```

---

## Phase 2 — Electron Main Process

### 2.1 main.js

```js
// electron/main.js
require('dotenv').config();
const { app, BrowserWindow, ipcMain, powerSaveBlocker, dialog } = require('electron');
const path = require('path');

let mainWindow;
let psbId = null;
let sessionActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (sessionActive) {
      e.preventDefault();
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Focus Session Active',
        message: 'Cannot quit during active focus session. Stay focused!',
        buttons: ['OK']
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  require('./ipc/auth');
  require('./ipc/todos');
  require('./ipc/session');
  require('./ipc/reports');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = {
  getWindow: () => mainWindow,
  setSessionActive: (val) => {
    sessionActive = val;
    if (val) {
      psbId = powerSaveBlocker.start('prevent-app-suspension');
    } else if (psbId !== null) {
      powerSaveBlocker.stop(psbId);
      psbId = null;
    }
  }
};
```

### 2.2 preload.js

```js
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  signup: (data) => ipcRenderer.invoke('auth:signup', data),
  login: (data) => ipcRenderer.invoke('auth:login', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getUser: () => ipcRenderer.invoke('auth:getUser'),

  getTodos: () => ipcRenderer.invoke('todos:get'),
  addTodo: (data) => ipcRenderer.invoke('todos:add', data),
  deleteTodo: (id) => ipcRenderer.invoke('todos:delete', id),
  completeTodo: (id) => ipcRenderer.invoke('todos:complete', id),

  startSession: (todoId) => ipcRenderer.invoke('session:start', todoId),
  endSession: () => ipcRenderer.invoke('session:end'),
  getSessionStatus: () => ipcRenderer.invoke('session:status'),

  getReports: (days) => ipcRenderer.invoke('reports:get', days),

  onAlarmTrigger: (cb) => ipcRenderer.on('alarm:trigger', (_, data) => cb(data)),
  onSessionTick: (cb) => ipcRenderer.on('session:tick', (_, seconds) => cb(seconds)),
  onAnalysisComplete: (cb) => ipcRenderer.on('analysis:complete', (_, result) => cb(result)),
});
```

---

## Phase 3 — Prisma Client + R2 Service

### 3.1 Prisma Client Singleton

```js
// electron/services/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

module.exports = { getPrisma };
```

### 3.2 Cloudflare R2 Service

```js
// electron/services/r2.js
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadScreenshot(localFilePath, sessionId, index) {
  const key = `sessions/${sessionId}/screenshot_${index}.jpg`;
  const fileBuffer = fs.readFileSync(localFilePath);

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  }));

  // Delete local file after upload
  fs.unlinkSync(localFilePath);

  // Return public URL
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function deleteSessionScreenshots(sessionId) {
  // Called after AI analysis — screenshots no longer needed
  // Note: R2 doesn't support bulk delete via SDK easily, loop through
  // For semester project: rely on R2 lifecycle rules to auto-delete after 1 day
}

module.exports = { uploadScreenshot, deleteSessionScreenshots };
```

> **R2 Setup (Free Tier):**
> 1. Cloudflare account (free)
> 2. R2 → Create bucket → enable public access
> 3. Manage R2 API tokens → create token with Object Read & Write
> 4. Set lifecycle rule: delete objects after 1 day (privacy)

### 3.3 Screenshot Service

```js
// electron/services/screenshot.js
const { desktopCapturer } = require('electron');
const path = require('path');
const { app } = require('electron');
const sharp = require('sharp');
const { uploadScreenshot } = require('./r2');

async function captureAndUpload(sessionId, index) {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1280, height: 720 }
  });

  if (sources.length === 0) return null;

  const imageBuffer = sources[0].thumbnail.toPNG();
  const tempPath = path.join(app.getPath('temp'), `cap_${Date.now()}.jpg`);

  await sharp(imageBuffer).jpeg({ quality: 70 }).toFile(tempPath);

  const url = await uploadScreenshot(tempPath, sessionId, index);
  return url;
}

module.exports = { captureAndUpload };
```

---

## Phase 4 — Authentication

```js
// electron/ipc/auth.js
const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const keytar = require('keytar');
const { getPrisma } = require('../services/prisma');

const SERVICE = 'focus-tracker';
const ACCOUNT = 'current-user';

ipcMain.handle('auth:signup', async (_, { email, password }) => {
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'Email already registered' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  await keytar.setPassword(SERVICE, ACCOUNT, String(user.id));
  return { success: true, userId: user.id, email: user.email };
});

ipcMain.handle('auth:login', async (_, { email, password }) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'Invalid email or password' };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { error: 'Invalid email or password' };

  await keytar.setPassword(SERVICE, ACCOUNT, String(user.id));
  return { success: true, userId: user.id, email: user.email };
});

ipcMain.handle('auth:logout', async () => {
  await keytar.deletePassword(SERVICE, ACCOUNT);
  return { success: true };
});

ipcMain.handle('auth:getUser', async () => {
  const userId = await keytar.getPassword(SERVICE, ACCOUNT);
  if (!userId) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true }
  });
  return user;
});
```

---

## Phase 5 — Todos + Alarm Scheduler

```js
// electron/ipc/todos.js
const { ipcMain } = require('electron');
const keytar = require('keytar');
const { getPrisma } = require('../services/prisma');
const { scheduleAlarm } = require('../services/scheduler');

ipcMain.handle('todos:get', async () => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user');
  const prisma = getPrisma();
  return prisma.todo.findMany({
    where: { userId: Number(userId) },
    orderBy: { scheduledTime: 'asc' }
  });
});

ipcMain.handle('todos:add', async (_, { taskName, scheduledTime, durationMinutes }) => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user');
  const prisma = getPrisma();
  const todo = await prisma.todo.create({
    data: { userId: Number(userId), taskName, scheduledTime, durationMinutes }
  });
  scheduleAlarm(todo.id, taskName, scheduledTime);
  return { success: true, todo };
});

ipcMain.handle('todos:delete', async (_, id) => {
  const prisma = getPrisma();
  await prisma.todo.delete({ where: { id } });
  return { success: true };
});

ipcMain.handle('todos:complete', async (_, id) => {
  const prisma = getPrisma();
  await prisma.todo.update({ where: { id }, data: { isCompleted: true } });
  return { success: true };
});
```

```js
// electron/services/scheduler.js
const schedule = require('node-schedule');
const { getWindow } = require('../main');

const jobs = new Map();

function scheduleAlarm(todoId, taskName, scheduledTime) {
  const [hour, minute] = scheduledTime.split(':').map(Number);
  const job = schedule.scheduleJob({ hour, minute }, () => {
    const win = getWindow();
    if (win) {
      win.show();
      win.focus();
      win.webContents.send('alarm:trigger', { todoId, taskName });
    }
  });
  jobs.set(todoId, job);
}

function cancelAlarm(todoId) {
  jobs.get(todoId)?.cancel();
  jobs.delete(todoId);
}

module.exports = { scheduleAlarm, cancelAlarm };
```

---

## Phase 6 — Focus Session Engine

```js
// electron/ipc/session.js
const { ipcMain } = require('electron');
const path = require('path');
const keytar = require('keytar');
const { getPrisma } = require('../services/prisma');
const { captureAndUpload } = require('../services/screenshot');
const { getWindow, setSessionActive } = require('../main');
const { Worker } = require('worker_threads');

let sessionState = null;
let screenshotInterval = null;
let tickInterval = null;

ipcMain.handle('session:start', async (_, todoId) => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user');
  const prisma = getPrisma();
  const todo = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!todo) return { error: 'Todo not found' };

  // Create session record immediately
  const session = await prisma.session.create({
    data: {
      userId: Number(userId),
      todoId,
      taskName: todo.taskName,
      startedAt: new Date(),
    }
  });

  const totalSeconds = todo.durationMinutes * 60;

  sessionState = {
    sessionId: session.id,
    userId: Number(userId),
    todoId,
    taskName: todo.taskName,
    durationMinutes: todo.durationMinutes,
    remainingSeconds: totalSeconds,
    screenshotUrls: [],
    screenshotIndex: 0,
  };

  setSessionActive(true);

  tickInterval = setInterval(() => {
    sessionState.remainingSeconds--;
    getWindow()?.webContents.send('session:tick', sessionState.remainingSeconds);
    if (sessionState.remainingSeconds <= 0) {
      clearInterval(tickInterval);
      clearInterval(screenshotInterval);
      endSession();
    }
  }, 1000);

  screenshotInterval = setInterval(async () => {
    const url = await captureAndUpload(sessionState.sessionId, sessionState.screenshotIndex++);
    if (url) sessionState.screenshotUrls.push(url);
  }, 30000);

  return { success: true, task: todo.taskName, totalSeconds };
});

ipcMain.handle('session:status', () => {
  if (!sessionState) return null;
  return { taskName: sessionState.taskName, remainingSeconds: sessionState.remainingSeconds };
});

async function endSession() {
  if (!sessionState) return;
  setSessionActive(false);

  const { sessionId, userId, todoId, taskName, screenshotUrls } = sessionState;
  sessionState = null;

  const worker = new Worker(path.join(__dirname, '../services/ai-worker.js'), {
    workerData: { screenshotUrls, taskName, sessionId }
  });

  worker.on('message', async (result) => {
    const prisma = getPrisma();

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
      }
    });

    await prisma.todo.update({ where: { id: todoId }, data: { isCompleted: true } });

    getWindow()?.webContents.send('analysis:complete', result);
  });

  worker.on('error', async (err) => {
    console.error('AI worker error:', err);
    const prisma = getPrisma();
    await prisma.session.update({
      where: { id: sessionId },
      data: { completedAt: new Date(), aiSummary: `Analysis failed: ${err.message}` }
    });
  });
}
```

---

## Phase 7 — AI Worker (Moondream2 + R2 URLs)

```js
// electron/services/ai-worker.js
const { workerData, parentPort } = require('worker_threads');
const { InferenceClient } = require('@huggingface/inference');

async function analyzeScreenshots() {
  const { screenshotUrls, taskName } = workerData;

  if (screenshotUrls.length === 0) {
    parentPort.postMessage({
      focusScore: 0, total: 0, focused: 0, distracted: 0,
      summary: 'No screenshots captured.', distractionDetails: 'N/A'
    });
    return;
  }

  const client = new InferenceClient(process.env.HF_TOKEN);

  const imageContents = screenshotUrls.map(url => ({
    type: 'image_url',
    image_url: { url }   // Pass R2 public URLs directly — no base64 needed
  }));

  const prompt = `
You are a productivity analyst. The user's assigned task was: "${taskName}".
You are given ${screenshotUrls.length} screenshots taken every 30 seconds during a focus session.

For each screenshot, determine if the user was:
- FOCUSED: actively working on "${taskName}"
- DISTRACTED: doing something unrelated

Return ONLY valid JSON:
{
  "focused": <number>,
  "distracted": <number>,
  "focus_percentage": <number 0-100>,
  "summary": "<2-3 sentences>",
  "distraction_details": "<what distractions observed, or 'None'>"
}`;

  try {
    const response = await client.chatCompletion({
      model: 'vikhyatk/moondream2',
      messages: [{ role: 'user', content: [...imageContents, { type: 'text', text: prompt }] }],
      max_tokens: 512,
    });

    const raw = response.choices[0].message.content;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    parentPort.postMessage({
      focusScore: parsed.focus_percentage,
      total: screenshotUrls.length,
      focused: parsed.focused,
      distracted: parsed.distracted,
      summary: parsed.summary,
      distractionDetails: parsed.distraction_details,
    });
  } catch (err) {
    parentPort.postMessage({
      focusScore: 0, total: screenshotUrls.length,
      focused: 0, distracted: screenshotUrls.length,
      summary: `AI analysis failed: ${err.message}`,
      distractionDetails: 'Analysis unavailable',
    });
  }
}

analyzeScreenshots();
```

---

## Phase 8 — React UI

### Auth.jsx

```jsx
import { useState } from 'react';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const fn = mode === 'login' ? window.api.login : window.api.signup;
    const result = await fn(form);
    if (result.error) return setError(result.error);
    onLogin(result);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm text-white">
        <h1 className="text-2xl font-bold mb-1">FocusTracker</h1>
        <p className="text-gray-400 text-sm mb-6">{mode === 'login' ? 'Sign in to your account' : 'Create account'}</p>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full bg-gray-800 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-blue-500"
            type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full bg-gray-800 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-blue-500"
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-medium" type="submit">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button className="mt-4 text-gray-400 text-sm w-full text-center"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have account? Sign in'}
        </button>
      </div>
    </div>
  );
}
```

### App.jsx

```jsx
import { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import FocusSession from './pages/FocusSession';
import Reports from './pages/Reports';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [page, setPage] = useState('dashboard');
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    window.api.getUser().then(setUser);
  }, []);

  if (user === undefined) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>
  );
  if (!user) return <Auth onLogin={setUser} />;

  if (activeSession) return (
    <FocusSession session={activeSession} onComplete={() => setActiveSession(null)} />
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <nav className="w-52 bg-gray-900 p-5 flex flex-col gap-1">
        <h1 className="font-bold text-lg mb-5 text-blue-400">FocusTracker</h1>
        <NavBtn active={page === 'dashboard'} onClick={() => setPage('dashboard')}>Dashboard</NavBtn>
        <NavBtn active={page === 'reports'} onClick={() => setPage('reports')}>Reports</NavBtn>
        <div className="mt-auto">
          <button className="text-gray-500 text-sm hover:text-white"
            onClick={() => { window.api.logout(); setUser(null); }}>
            Sign Out
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6 overflow-auto">
        {page === 'dashboard' && <Dashboard onStartSession={setActiveSession} />}
        {page === 'reports' && <Reports />}
      </main>
    </div>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
      {children}
    </button>
  );
}
```

### Dashboard.jsx

```jsx
import { useEffect, useState } from 'react';

export default function Dashboard({ onStartSession }) {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ taskName: '', scheduledTime: '', durationMinutes: 30 });
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.api.getTodos().then(setTodos);
    window.api.onAlarmTrigger((data) => setAlarm(data));
  }, []);

  async function addTodo() {
    if (!form.taskName || !form.scheduledTime) return;
    setLoading(true);
    await window.api.addTodo(form);
    const updated = await window.api.getTodos();
    setTodos(updated);
    setForm({ taskName: '', scheduledTime: '', durationMinutes: 30 });
    setLoading(false);
  }

  async function startSession(todoId) {
    const result = await window.api.startSession(todoId);
    if (result.success) {
      onStartSession({ todoId, taskName: result.task, totalSeconds: result.totalSeconds });
      setAlarm(null);
    }
  }

  return (
    <div>
      {alarm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-sm border border-gray-700">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold mb-2">Time to Focus!</h2>
            <p className="text-gray-400 mb-6">Task: <span className="text-white font-medium">{alarm.taskName}</span></p>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium mb-3"
              onClick={() => startSession(alarm.todoId)}>
              Start Focus Session
            </button>
            <button className="text-gray-500 text-sm" onClick={() => setAlarm(null)}>
              Skip this time
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Today's Tasks</h2>

      <div className="bg-gray-900 p-4 rounded-xl mb-6 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-40">
          <label className="text-xs text-gray-400 mb-1 block">Task Name</label>
          <input className="w-full bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500 text-sm"
            placeholder="e.g. Study algorithms" value={form.taskName}
            onChange={(e) => setForm({ ...form, taskName: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Start Time</label>
          <input type="time" className="bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500 text-sm"
            value={form.scheduledTime}
            onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
          <input type="number" className="bg-gray-800 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500 text-sm w-24"
            value={form.durationMinutes} min={5} max={180}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
          onClick={addTodo} disabled={loading}>
          {loading ? '...' : 'Add Task'}
        </button>
      </div>

      <div className="space-y-2">
        {todos.length === 0 && <p className="text-gray-500 text-sm">No tasks yet. Add one above.</p>}
        {todos.map(todo => (
          <div key={todo.id}
            className={`flex items-center justify-between p-4 rounded-xl border ${todo.isCompleted ? 'opacity-40 border-gray-800 bg-gray-900' : 'border-gray-700 bg-gray-900'}`}>
            <div>
              <p className="font-medium">{todo.taskName}</p>
              <p className="text-sm text-gray-500">{todo.scheduledTime} · {todo.durationMinutes} min</p>
            </div>
            <div className="flex gap-2">
              {!todo.isCompleted && (
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
                  onClick={() => startSession(todo.id)}>
                  Start Now
                </button>
              )}
              <button className="text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm"
                onClick={async () => {
                  await window.api.deleteTodo(todo.id);
                  setTodos(todos.filter(t => t.id !== todo.id));
                }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### FocusSession.jsx

```jsx
import { useEffect, useState } from 'react';

export default function FocusSession({ session, onComplete }) {
  const [seconds, setSeconds] = useState(session.totalSeconds);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.api.onSessionTick((remaining) => setSeconds(remaining));
    window.api.onAnalysisComplete((data) => {
      setAnalyzing(false);
      setResult(data);
    });
  }, []);

  useEffect(() => {
    if (seconds <= 0) setAnalyzing(true);
  }, [seconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - (seconds / session.totalSeconds);

  if (result) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
      <p className="text-gray-400 mb-8">{session.taskName}</p>
      <div className="text-7xl font-bold mb-2" style={{ color: result.focusScore >= 70 ? '#22c55e' : result.focusScore >= 40 ? '#f59e0b' : '#ef4444' }}>
        {result.focusScore?.toFixed(0)}%
      </div>
      <p className="text-gray-400 mb-6">Focus Score</p>
      <p className="max-w-md text-gray-300 mb-4">{result.summary}</p>
      {result.distractionDetails && result.distractionDetails !== 'None' && (
        <p className="text-red-400 text-sm max-w-md mb-6">Distractions: {result.distractionDetails}</p>
      )}
      <div className="flex gap-6 text-sm text-gray-500 mb-8">
        <span>✅ Focused: {result.focused}</span>
        <span>❌ Distracted: {result.distracted}</span>
        <span>📸 Total: {result.total} screenshots</span>
      </div>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
        onClick={onComplete}>
        Back to Dashboard
      </button>
    </div>
  );

  if (analyzing) return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center text-center">
      <div className="text-5xl mb-6 animate-spin">⟳</div>
      <h2 className="text-2xl font-bold mb-3">Analyzing your session...</h2>
      <p className="text-gray-400">AI reviewing {Math.ceil(session.totalSeconds / 30)} screenshots</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center text-center p-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-400 text-sm font-medium">RECORDING</span>
      </div>
      <h2 className="text-xl text-gray-400 mb-2">Focus Session</h2>
      <p className="text-2xl font-semibold mb-10">{session.taskName}</p>
      <div className="text-8xl font-mono font-bold mb-8">
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="w-64 h-2 bg-gray-800 rounded-full mb-8">
        <div className="h-2 bg-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}></div>
      </div>
      <p className="text-gray-600 text-sm">Screenshots captured every 30 seconds</p>
      <p className="text-gray-600 text-sm mt-1">Timer cannot be stopped</p>
    </div>
  );
}
```

### Reports.jsx

```jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Reports() {
  const [data, setData] = useState([]);

  useEffect(() => {
    window.api.getReports(7).then(setData);
  }, []);

  const color = (score) => score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Focus Report — Last 7 Days</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No sessions yet. Complete a focus session to see your report.</p>
      ) : (
        <>
          <div className="bg-gray-900 rounded-xl p-4 mb-8">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151' }}
                  formatter={(v) => [`${v?.toFixed(0)}%`, 'Focus Score']}
                />
                <Bar dataKey="avg_focus" radius={[4, 4, 0, 0]}>
                  {data.map((entry, i) => <Cell key={i} fill={color(entry.avg_focus)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="font-semibold mb-3 text-gray-300">Session History</h3>
          <div className="space-y-2">
            {data.flatMap(d => d.sessions || []).map(s => (
              <div key={s.id} className="bg-gray-900 rounded-xl p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{s.taskName}</p>
                  <p className="text-sm text-gray-500">{new Date(s.completedAt).toLocaleDateString()} · {s.durationMinutes} min</p>
                  {s.aiSummary && <p className="text-xs text-gray-400 mt-1 max-w-lg">{s.aiSummary}</p>}
                </div>
                <span className="font-bold text-lg" style={{ color: color(s.focusScore) }}>
                  {s.focusScore?.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Phase 9 — Reports IPC

```js
// electron/ipc/reports.js
const { ipcMain } = require('electron');
const keytar = require('keytar');
const { getPrisma } = require('../services/prisma');

ipcMain.handle('reports:get', async (_, days = 7) => {
  const userId = await keytar.getPassword('focus-tracker', 'current-user');
  const prisma = getPrisma();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const sessions = await prisma.session.findMany({
    where: {
      userId: Number(userId),
      completedAt: { gte: since }
    },
    orderBy: { completedAt: 'desc' },
    include: { todo: { select: { durationMinutes: true } } }
  });

  // Group by date
  const byDate = {};
  for (const s of sessions) {
    if (!s.completedAt) continue;
    const date = s.completedAt.toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = { date, sessions: [], totalScore: 0, count: 0 };
    byDate[date].sessions.push({ ...s, durationMinutes: s.todo?.durationMinutes });
    byDate[date].totalScore += s.focusScore || 0;
    byDate[date].count++;
  }

  return Object.values(byDate).map(d => ({
    ...d,
    avg_focus: d.count > 0 ? d.totalScore / d.count : 0,
  })).sort((a, b) => a.date.localeCompare(b.date));
});
```

---

## Build Order (Follow This Sequence)

```
Step 1  → npm create vite + install all deps
Step 2  → Electron window opens (dev mode working)
Step 3  → Prisma schema + npx prisma db push (Neon)
Step 4  → Auth IPC + React Auth page
Step 5  → Todos CRUD + Dashboard UI
Step 6  → node-schedule alarm trigger
Step 7  → desktopCapturer screenshot + R2 upload
Step 8  → Focus session timer (strict mode)
Step 9  → AI worker thread (moondream2)
Step 10 → Reports page (recharts)
Step 11 → Polish + electron-builder package
```

---

## External Services Setup

### Neon DB (free)
1. neon.tech → New project → copy `DATABASE_URL`
2. Paste in `.env`
3. `npx prisma db push` → tables created

### Cloudflare R2 (free 10GB)
1. cloudflare.com → R2 → Create bucket: `focus-screenshots`
2. Enable public access → copy public URL
3. R2 → Manage R2 API tokens → Create token (Object Read & Write)
4. Copy Account ID, Access Key ID, Secret Access Key → paste in `.env`
5. Set lifecycle rule: delete objects after 1 day (Settings → Lifecycle)

### HuggingFace (free)
1. huggingface.co → Settings → Access Tokens → New token (read)
2. Paste in `.env` as `HF_TOKEN`

---

## .env.example

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/focustracker?sslmode=require

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=focus-screenshots
R2_PUBLIC_URL=https://pub-xxx.r2.dev

HF_TOKEN=hf_
```
