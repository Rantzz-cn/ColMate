# ColMate Deployment Guide — Railway

This guide covers hosting ColMate on **Railway.app** (Postgres + Node backend).

## 1. Set Up Railway Account & Project

1. Sign up at [railway.app](https://railway.app)
2. Create a new project: **Dashboard** → **Create** → **Empty Project**
3. Add services:
   - **Postgres**: Click **Add** → **Database** → **Postgres**
   - **Node.js**: Click **Add** → **GitHub Repo** or upload your code

## 2. Configure Postgres on Railway

1. Click the Postgres service tile
2. Go to the **Variables** tab
3. Railway auto-exposes `DATABASE_URL` — copy it (or note that it's available)
4. (Optional) Go to **Data** tab to verify schema

## 3. Deploy Node Backend

### Option A: GitHub Integration (Recommended)

1. Push your ColMate repo to GitHub
2. In Railway, click **Add Service** → **GitHub Repo** → select `ColMate`
3. Select the `backend/` directory as the root
4. In the Node service, go to **Variables** and add:
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_secret_here
   DATABASE_URL=<auto-filled from Postgres>
   PORT=8080
   ```
5. Railway auto-deploys on push; watch the **Deployments** tab

### Option B: Manual Deploy

1. Install Railway CLI: `npm install -g @railway/cli`
2. From your project root:
   ```bash
   railway login
   railway init
   railway up
   ```
3. Link services in Railway dashboard

## 4. Run Migrations & Seed on Deployed Database

Once your backend is deployed, open the Railway dashboard and click **Backend Service** → **Shell**.

In the shell:
```bash
cd backend
npx prisma migrate deploy
npm run seed
```

(Or use your deployed DB URL locally to run these commands.)

## 5. Deploy Frontend (Expo)

Since Expo can be run via CLI, you have two options:

- **Expo Go**: Scan QR on mobile (dev-friendly, no deployment)
- **EAS Build + EAS Hosting**: For production iOS/Android binaries
  ```bash
  npm install -g eas-cli
  cd frontend
  eas init
  eas build
  eas submit
  ```

Or use **Vercel/Netlify** to host a web build:
```bash
cd frontend
npx expo export --platform web
# Deploy the dist/ folder to Vercel/Netlify
```

## 6. Update Frontend Server URL

Once your backend is live on Railway, update the frontend to connect to it.

In `frontend/App.js`, change:
```javascript
const [serverUrl, setServerUrl] = useState('https://your-railway-backend-url.up.railway.app');
```

(Railway provides a public URL like `https://colmate-backend-prod.up.railway.app`.)

## 7. Test Production

1. Backend health check:
   ```bash
   curl https://your-railway-backend-url.up.railway.app/
   ```
2. Frontend Socket.IO connection:
   - Update `serverUrl` in frontend
   - Restart Expo dev/build
   - Verify `matched` event fires when queuing

## 8. Environment Variables Checklist

### Backend (Railway Variables)
```
DATABASE_URL=postgresql://...  (auto-filled from Postgres)
JWT_SECRET=your_secret_here
NODE_ENV=production
PORT=8080  (Railway's default)
```

### Frontend
```
EXPO_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
```

## 9. Monitoring & Logs

- **Railway Dashboard**: Click service → **Logs** tab to debug
- **Metrics**: Monitor CPU, memory, and request count under **Metrics**
- **Alerts**: Set up email alerts for crashes

## 10. Scaling & Next Steps

- **Database**: Postgres auto-scales; upgrade plan if needed
- **Backend**: Railway auto-scales containers; adjust as traffic grows
- **Caching**: Add Redis for matchmaker queue (replace in-memory implementation)
- **Storage**: Use Railway's file storage for profile pictures

## Common Issues

| Issue | Fix |
|-------|-----|
| `DATABASE_URL not found` | Go to **Postgres service** → **Variables** → verify `DATABASE_URL` is set |
| `Port already in use` | Railway sets `PORT=8080` by default; ensure backend uses `process.env.PORT` |
| `Prisma migrations fail` | Run `npx prisma migrate deploy` in deployed shell or local with deployed DB URL |
| `Socket.IO connection fails` | Check CORS in backend; update frontend `serverUrl` to Railway's public domain |

---

For more help: [Railway Docs](https://docs.railway.app)
