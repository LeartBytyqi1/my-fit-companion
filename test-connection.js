require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Supabase connection...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('Database:', result[0]);
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
