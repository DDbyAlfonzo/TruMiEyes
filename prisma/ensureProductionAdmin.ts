import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const adminEmail = "ardesignstudio25@gmail.com";

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true },
  });

  if (existingAdmin) {
    const updateData: { role?: "ADMIN"; passwordHash?: string } = {};
    if (existingAdmin.role !== "ADMIN") {
      updateData.role = "ADMIN";
    }

    if (process.env.PRODUCTION_ADMIN_RESET_PASSWORD === "true") {
      const temporaryPassword = process.env.PRODUCTION_ADMIN_TEMP_PASSWORD;
      if (!temporaryPassword) {
        throw new Error("PRODUCTION_ADMIN_TEMP_PASSWORD is required to reset the production admin password.");
      }
      updateData.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: updateData,
      });
      console.log(`Updated production admin ${adminEmail}.`);
      return;
    }

    console.log(`Admin ${adminEmail} already exists.`);
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
