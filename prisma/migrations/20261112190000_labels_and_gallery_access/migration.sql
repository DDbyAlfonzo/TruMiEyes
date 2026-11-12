-- CreateEnum
CREATE TYPE "PhotoLabelColor" AS ENUM ('GREEN', 'AMBER', 'BLUE');

-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN     "accessCodeHash" TEXT,
ADD COLUMN     "accessFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "accessLockedUntil" TIMESTAMP(3),
ADD COLUMN     "shareSlug" TEXT;

-- CreateTable
CREATE TABLE "PhotoLabel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "color" "PhotoLabelColor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_shareSlug_key" ON "ClientProject"("shareSlug");

-- CreateIndex
CREATE INDEX "PhotoLabel_galleryId_idx" ON "PhotoLabel"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLabel_userId_photoId_key" ON "PhotoLabel"("userId", "photoId");

-- AddForeignKey
ALTER TABLE "PhotoLabel" ADD CONSTRAINT "PhotoLabel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLabel" ADD CONSTRAINT "PhotoLabel_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "ProjectImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLabel" ADD CONSTRAINT "PhotoLabel_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "ClientProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
