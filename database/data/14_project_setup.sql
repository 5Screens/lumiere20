-- Script: 14_project_setup.sql
-- Description: Données de test pour les tables de configuration des projets
-- Date: 2025-04-30

-- Begin transaction
BEGIN;

-- A/ Données pour VISIBILITY des projets
-- Insertion des codes
INSERT INTO configuration.project_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'VISIBILITY', 'PUBLIC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VISIBILITY', 'PRIVATE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'VISIBILITY', 'RESTRICTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.project_setup_label (uuid, rel_project_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PUBLIC', 'fr', 'Public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRIVATE', 'fr', 'Privé', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RESTRICTED', 'fr', 'Restreint', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.project_setup_label (uuid, rel_project_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'PUBLIC', 'en', 'Public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRIVATE', 'en', 'Private', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RESTRICTED', 'en', 'Restricted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- B/ Données pour CATEGORY des projets
-- Insertion des codes
INSERT INTO configuration.project_setup_codes (uuid, metadata, code, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'CATEGORY', 'SOFTWARE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'BUSINESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'SERVICE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'INFRASTRUCTURE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'SECURITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'COMPLIANCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CATEGORY', 'RESEARCH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en français
INSERT INTO translations.project_setup_label (uuid, rel_project_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SOFTWARE', 'fr', 'Logiciel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS', 'fr', 'Métier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE', 'fr', 'Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INFRASTRUCTURE', 'fr', 'Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY', 'fr', 'Sécurité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'COMPLIANCE', 'fr', 'Conformité', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RESEARCH', 'fr', 'Recherche', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertion des traductions en anglais
INSERT INTO translations.project_setup_label (uuid, rel_project_setup_code, lang, label, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'SOFTWARE', 'en', 'Software', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'BUSINESS', 'en', 'Business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SERVICE', 'en', 'Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INFRASTRUCTURE', 'en', 'Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SECURITY', 'en', 'Security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'COMPLIANCE', 'en', 'Compliance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'RESEARCH', 'en', 'Research', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Commit transaction
COMMIT;
