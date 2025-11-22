-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'SEEN');

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageContent" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastWhatsAppNotifiedAt" TIMESTAMP(3),
    "adminLastRepliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationAnalytics" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "userMessages" INTEGER NOT NULL DEFAULT 0,
    "adminMessages" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMs" INTEGER,
    "firstResponseTimeMs" INTEGER,
    "lastResponseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppNotificationLog" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "messageId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");

-- CreateIndex
CREATE INDEX "Chat_conversationId_idx" ON "Chat"("conversationId");

-- CreateIndex
CREATE INDEX "Chat_isFromAdmin_idx" ON "Chat"("isFromAdmin");

-- CreateIndex
CREATE INDEX "Chat_createdAt_idx" ON "Chat"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_userId_key" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_isActive_idx" ON "Conversation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationAnalytics_conversationId_key" ON "ConversationAnalytics"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationAnalytics_conversationId_idx" ON "ConversationAnalytics"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsAppNotificationLog_userId_idx" ON "WhatsAppNotificationLog"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppNotificationLog_status_idx" ON "WhatsAppNotificationLog"("status");

-- CreateIndex
CREATE INDEX "WhatsAppNotificationLog_sentAt_idx" ON "WhatsAppNotificationLog"("sentAt");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationAnalytics" ADD CONSTRAINT "ConversationAnalytics_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
