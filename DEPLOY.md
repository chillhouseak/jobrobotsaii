# Deploy JobRobots AI

## Architecture

| Service | Platform | Status |
|---------|----------|--------|
| User Frontend | Vercel | ✅ Already deployed |
| Admin Panel | Vercel | ✅ Configured |
| Backend (API) | Railway/Render | ⚠️ Needs deployment |

---

## Step 1: Deploy Backend

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo → Select `jobrobots-ai`
3. Set Root Directory: `backend`
4. Add Environment Variables:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=jobrobots_secret_key_2024_production
   PORT=5001
   ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-admin.vercel.app
   GEMINI_API_KEY=...
   ELEVENLABS_API_KEY=...
   FRONTEND_URL=https://your-frontend.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```
5. Deploy
6. Copy URL (e.g., `https://jobrobots-backend.up.railway.app`)

### Option B: Render
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add same Environment Variables
6. Deploy

---

## Step 2: Deploy/Update Frontend

### User Frontend (if not deployed)
```bash
cd frontend
vercel --prod
```

### Admin Panel
```bash
cd admin-panel
vercel --prod
```

---

## Step 3: Configure API URL

### On Vercel Dashboard:

**User Frontend** → Settings → Environment Variables:
```
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

**Admin Panel** → Settings → Environment Variables:
```
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

---

## Step 4: Create Admin User

After backend deploys, run:
```bash
cd backend
npm run seed:admin
```

---

## URLs After Deployment

| Service | URL |
|---------|-----|
| User Frontend | `https://your-frontend.vercel.app` |
| Admin Panel | `https://your-admin.vercel.app` |
| Backend API | `https://your-backend.up.railway.app` |

---

## Admin Login
- Email: `admin@jobrobots.ai`
- Password: `JobRobots@2024!`

---

## Troubleshooting

### CORS Errors
- Add your Vercel URLs to `ALLOWED_ORIGINS` on backend
- Example: `https://jobrobots.vercel.app,https://admin-jobrobots.vercel.app`

### API Not Working
- Check `VITE_API_URL` ends with `/api`
- Verify backend is running

### Login Issues
- Clear browser cache
- Check JWT_SECRET is same everywhere
