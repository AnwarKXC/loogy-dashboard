-- CreateTable
CREATE TABLE "WhatsAppSettings" (
    "id" SERIAL NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionStatus" TEXT NOT NULL DEFAULT 'disconnected',
    "businessPhone" TEXT,
    "recipientPhone" TEXT,
    "lastConnected" TIMESTAMP(3),
    "qrCode" TEXT,
    "sessionData" JSONB,
    "autoReconnect" BOOLEAN NOT NULL DEFAULT true,
    "messageTemplate" JSONB,
    "sendToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "sendToBusiness" BOOLEAN NOT NULL DEFAULT true,
    "businessNotificationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSettings_pkey" PRIMARY KEY ("id")
);
