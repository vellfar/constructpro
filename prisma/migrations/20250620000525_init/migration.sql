/*
  Warnings:

  - The values [DELAYED] on the enum `ActivityStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RESERVED] on the enum `EquipmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `quantity` on the `FuelRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requestDate` on the `FuelRequest` table. All the data in the column will be lost.
  - You are about to drop the `ActivityEquipmentBudget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityEstimate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityLaborBudget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityMaterialBudget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityMeasurement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentAssessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentLocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FuelConsumption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FuelIssuance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectAssignment` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `ownership` on the `Equipment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `requestedQuantity` to the `FuelRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EquipmentOwnership" AS ENUM ('OWNED', 'RENTED', 'LEASED');

-- CreateEnum
CREATE TYPE "FuelUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityStatus_new" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Activity" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Activity" ALTER COLUMN "status" TYPE "ActivityStatus_new" USING ("status"::text::"ActivityStatus_new");
ALTER TYPE "ActivityStatus" RENAME TO "ActivityStatus_old";
ALTER TYPE "ActivityStatus_new" RENAME TO "ActivityStatus";
DROP TYPE "ActivityStatus_old";
ALTER TABLE "Activity" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EquipmentStatus_new" AS ENUM ('OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');
ALTER TABLE "Equipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Equipment" ALTER COLUMN "status" TYPE "EquipmentStatus_new" USING ("status"::text::"EquipmentStatus_new");
ALTER TYPE "EquipmentStatus" RENAME TO "EquipmentStatus_old";
ALTER TYPE "EquipmentStatus_new" RENAME TO "EquipmentStatus";
DROP TYPE "EquipmentStatus_old";
ALTER TABLE "Equipment" ALTER COLUMN "status" SET DEFAULT 'OPERATIONAL';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FuelRequestStatus" ADD VALUE 'ACKNOWLEDGED';
ALTER TYPE "FuelRequestStatus" ADD VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEquipmentBudget" DROP CONSTRAINT "ActivityEquipmentBudget_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEstimate" DROP CONSTRAINT "ActivityEstimate_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLaborBudget" DROP CONSTRAINT "ActivityLaborBudget_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityMaterialBudget" DROP CONSTRAINT "ActivityMaterialBudget_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityMeasurement" DROP CONSTRAINT "ActivityMeasurement_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_projectId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentAssessment" DROP CONSTRAINT "EquipmentAssessment_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentAssignment" DROP CONSTRAINT "EquipmentAssignment_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentAssignment" DROP CONSTRAINT "EquipmentAssignment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentLocation" DROP CONSTRAINT "EquipmentLocation_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "FuelConsumption" DROP CONSTRAINT "FuelConsumption_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "FuelConsumption" DROP CONSTRAINT "FuelConsumption_issuanceId_fkey";

-- DropForeignKey
ALTER TABLE "FuelIssuance" DROP CONSTRAINT "FuelIssuance_issuedById_fkey";

-- DropForeignKey
ALTER TABLE "FuelIssuance" DROP CONSTRAINT "FuelIssuance_requestId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAssignment" DROP CONSTRAINT "ProjectAssignment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAssignment" DROP CONSTRAINT "ProjectAssignment_userId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "ownership",
ADD COLUMN     "ownership" "EquipmentOwnership" NOT NULL;

-- AlterTable
ALTER TABLE "FuelRequest" DROP COLUMN "quantity",
DROP COLUMN "requestDate",
ADD COLUMN     "acknowledgedById" INTEGER,
ADD COLUMN     "acknowledgedQuantity" DOUBLE PRECISION,
ADD COLUMN     "acknowledgmentComments" TEXT,
ADD COLUMN     "acknowledgmentDate" TIMESTAMP(3),
ADD COLUMN     "approvalComments" TEXT,
ADD COLUMN     "approvedQuantity" DOUBLE PRECISION,
ADD COLUMN     "completedById" INTEGER,
ADD COLUMN     "completionComments" TEXT,
ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "issuanceComments" TEXT,
ADD COLUMN     "issuanceDate" TIMESTAMP(3),
ADD COLUMN     "issuedById" INTEGER,
ADD COLUMN     "issuedQuantity" DOUBLE PRECISION,
ADD COLUMN     "requestedQuantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "urgency" "FuelUrgency" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "ActivityEquipmentBudget";

-- DropTable
DROP TABLE "ActivityEstimate";

-- DropTable
DROP TABLE "ActivityLaborBudget";

-- DropTable
DROP TABLE "ActivityMaterialBudget";

-- DropTable
DROP TABLE "ActivityMeasurement";

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "EquipmentAssessment";

-- DropTable
DROP TABLE "EquipmentLocation";

-- DropTable
DROP TABLE "FuelConsumption";

-- DropTable
DROP TABLE "FuelIssuance";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "ProjectAssignment";

-- DropEnum
DROP TYPE "ConditionType";

-- DropEnum
DROP TYPE "FunctionalityType";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "OwnershipType";

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
