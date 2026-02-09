/*
  Warnings:

  - You are about to drop the column `target_percentage` on the `slas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data"."commitments" ADD COLUMN     "target_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "data"."slas" DROP COLUMN "target_percentage";
