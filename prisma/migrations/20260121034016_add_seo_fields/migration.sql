-- AlterTable
ALTER TABLE "BrandTranslation" ADD COLUMN     "metaDescription" VARCHAR(160),
ADD COLUMN     "metaKeywords" VARCHAR(255),
ADD COLUMN     "metaTitle" VARCHAR(70),
ADD COLUMN     "ogDescription" VARCHAR(200),
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "ogTitle" VARCHAR(70);

-- AlterTable
ALTER TABLE "CategoryTranslation" ADD COLUMN     "metaDescription" VARCHAR(160),
ADD COLUMN     "metaKeywords" VARCHAR(255),
ADD COLUMN     "metaTitle" VARCHAR(70),
ADD COLUMN     "ogDescription" VARCHAR(200),
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "ogTitle" VARCHAR(70);

-- AlterTable
ALTER TABLE "ProductTranslation" ADD COLUMN     "metaDescription" VARCHAR(160),
ADD COLUMN     "metaKeywords" VARCHAR(255),
ADD COLUMN     "metaTitle" VARCHAR(70),
ADD COLUMN     "ogDescription" VARCHAR(200),
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "ogTitle" VARCHAR(70);

-- CreateTable
CREATE TABLE "PageSEO" (
    "id" SERIAL NOT NULL,
    "pageKey" TEXT NOT NULL,
    "lang" "Language" NOT NULL,
    "title" VARCHAR(70) NOT NULL,
    "description" VARCHAR(160),
    "keywords" VARCHAR(255),
    "ogTitle" VARCHAR(70),
    "ogDescription" VARCHAR(200),
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "robots" TEXT DEFAULT 'index, follow',
    "structuredData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSEO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageSEO_pageKey_lang_idx" ON "PageSEO"("pageKey", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "PageSEO_pageKey_lang_key" ON "PageSEO"("pageKey", "lang");
