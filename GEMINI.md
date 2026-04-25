# 🛡️ ISG Saha Gözlem Sistemi - Project Context

## Project Overview
This is a full-stack, local-first Occupational Health and Safety (OHS/İSG) management system designed for **Turkish Technic**, adhering to **ISO 45001** standards. It enables field personnel to record observations, incidents, and audits even in offline environments, with automatic synchronization to a central server when connectivity is restored.

### Core Technologies
- **Frontend:** React (Vite), Dexie.js (IndexedDB), Socket.io-client, Vanilla CSS.
- **Backend:** Node.js (Express), SQLite (better-sqlite3), Socket.io.
- **AI/ML:** TensorFlow.js (COCO-SSD) for automated PPE (KKD) detection.
- **Security:** JWT Authentication, BCrypt password hashing, RBAC (Role-Based Access Control).

## Architecture & Logic
### Local-First Sync Strategy
The application prioritizes local data availability using **Dexie.js**.
1. **Offline Mode:** All changes are saved to a local `syncQueue` in IndexedDB.
2. **Synchronization:** When online, the `SyncService` pushes queued changes to the backend and pulls new updates.
3. **Real-time:** Socket.io is used for instant updates across different devices within the same organization.

### Digital Agent Ecosystem
The system features specialized "agents" (located in `src/services/agents/`) that perform autonomous tasks:
- **Compliance Agent:** Matches field findings with legal regulations (Law No. 6331).
- **Guardian Agent:** Detects critical hazards and PPE violations in photos.
- **Analyst Agent:** Monitors trends and calculates predictive risk scores.
- **Coach Agent:** Manages personnel competency and training requirements.

## Building and Running
### Development
- **Start Backend:** `npm run server` (Runs on `http://localhost:3001`)
- **Start Frontend:** `npm run dev` (Runs on `http://localhost:5173`)
- **Combined Dev Mode:** `npm run dev:full`

### Production
- **Manual Build:** `npm run build`
- **Windows Startup:** Run `BASLAT.bat` (Builds the app and starts the production server on port 8080).
- **Production Server:** `node server.cjs` (Serves the `dist` folder).

## Directory Structure
- `src/components/`: UI components (Common, Layout, and Feature-specific).
- `src/services/`: Core business logic, sync engine, and AI services.
- `src/database/db.js`: Dexie.js schema and migrations.
- `server/`: Express API, SQLite database, and socket handlers.
- `server/routes/crudFactory.js`: A generic router for standard entity operations.
- `.agent/skills/`: Custom instructions and tools for AI interaction.

## Development Conventions
- **Language:** UI is in Turkish; code/comments are a mix of Turkish and English.
- **Styling:** Custom Vanilla CSS with a focus on CSS Variables (defined in `index.css` and `layout-styles.css`).
- **Data Integrity:** Always use `syncQueue` for data mutations to ensure offline compatibility.
- **API Versioning:** All endpoints are prefixed with `/api/v1/`.

## Key Files
- `package.json`: Main project configuration and scripts.
- `AGENTS.md`: Detailed descriptions of the AI Agent Ecosystem.
- `src/services/syncService.js`: The heart of the data synchronization logic.
- `server/index.js`: Main backend entry point.
