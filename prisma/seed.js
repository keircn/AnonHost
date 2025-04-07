const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.transaction.deleteMany({
    where: {
      type: 'bmc',
      transactionId: {
        startsWith: 'BMC_TEST_'
      }
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'keiran0@proton.me' },
    update: {},
    create: {
      email: 'keiran0@proton.me',
      name: 'Keiran',
      premium: false
    }
  });

  const transaction = await prisma.transaction.create({
    data: {
      transactionId: `BMC_TEST_${Date.now()}`,
      userId: user.id,
      amount: 5.00,
      currency: 'USD',
      type: 'bmc',
      createdAt: new Date()
    }
  });

  console.log('Seed results:', { user, transaction });
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  });