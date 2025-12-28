const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 従業員ロールの作成
  await prisma.employeeRole.createMany({
    data: [
      { roleNumber: 0, roleName: '管理者' },
      { roleNumber: 1, roleName: '新入社員' },
      { roleNumber: 2, roleName: 'OJT推進者' },
      { roleNumber: 3, roleName: 'OJT責任者' },
      { roleNumber: 4, roleName: 'OJT支援者' }
    ],
    skipDuplicates: true
  });
  console.log('✓ Employee roles created');

  // 絵文字の作成
  await prisma.emoji.createMany({
    data: [
      { id: 'EMJ00001', emojiContent: '👍' },
      { id: 'EMJ00002', emojiContent: '😢' },
      { id: 'EMJ00003', emojiContent: '😊' },
      { id: 'EMJ00004', emojiContent: '🤔' },
      { id: 'EMJ00005', emojiContent: '🧡' },
      { id: 'EMJ00006', emojiContent: '😎' }
    ],
    skipDuplicates: true
  });
  console.log('✓ Emojis created');

  // 管理者ユーザーの作成
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.employee.create({
    data: {
      id: 'EMP0001',
      userName: 'admin',
      password: hashedPassword,
      employeeName: '管理者',
      role: 0,
      color: '#3498db',
      isDeleted: 0
    }
  });
  console.log('✓ Admin user created (username: admin, password: admin123)');

  // テストユーザーの作成
  const testPassword = await bcrypt.hash('test123', 10);
  await prisma.employee.create({
    data: {
      id: 'EMP0002',
      userName: 'testuser',
      password: testPassword,
      employeeName: 'テストユーザー',
      role: 1,
      color: '#e74c3c',
      isDeleted: 0
    }
  });
  console.log('✓ Test user created (username: testuser, password: test123)');

  console.log('\nSeeding completed successfully!');
  console.log('\nDefault accounts:');
  console.log('  - Admin: username=admin, password=admin123');
  console.log('  - User:  username=testuser, password=test123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
