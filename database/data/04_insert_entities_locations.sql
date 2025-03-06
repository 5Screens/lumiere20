-- Script: 04_insert_entities_locations.sql
-- Description: Test data for configuration.rel_entities_locations table
-- Date: 2025-03-06

BEGIN;

-- Create temporary tables to store random UUIDs
CREATE TEMPORARY TABLE temp_random_entities AS
SELECT uuid 
FROM configuration.entities 
ORDER BY RANDOM();

CREATE TEMPORARY TABLE temp_random_locations AS
SELECT uuid 
FROM configuration.locations 
ORDER BY RANDOM();

-- Insert test data for rel_entities_locations
INSERT INTO configuration.rel_entities_locations (
    uuid,
    entity_uuid,
    location_uuid,
    start_date,
    end_date,
    date_creation,
    date_modification
)
SELECT 
    uuid_generate_v4() as uuid,
    e.uuid as entity_uuid,
    l.uuid as location_uuid,
    CURRENT_DATE - (INTERVAL '1 day' * floor(random() * 365)) as start_date,
    CASE 
        WHEN random() < 0.3 THEN -- 30% chance to have an end_date
            CURRENT_DATE - (INTERVAL '1 day' * floor(random() * 180))
        ELSE NULL 
    END as end_date,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM 
    (SELECT uuid, row_number() OVER () as rn FROM temp_random_entities) e,
    (SELECT uuid, row_number() OVER () as rn FROM temp_random_locations) l,
    generate_series(1, 50) as seq
WHERE e.rn = (seq % (SELECT COUNT(*) FROM temp_random_entities) + 1)
  AND l.rn = (seq % (SELECT COUNT(*) FROM temp_random_locations) + 1);

-- Fix any end_dates that are before start_dates
UPDATE configuration.rel_entities_locations
SET end_date = start_date + (INTERVAL '1 day' * floor(random() * 180))
WHERE end_date <= start_date;

-- Clean up
DROP TABLE temp_random_entities;
DROP TABLE temp_random_locations;

COMMIT;
