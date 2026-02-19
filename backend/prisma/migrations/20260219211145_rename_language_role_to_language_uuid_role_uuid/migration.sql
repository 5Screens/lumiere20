/*
  Warnings:

  - You are about to drop the column `language` on the `persons` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `persons` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "configuration"."persons" DROP CONSTRAINT "persons_language_fkey";

-- DropForeignKey
ALTER TABLE "configuration"."persons" DROP CONSTRAINT "persons_role_fkey";

-- AlterTable
ALTER TABLE "configuration"."persons" DROP COLUMN "language",
DROP COLUMN "role",
ADD COLUMN     "language_uuid" UUID,
ADD COLUMN     "role_uuid" UUID;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_language_uuid_fkey" FOREIGN KEY ("language_uuid") REFERENCES "configuration"."languages"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_role_uuid_fkey" FOREIGN KEY ("role_uuid") REFERENCES "configuration"."roles"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
