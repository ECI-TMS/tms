import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  const existingAdmin = await prisma.users.findFirst({
    where: {
      Email: 'admin@eci.com',
    },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping creation...');
    return;
  }

  // Hash the password
  const hashedPassword = await hash('Sqazi@2025', 10);

  // Create admin user
  const adminUser = await prisma.users.create({
    data: {
      Username: 'admin',
      Email: 'admin@eci.com',
      Password: hashedPassword,
      UserType: 'ADMIN',
      FirstName: 'System',
      LastName: 'Administrator',
      ContactNumber: 'N/A',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: admin@eci.com');
  console.log('🔑 Password: Sqazi@2025');
  console.log('🆔 User ID:', adminUser.UserID);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🏁 Seeding completed!');
  });
