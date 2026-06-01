-- CreateTable
CREATE TABLE "ProductConfig" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "layers" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductConfig_productId_key" ON "ProductConfig"("productId");
