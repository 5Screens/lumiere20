-- Script: 14_create_project_tables.sql
-- Description: Création des tables nécessaires à la gestion des projets
-- Date: 2025-04-30

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- 1. Create project_setup_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'project_setup_codes') THEN
        DROP TABLE configuration.project_setup_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.project_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create project_setup_label table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'project_setup_label') THEN
        DROP TABLE translations.project_setup_label CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.project_setup_label (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_project_setup_code VARCHAR(50) NOT NULL REFERENCES configuration.project_setup_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_project_setup_code, lang)
);

-- Add audit triggers
-- Trigger for project_setup_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_project_setup_codes') THEN
        DROP TRIGGER audit_project_setup_codes ON configuration.project_setup_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_project_setup_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.project_setup_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for project_setup_label
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_project_setup_label') THEN
        DROP TRIGGER audit_project_setup_label ON translations.project_setup_label;
    END IF;
END
$$;

CREATE TRIGGER audit_project_setup_label
AFTER INSERT OR UPDATE OR DELETE ON translations.project_setup_label
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add comments
COMMENT ON TABLE configuration.project_setup_codes IS 'Table contenant les codes de configuration des projets';
COMMENT ON TABLE translations.project_setup_label IS 'Table contenant les traductions des codes de configuration des projets';

-- Commit transaction
COMMIT;
