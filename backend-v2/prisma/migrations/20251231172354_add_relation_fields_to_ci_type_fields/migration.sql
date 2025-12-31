-- AlterTable
ALTER TABLE "configuration"."ci_type_fields" ADD COLUMN     "relation_display" VARCHAR(100),
ADD COLUMN     "relation_filter" JSONB,
ADD COLUMN     "relation_object" VARCHAR(100);
