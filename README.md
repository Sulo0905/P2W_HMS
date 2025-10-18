# Login Issue - Quick Fix Instructions

## Problem
You can't login because either:
1. Backend server isn't running properly
2. No users exist in the database
3. MongoDB connection issue

## Solution - Follow These Steps:

### Step 1: Stop All Running Servers
Press `Ctrl+C` in any terminal windows running the servers

### Step 2: Start MongoDB (if not running)
Make sure MongoDB is running on your system. If you have MongoDB installed locally, it should be running as a service.

### Step 3: Create Test Users
Run this command in the backend directory:
```powershell
cd c:\Users\suloc\Desktop\ITP\profile-management\backend
node seedAdmin.js
```

This will create:
- **Admin**: username=`admin`, password=`admin123`
- **Doctor**: username=`doctor1`, password=`doctor123`
- **Patient**: username=`patient1`, password=`patient123`

### Step 4: Start Backend Server
```powershell
cd c:\Users\suloc\Desktop\ITP\profile-management\backend
node server.js
```

You should see:
```
🔗 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas: localhost
📊 Database: profileManagementDB
Server running on port 3004
```

### Step 5: Start Frontend (in a NEW terminal)
```powershell
cd c:\Users\suloc\Desktop\ITP\profile-management\frontend
npm start
```

### Step 6: Test Login
1. Browser should open to `http://localhost:3000`
2. You should see the login page
3. Try logging in with:
   - Username: `admin`
   - Password: `admin123`

### Step 7: Check Browser Console
If login still doesn't work:
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Try to login
4. Look for error messages (they will have 🔐, ✅, or ❌ emojis)
5. Share what you see

### Step 8: Check Network Tab
1. In DevTools, go to Network tab
2. Try to login
3. Look for request to `auth/login`
4. Check the Status Code and Response

## Common Issues:

### Issue 1: MongoDB Not Running
**Error**: "MongoServerError: connect ECONNREFUSED"
**Solution**: Start MongoDB service or install MongoDB

### Issue 2: Port Already in Use
**Error**: "EADDRINUSE: address already in use :::3004"
**Solution**: Kill the process using that port or use a different port

### Issue 3: No Users in Database
**Error**: "Invalid credentials"
**Solution**: Run `node seedAdmin.js` to create test users

## Quick Test
Open browser and go to: `http://localhost:3004/`
- If you see JSON response → Backend is running ✅
- If you see error → Backend is NOT running ❌
