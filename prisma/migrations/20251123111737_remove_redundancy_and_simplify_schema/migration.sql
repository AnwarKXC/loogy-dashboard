/*
  Warnings:

  - You are about to drop the column `whatsappLink` on the `ContactSettings` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappNumber` on the `ContactSettings` table. All the data in the column will be lost.
  - You are about to drop the column `lastWhatsAppNotifiedAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `seo` on the `GeneralSettings` table. All the data in the column will be lost.
  - You are about to drop the column `shippingWhatsapp` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `brandName` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seo` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappGroup` on the `SocialSettings` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ConversationAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserBehavior` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferenceBrand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferenceCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferenceLastBrand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferenceLastCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsAppNotificationLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhatsAppSettings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[authProvider]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authProvider` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationAnalytics" DROP CONSTRAINT "ConversationAnalytics_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "UserBehavior" DROP CONSTRAINT "UserBehavior_productId_fkey";

-- DropForeignKey
ALTER TABLE "UserBehavior" DROP CONSTRAINT "UserBehavior_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceBrand" DROP CONSTRAINT "UserPreferenceBrand_brandId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceBrand" DROP CONSTRAINT "UserPreferenceBrand_preferenceId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceCategory" DROP CONSTRAINT "UserPreferenceCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceCategory" DROP CONSTRAINT "UserPreferenceCategory_preferenceId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceLastBrand" DROP CONSTRAINT "UserPreferenceLastBrand_brandId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceLastBrand" DROP CONSTRAINT "UserPreferenceLastBrand_preferenceId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceLastCategory" DROP CONSTRAINT "UserPreferenceLastCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferenceLastCategory" DROP CONSTRAINT "UserPreferenceLastCategory_preferenceId_fkey";

-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- AlterTable
ALTER TABLE "ContactSettings" DROP COLUMN "whatsappLink",
DROP COLUMN "whatsappNumber";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "lastWhatsAppNotifiedAt";

-- AlterTable
ALTER TABLE "GeneralSettings" DROP COLUMN "seo";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingWhatsapp";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "productName";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "brandName",
DROP COLUMN "categoryName",
DROP COLUMN "seo";

-- AlterTable
ALTER TABLE "SocialSettings" DROP COLUMN "whatsappGroup";

-- AlterTable
ALTER TABLE "SuperAdmin" ADD COLUMN     "notifyMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOrders" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUid",
ADD COLUMN     "authProvider" TEXT NOT NULL;

-- DropTable
DROP TABLE "ConversationAnalytics";

-- DropTable
DROP TABLE "UserBehavior";

-- DropTable
DROP TABLE "UserPreference";

-- DropTable
DROP TABLE "UserPreferenceBrand";

-- DropTable
DROP TABLE "UserPreferenceCategory";

-- DropTable
DROP TABLE "UserPreferenceLastBrand";

-- DropTable
DROP TABLE "UserPreferenceLastCategory";

-- DropTable
DROP TABLE "WhatsAppNotificationLog";

-- DropTable
DROP TABLE "WhatsAppSettings";

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "superAdminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_superAdminId_idx" ON "PushSubscription"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_key" ON "User"("authProvider");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
