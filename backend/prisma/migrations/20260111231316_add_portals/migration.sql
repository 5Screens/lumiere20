-- CreateTable
CREATE TABLE "core"."portals" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "base_url" VARCHAR(500),
    "thumbnail_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "view_component" VARCHAR(100),
    "title" VARCHAR(255),
    "subtitle" VARCHAR(255),
    "welcome_template" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "theme_primary_color" VARCHAR(20),
    "theme_secondary_color" VARCHAR(20),
    "show_chat" BOOLEAN NOT NULL DEFAULT false,
    "show_alerts" BOOLEAN NOT NULL DEFAULT false,
    "show_actions" BOOLEAN NOT NULL DEFAULT false,
    "show_widgets" BOOLEAN NOT NULL DEFAULT false,
    "chat_default_message" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portals_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."portal_actions" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "action_type" VARCHAR(50),
    "action_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_actions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."portal_alerts" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(20),
    "icon" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_alerts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."portal_widgets" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "widget_type" VARCHAR(50),
    "config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_widgets_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."portal__portal_actions" (
    "rel_portal" UUID NOT NULL,
    "rel_portal_action" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portal__portal_actions_pkey" PRIMARY KEY ("rel_portal","rel_portal_action")
);

-- CreateTable
CREATE TABLE "core"."portal__portal_alerts" (
    "rel_portal" UUID NOT NULL,
    "rel_portal_alert" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portal__portal_alerts_pkey" PRIMARY KEY ("rel_portal","rel_portal_alert")
);

-- CreateTable
CREATE TABLE "core"."portal__portal_widgets" (
    "rel_portal" UUID NOT NULL,
    "rel_portal_widget" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portal__portal_widgets_pkey" PRIMARY KEY ("rel_portal","rel_portal_widget")
);

-- CreateIndex
CREATE UNIQUE INDEX "portals_code_key" ON "core"."portals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "portal_actions_code_key" ON "core"."portal_actions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "portal_alerts_code_key" ON "core"."portal_alerts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "portal_widgets_code_key" ON "core"."portal_widgets"("code");

-- AddForeignKey
ALTER TABLE "core"."portal__portal_actions" ADD CONSTRAINT "portal__portal_actions_rel_portal_fkey" FOREIGN KEY ("rel_portal") REFERENCES "core"."portals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."portal__portal_actions" ADD CONSTRAINT "portal__portal_actions_rel_portal_action_fkey" FOREIGN KEY ("rel_portal_action") REFERENCES "core"."portal_actions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."portal__portal_alerts" ADD CONSTRAINT "portal__portal_alerts_rel_portal_fkey" FOREIGN KEY ("rel_portal") REFERENCES "core"."portals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."portal__portal_alerts" ADD CONSTRAINT "portal__portal_alerts_rel_portal_alert_fkey" FOREIGN KEY ("rel_portal_alert") REFERENCES "core"."portal_alerts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."portal__portal_widgets" ADD CONSTRAINT "portal__portal_widgets_rel_portal_fkey" FOREIGN KEY ("rel_portal") REFERENCES "core"."portals"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."portal__portal_widgets" ADD CONSTRAINT "portal__portal_widgets_rel_portal_widget_fkey" FOREIGN KEY ("rel_portal_widget") REFERENCES "core"."portal_widgets"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
