const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const universities = ['State University', 'Tech College', 'City University'];
  for (const name of universities) {
    await prisma.university.upsert({ where: { name }, update: {}, create: { name } });
  }

  const interests = ['Gaming', 'Music', 'Sports', 'Computer Science', 'Art', 'Reading'];
  for (const name of interests) {
    await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
  }

  const sampleUsers = [
    { email: 'alice@example.com', password: 'password123', name: 'Alice', university: 'State University', interests: ['Music', 'Art'] },
    { email: 'bob@example.com', password: 'password123', name: 'Bob', university: 'State University', interests: ['Gaming', 'Computer Science'] },
    { email: 'carol@example.com', password: 'password123', name: 'Carol', university: 'Tech College', interests: ['Reading', 'Music'] },
    { email: 'dave@example.com', password: 'password123', name: 'Dave', university: 'City University', interests: ['Sports', 'Gaming'] }
  ];

  for (const u of sampleUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    // create or skip if exists
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      const uni = await prisma.university.findUnique({ where: { name: u.university } });
      user = await prisma.user.create({ data: { email: u.email, password: hashed, name: u.name, universityId: uni ? uni.id : null } });
      for (const iname of u.interests) {
        const it = await prisma.interest.findUnique({ where: { name: iname } });
        if (it) {
          await prisma.userInterest.create({ data: { userId: user.id, interestId: it.id } });
        }
      }
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
