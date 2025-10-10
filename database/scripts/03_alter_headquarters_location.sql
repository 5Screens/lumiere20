-- Script: 03_alter_headquarters_location.sql
-- Description: Modification of headquarters_location field in entities table
-- Date: 2025-03-10

BEGIN;

-- Change the type of the existing column from VARCHAR to UUID
ALTER TABLE configuration.entities 
ALTER COLUMN rel_headquarters_location TYPE UUID USING NULL;

-- Add the foreign key constraint
ALTER TABLE configuration.entities
ADD CONSTRAINT fk_headquarters_location
FOREIGN KEY (rel_headquarters_location) REFERENCES configuration.locations(uuid);

COMMIT;
