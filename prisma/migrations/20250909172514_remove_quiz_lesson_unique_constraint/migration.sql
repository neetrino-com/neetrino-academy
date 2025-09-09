/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Quiz` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Quiz" DROP CONSTRAINT "Quiz_lessonId_fkey";

-- DropIndex
DROP INDEX "public"."Quiz_lessonId_key";

-- AlterTable
ALTER TABLE "public"."Quiz" DROP COLUMN "lessonId";

-- CreateTable
CREATE TABLE "public"."QuizLesson" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizLesson_quizId_lessonId_key" ON "public"."QuizLesson"("quizId", "lessonId");

-- AddForeignKey
ALTER TABLE "public"."QuizLesson" ADD CONSTRAINT "QuizLesson_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizLesson" ADD CONSTRAINT "QuizLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
