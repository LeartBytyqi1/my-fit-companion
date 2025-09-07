# Railway Deployment Guide

## 1. Sign up at railway.app with GitHub
## 2. Install Railway CLI or use web interface

## 3. Create railway.json in your project root:
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}

## 4. Environment Variables to set in Railway dashboard:
- NODE_ENV=production
- JWT_SECRET=your-super-secure-jwt-secret
- DATABASE_URL=postgresql://... (Railway provides this)
- MONGO_URI=mongodb+srv://... (use MongoDB Atlas)
- ALLOWED_ORIGINS=https://yourdomain.railway.app

## 5. Deploy commands:
# railway login
# railway init
# railway up
