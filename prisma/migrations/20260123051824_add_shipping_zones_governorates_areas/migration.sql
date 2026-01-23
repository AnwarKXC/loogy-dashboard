-- CreateTable
CREATE TABLE "Governorate" (
    "id" SERIAL NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "shippingZoneId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Governorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "governorateId" INTEGER NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "freeShippingThreshold" DECIMAL(10,2),
    "estimatedDays" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Governorate_slug_key" ON "Governorate"("slug");

-- CreateIndex
CREATE INDEX "Governorate_shippingZoneId_idx" ON "Governorate"("shippingZoneId");

-- CreateIndex
CREATE INDEX "Governorate_isActive_displayOrder_idx" ON "Governorate"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "Area_governorateId_isActive_idx" ON "Area"("governorateId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Area_governorateId_slug_key" ON "Area"("governorateId", "slug");

-- CreateIndex
CREATE INDEX "ShippingZone_isActive_displayOrder_idx" ON "ShippingZone"("isActive", "displayOrder");

-- AddForeignKey
ALTER TABLE "Governorate" ADD CONSTRAINT "Governorate_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "ShippingZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "Governorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
