/*
  Warnings:

  - You are about to drop the column `description` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `PricePromoCode` table. All the data in the column will be lost.
  - You are about to drop the column `priceSettingsId` on the `PricePromoCode` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `superAdminId` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `WishlistItem` table. All the data in the column will be lost.
  - You are about to drop the `CartPricingRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneralSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceDiscount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SuperAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SuperAdminSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authProviderId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wishlistId,productId,variantId]` on the table `WishlistItem` will be added. If there are existing duplicate values, this will fail.
  - Made the column `productId` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `applicationType` to the `PricePromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PricePromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `PricePromoCode` table without a default value. This is not possible if the table is not empty.
  - Made the column `stock` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `adminId` to the `PushSubscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authProviderId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'MANAGER', 'SALES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "PriceDiscount" DROP CONSTRAINT "PriceDiscount_priceSettingsId_fkey";

-- DropForeignKey
ALTER TABLE "PricePromoCode" DROP CONSTRAINT "PricePromoCode_priceSettingsId_fkey";

-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_superAdminId_fkey";

-- DropForeignKey
ALTER TABLE "SuperAdmin" DROP CONSTRAINT "SuperAdmin_createdById_fkey";

-- DropForeignKey
ALTER TABLE "SuperAdminSession" DROP CONSTRAINT "SuperAdminSession_superAdminId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_productId_fkey";

-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- DropIndex
DROP INDEX "Chat_conversationId_idx";

-- DropIndex
DROP INDEX "Chat_createdAt_idx";

-- DropIndex
DROP INDEX "Chat_isFromAdmin_idx";

-- DropIndex
DROP INDEX "Conversation_isActive_idx";

-- DropIndex
DROP INDEX "Order_status_idx";

-- DropIndex
DROP INDEX "PricePromoCode_priceSettingsId_idx";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "PushSubscription_superAdminId_idx";

-- DropIndex
DROP INDEX "User_authProvider_key";

-- DropIndex
DROP INDEX "User_isActive_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- DropIndex
DROP INDEX "WishlistItem_wishlistId_productId_key";

-- AlterTable
ALTER TABLE "Brand" DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "variantId" INTEGER;

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "name",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "status",
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PricePromoCode" DROP COLUMN "discount",
DROP COLUMN "priceSettingsId",
ADD COLUMN     "applicationType" "PricingApplicationType" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pricingSettingsId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "quantity",
DROP COLUMN "shortDescription",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "stock" SET NOT NULL,
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "images" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "PushSubscription" DROP COLUMN "superAdminId",
ADD COLUMN     "adminId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "authProviderId" TEXT NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "authProvider" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WishlistItem" DROP COLUMN "quantity",
ADD COLUMN     "variantId" INTEGER;

-- DropTable
DROP TABLE "CartPricingRule";

-- DropTable
DROP TABLE "GeneralSettings";

-- DropTable
DROP TABLE "PriceDiscount";

-- DropTable
DROP TABLE "PriceSettings";

-- DropTable
DROP TABLE "SuperAdmin";

-- DropTable
DROP TABLE "SuperAdminSession";

-- DropEnum
DROP TYPE "BehaviorType";

-- DropEnum
DROP TYPE "PricingRuleType";

-- DropEnum
DROP TYPE "SuperAdminRole";

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "lang" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandTranslation" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "lang" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "lang" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sku" TEXT,
    "attributes" JSONB,
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTimeline" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedById" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" SERIAL NOT NULL,
    "shippingFee" DECIMAL(12,2),
    "minOrderValue" DECIMAL(12,2),
    "maxOrderValue" DECIMAL(12,2),
    "bulkDiscountThreshold" DECIMAL(12,2),
    "bulkDiscountPercentage" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" SERIAL NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeDescription" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "languageOptions" TEXT[] DEFAULT ARRAY['en', 'ar']::TEXT[],
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notifyOrders" BOOLEAN NOT NULL DEFAULT true,
    "notifyMessages" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryTranslation_categoryId_lang_idx" ON "CategoryTranslation"("categoryId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_lang_key" ON "CategoryTranslation"("categoryId", "lang");

-- CreateIndex
CREATE INDEX "BrandTranslation_brandId_lang_idx" ON "BrandTranslation"("brandId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_brandId_lang_key" ON "BrandTranslation"("brandId", "lang");

-- CreateIndex
CREATE INDEX "ProductTranslation_productId_lang_idx" ON "ProductTranslation"("productId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_lang_key" ON "ProductTranslation"("productId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "OrderTimeline_orderId_createdAt_idx" ON "OrderTimeline"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderTimeline_changedById_idx" ON "OrderTimeline"("changedById");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_role_isActive_idx" ON "Admin"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminSession_token_expiresAt_idx" ON "AdminSession"("token", "expiresAt");

-- CreateIndex
CREATE INDEX "Brand_deletedAt_idx" ON "Brand"("deletedAt");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex
CREATE INDEX "Chat_conversationId_createdAt_idx" ON "Chat"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_isActive_unreadCount_idx" ON "Conversation"("isActive", "unreadCount");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "PricePromoCode_code_isActive_idx" ON "PricePromoCode"("code", "isActive");

-- CreateIndex
CREATE INDEX "PricePromoCode_validFrom_validTo_idx" ON "PricePromoCode"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Product_categoryId_isPublished_isArchived_deletedAt_idx" ON "Product"("categoryId", "isPublished", "isArchived", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_brandId_isPublished_isArchived_deletedAt_idx" ON "Product"("brandId", "isPublished", "isArchived", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_isPublished_createdAt_idx" ON "Product"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Product_isPublished_rating_idx" ON "Product"("isPublished", "rating");

-- CreateIndex
CREATE INDEX "PushSubscription_adminId_idx" ON "PushSubscription"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProviderId_key" ON "User"("authProviderId");

-- CreateIndex
CREATE INDEX "User_authProviderId_idx" ON "User"("authProviderId");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "WishlistItem_wishlistId_idx" ON "WishlistItem"("wishlistId");

-- CreateIndex
CREATE INDEX "WishlistItem_variantId_idx" ON "WishlistItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_variantId_key" ON "WishlistItem"("wishlistId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandTranslation" ADD CONSTRAINT "BrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTimeline" ADD CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricePromoCode" ADD CONSTRAINT "PricePromoCode_pricingSettingsId_fkey" FOREIGN KEY ("pricingSettingsId") REFERENCES "PricingSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
