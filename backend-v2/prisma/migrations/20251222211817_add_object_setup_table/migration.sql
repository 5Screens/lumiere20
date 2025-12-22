-- CreateTable
CREATE TABLE "configuration"."object_setup" (
    "uuid" UUID NOT NULL,
    "object_type" VARCHAR(50) NOT NULL,
    "metadata" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "value" INTEGER,
    "icon" VARCHAR(50),
    "color" VARCHAR(50),
    "font_weight" VARCHAR(20),
    "font_style" VARCHAR(20),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_setup_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "object_setup_object_type_metadata_idx" ON "configuration"."object_setup"("object_type", "metadata");

-- CreateIndex
CREATE INDEX "object_setup_object_type_idx" ON "configuration"."object_setup"("object_type");

-- CreateIndex
CREATE UNIQUE INDEX "object_setup_object_type_metadata_code_key" ON "configuration"."object_setup"("object_type", "metadata", "code");
