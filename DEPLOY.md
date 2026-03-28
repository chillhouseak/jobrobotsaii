# Deploy JobRobots AI

## Step 1: Deploy Backend (Node.js/Express)

Use **Render.com** (free tier) for the backend:

1. Go to [render.com](https://render.com) → Sign up / Login
2. Click **New → Web Service**
3. Connect your GitHub repo: `https://github.com/YOUR_USERNAME/jobrobots-ai`
4. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = jobrobots_secret_key_2024_production
   - `GEMINI_API_KEY` = your Gemini API key
   - `ELEVENLABS_API_KEY` = your ElevenLabs API key
   - `PORT` = 5001
6. Click **Deploy**

After deploy, copy your URL: `https://jobrobots-ai-backend.onrender.com`

---

## Step 2: Update Vercel Config

Edit `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-RENDER-URL.onrender.com/api/:path*" }
  ]
}
```

Replace `YOUR-RENDER-URL` with your actual Render URL.

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up / Login with GitHub
2. Click **Add New → Project**
3. Import your GitHub repo
4. Set:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**

Your app will be live at: `https://jobrobots-ai-frontend.vercel.app`

---

## Important Notes

- **CORS**: The `vercel.json` rewrite handles all API calls — no CORS issues
- **MongoDB Atlas**: Your database stays on Atlas (no change needed)
- **Environment Variables**: Set API keys on Render, not on Vercel
- **Updates**: Push to GitHub → Vercel auto-deploys
