# Database Setup Instructions

## 1. PostgreSQL (for main app data)

### Option A: Supabase (Recommended - Free)
1. Go to https://supabase.com
2. Create new project
3. Copy the connection string from Settings > Database
4. Format: postgresql://postgres:[password]@[host]:5432/postgres

### Option B: Neon (Alternative Free)
1. Go to https://neon.tech  
2. Create database
3. Copy connection string

## 2. MongoDB (for chat messages)

### MongoDB Atlas (Free 512MB)
1. Go to https://cloud.mongodb.com
2. Create cluster (choose free M0)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string
6. Format: mongodb+srv://username:password@cluster.mongodb.net/my-fit-companion

## 3. Update .env for production:
DATABASE_URL="postgresql://..."
MONGO_URI="mongodb+srv://..."
