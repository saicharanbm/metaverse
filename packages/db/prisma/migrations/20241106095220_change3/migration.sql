/*
  Warnings:

  - You are about to drop the column `ImageUrl` on the `Elements` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `Elements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `static` to the `Elements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Made the column `height` on table `Space` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Elements" DROP COLUMN "ImageUrl",
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "static" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Map" ADD COLUMN     "thumbnail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Space" ALTER COLUMN "height" SET NOT NULL;
