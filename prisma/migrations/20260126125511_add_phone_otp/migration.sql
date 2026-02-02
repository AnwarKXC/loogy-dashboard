-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_code_idx" ON "PhoneOtp"("phone", "code");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_expiresAt_idx" ON "PhoneOtp"("phone", "expiresAt");
