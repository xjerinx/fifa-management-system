# FIFA Management System

A full-stack management and operations platform for football federations, clubs, tournaments, matches, players, and personnel.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios
- **Backend**: Node.js, Express, MySQL / MariaDB (`mysql2`), CORS, Dotenv

---

## Quick Start Guide

### 1. Start MySQL Database
Ensure MySQL / MariaDB is active via **XAMPP Control Panel** (or run `npm run db:start`).
- Host: `127.0.0.1`
- Port: `3306`
- Database: `fifa_management`

### 2. Run the Full Application (Single Command)
From the project root:
```bash
npm run dev
```
This runs both the backend server and frontend Vite server concurrently with color-coded logs.

### 3. Alternative Commands
| Command | Action |
|---|---|
| `npm run dev` | Starts both backend (port 5000) and frontend (port 5173) |
| `npm run dev:backend` | Starts only the backend API server |
| `npm run dev:frontend` | Starts only the frontend Vite server |
| `npm run build` | Builds the frontend for production |
| `npm run db:start` | Launches XAMPP MySQL daemon |

---

## Access Points
- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
