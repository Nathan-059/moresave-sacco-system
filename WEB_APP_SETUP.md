# Moresave SACCO Web Application - Startup Guide

## The Problem You're Having

**"Connection error. Please check if the server is running."**

This error appears because the **backend Node.js server is NOT running**. The frontend React app tries to call `/api/auth/login`, but there's nothing listening on port 5000.

---

## The Solution: Start TWO Servers

### Option 1: Automatic (Easiest) - Windows Only
```bash
Double-click: START_WEB_APP.bat
```
This automatically starts both servers. Then open: **http://localhost:5173**

---

### Option 2: Manual (All Platforms)

**STEP 1: Start Backend Server**
```bash
cd moresave-react/server
npm install
npm start
```
Wait for: ✅ `Server running on port 5000`

**STEP 2: In a NEW terminal, Start Frontend**
```bash
cd moresave-react
npm install
npm run dev
```
Then open: **http://localhost:5173**

---

## Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## Troubleshooting

### ❌ Still Getting "Connection error"?

**Check 1: Is backend running?**
```bash
netstat -an | findstr :5000
```
If nothing shows, the backend isn't running. Go to STEP 1 above.

**Check 2: Is port 5000 blocked?**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Check 3: Database connection**
The backend needs MySQL with the `SACCO` database:
```bash
cd database
mysql -u root < SACCO.sql
```

### ❌ "npm: command not found"
Install Node.js 20+: https://nodejs.org/

### ❌ "Cannot find module"
```bash
cd moresave-react/server
npm install
```

### ❌ Port already in use
Find what's using port 5000:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## What's Running Where?

| Component | Port | URL | Status |
|-----------|------|-----|--------|
| Frontend (React) | 3000/5173 | http://localhost:5173 | Browser |
| Backend API | 5000 | http://localhost:5000 | Terminal 1 |
| Database | 3306 | localhost:3306 | MySQL Service |

---

## Architecture

```
Browser (localhost:5173)
    ↓
    └─→ Frontend (React + Vite)
            ↓
        /api/* requests
            ↓
        Vite Proxy (localhost:5173 → localhost:5000)
            ↓
        Backend API (Express on port 5000)
            ↓
        MySQL Database (localhost:3306)
```

**Key Point:** The frontend uses Vite's proxy to forward `/api/*` requests to the backend on port 5000.

---

## Scripts Available

### Frontend (moresave-react)
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

### Backend (moresave-react/server)
```bash
npm start       # Start production server
npm run dev     # Start with auto-reload (nodemon)
```

---

## Next Steps

1. ✅ Run `START_WEB_APP.bat` OR follow Option 2 Manual Steps
2. ✅ Open http://localhost:5173
3. ✅ Login with admin/admin123
4. ✅ Make sure BOTH terminals show no errors

**Still having issues?** Run: `DIAGNOSE.bat` to check your system setup
