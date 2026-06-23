-- CreateEnum
CREATE TYPE "ProjectImageStatus" AS ENUM ('HIDDEN', 'CLIENT_REVIEW', 'APPROVED');

-- AlterTable
ALTER TABLE "ProjectImage"
ADD COLUMN "downloadable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "status" "ProjectImageStatus" NOT NULL DEFAULT 'CLIENT_REVIEW';

-- CreateTable
CREATE TABLE "PhotoFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoFavorite_userId_photoId_key" ON "PhotoFavorite"("userId", "photoId");

-- CreateIndex
CREATE INDEX "PhotoFavorite_galleryId_idx" ON "PhotoFavorite"("galleryId");

-- CreateIndex
CREATE INDEX "PhotoComment_photoId_idx" ON "PhotoComment"("photoId");

-- CreateIndex
CREATE INDEX "PhotoComment_galleryId_idx" ON "PhotoComment"("galleryId");

-- AddForeignKey
ALTER TABLE "PhotoFavorite" ADD CONSTRAINT "PhotoFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoFavorite" ADD CONSTRAINT "PhotoFavorite_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "ProjectImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoFavorite" ADD CONSTRAINT "PhotoFavorite_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "ClientProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "ProjectImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "ClientProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
