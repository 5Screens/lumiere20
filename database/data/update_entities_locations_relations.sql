-- Script: update_entities_locations_relations.sql
-- Description: Update relations between entities and locations after both are created
-- Date: 2025-10-10

BEGIN;

-- ============================================================================
-- PHASE 1: Update entities.rel_headquarters_location
-- ============================================================================

-- Pour les entreprises principales (COMPANY)
UPDATE configuration.entities e
SET rel_headquarters_location = (
    SELECT loc.uuid
    FROM configuration.locations loc
    WHERE loc.city = 'Paris'
    LIMIT 1
)
WHERE e.entity_id = 'LUM001';

UPDATE configuration.entities e
SET rel_headquarters_location = (
    SELECT loc.uuid
    FROM configuration.locations loc
    WHERE loc.city = 'Lyon'
    LIMIT 1
)
WHERE e.entity_id = 'LUM002';

UPDATE configuration.entities e
SET rel_headquarters_location = (
    SELECT loc.uuid
    FROM configuration.locations loc
    WHERE loc.city = 'Marseille'
    LIMIT 1
)
WHERE e.entity_id = 'LUM003';

-- Pour les succursales (BRANCH): lier chaque succursale à une location de la même ville
-- Extraction du nom de ville depuis le nom de la succursale (ex: "Lumiere Paris Branch" -> "Paris")
UPDATE configuration.entities e
SET rel_headquarters_location = (
    SELECT loc.uuid
    FROM configuration.locations loc
    WHERE loc.city = TRIM(SPLIT_PART(e.name, ' ', 2))
    LIMIT 1
)
WHERE e.entity_type = 'BRANCH';

-- ============================================================================
-- PHASE 2: Update locations.primary_entity_uuid (déjà fait dans locations.sql)
-- ============================================================================
-- Note: Les locations ont déjà été liées aux entités dans locations.sql
-- via UPDATE basé sur le matching de ville

COMMIT;
