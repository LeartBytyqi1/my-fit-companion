# DEPLOYMENT INSTRUCTIONS

## Step-by-Step Railway Deployment

### 1. Sign up for Railway
- Go to https://railway.app
- Click "Login with GitHub"
- Authorize Railway to access your repositories

### 2. Deploy your project
```bash
# In your project directory, run:
railway login
railway init
railway up
```

### 3. Set Environment Variables in Railway Dashboard
After deployment, go to your Railway dashboard and add these variables:

**Required Environment Variables:**
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-now
MONGO_URI=mongodb+srv://lb51563_db_user:YOUR_ACTUAL_PASSWORD@cluster0.i7najps.mongodb.net/my-fit-companion
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
ALLOWED_ORIGINS=https://your-app.railway.app
```

### 4. Important Notes:
- Replace YOUR_ACTUAL_PASSWORD with your MongoDB password
- Replace DATABASE_URL with your Supabase/Neon connection string
- Railway will give you a domain like: https://my-fit-companion-production.railway.app
- Update ALLOWED_ORIGINS with your actual Railway domain

### 5. Test your deployment:
- Visit your Railway URL
- You should see: "Fitness API is running"
- Test API: https://your-domain.railway.app/api/auth/register

## Alternative: Render Deployment
If Railway doesn't work, you can use Render:
1. Go to https://render.com
2. Connect GitHub
3. Create "Web Service"
4. Build command: `npm install && npx prisma generate`
5. Start command: `npm start`
6. Add same environment variables
