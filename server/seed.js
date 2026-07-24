// server/seed.js — Seed admin user into the database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const email = 'admin@webore.com';
  const password = 'admin@123';

  try {
    await prisma.$connect();

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`Admin user already exists: ${email} (role: ${existing.role})`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Webore',
        role: 'admin',
      },
    });

    console.log('=========================================');
    console.log('  Admin user created successfully!');
    console.log('=========================================');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role:     ${admin.role}`);
    console.log('=========================================');
    console.log('  IMPORTANT: Change this password after');
    console.log('  your first login in production!');
    console.log('=========================================');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
