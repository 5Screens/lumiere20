/*
  Warnings:

  - You are about to drop the column `relation_icon` on the `object_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "configuration"."object_types" DROP COLUMN "relation_icon";
