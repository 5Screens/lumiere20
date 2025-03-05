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
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, langue)
);

-- Création des index
CREATE INDEX idx_entities_types_label_langue ON translations.entities_types_label (langue);
CREATE INDEX idx_entities_types_label_dates ON translations.entities_types_label (date_creation, date_modification);

-- Création du trigger pour la mise à jour de la date de modification
CREATE TRIGGER update_entities_types_label_date_modification
    BEFORE UPDATE ON translations.entities_types_label
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();

-- Création du trigger pour la validation des dates
CREATE TRIGGER validate_entities_types_label_dates
    BEFORE UPDATE ON translations.entities_types_label
    FOR EACH ROW
    EXECUTE FUNCTION validate_modification_date();

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

-- Fin de la transaction
COMMIT;
