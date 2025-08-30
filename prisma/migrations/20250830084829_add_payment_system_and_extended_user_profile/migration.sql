-- AlterTable
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "age" INTEGER;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "country" TEXT DEFAULT 'Armenia';
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "instagram" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "telegram" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT NOT NULL,
    "monthNumber" INTEGER,
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "price" DECIMAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "durationUnit" TEXT DEFAULT 'weeks',
    "currency" TEXT DEFAULT 'RUB',
    "paymentType" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "monthlyPrice" DECIMAL,
    "totalPrice" DECIMAL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("createdAt", "createdBy", "currency", "description", "direction", "duration", "durationUnit", "id", "isActive", "isDraft", "level", "price", "slug", "thumbnail", "title", "updatedAt") SELECT "createdAt", "createdBy", "currency", "description", "direction", "duration", "durationUnit", "id", "isActive", "isDraft", "level", "price", "slug", "thumbnail", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE TABLE "new_Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "nextPaymentDue" DATETIME,
    CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Enrollment" ("courseId", "enrolledAt", "id", "status", "userId") SELECT "courseId", "enrolledAt", "id", "status", "userId" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Payment_userId_courseId_idx" ON "Payment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");
