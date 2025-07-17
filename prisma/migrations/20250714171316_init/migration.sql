-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT;

-- AlterTable
ALTER TABLE "EquipmentAssignment" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
