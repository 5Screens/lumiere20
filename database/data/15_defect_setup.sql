-- Script: 15_defect_setup.sql
-- Description: Données de test pour les tables de configuration des défauts (defect setup)
-- Date: 2025-05-05

-- Begin transaction
BEGIN;

-- A/ Données pour SEVERITY des défauts
INSERT INTO configuration.defect_setup_codes (uuid, metadata, code, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'SEVERITY', 'BLOCKER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SEVERITY', 'CRITICAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SEVERITY', 'MAJOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SEVERITY', 'MINOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SEVERITY', 'TRIVIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SEVERITY', 'COSMETIC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions françaises pour SEVERITY
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'BLOCKER', 'fr', 'Bloquant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CRITICAL', 'fr', 'Critique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MAJOR', 'fr', 'Majeur', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MINOR', 'fr', 'Mineur', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TRIVIAL', 'fr', 'Mineur (trivial)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'COSMETIC', 'fr', 'Cosmétique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions anglaises pour SEVERITY
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'BLOCKER', 'en', 'Blocker', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'CRITICAL', 'en', 'Critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MAJOR', 'en', 'Major', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MINOR', 'en', 'Minor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TRIVIAL', 'en', 'Trivial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'COSMETIC', 'en', 'Cosmetic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- B/ Données pour IMPACT des défauts
INSERT INTO configuration.defect_setup_codes (uuid, metadata, code, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'IMPACT', 'GLOBAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'MULTIPLE_USERS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'SINGLE_USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'INTERNAL_ONLY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'IMPACT', 'NON_BLOCKING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions françaises pour IMPACT
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'GLOBAL', 'fr', 'Global', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MULTIPLE_USERS', 'fr', 'Plusieurs utilisateurs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SINGLE_USER', 'fr', 'Utilisateur unique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTERNAL_ONLY', 'fr', 'Interne uniquement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NON_BLOCKING', 'fr', 'Non bloquant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions anglaises pour IMPACT
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'GLOBAL', 'en', 'Global', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'MULTIPLE_USERS', 'en', 'Multiple users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'SINGLE_USER', 'en', 'Single user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'INTERNAL_ONLY', 'en', 'Internal only', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'NON_BLOCKING', 'en', 'Non blocking', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- C/ Données pour ENVIRONMENT des défauts
INSERT INTO configuration.defect_setup_codes (uuid, metadata, code, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'ENVIRONMENT', 'PRODUCTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENVIRONMENT', 'PRE_PRODUCTION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENVIRONMENT', 'STAGING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENVIRONMENT', 'TEST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENVIRONMENT', 'DEVELOPMENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'ENVIRONMENT', 'LOCAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions françaises pour ENVIRONMENT
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'PRODUCTION', 'fr', 'Production', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRE_PRODUCTION', 'fr', 'Pré-production', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STAGING', 'fr', 'Pré-prod technique', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TEST', 'fr', 'Test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'DEVELOPMENT', 'fr', 'Développement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'LOCAL', 'fr', 'Local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Traductions anglaises pour ENVIRONMENT
INSERT INTO translations.defect_setup_labels (uuid, rel_defect_setup_code, lang, label, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'PRODUCTION', 'en', 'Production', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'PRE_PRODUCTION', 'en', 'Pre-production', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'STAGING', 'en', 'Staging', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'TEST', 'en', 'Test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'DEVELOPMENT', 'en', 'Development', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'LOCAL', 'en', 'Local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Commit transaction
COMMIT;
