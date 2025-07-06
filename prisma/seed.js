const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Creating test user...");
  const user = await prisma.user.upsert({
    where: { email: "keiran0@proton.me" },
    update: {
      premium: false,
    },
    create: {
      email: "keiran0@proton.me",
      name: "Keiran",
      premium: false,
    },
  });

  console.log("Seed results:", {
    user: { id: user.id, email: user.email, premium: user.premium },
  });
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
