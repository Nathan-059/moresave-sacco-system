# 🚀 Moresave SACCO Web App - Pre-Launch Checklist

Before opening the browser, ensure:

## ✅ Prerequisites Met
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MySQL running on localhost:3306
- [ ] SACCO database created (`mysql -u root < database/SACCO.sql`)

## ✅ Dependencies Installed
- [ ] Run: `cd moresave-react && npm install`
- [ ] Run: `cd moresave-react/server && npm install`

## ✅ Backend Server Started
- [ ] Terminal 1: `cd moresave-react/server && npm start`
- [ ] Wait for: `Server running on port 5000`
- [ ] Check: http://localhost:5000/api/health returns `{"status":"OK","message":"Moresave SACCO API is running"}`

## ✅ Frontend Server Started
- [ ] Terminal 2: `cd moresave-react && npm run dev`
- [ ] Wait for: `VITE v... ready in ... ms`

## ✅ Browser Access
- [ ] Open: http://localhost:5173
- [ ] See login page (not connection error)

## ✅ Login Test
- [ ] Username: `admin`
- [ ] Password: `admin123`
- [ ] Click: SIGN IN

---

## 🆘 If You See "Connection error":

### Step 1: Check Backend
```bash
# In Terminal 1, check if it's running
# Should say: "Server running on port 5000"

# If stopped, restart:
cd moresave-react/server
npm start
```

### Step 2: Verify Backend is Reachable
Open in browser: http://localhost:5000/api/health

Should see: `{"status":"OK","message":"Moresave SACCO API is running"}`

### Step 3: Check Database
```bash
mysql -u root
SHOW DATABASES;
USE SACCO;
SELECT COUNT(*) FROM users;
```

Should show at least 1 user (admin).

### Step 4: Retry Frontend
Close and reopen browser. Go to http://localhost:5173

---

## 🔧 Port Issues

**If port 5000 is in use:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**If port 5173 is in use:**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📋 Server Configuration

Backend connects using:
- **DB Host:** localhost:3306
- **DB User:** root
- **DB Password:** (empty)
- **DB Name:** SACCO
- **API Port:** 5000

If your MySQL is different, edit: `moresave-react/server/.env`

---

**🎯 Tip:** The most common mistake is forgetting to start the backend. Always check Terminal 1!
