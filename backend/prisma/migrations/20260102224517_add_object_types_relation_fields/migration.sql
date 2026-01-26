-- AlterTable
ALTER TABLE "configuration"."object_types" ADD COLUMN     "display_field" VARCHAR(100),
ADD COLUMN     "relation_icon" VARCHAR(100),
ADD COLUMN     "secondary_field" VARCHAR(100);
