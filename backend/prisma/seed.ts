import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@vendorbridge.com',
      password: hashed,
      role: 'ADMIN'
    }
  });
  
  console.log('Seeded admin:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
