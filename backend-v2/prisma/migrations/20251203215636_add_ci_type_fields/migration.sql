-- CreateTable
CREATE TABLE "configuration"."ci_type_fields" (
    "uuid" UUID NOT NULL,
    "ci_type_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "label_key" VARCHAR(100) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "show_in_table" BOOLEAN NOT NULL DEFAULT false,
    "show_in_form" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_readonly" BOOLEAN NOT NULL DEFAULT false,
    "min_width" VARCHAR(20),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "pattern" VARCHAR(255),
    "default_value" VARCHAR(255),
    "options_source" TEXT,
    "format_pattern" VARCHAR(100),
    "unit" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_type_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "ci_type_fields_ci_type_uuid_display_order_idx" ON "configuration"."ci_type_fields"("ci_type_uuid", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "ci_type_fields_ci_type_uuid_field_name_key" ON "configuration"."ci_type_fields"("ci_type_uuid", "field_name");

-- AddForeignKey
ALTER TABLE "configuration"."ci_type_fields" ADD CONSTRAINT "ci_type_fields_ci_type_uuid_fkey" FOREIGN KEY ("ci_type_uuid") REFERENCES "configuration"."ci_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
