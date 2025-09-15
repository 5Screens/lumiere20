-- Script: 19_location_status.sql
-- Description: Insertion des statuts de locations et leurs traductions
-- Date: 2025-09-15

BEGIN;

-- 1/ Insertion du type LOCATION dans ticket_types
INSERT INTO configuration.ticket_types (code) VALUES ('LOCATION');

-- Insertion des traductions pour le type LOCATION
-- Français
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT uuid, 'fr', 'Emplacement'
FROM configuration.ticket_types
WHERE code = 'LOCATION';

-- Anglais
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT uuid, 'en', 'Location'
FROM configuration.ticket_types
WHERE code = 'LOCATION';

-- Espagnol
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT uuid, 'es', 'Ubicación'
FROM configuration.ticket_types
WHERE code = 'LOCATION';

-- Portugais
INSERT INTO translations.ticket_types_translation (ticket_type_uuid, lang, label)
SELECT uuid, 'pt', 'Localização'
FROM configuration.ticket_types
WHERE code = 'LOCATION';

-- 2/ Insertion des statuts spécifiques aux locations
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('ACTIVE', 'LOCATION'),         -- Location active
    ('INACTIVE', 'LOCATION');       -- Location inactive

-- 2/ Insertion des traductions en français
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE 
        WHEN code = 'ACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Actif'
        WHEN code = 'INACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Inactif'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'LOCATION';

-- Insertion des traductions en anglais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE 
        WHEN code = 'ACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Active'
        WHEN code = 'INACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Inactive'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'LOCATION';

-- Insertion des traductions en espagnol
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE 
        WHEN code = 'ACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Activo'
        WHEN code = 'INACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Inactivo'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'LOCATION';

-- Insertion des traductions en portugais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE 
        WHEN code = 'ACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Ativo'
        WHEN code = 'INACTIVE' AND rel_ticket_type = 'LOCATION' THEN 'Inativo'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'LOCATION';

COMMIT;


