# Quick Deployment Script

# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up

# 3. Set environment variables in Railway dashboard:
# NODE_ENV=production
# JWT_SECRET=your-super-secure-secret-key
# DATABASE_URL=postgresql://... (from Supabase)
# MONGO_URI=mongodb+srv://... (from MongoDB Atlas)  
# ALLOWED_ORIGINS=https://your-app.railway.app

# 4. Your app will be live at: https://your-app.railway.app
