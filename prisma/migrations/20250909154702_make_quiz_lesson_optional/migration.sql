/*
  Warnings:

  - Added the required column `createdBy` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Quiz" DROP CONSTRAINT "Quiz_lessonId_fkey";

-- Сначала добавляем колонку createdBy с дефолтным значением
ALTER TABLE "public"."Quiz" ADD COLUMN "createdBy" TEXT;

-- Обновляем существующие записи - назначаем первого админа как создателя
UPDATE "public"."Quiz" 
SET "createdBy" = (
  SELECT "id" FROM "public"."User" 
  WHERE "role" = 'ADMIN' 
  ORDER BY "createdAt" ASC 
  LIMIT 1
)
WHERE "createdBy" IS NULL;

-- Теперь делаем колонку NOT NULL
ALTER TABLE "public"."Quiz" ALTER COLUMN "createdBy" SET NOT NULL;

-- Делаем lessonId опциональным
ALTER TABLE "public"."Quiz" ALTER COLUMN "lessonId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quiz" ADD CONSTRAINT "Quiz_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
