/*
  Warnings:

  - Added the required column `dateReceived` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `procurementDescription` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceProvider` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateReceived" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "documentId" INTEGER,
ADD COLUMN     "goodsReceivedNote" TEXT,
ADD COLUMN     "invoiceDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "procurementDescription" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "serviceProvider" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
