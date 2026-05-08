# Phase 2 Complete — Wire-Up & End-to-End Verification

**Date:** 2026-05-08
**Status:** ✅ Done — dev stack boots, signup persists to DB

---

## Goal of Phase 2

Bring the Phase 1 scaffold to life: confirm every layer (DB → Prisma → IPC → preload → React) talks to the next without errors, and prove it with a real signup persisted to PostgreSQL.

---

## What Was Verified

### 2.1 Database Connectivity
- Local PostgreSQL reachable on `localhost:5432` (`pg_isready`)
- `focus-tracker` database present
- `DATABASE_URL=postgresql://postgres@localhost:5432/focus-tracker` in `.env` resolves correctly

### 2.2 Prisma Schema → Database
```bash
npm run prisma:generate   # ✔ Generated Prisma Client v6.19.3
npm run prisma:push       # ✔ Database is already in sync with the Prisma schema
```
Tables created in `public` schema: `User`, `Todo`, `Session`.

### 2.3 Native Module Rebuild for Electron
```bash
./node_modules/.bin/electron-rebuild -f -w keytar
# ✔ Rebuild Complete  (keytar bound to Electron's Node ABI)
```
- `sharp` ships prebuilt binaries for Electron — no rebuild needed.
- Without this step, `keytar` throws `NODE_MODULE_VERSION` mismatch on first auth call.

### 2.4 Dev Stack Boot
```bash
npm run dev
# [0] VITE v8.0.11 ready in 727 ms → http://localhost:5173/
# [1] injected env (7) from .env
# Electron window opens, renderer connects to Vite
```
- `concurrently` starts Vite + Electron
- `wait-on` blocks Electron until Vite ready
- HTTP `GET /` returns 200 with React entry HTML

### 2.5 End-to-End Auth Round-Trip
- React `Auth.jsx` → `window.api.signup()` → preload `ipcRenderer.invoke('auth:signup')` → main `ipc/auth.js` → bcrypt hash → Prisma insert → keytar store userId.
- Verified by inserting user `test22@gmail.com` from the UI; row landed in `User` table with hashed password and `createdAt` timestamp.

---

## Issues Hit & Fixed

| Issue | Cause | Fix |
|-------|-------|-----|
| Vite jumped to port `5174`, `wait-on` stuck on `5173` | Stale `node`/`electron` from a prior session held port `5173` | `kill <pid>` of the dangling vite + electron processes, restart `npm run dev` |
| Bash background task showed empty log for `npm run dev` | RTK output filter buffers long-lived processes | Use `rtk proxy npm run dev` to bypass filtering |
| `electron-rebuild -w sharp` reported no rebuild | `sharp` provides prebuilt Electron bindings | Skip — confirmed working at runtime |

Cosmetic warning (ignore): `Installed VAAPI version is too old. min supported version: 1.17 installed version: 1.14` — GPU video accel only, no functional impact.

---

## Commands Reference

```bash
# Verify Postgres
pg_isready -h localhost -p 5432
psql -h localhost -U postgres -lqt | grep focus-tracker

# Sync schema
npm run prisma:generate
npm run prisma:push

# Rebuild native modules (run if keytar throws ABI errors)
./node_modules/.bin/electron-rebuild -f -w keytar

# Boot dev
npm run dev

# Inspect auth row
psql -h localhost -U postgres -d focus-tracker \
  -c 'SELECT id, email, "createdAt" FROM "User" ORDER BY id DESC LIMIT 5;'
```

---

## Stack Confirmed Working

| Layer | Verified |
|-------|----------|
| PostgreSQL @ localhost:5432 | ✅ accepting connections |
| Prisma Client v6.19.3 | ✅ schema in sync |
| Electron main process | ✅ window opens, IPC handlers loaded |
| Preload contextBridge | ✅ `window.api` exposed to renderer |
| Vite dev server | ✅ HMR on :5173 |
| React Auth page | ✅ renders, submits to IPC |
| keytar (OS keychain) | ✅ stores userId after signup |
| bcryptjs hash | ✅ password hashed before insert |

---

## Next Phase

**Phase 3** — Todos CRUD + node-schedule alarm trigger.
- Add a todo with scheduled time
- Confirm `Todo` row inserted and tied to `userId`
- Confirm `node-schedule` job fires at `HH:MM` and emits `alarm:trigger` IPC event to renderer
- Alarm modal appears in Dashboard with task name + Start button
