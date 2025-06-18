/*
  Warnings:

  - The values [APPROVED,REJECTED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `dateReceived` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `goodsReceivedNote` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `procurementDescription` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `issueDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE');
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
DROP COLUMN "dateReceived",
DROP COLUMN "documentId",
DROP COLUMN "goodsReceivedNote",
DROP COLUMN "invoiceDate",
DROP COLUMN "procurementDescription",
DROP COLUMN "providerId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
