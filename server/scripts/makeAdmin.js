require("dotenv").config();
const prisma = require("../lib/prisma");

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("Kullanım: node scripts/makeAdmin.js email@ornek.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin", verified: true },
  });

  console.log("Admin yapıldı:", user.email, user.role);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
