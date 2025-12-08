-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "adminId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
