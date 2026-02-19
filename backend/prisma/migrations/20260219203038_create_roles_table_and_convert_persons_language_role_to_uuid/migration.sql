/*
  Warnings:

  - The `language` column on the `persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `persons` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "configuration"."persons" DROP COLUMN "language",
ADD COLUMN     "language" UUID,
DROP COLUMN "role",
ADD COLUMN     "role" UUID;

-- CreateTable
CREATE TABLE "configuration"."roles" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "configuration"."roles"("code");

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_language_fkey" FOREIGN KEY ("language") REFERENCES "configuration"."languages"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration"."persons" ADD CONSTRAINT "persons_role_fkey" FOREIGN KEY ("role") REFERENCES "configuration"."roles"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
