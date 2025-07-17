-- AlterTable
ALTER TABLE "ProjectAssignment" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
