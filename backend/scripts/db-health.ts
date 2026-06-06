import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseHealth() {
  console.log('--- Database Health Check ---');
  try {
    // Attempt a basic query to check connection
    const result: any = await prisma.$queryRaw`SELECT 1 as is_alive, DATABASE() as db_name, VERSION() as version;`;
    
    if (result && result.length > 0) {
      console.log('✅ Connection Success: Database is reachable.');
      console.log(`📦 Database Name: ${result[0].db_name}`);
      console.log(`🔧 MySQL Version: ${result[0].version}`);
    } else {
      console.error('❌ Connection Failed: Query returned empty result.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Connection Failed: Unable to connect to the database.');
    console.error(`Error Details: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();
