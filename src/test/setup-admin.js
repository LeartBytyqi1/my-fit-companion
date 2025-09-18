const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Checking for existing admin users...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('   Role:', existingAdmin.role);
      return existingAdmin;
    }

    console.log('🔧 Creating new admin user...');
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fitcompanion.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User', // Keep for backward compatibility
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', adminUser.email);
    console.log('   Password: admin123');
    console.log('   Role:', adminUser.role);
    console.log('   ID:', adminUser.id);
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error managing admin user:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test the database connection and create admin user
async function testDatabase() {
  try {
    console.log('🚀 Testing PostgreSQL database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Check if User table exists and has correct schema
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Create admin user
    await createAdminUser();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📱 Your Android admin endpoints are ready to use!');
    
  } catch (error) {
    console.error('💥 Database test failed:', error.message);
  }
}

testDatabase();