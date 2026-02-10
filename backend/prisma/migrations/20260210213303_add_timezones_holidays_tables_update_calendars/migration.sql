/*
  Warnings:

  - You are about to drop the column `holidays` on the `calendars` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `calendars` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "data"."calendars" DROP COLUMN "holidays",
DROP COLUMN "timezone",
ADD COLUMN     "rel_timezone_uuid" UUID;

-- CreateTable
CREATE TABLE "data"."timezones" (
    "uuid" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "utc_offset" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timezones_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."holidays" (
    "uuid" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "country_code" VARCHAR(10),
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "data"."holidays_calendars" (
    "uuid" UUID NOT NULL,
    "rel_holiday_uuid" UUID NOT NULL,
    "rel_calendar_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_calendars_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "timezones_code_key" ON "data"."timezones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_calendars_rel_holiday_uuid_rel_calendar_uuid_key" ON "data"."holidays_calendars"("rel_holiday_uuid", "rel_calendar_uuid");

-- AddForeignKey
ALTER TABLE "data"."holidays_calendars" ADD CONSTRAINT "holidays_calendars_rel_holiday_uuid_fkey" FOREIGN KEY ("rel_holiday_uuid") REFERENCES "data"."holidays"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."holidays_calendars" ADD CONSTRAINT "holidays_calendars_rel_calendar_uuid_fkey" FOREIGN KEY ("rel_calendar_uuid") REFERENCES "data"."calendars"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."calendars" ADD CONSTRAINT "calendars_rel_timezone_uuid_fkey" FOREIGN KEY ("rel_timezone_uuid") REFERENCES "data"."timezones"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
