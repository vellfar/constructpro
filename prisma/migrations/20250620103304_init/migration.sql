-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "employeeId" INTEGER,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "unitCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FuelRequest" ADD COLUMN     "quantity" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
