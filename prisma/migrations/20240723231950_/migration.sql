/*
  Warnings:

  - A unique constraint covering the columns `[userId,key]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_key_key" ON "Document"("userId", "key");
