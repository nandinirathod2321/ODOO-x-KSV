import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const usersPath = path.join(__dirname, '../seed-data/users.json');
  const vendorsPath = path.join(__dirname, '../seed-data/vendors.json');

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const vendors = JSON.parse(fs.readFileSync(vendorsPath, 'utf8'));

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role
      }
    });
  }

  await prisma.vendor.createMany({
    data: vendors
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
