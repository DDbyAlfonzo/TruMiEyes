-- CreateTable
CREATE TABLE "LayoutPage" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "sketchPath" TEXT NOT NULL,
    "slots" JSONB NOT NULL,

    CONSTRAINT "LayoutPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LayoutPage_layoutId_index_key" ON "LayoutPage"("layoutId", "index");

-- AddForeignKey
ALTER TABLE "LayoutPage" ADD CONSTRAINT "LayoutPage_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "BookLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
