# FocusTracker AI

FocusTracker AI is a desktop productivity application that helps a user plan focus tasks, start a strict focus session, capture screenshots during the session, analyze the screenshots with a locally trained machine learning model, and generate focus reports. The project is built with Electron, React, Vite, Prisma, PostgreSQL, Sharp, and a local machine learning pipeline.

## Project Objective

The main objective is to measure how focused a user remained during a planned task. The user creates a task, sets a start time and duration, starts a focus session, and the system captures screenshots at randomized intervals. At the end of the session, screenshots are analyzed and the app shows a focus score, focused count, distracted count, AI summary, and weekly report.

## Main Features

- User signup, login, logout, and saved session restoration.
- Task creation witname,h task  scheduled time, and duration.
- Alarm trigger at the scheduled task time.
- Strict focus session timer.
- Random screenshot capture during a session.
- Screenshot capture, compression, and local storage.
- Local model based focus and distraction analysis.
- Session result screen with focus score and summary.
- Seven-day reports with charts and session history.
- Local ML pipeline for dataset preprocessing, model training, analysis, and evaluation.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Desktop shell | Electron |
| Frontend | React, Vite |
| Animation | Framer Motion |
| Charts | Recharts |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Secure local session | Keytar |
| Password hashing | bcryptjs |
| Screenshot processing | Sharp |
| Screenshot storage | Local application data folder |
| Local ML pipeline | Node.js scripts and logistic regression |

## Project Structure

```text
sp-focus-tracker/
  electron/
    main.js                 Electron app startup and window creation
    preload.js              Secure bridge between React and Electron IPC
    ipc/
      auth.js               Signup, login, logout, saved user lookup
      todos.js              Task CRUD and alarm scheduling
      session.js            Focus session timer, screenshots, AI result saving
      reports.js            Report data aggregation
    services/
      prisma.js             Prisma client singleton
      scheduler.js          node-schedule alarm jobs
      screenshot.js         Screenshot capture and compression
      r2.js                 Legacy cloud upload helper, not required for local model demo
      ai-worker.js          Local trained model analysis worker
  prisma/
    schema.prisma           User, Todo, and Session database models
  src/
    components/             Reusable UI components
    pages/
      Auth/                 Login and signup UI
      Dashboard/            Task dashboard and alarm modal
      FocusSession/         Timer and analysis state
      Reports/              Analytics and session history
    lib/api.js              Renderer access to preload API
    utils/                  Time and score helper functions
  ml/
    preprocess.js           Dataset preprocessing
    train.js                Model training
    evaluate.js             Model evaluation
    analyze.js              Local screenshot analysis
    lib/common.js           Shared ML feature extraction helpers
```

## Application Flow

### 1. App Startup

Electron starts from `electron/main.js`. It loads environment variables, creates a browser window, attaches `electron/preload.js`, and registers IPC handlers for auth, todos, sessions, and reports.

In development mode, Electron loads:

```text
http://localhost:5173
```

In production mode, it loads:

```text
dist/index.html
```

### 2. React Entry Point

React starts from `src/main.jsx`, which renders `src/components/App/App.jsx`.

`App.jsx` is the main route controller. It checks the current saved user by calling:

```js
api.getUser()
```

The UI decision is:

```text
user is undefined -> show BootLoader
user is null      -> show Auth page
user exists       -> show Dashboard and Sidebar
activeSession set -> show FocusSession
```

## Authentication Flow

Authentication is implemented in `electron/ipc/auth.js`.

### Signup

1. The user enters email, username, and password in `Auth.jsx`.
2. `Auth.jsx` calls `api.signup(form)`.
3. `preload.js` forwards this to IPC channel `auth:signup`.
4. `auth.js` checks whether the email already exists.
5. The password is hashed using `bcrypt.hash(password, 10)`.
6. A new user is saved in PostgreSQL using Prisma.
7. The user ID is saved securely in the operating system keychain using Keytar.
8. React receives the user object and opens the dashboard.

### Login

1. The user enters email and password.
2. `Auth.jsx` calls `api.login(form)`.
3. `auth.js` finds the user by email.
4. `bcrypt.compare()` validates the password.
5. The user ID is saved in Keytar.
6. React receives the user object and opens the dashboard.

### Logout

Logout calls `api.logout()`, which deletes the saved Keytar value. After logout, `App.jsx` sets `user` to `null`, so the Auth page appears again.

## Why Auth Is Skipped After First Login

The app does not permanently bypass authentication. It restores a saved login session.

After successful signup or login, this line stores the logged-in user ID in Keytar:

```js
await keytar.setPassword('focus-tracker', 'current-user', String(user.id))
```

On the next app start, `App.jsx` calls `api.getUser()`. The `auth:getUser` IPC handler reads the saved user ID from Keytar:

```js
const userId = await keytar.getPassword('focus-tracker', 'current-user')
```

If the user ID exists, Prisma loads that user from the database and the app directly opens the dashboard. This looks like auth is skipped, but technically it is session restoration.

To show the login screen again, the user must logout. Logout deletes the saved Keytar session.

## Dashboard and Task Flow

The dashboard is implemented in `src/pages/Dashboard/Dashboard.jsx`.

Sequence:

