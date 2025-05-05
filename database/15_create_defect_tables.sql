-- Script: 15_create_defect_tables.sql
-- Description: Création des tables de configuration pour les défauts (defect setup)
-- Date: 2025-05-05

-- Extension requise pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table defect_setup_codes
CREATE TABLE IF NOT EXISTS configuration.defect_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table defect_setup_labels
CREATE TABLE IF NOT EXISTS translations.defect_setup_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_defect_setup_code TEXT NOT NULL REFERENCES configuration.defect_setup_codes(code) ON DELETE CASCADE,
    lang VARCHAR(2) NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les recherches sur les labels
CREATE INDEX IF NOT EXISTS idx_defect_setup_labels_rel_code ON translations.defect_setup_labels(rel_defect_setup_code);

-- Commit transaction
COMMIT;
