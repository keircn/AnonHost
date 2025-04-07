const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'keiran0@proton.me' },
    update: {},
    create: {
      email: 'keiran0@proton.me',
      name: 'Keiran',
      premium: false,
      transactions: {
        create: {
          transactionId: 'BMC_TEST_123',
          amount: 5.00,
          currency: 'USD',
          type: 'bmc',
          createdAt: new Date()
        }
      }
    }
  })

  console.log({ user })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })