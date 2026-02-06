-- CreateTable
CREATE TABLE "data"."request_catalog_items" (
    "uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "rel_service_offering_uuid" UUID NOT NULL,
    "icon" VARCHAR(50),
    "form_fields" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_catalog_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."rel_request_catalog_items_cis" (
    "uuid" UUID NOT NULL,
    "rel_request_catalog_item_uuid" UUID NOT NULL,
    "rel_ci_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rel_request_catalog_items_cis_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "configuration"."causes" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "causes_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "request_catalog_items_rel_service_offering_uuid_idx" ON "data"."request_catalog_items"("rel_service_offering_uuid");

-- CreateIndex
CREATE INDEX "rel_request_catalog_items_cis_rel_request_catalog_item_uuid_idx" ON "data"."rel_request_catalog_items_cis"("rel_request_catalog_item_uuid");

-- CreateIndex
CREATE INDEX "rel_request_catalog_items_cis_rel_ci_uuid_idx" ON "data"."rel_request_catalog_items_cis"("rel_ci_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rel_request_catalog_items_cis_rel_request_catalog_item_uuid_key" ON "data"."rel_request_catalog_items_cis"("rel_request_catalog_item_uuid", "rel_ci_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "causes_code_key" ON "configuration"."causes"("code");

-- AddForeignKey
ALTER TABLE "data"."request_catalog_items" ADD CONSTRAINT "request_catalog_items_rel_service_offering_uuid_fkey" FOREIGN KEY ("rel_service_offering_uuid") REFERENCES "data"."service_offerings"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."rel_request_catalog_items_cis" ADD CONSTRAINT "rel_request_catalog_items_cis_rel_request_catalog_item_uui_fkey" FOREIGN KEY ("rel_request_catalog_item_uuid") REFERENCES "data"."request_catalog_items"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."rel_request_catalog_items_cis" ADD CONSTRAINT "rel_request_catalog_items_cis_rel_ci_uuid_fkey" FOREIGN KEY ("rel_ci_uuid") REFERENCES "data"."configuration_items"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
