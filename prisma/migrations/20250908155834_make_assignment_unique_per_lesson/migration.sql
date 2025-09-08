/*
  Warnings:

  - A unique constraint covering the columns `[lessonId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Assignment_lessonId_key" ON "public"."Assignment"("lessonId");
