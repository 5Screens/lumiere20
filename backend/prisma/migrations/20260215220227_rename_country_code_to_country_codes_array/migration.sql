/*
  Warnings:

  - You are about to drop the column `country_code` on the `holidays` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data"."holidays" DROP COLUMN "country_code",
ADD COLUMN     "country_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
