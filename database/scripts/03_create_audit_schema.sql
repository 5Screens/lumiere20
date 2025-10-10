-- Script: 03_create_audit_schema.sql
-- Description: Création du schéma d'audit et de la table audit_changes
-- Date: 2025-03-06

-- Activation du mode transaction
BEGIN;

-- Création du schéma audit
CREATE SCHEMA IF NOT EXISTS audit;

-- Ajout du schéma audit au search_path
SET search_path TO configuration, core, data, translations, audit, public;
ALTER DATABASE lumiere_v16 SET search_path TO configuration, core, data, translations, audit, public;

-- Création de la table d'audit pour journaliser les changements
CREATE TABLE audit.audit_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_type VARCHAR(50) NOT NULL,
    object_uuid UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    attribute_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    user_id UUID NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ajout d'index pour améliorer les performances des requêtes fréquentes
CREATE INDEX idx_audit_changes_object_uuid ON audit.audit_changes(object_uuid);
CREATE INDEX idx_audit_changes_user_id ON audit.audit_changes(user_id);
CREATE INDEX idx_audit_changes_event_date ON audit.audit_changes(event_date);
CREATE INDEX idx_audit_changes_event_type ON audit.audit_changes(event_type);
CREATE INDEX idx_audit_changes_object_type ON audit.audit_changes(object_type);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE audit.audit_changes IS 'Table de journalisation des modifications sur les objets du système';
COMMENT ON COLUMN audit.audit_changes.id IS 'Identifiant unique de l''entrée d''audit';
COMMENT ON COLUMN audit.audit_changes.object_type IS 'Type d''objet concerné (persons, locations, entities, services, service_offering)';
COMMENT ON COLUMN audit.audit_changes.object_uuid IS 'UUID de l''objet concerné par la modification';
COMMENT ON COLUMN audit.audit_changes.event_type IS 'Type d''événement: Obj_CREATED, Field_UPDATED, Rel_CREATED, Rel_Changed, Rel_Deleted';
COMMENT ON COLUMN audit.audit_changes.attribute_name IS 'Nom du champ modifié, NULL si l''événement concerne l''objet entier';
COMMENT ON COLUMN audit.audit_changes.old_value IS 'Valeur avant modification, NULL pour les créations';
COMMENT ON COLUMN audit.audit_changes.new_value IS 'Valeur après modification, NULL pour les suppressions';
COMMENT ON COLUMN audit.audit_changes.user_id IS 'UUID de l''utilisateur ayant effectué la modification';
COMMENT ON COLUMN audit.audit_changes.event_date IS 'Date et heure de l''événement';

-- Création de la nouvelle fonction d'audit qui exclut les champs updated_at
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
            IF col_name NOT IN ('created_at', 'updated_at') THEN
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
            -- Ignorer explicitement les colonnes updated_at
            IF col_name <> 'updated_at' THEN
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
            IF col_name NOT IN ('created_at', 'updated_at') THEN
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


-- Création des déclencheurs pour les tables à auditer

-- Déclencheur pour la table persons
CREATE TRIGGER trg_audit_persons
AFTER INSERT OR UPDATE OR DELETE ON configuration.persons
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table locations
CREATE TRIGGER trg_audit_locations
AFTER INSERT OR UPDATE OR DELETE ON configuration.locations
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table entities
CREATE TRIGGER trg_audit_entities
AFTER INSERT OR UPDATE OR DELETE ON configuration.entities
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table services
CREATE TRIGGER trg_audit_services
AFTER INSERT OR UPDATE OR DELETE ON data.services
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table service_offerings
CREATE TRIGGER trg_audit_service_offerings
AFTER INSERT OR UPDATE OR DELETE ON data.service_offerings
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table symptoms
CREATE TRIGGER trg_audit_symptoms
AFTER INSERT OR UPDATE OR DELETE ON configuration.symptoms
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table symptoms_translation
CREATE TRIGGER trg_audit_symptoms_translation
AFTER INSERT OR UPDATE OR DELETE ON translations.symptoms_translation
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table groups
CREATE TRIGGER trg_audit_groups
AFTER INSERT OR UPDATE OR DELETE ON configuration.groups
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table rel_persons_groups
CREATE TRIGGER trg_audit_rel_persons_groups
AFTER INSERT OR UPDATE OR DELETE ON configuration.rel_persons_groups
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table tickets
CREATE TRIGGER trg_audit_tickets
AFTER INSERT OR UPDATE OR DELETE ON core.tickets
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Déclencheur pour la table rel_parent_child_tickets
CREATE TRIGGER trg_audit_rel_parent_child_tickets
AFTER INSERT OR UPDATE OR DELETE ON core.rel_parent_child_tickets
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Note: Le trigger trg_audit_rel_tickets_groups_persons est créé dans 09_assignation_and_watch_table.sql
-- car la table core.rel_tickets_groups_persons est créée dans ce fichier

-- Fonction pour définir l'utilisateur courant dans le contexte de la session
CREATE OR REPLACE FUNCTION configuration.set_current_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Validation de la transaction
COMMIT;
