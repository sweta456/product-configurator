/*
  Warnings:

  - Added the required column `images` to the `Configurator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `Configurator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `texts` to the `Configurator` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `Configurator` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Configurator" ADD COLUMN     "images" JSONB NOT NULL,
ADD COLUMN     "shop" TEXT NOT NULL,
ADD COLUMN     "texts" JSONB NOT NULL,
ALTER COLUMN "productId" SET NOT NULL;
