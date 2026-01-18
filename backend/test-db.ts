import { prisma } from './src/config/database';

async function testDatabase() {
  try {
    // Count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    // Test raw query
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Database time:', result);

    console.log('✅ Database connection works!');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

