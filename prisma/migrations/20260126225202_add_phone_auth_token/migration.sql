-- CreateTable
CREATE TABLE "PhoneAuthToken" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneAuthToken_phone_key" ON "PhoneAuthToken"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneAuthToken_token_key" ON "PhoneAuthToken"("token");

-- CreateIndex
CREATE INDEX "PhoneAuthToken_token_idx" ON "PhoneAuthToken"("token");
