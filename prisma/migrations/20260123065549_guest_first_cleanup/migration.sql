/*
  Warnings:

  - You are about to drop the column `notifyMessages` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `PricingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wishlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WishlistItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductReview" DROP CONSTRAINT "ProductReview_productId_fkey";

-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_defaultAddressId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_wishlistId_fkey";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- DropIndex
DROP INDEX "PushSubscription_userId_idx";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "notifyMessages";

-- First add columns as nullable, then update existing data, then make required
ALTER TABLE "Order" DROP COLUMN "userId",
ADD COLUMN     "areaId" INTEGER,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "governorateId" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "promoCode" TEXT,
ALTER COLUMN "shippingCountry" SET DEFAULT 'Egypt';

-- Update existing orders to have customerPhone from shippingPhone
UPDATE "Order" SET "customerPhone" = "shippingPhone" WHERE "customerPhone" IS NULL;

-- Now make customerPhone required
ALTER TABLE "Order" ALTER COLUMN "customerPhone" SET NOT NULL;

-- AlterTable
ALTER TABLE "PricingSettings" DROP COLUMN "currency";

-- AlterTable
ALTER TABLE "PushSubscription" DROP COLUMN "userId";

-- DropTable
DROP TABLE "Address";

-- DropTable
DROP TABLE "Cart";

-- DropTable
DROP TABLE "CartItem";

-- DropTable
DROP TABLE "Chat";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "ProductReview";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Wishlist";

-- DropTable
DROP TABLE "WishlistItem";

-- DropEnum
DROP TYPE "MessageStatus";

-- DropEnum
DROP TYPE "ReviewStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE INDEX "Order_customerPhone_createdAt_idx" ON "Order"("customerPhone", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_governorateId_idx" ON "Order"("governorateId");

-- CreateIndex
CREATE INDEX "Order_areaId_idx" ON "Order"("areaId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
