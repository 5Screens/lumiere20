-- Script: 04_update_audit_triggers.sql
-- Description: Modification des déclencheurs d'audit pour exclure les champs date_modification
-- Date: 2025-03-12

-- Activation du mode transaction
BEGIN;

-- Suppression de la fonction existante
DROP FUNCTION IF EXISTS audit.log_changes() CASCADE;

-- Création de la nouvelle fonction d'audit qui exclut les champs date_modification
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    object_type TEXT;
    col_name TEXT;
    old_val TEXT;
    new_val TEXT;
    record_json TEXT := '';
BEGIN
    -- Récupération de l'ID utilisateur actuel (à implémenter selon votre système d'authentification)
    -- Dans un système réel, cela serait récupéré depuis le contexte de la session
    current_user_id := COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Détermination du type d'objet basé sur le schéma et la table
    IF TG_TABLE_SCHEMA = 'configuration' AND TG_TABLE_NAME = 'persons' THEN
        object_type := 'persons';
    ELSIF TG_TABLE_SCHEMA = 'configuration' AND TG_TABLE_NAME = 'locations' THEN
        object_type := 'locations';
    ELSIF TG_TABLE_SCHEMA = 'configuration' AND TG_TABLE_NAME = 'entities' THEN
        object_type := 'entities';
    ELSIF TG_TABLE_SCHEMA = 'configuration' AND TG_TABLE_NAME = 'symptoms' THEN
        object_type := 'symptoms';
    ELSIF TG_TABLE_SCHEMA = 'data' AND TG_TABLE_NAME = 'services' THEN
        object_type := 'services';
    ELSIF TG_TABLE_SCHEMA = 'data' AND TG_TABLE_NAME = 'service_offerings' THEN
        object_type := 'service_offerings';
    ELSIF TG_TABLE_SCHEMA = 'translations' AND TG_TABLE_NAME = 'symptoms_translation' THEN
        object_type := 'symptoms_translation';
    ELSE
        object_type := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME;
    END IF;
    
    -- Traitement selon le type d'opération
    IF (TG_OP = 'INSERT') THEN
        -- Création du format clé/valeur pour les données insérées
        FOR col_name IN 
            SELECT c.column_name 
            FROM information_schema.columns c
            WHERE c.table_schema = TG_TABLE_SCHEMA 
            AND c.table_name = TG_TABLE_NAME
            ORDER BY c.ordinal_position
        LOOP
            -- Ignorer les colonnes système
            IF col_name NOT IN ('date_creation', 'date_modification') THEN
                EXECUTE format('SELECT $1.%I::TEXT', col_name) 
                INTO new_val
                USING NEW;
                
                -- Ajouter la paire clé/valeur au résultat
                IF record_json <> '' THEN
                    record_json := record_json || ', ';
                END IF;
                record_json := record_json || col_name || '=' || COALESCE(new_val, 'NULL');
            END IF;
        END LOOP;
        
        -- Insertion d'un nouvel enregistrement d'audit pour la création d'objet
        INSERT INTO audit.audit_changes (
            object_type, object_uuid, event_type, attribute_name, old_value, new_value, user_id
        ) VALUES (
            object_type, NEW.uuid, 'Obj_CREATED', NULL, NULL, record_json, current_user_id
        );
        RETURN NEW;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Pour chaque colonne modifiée, créer un enregistrement d'audit
        FOR col_name IN 
            SELECT c.column_name 
            FROM information_schema.columns c
            WHERE c.table_schema = TG_TABLE_SCHEMA 
            AND c.table_name = TG_TABLE_NAME
        LOOP
            -- Ignorer explicitement les colonnes date_modification
            IF col_name <> 'date_modification' THEN
                -- Récupération des valeurs avant et après modification
                EXECUTE format('SELECT $1.%I::TEXT, $2.%I::TEXT', col_name, col_name) 
                INTO old_val, new_val
                USING OLD, NEW;
                
                -- Si la valeur a changé, enregistrer la modification
                IF old_val IS DISTINCT FROM new_val THEN
                    INSERT INTO audit.audit_changes (
                        object_type, object_uuid, event_type, attribute_name, old_value, new_value, user_id
                    ) VALUES (
                        object_type, NEW.uuid, 'Field_UPDATED', col_name, old_val, new_val, current_user_id
                    );
                END IF;
            END IF;
        END LOOP;
        RETURN NEW;
        
    ELSIF (TG_OP = 'DELETE') THEN
        -- Création du format clé/valeur pour les données supprimées
        FOR col_name IN 
            SELECT c.column_name 
            FROM information_schema.columns c
            WHERE c.table_schema = TG_TABLE_SCHEMA 
            AND c.table_name = TG_TABLE_NAME
            ORDER BY c.ordinal_position
        LOOP
            -- Ignorer les colonnes système
            IF col_name NOT IN ('date_creation', 'date_modification') THEN
                EXECUTE format('SELECT $1.%I::TEXT', col_name) 
                INTO old_val
                USING OLD;
                
                -- Ajouter la paire clé/valeur au résultat
                IF record_json <> '' THEN
                    record_json := record_json || ', ';
                END IF;
                record_json := record_json || col_name || '=' || COALESCE(old_val, 'NULL');
            END IF;
        END LOOP;
        
        -- Insertion d'un enregistrement d'audit pour la suppression d'objet
        INSERT INTO audit.audit_changes (
            object_type, object_uuid, event_type, attribute_name, old_value, new_value, user_id
        ) VALUES (
            object_type, OLD.uuid, 'Rel_Deleted', NULL, record_json, NULL, current_user_id
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recréation des déclencheurs pour les tables à auditer

-- Déclencheur pour la table persons
DROP TRIGGER IF EXISTS trg_audit_persons ON configuration.persons;
CREATE TRIGGER trg_audit_persons
AFTER INSERT OR UPDATE OR DELETE ON configuration.persons
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table locations
DROP TRIGGER IF EXISTS trg_audit_locations ON configuration.locations;
CREATE TRIGGER trg_audit_locations
AFTER INSERT OR UPDATE OR DELETE ON configuration.locations
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table entities
DROP TRIGGER IF EXISTS trg_audit_entities ON configuration.entities;
CREATE TRIGGER trg_audit_entities
AFTER INSERT OR UPDATE OR DELETE ON configuration.entities
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table services
DROP TRIGGER IF EXISTS trg_audit_services ON data.services;
CREATE TRIGGER trg_audit_services
AFTER INSERT OR UPDATE OR DELETE ON data.services
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table service_offerings
DROP TRIGGER IF EXISTS trg_audit_service_offerings ON data.service_offerings;
CREATE TRIGGER trg_audit_service_offerings
AFTER INSERT OR UPDATE OR DELETE ON data.service_offerings
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table symptoms
DROP TRIGGER IF EXISTS trg_audit_symptoms ON configuration.symptoms;
CREATE TRIGGER trg_audit_symptoms
AFTER INSERT OR UPDATE OR DELETE ON configuration.symptoms
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table symptoms_translation
DROP TRIGGER IF EXISTS trg_audit_symptoms_translation ON translations.symptoms_translation;
CREATE TRIGGER trg_audit_symptoms_translation
AFTER INSERT OR UPDATE OR DELETE ON translations.symptoms_translation
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Validation de la transaction
COMMIT;

-- Commentaire explicatif
/*
Ce script modifie la fonction d'audit log_changes() pour exclure explicitement les champs 'date_modification'
lors des opérations UPDATE. Cela évite de générer des entrées d'audit inutiles pour ces champs qui sont
automatiquement mis à jour par le système.

La modification principale se trouve dans la section UPDATE de la fonction, où nous avons ajouté une condition
pour ignorer explicitement le champ 'date_modification'.
*/
