-- Script: 11_create_problem_tables.sql
-- Description: Creation of problem-related tables in the configuration schema
-- Date: 2025-04-10

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- Create problem_categories table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'problem_categories') THEN
        DROP TABLE configuration.problem_categories CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.problem_categories (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create problem_categories_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'problem_categories_labels') THEN
        DROP TABLE translations.problem_categories_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.problem_categories_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_problem_category_code VARCHAR(50) NOT NULL REFERENCES configuration.problem_categories(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_problem_category_code, lang)
);

-- Add audit triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_problem_categories') THEN
        DROP TRIGGER audit_problem_categories ON configuration.problem_categories;
    END IF;
END
$$;

CREATE TRIGGER audit_problem_categories
AFTER INSERT OR UPDATE OR DELETE ON configuration.problem_categories
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_problem_categories_labels') THEN
        DROP TRIGGER audit_problem_categories_labels ON translations.problem_categories_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_problem_categories_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.problem_categories_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add comments
COMMENT ON TABLE configuration.problem_categories IS 'Table storing problem categories';
COMMENT ON COLUMN configuration.problem_categories.code IS 'Unique code identifying the problem category';

COMMENT ON TABLE translations.problem_categories_labels IS 'Table storing translations for problem categories';
COMMENT ON COLUMN translations.problem_categories_labels.rel_problem_category_code IS 'Reference to the problem category code';
COMMENT ON COLUMN translations.problem_categories_labels.lang IS 'Language code for the translation';
COMMENT ON COLUMN translations.problem_categories_labels.label IS 'Translated label for the problem category';

-- Commit transaction
COMMIT;
