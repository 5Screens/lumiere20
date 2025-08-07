-- Script: 07_CreateEntitiesCodeTranslation.sql
-- Description: Création de la table entities_types_label dans le schéma translations
-- Date: 2025-03-05

-- Activation du mode transaction
BEGIN;

-- Création de la table entities_types_label
CREATE TABLE translations.entities_types_label (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('COMPANY', 'BRANCH', 'DEPARTMENT', 'SUPPLIER', 'CUSTOMER')),
    langue VARCHAR(5) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, langue)
);

-- Création des index
CREATE INDEX idx_entities_types_label_langue ON translations.entities_types_label (langue);
CREATE INDEX idx_entities_types_label_dates ON translations.entities_types_label (created_at, updated_at);

-- Création du trigger pour la mise à jour de la date de modification
CREATE TRIGGER update_entities_types_label_updated_at
    BEFORE UPDATE ON translations.entities_types_label
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Création du trigger pour la validation des dates
CREATE TRIGGER validate_entities_types_label_dates
    BEFORE UPDATE ON translations.entities_types_label
    FOR EACH ROW
    EXECUTE FUNCTION valiupdated_at_date();

-- Insertion des valeurs par défaut pour le français
INSERT INTO translations.entities_types_label (entity_type, langue, libelle) VALUES
('COMPANY', 'fr', 'Entreprise'),
('BRANCH', 'fr', 'Succursale'),
('DEPARTMENT', 'fr', 'Département'),
('SUPPLIER', 'fr', 'Fournisseur'),
('CUSTOMER', 'fr', 'Client');

-- Insertion des valeurs par défaut pour l'anglais
INSERT INTO translations.entities_types_label (entity_type, langue, libelle) VALUES
('COMPANY', 'en', 'Company'),
('BRANCH', 'en', 'Branch'),
('DEPARTMENT', 'en', 'Department'),
('SUPPLIER', 'en', 'Supplier'),
('CUSTOMER', 'en', 'Customer');

-- Insertion des valeurs par défaut pour l'espagnol
INSERT INTO translations.entities_types_label (entity_type, langue, libelle) VALUES
('COMPANY', 'es', 'Empresa'),
('BRANCH', 'es', 'Sucursal'),
('DEPARTMENT', 'es', 'Departamento'),
('SUPPLIER', 'es', 'Proveedor'),
('CUSTOMER', 'es', 'Cliente');

-- Insertion des valeurs par défaut pour le portugais
INSERT INTO translations.entities_types_label (entity_type, langue, libelle) VALUES
('COMPANY', 'pt', 'Empresa'),
('BRANCH', 'pt', 'Filial'),
('DEPARTMENT', 'pt', 'Departamento'),
('SUPPLIER', 'pt', 'Fornecedor'),
('CUSTOMER', 'pt', 'Cliente');

-- 3. Create entity_setup_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'entity_setup_codes') THEN
        DROP TABLE configuration.entity_setup_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.entity_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create entity_setup_labels table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'entity_setup_labels') THEN
        DROP TABLE translations.entity_setup_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.entity_setup_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_entity_setup_code VARCHAR(50) NOT NULL REFERENCES configuration.entity_setup_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_entity_setup_code, lang)
);

-- Add audit triggers
-- Trigger for entity_setup_codes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_entity_setup_codes') THEN
        CREATE TRIGGER trg_audit_entity_setup_codes
            AFTER INSERT OR UPDATE OR DELETE ON configuration.entity_setup_codes
            FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
    END IF;
END
$$;

-- Trigger for entity_setup_labels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_entity_setup_labels') THEN
        CREATE TRIGGER trg_audit_entity_setup_labels
            AFTER INSERT OR UPDATE OR DELETE ON translations.entity_setup_labels
            FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
    END IF;
END
$$;

-- Fin de la transaction
COMMIT;
