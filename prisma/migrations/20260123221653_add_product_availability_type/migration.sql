-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('IN_STOCK_EGYPT', 'ARRIVING_SOON', 'PRE_ORDER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availabilityType" "AvailabilityType" NOT NULL DEFAULT 'IN_STOCK_EGYPT',
ADD COLUMN     "expectedArrivalDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_availabilityType_isPublished_idx" ON "Product"("availabilityType", "isPublished");
