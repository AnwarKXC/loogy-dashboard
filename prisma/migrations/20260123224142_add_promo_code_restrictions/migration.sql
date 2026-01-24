-- CreateEnum
CREATE TYPE "PromoCodeScope" AS ENUM ('GLOBAL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_PRODUCT_TYPES');

-- AlterTable
ALTER TABLE "PricePromoCode" ADD COLUMN     "applicableAvailabilityTypes" "AvailabilityType"[],
ADD COLUMN     "scope" "PromoCodeScope" NOT NULL DEFAULT 'GLOBAL';

-- CreateTable
CREATE TABLE "_PricePromoCodeToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PricePromoCodeToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PricePromoCodeToProduct_B_index" ON "_PricePromoCodeToProduct"("B");

-- AddForeignKey
ALTER TABLE "_PricePromoCodeToProduct" ADD CONSTRAINT "_PricePromoCodeToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "PricePromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PricePromoCodeToProduct" ADD CONSTRAINT "_PricePromoCodeToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
