-- AlterTable
ALTER TABLE "configuration"."ci_types" ADD COLUMN     "rel_category_uuid" UUID;

-- CreateTable
CREATE TABLE "configuration"."ci_categories" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_categories_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "ci_categories_code_key" ON "configuration"."ci_categories"("code");

-- CreateIndex
CREATE INDEX "ci_types_rel_category_uuid_idx" ON "configuration"."ci_types"("rel_category_uuid");

-- AddForeignKey
ALTER TABLE "configuration"."ci_types" ADD CONSTRAINT "ci_types_rel_category_uuid_fkey" FOREIGN KEY ("rel_category_uuid") REFERENCES "configuration"."ci_categories"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
