# JobRobots AI - Deploy on Vercel

## Project Structure
```
jobrobots-ai/
├── api/                    # Vercel serverless functions (API routes)
│   ├── _lib/
│   │   ├── db.js         # MongoDB cached connection
│   │   └── auth.js      # Auth middleware
│   ├── auth/
│   │   ├── login.js     # POST /api/auth/login
│   │   ├── register.js   # POST /api/auth/register
│   │   ├── me.js         # GET /api/auth/me
│   │   └── profile.js    # PUT /api/auth/profile
│   ├── ai/
│   │   └── [...slug].js  # All AI endpoints
│   └── webhooks/
│       └── ipn.js        # POST /api/webhooks/ipn
├── backend/               # Local development (Express)
├── frontend/              # React/Vite app
├── vercel.json            # Vercel config
└── package.json
```

## Deploy Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "JobRobots AI - Ready for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jobrobots-ai.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Vercel auto-detects settings:
   - **Root Directory:** `.` (root)
   - **Framework:** Other
   - **Build Command:** (leave empty)
5. Click **Deploy**

### 3. Add Environment Variables (in Vercel Dashboard)
Go to Project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | jobrobots_secret_key_2024_production |
| `GEMINI_API_KEY` | Your Gemini API key |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |

### 4. Redeploy
After adding env vars, go to **Deployments** → **Redeploy** the latest.

## Local Development

### Backend (local)
```bash
cd backend && npm install && npm start
```

### Frontend (local)
```bash
cd frontend && npm install && npm run dev
```

## Notes
- API routes at `/api/*` are served as Vercel serverless functions
- Frontend routes are served from the `frontend/` build
- MongoDB connection is cached for cold start performance
