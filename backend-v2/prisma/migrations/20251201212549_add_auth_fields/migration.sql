/*
  Warnings:

  - You are about to drop the column `active` on the `persons` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `persons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "configuration"."persons" DROP COLUMN "active",
DROP COLUMN "password",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMPTZ(6),
ADD COLUMN     "password_hash" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "role" VARCHAR(50) NOT NULL DEFAULT 'user';
