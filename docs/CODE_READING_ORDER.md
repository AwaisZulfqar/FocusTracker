# Code Reading Order

Use this order when you want to understand the project file structure step by step. This document does not explain the code logic. It only tells you what to read first, next, and last.

## 1. Start Here

1. `README.md`
2. `PLAN.md`
3. `HOW_WE_WORK.md`
4. `PHASE1_COMPLETE.md`
5. `PHASE2_COMPLETE.md`
6. `package.json`
7. `.env.example`
8. `vite.config.js`

These files tell you what the project is, what scripts exist, what environment variables are expected, and how the app is started.

## 2. Understand The App Entry Point

1. `index.html`
2. `src/main.jsx`
3. `src/styles/index.css`
4. `src/components/App/App.jsx`
5. `src/components/App/App.module.css`

Read these before opening individual pages. This gives you the frontend starting path.

## 3. Understand Main Screens

1. `src/pages/Auth/Auth.jsx`
2. `src/pages/Dashboard/Dashboard.jsx`
3. `src/pages/FocusSession/FocusSession.jsx`
4. `src/pages/Reports/Reports.jsx`

After each `.jsx` file, read its matching `.module.css` file in the same folder.

Recommended order:

1. Auth
2. Dashboard
3. FocusSession
4. Reports

## 4. Understand Shared Frontend Helpers

1. `src/lib/api.js`
2. `src/lib/animations.js`
3. `src/utils/time.js`
4. `src/utils/score.js`
5. `src/constants/ring.js`
6. `src/constants/particles.js`

Read these after the pages because pages use these helper files.

## 5. Understand Reusable UI Components

Read these after pages and helpers.

1. `src/components/Sidebar/Sidebar.jsx`
2. `src/components/Sidebar/NavItem.jsx`
3. `src/components/TimerRing/TimerRing.jsx`
4. `src/components/TodoCard/TodoCard.jsx`
5. `src/components/SessionCard/SessionCard.jsx`
6. `src/components/ResultScreen/ResultScreen.jsx`
7. `src/components/AlarmModal/AlarmModal.jsx`
8. `src/components/FocusChart/FocusChart.jsx`
9. `src/components/StatCard/StatCard.jsx`
10. `src/components/StatTile/StatTile.jsx`
11. `src/components/StatPill/StatPill.jsx`
12. `src/components/Field/Field.jsx`
13. `src/components/InputField/InputField.jsx`
14. `src/components/StyledInput/StyledInput.jsx`
15. `src/components/Background/Background.jsx`
16. `src/components/BootLoader/BootLoader.jsx`
17. `src/components/Particle/Particle.jsx`
18. `src/components/FloatingOrb/FloatingOrb.jsx`
19. `src/components/icons/index.js`

For each component folder, read the `.jsx` file first and then its `.module.css` file.

## 6. Understand Electron Desktop Layer

1. `electron/main.js`
2. `electron/preload.js`

These are the desktop app entry files. Read them before IPC and services.

## 7. Understand IPC Files

1. `electron/ipc/auth.js`
2. `electron/ipc/todos.js`
3. `electron/ipc/session.js`
4. `electron/ipc/reports.js`

Read these after `electron/main.js` and `electron/preload.js`.

## 8. Understand Backend Services

1. `electron/services/prisma.js`
2. `electron/services/scheduler.js`
3. `electron/services/screenshot.js`
4. `electron/services/ai-worker.js`
5. `electron/services/r2.js`

Read these after IPC files. These files handle database access, scheduling, screenshots, AI analysis, and storage.

## 9. Understand Database Structure

1. `prisma/schema.prisma`

Read this after Electron services, because the services depend on the database models.

## 10. Understand ML Pipeline

1. `ml/README.md`
2. `ml/lib/common.js`
3. `ml/preprocess.js`
4. `ml/train.js`
5. `ml/evaluate.js`
6. `ml/analyze.js`
7. `ml/lib/predictor.js`

Read in this order if you want to understand how the local focus model is prepared and used.

## 11. Understand ML Data And Outputs

1. `ml/dataset/raw/focused/`
2. `ml/dataset/raw/distracted/`
3. `ml/processed/dataset.json`
4. `ml/processed/train.json`
5. `ml/processed/test.json`
6. `ml/processed/preprocessing-report.json`
7. `ml/models/focus-logreg.json`
8. `ml/reports/training-report.json`
9. `ml/reports/evaluation-report.json`

Read folders first, then generated JSON files.

## 12. Understand Project Documentation

1. `docs/FocusTracker_Project_Report.html`
2. `docs/FocusTracker_Project_Report.pdf`

Read these after the code structure if you want the project report view.

## 13. Usually Skip These First

Do not start with these folders:

1. `node_modules/`
2. `dist/`
3. `.git/`
4. `electron/assets/`
5. `WhatsApp Unknown 2026-05-13 at 5.17.48 PM/`

These are dependencies, build output, Git internals, icons, or raw source screenshots. They are not the best place to understand the code.

## Quick Full Sequence

1. Root docs and config
2. React app entry
3. Main pages
4. Frontend helpers
5. Shared UI components
6. Electron entry files
7. IPC files
8. Electron services
9. Prisma schema
10. ML pipeline
11. ML dataset and generated outputs
12. Project report files

