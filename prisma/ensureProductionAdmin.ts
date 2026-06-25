import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const adminEmail = "ardesignstudio25@gmail.com";

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: "ADMIN" },
      });
      console.log(`Updated ${adminEmail} to ADMIN.`);
    } else {
      console.log(`Admin ${adminEmail} already exists.`);
    }
    return;
  }

  const temporaryPassword = process.env.PRODUCTION_ADMIN_TEMP_PASSWORD;
  if (!temporaryPassword) {
    throw new Error("PRODUCTION_ADMIN_TEMP_PASSWORD is required to create the production admin.");
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "AR Design Studio",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created production admin ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
