-- CreateTable
CREATE TABLE "configuration"."object_types" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label_key" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "api_endpoint" VARCHAR(255) NOT NULL,
    "default_sort_field" VARCHAR(100) NOT NULL DEFAULT 'updated_at',
    "default_sort_order" INTEGER NOT NULL DEFAULT -1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."object_fields" (
    "uuid" UUID NOT NULL,
    "object_type_uuid" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "label_key" VARCHAR(100) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "show_in_table" BOOLEAN NOT NULL DEFAULT true,
    "show_in_form" BOOLEAN NOT NULL DEFAULT true,
    "show_in_detail" BOOLEAN NOT NULL DEFAULT true,
    "is_sortable" BOOLEAN NOT NULL DEFAULT true,
    "is_filterable" BOOLEAN NOT NULL DEFAULT true,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_readonly" BOOLEAN NOT NULL DEFAULT false,
    "min_width" VARCHAR(20),
    "default_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "pattern" VARCHAR(255),
    "options_source" VARCHAR(255),
    "relation_object" VARCHAR(100),
    "relation_display" VARCHAR(100),
    "format_pattern" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "object_types_code_key" ON "configuration"."object_types"("code");

-- CreateIndex
CREATE INDEX "object_fields_object_type_uuid_display_order_idx" ON "configuration"."object_fields"("object_type_uuid", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "object_fields_object_type_uuid_field_name_key" ON "configuration"."object_fields"("object_type_uuid", "field_name");

-- AddForeignKey
ALTER TABLE "configuration"."object_fields" ADD CONSTRAINT "object_fields_object_type_uuid_fkey" FOREIGN KEY ("object_type_uuid") REFERENCES "configuration"."object_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