1. Dashboard loads todos using `api.getTodos()`.
2. User creates a task with task name, scheduled time, and duration.
3. Dashboard calls `api.addTodo(form)`.
4. `electron/ipc/todos.js` saves the todo in the database.
5. `scheduler.js` schedules an alarm using `node-schedule`.
6. When the scheduled time arrives, Electron sends `alarm:trigger` to React.
7. Dashboard shows `AlarmModal`.
8. User starts the focus session.

## Focus Session Flow

The focus session is controlled by `electron/ipc/session.js` and displayed by `src/pages/FocusSession/FocusSession.jsx`.

Sequence:

1. User starts a task session from the dashboard.
2. `session:start` creates a new `Session` row in the database.
3. The app stores active session state in memory.
4. A one-second timer starts.
5. Screenshot capture times are randomly planned.
6. During the session, screenshots are captured and saved locally.
7. React receives `session:tick` and `session:screenshot` events.
8. When the timer reaches zero, the session ends automatically.
9. Screenshots are sent to the AI worker.
10. The result is saved in the `Session` table.
11. React receives `analysis:complete` and displays the result screen.

The app prevents closing the window during an active session using the `sessionActive` flag in `main.js`.

## Screenshot Processing

Screenshot processing is implemented in `electron/services/screenshot.js`.

On Linux, the app tries native screenshot tools:

```text
gnome-screenshot
scrot
import
grim
```

On Windows and macOS, it uses Electron `desktopCapturer`.

After capture, the screenshot is:

1. Resized to fit inside 1280x720.
2. Converted to JPEG.
3. Compressed at quality 70.
4. Saved locally in the app user data folder.
5. Removed from the local temp folder.

## Local Model Analysis

Live focus-session analysis is implemented in `electron/services/ai-worker.js`.

The app uses the local trained model when `FOCUS_ANALYZER=local`. In local mode, screenshots are saved to the app's local user data folder. The worker loads:

```text
ml/models/focus-logreg.json
```

Then it extracts features from each screenshot and predicts `focused` or `distracted`.

The result is saved in the database fields:

- `focusScore`
- `totalScreenshots`
- `focusedCount`
- `distractedCount`
- `aiSummary`
- `distractionDetails`
- `screenshotUrls` or local screenshot paths
- `completedAt`

## Reports Flow

Reports are implemented in `electron/ipc/reports.js` and `src/pages/Reports/Reports.jsx`.

Sequence:

1. Reports page calls `api.getReports(7)`.
2. IPC loads completed sessions from the last seven days.
3. Sessions are grouped by completion date.
4. Average focus score is calculated for each date.
5. React shows summary cards, a bar chart, and session history.

## Database Design

The Prisma schema contains three main models.

### User

Stores account information.

Important fields:

- `id`
- `email`
- `username`
- `passwordHash`
- `createdAt`

### Todo

Stores planned focus tasks.

Important fields:

- `taskName`
- `scheduledTime`
- `durationMinutes`
- `isCompleted`
- `userId`

### Session

Stores focus session results.

Important fields:

- `taskName`
- `focusScore`
- `totalScreenshots`
- `focusedCount`
- `distractedCount`
- `aiSummary`
- `distractionDetails`
- `screenshotUrls`
- `startedAt`
- `completedAt`

## Local ML Pipeline

The `ml/` folder was added to satisfy the academic machine learning requirements.

| Requirement | Implementation |
| --- | --- |
| Dataset preprocessing | `ml/preprocess.js` |
| Model training | `ml/train.js` |
| Analysis | `ml/analyze.js` |
| Evaluation | `ml/evaluate.js` |

Dataset layout:

```text
ml/dataset/raw/focused/
ml/dataset/raw/distracted/
```

Commands:

```bash
npm run ml:preprocess
npm run ml:train
npm run ml:evaluate
npm run ml:analyze -- ml/dataset/raw/focused/example.png
```

Run the complete local ML workflow:

```bash
npm run ml:all
```

Generated outputs:

```text
ml/processed/dataset.json
ml/processed/train.json
ml/processed/test.json
ml/processed/preprocessing-report.json
ml/models/focus-logreg.json
ml/reports/training-report.json
ml/reports/evaluation-report.json
```

The same local model pipeline is used for project submission and for live focus-session analysis inside the Electron app.

## Environment Variables

Create `.env` from `.env.example` and fill:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/focus-tracker
FOCUS_ANALYZER=local
LOCAL_MODEL_PATH=
```

## Setup and Run

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Push schema to database:

```bash
npm run prisma:push
```

Start the desktop app:

```bash
npm run dev
```

## Important Notes

- The app now uses the local trained model for live session analysis when `FOCUS_ANALYZER=local`.
- Before demonstrating local model analysis, add focused/distracted screenshots and run `npm run ml:all`.
- The Auth page appears only when no saved Keytar session exists.
- After login/signup, the saved Keytar session makes the app open directly to the dashboard.
- Logout clears the saved session and returns the user to the Auth page.

## Future Improvements

- Add validation to todo duration and scheduled time.
- Cancel scheduled alarms when todos are deleted.
- Add user-controlled screenshot privacy settings.
- Store human labels for screenshots to improve the local ML dataset.
- Improve the trained model with a larger labeled dataset.
- Add automated tests for IPC handlers and ML scripts.
