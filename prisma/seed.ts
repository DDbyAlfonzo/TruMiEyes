import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@trumieyes.com";
  const productionAdminEmail = "ardesignstudio25@gmail.com";
  const clientEmail = "client@trumieyes.com";
  const sampleLayoutName = "Classic 20-page";
  const sampleProjectTitle = "Smith Family Album";

  const adminPassword = await bcrypt.hash("admin123", 10);
  const clientPassword = await bcrypt.hash("client123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { active: true },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: productionAdminEmail },
    update: { role: "ADMIN", active: true },
    create: {
      email: productionAdminEmail,
      name: "AR Design Studio",
      passwordHash: adminPassword,
      role: "ADMIN",
      active: true,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { active: true },
    create: {
      email: clientEmail,
      name: "Sample Client",
      passwordHash: clientPassword,
      role: "CLIENT",
      active: true,
    },
  });

  const sampleLayouts = await prisma.bookLayout.findMany({
    where: { name: sampleLayoutName, createdByAdminId: admin.id },
    orderBy: { createdAt: "desc" },
  });
  const existingLayout = sampleLayouts[0];
  const layout =
    existingLayout
      ? await prisma.bookLayout.update({
          where: { id: existingLayout.id },
          data: {
            name: sampleLayoutName,
            description: "Balanced grid layout with space for captions.",
            previewImagePath: "/bg.jpg",
            pageCount: 20,
            orientation: "PORTRAIT",
          },
        })
      : await prisma.bookLayout.create({
          data: {
            name: sampleLayoutName,
            description: "Balanced grid layout with space for captions.",
            previewImagePath: "/bg.jpg",
            pageCount: 20,
            orientation: "PORTRAIT",
            createdByAdminId: admin.id,
          },
        });

  const sampleProjects = await prisma.clientProject.findMany({
    where: { title: sampleProjectTitle, clientId: client.id },
    orderBy: { createdAt: "desc" },
  });
  const existingProject = sampleProjects[0];
  const project =
    existingProject ||
    (await prisma.clientProject.create({
      data: {
        title: sampleProjectTitle,
        description: "Selection for the 2024 family photo book.",
        clientId: client.id,
        status: "SHARED",
      },
    }));

  const duplicateProjectIds = sampleProjects.slice(1).map((item) => item.id);
  if (duplicateProjectIds.length > 0) {
    const duplicateSelections = await prisma.clientSelection.findMany({
      where: { projectId: { in: duplicateProjectIds } },
      select: { id: true },
    });

    await prisma.selectedImage.deleteMany({
      where: { selectionId: { in: duplicateSelections.map((item) => item.id) } },
    });
    await prisma.clientSelection.deleteMany({
      where: { projectId: { in: duplicateProjectIds } },
    });
    await prisma.projectRequestMessage.deleteMany({
      where: { projectId: { in: duplicateProjectIds } },
    });
    await prisma.projectNote.deleteMany({
      where: { projectId: { in: duplicateProjectIds } },
    });
    await prisma.projectLayout.deleteMany({
      where: { projectId: { in: duplicateProjectIds } },
    });
    await prisma.projectImage.deleteMany({
      where: { projectId: { in: duplicateProjectIds } },
    });
    await prisma.clientProject.deleteMany({
      where: { id: { in: duplicateProjectIds } },
    });
  }

  const projectSelections = await prisma.clientSelection.findMany({
    where: { projectId: project.id },
    select: { id: true },
  });

  await prisma.selectedImage.deleteMany({
    where: { selectionId: { in: projectSelections.map((item) => item.id) } },
  });
  await prisma.clientSelection.deleteMany({
    where: { projectId: project.id },
  });
  await prisma.projectRequestMessage.deleteMany({
    where: { projectId: project.id },
  });
  await prisma.projectNote.deleteMany({
    where: { projectId: project.id },
  });
  await prisma.projectLayout.deleteMany({
    where: { projectId: project.id },
  });
  await prisma.projectImage.deleteMany({
    where: { projectId: project.id },
  });
  await prisma.clientProject.update({
    where: { id: project.id },
    data: {
      title: sampleProjectTitle,
      description: "Selection for the 2024 family photo book.",
      status: "SHARED",
      requestMessage: null,
    },
  });

  await prisma.projectLayout.create({
    data: {
      projectId: project.id,
      layoutId: layout.id,
    },
  });

  await prisma.projectImage.createMany({
    data: Array.from({ length: 6 }).map((_, idx) => ({
      projectId: project.id,
      imagePath: idx % 2 === 0 ? "/bg.jpg" : "/trumieyeslogo.png",
      filename: `sample_photo_${idx + 1}.jpg`,
    })),
  });

  const duplicateLayoutIds = sampleLayouts.slice(1).map((item) => item.id);
  if (duplicateLayoutIds.length > 0) {
    await prisma.bookLayout.deleteMany({
      where: { id: { in: duplicateLayoutIds } },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
