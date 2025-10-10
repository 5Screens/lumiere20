-- Script: configuration_items_seed.sql
-- Description: Données de test pour la table data.configuration_items
-- Date: 2025-03-25

BEGIN;

-- Insertion de 100 configuration items
DO $$
DECLARE
    i integer;
    item_name text;
    item_description text;
BEGIN
    FOR i IN 1..100 LOOP
        -- Génération du nom et de la description en fonction du type d'équipement
        CASE (i % 5)
            WHEN 0 THEN 
                item_name := 'Laptop-' || LPAD(i::text, 3, '0');
                item_description := 'Laptop for development team';
            WHEN 1 THEN 
                item_name := 'Server-' || LPAD(i::text, 3, '0');
                item_description := 'Production server for business applications';
            WHEN 2 THEN 
                item_name := 'Network-' || LPAD(i::text, 3, '0');
                item_description := 'Network equipment for office infrastructure';
            WHEN 3 THEN 
                item_name := 'Software-' || LPAD(i::text, 3, '0');
                item_description := 'Software license for business operations';
            ELSE 
                item_name := 'Printer-' || LPAD(i::text, 3, '0');
                item_description := 'Office printer for department use';
        END CASE;

        -- Insertion dans la table
        INSERT INTO data.configuration_items (
            name,
            description
        ) VALUES (
            item_name,
            item_description
        );
    END LOOP;
END $$;

COMMIT;
