-- Script: rel_persons_groups.sql
-- Description: Remplissage de la table configuration.rel_persons_groups
-- Date: 2025-04-01

-- Activation du mode transaction
BEGIN;

-- Vérification que les tables persons et groups existent et contiennent des données
DO $$
DECLARE
    person_count INTEGER;
    group_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO person_count FROM configuration.persons;
    SELECT COUNT(*) INTO group_count FROM configuration.groups;
    
    IF person_count < 10000 THEN
        RAISE EXCEPTION 'Not enough persons in the database. Expected at least 10000, found %', person_count;
    END IF;
    
    IF group_count < 30 THEN
        RAISE EXCEPTION 'Not enough groups in the database. Expected at least 30, found %', group_count;
    END IF;
END $$;

-- Suppression des données existantes (si nécessaire)
TRUNCATE TABLE configuration.rel_persons_groups CASCADE;

-- Boucle pour assigner 30 personnes à chaque groupe
DO $$
DECLARE
    group_uuids UUID[];
    person_uuids UUID[];
    current_group UUID;
    current_person UUID;
    persons_per_group INTEGER := 30;
    total_groups INTEGER := 30;
    i INTEGER;
    j INTEGER;
    offset_value INTEGER;
BEGIN
    -- Récupération des UUIDs des groupes
    SELECT ARRAY(SELECT uuid FROM configuration.groups ORDER BY uuid LIMIT total_groups) INTO group_uuids;
    
    -- Boucle sur chaque groupe
    FOR i IN 1..total_groups LOOP
        current_group := group_uuids[i];
        offset_value := (i - 1) * persons_per_group;
        
        -- Récupération des 30 personnes pour ce groupe
        SELECT ARRAY(
            SELECT uuid 
            FROM configuration.persons 
            ORDER BY uuid 
            LIMIT persons_per_group 
            OFFSET offset_value
        ) INTO person_uuids;
        
        -- Insertion des relations pour ce groupe
        FOR j IN 1..persons_per_group LOOP
            current_person := person_uuids[j];
            
            INSERT INTO configuration.rel_persons_groups (
                uuid, 
                rel_member, 
                rel_group, 
                created_at, 
                updated_at
            ) VALUES (
                uuid_generate_v4(), 
                current_person, 
                current_group, 
                CURRENT_TIMESTAMP, 
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- Vérification du nombre d'enregistrements insérés
DO $$
DECLARE
    record_count INTEGER;
    expected_count INTEGER := 900; -- 30 groupes * 30 personnes
BEGIN
    SELECT COUNT(*) INTO record_count FROM configuration.rel_persons_groups;
    
    RAISE NOTICE 'Inserted % records into configuration.rel_persons_groups', record_count;
    
    IF record_count != expected_count THEN
        RAISE WARNING 'Expected % records, but inserted %', expected_count, record_count;
    END IF;
END $$;

-- Validation de la transaction
COMMIT;
