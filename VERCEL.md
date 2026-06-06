# Deploying VendorBridge to Vercel

> **Architecture Note:** VendorBridge has two parts:
> - **Frontend** (React/Vite) → deploy on **Vercel**
> - **Backend** (Node.js/Express + SQLite) → deploy on **Railway / Render / Fly.io**
>
> Vercel only hosts static/serverless apps. The Express backend needs a persistent server.

---

## Part 1 — Deploy Frontend on Vercel

### Option A: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Go into the frontend folder
cd frontend

# 3. Deploy
vercel

# 4. Follow prompts:
#    - Set up and deploy: Y
#    - Which scope: your account
#    - Link to existing project: N
#    - Project name: vendorbridge-frontend
#    - In which directory is your code: ./
#    - Want to override settings: N
```

### Option B: Vercel Dashboard (No CLI)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo `ODOO-x-KSV`
3. Set **Root Directory** → `frontend`
4. Framework Preset → **Vite**
5. Build Command → `npm run build`
6. Output Directory → `dist`
7. Click **Deploy**

### Frontend Environment Variables on Vercel

In Vercel Dashboard → Project → Settings → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.railway.app` |

Then update `frontend/src/lib/axios.js` base URL to use:
```js
baseURL: import.meta.env.VITE_API_URL || '/api'
```

---

## Part 2 — Deploy Backend on Railway (Free Tier)

Railway is the easiest platform for Node.js + persistent SQLite.

### Steps

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Select your repo → Set **Root Directory** to `backend`
3. Railway auto-detects Node.js
4. Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `file:./dev.db` |
| `JWT_SECRET` | `your_long_random_secret_here` |
| `JWT_EXPIRES_IN` | `24h` |
| `NODE_ENV` | `production` |
| `PORT` | `8000` |

5. Go to **Settings** → **Start Command**, set:
```
npm run start
```

6. Add a **Build Command**:
```
npm install && npm run build && npx prisma db push && node prisma/seed.js
```

7. Railway will assign a public URL like `https://vendorbridge-backend.railway.app`

---

## Part 3 — Deploy Backend on Render (Alternative)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect GitHub → select repo
3. Root Directory: `backend`
4. Build Command:
```bash
npm install && npm run build && npx prisma db push && node prisma/seed.js
```
5. Start Command:
```bash
node dist/server.js
```
6. Add same Environment Variables as above

---

## Part 4 — Connect Frontend → Backend

After deploying backend, update Vercel Frontend env:

```
VITE_API_URL=https://your-backend.railway.app
```

And update `frontend/vite.config.js` for production:
```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## CORS Configuration

Make sure backend `src/server.ts` allows your Vercel domain:

```ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app'  // ← add your Vercel URL
  ],
  credentials: true
}));
```

---

## Production Checklist

- [ ] `JWT_SECRET` is a long random string (not the dev default)
- [ ] `NODE_ENV=production` is set on backend
- [ ] CORS origin includes your Vercel frontend URL
- [ ] Frontend `VITE_API_URL` points to deployed backend
- [ ] Seed ran successfully (`node prisma/seed.js`)
- [ ] Test login with `admin@vendorbridge.com` / `admin123`

---

## Quick Test After Deployment

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vendorbridge.com","password":"admin123"}'
```
