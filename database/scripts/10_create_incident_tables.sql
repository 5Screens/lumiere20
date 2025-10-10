-- Script: 10_create_incident_tables.sql
-- Description: Creation of incident-related tables in the configuration schema
-- Date: 2025-04-07

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- 1. Create incident_setup_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_setup_codes') THEN
        DROP TABLE configuration.incident_setup_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    code VARCHAR(50) NOT NULL UNIQUE,
    value INTEGER, -- Pour urgencies et impacts qui ont une valeur numérique
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create incident_setup_labels table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'incident_setup_labels') THEN
        DROP TABLE translations.incident_setup_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.incident_setup_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_incident_setup_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_setup_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_setup_code, lang)
);

-- 3. Create contact_types table (conservée séparément)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'contact_types') THEN
        DROP TABLE configuration.contact_types CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.contact_types (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create incident_priorities table (utilise les nouveaux codes)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_priorities') THEN
        DROP TABLE configuration.incident_priorities CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_priorities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    rel_incident_urgency_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_setup_codes(code),
    rel_incident_impact_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_setup_codes(code),
    priority_level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_urgency_code, rel_incident_impact_code)
);

-- 5. Create contact_types_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'contact_types_labels') THEN
        DROP TABLE translations.contact_types_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.contact_types_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_contact_type_code VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_contact_type_code, language),
    CONSTRAINT contact_types_labels_rel_contact_type_code_fkey 
        FOREIGN KEY (rel_contact_type_code) 
        REFERENCES configuration.contact_types(code) 
        ON DELETE RESTRICT 
        DEFERRABLE INITIALLY IMMEDIATE
);

-- Add audit triggers
-- Trigger for incident_setup_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_setup_codes') THEN
        DROP TRIGGER audit_incident_setup_codes ON configuration.incident_setup_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_setup_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_setup_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for incident_setup_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_setup_labels') THEN
        DROP TRIGGER audit_incident_setup_labels ON translations.incident_setup_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_setup_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.incident_setup_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for contact_types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_contact_types') THEN
        DROP TRIGGER audit_contact_types ON configuration.contact_types;
    END IF;
END
$$;

CREATE TRIGGER audit_contact_types
AFTER INSERT OR UPDATE OR DELETE ON configuration.contact_types
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for incident_priorities
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_priorities') THEN
        DROP TRIGGER audit_incident_priorities ON configuration.incident_priorities;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_priorities
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_priorities
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for contact_types_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_contact_types_labels') THEN
        DROP TRIGGER audit_contact_types_labels ON translations.contact_types_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_contact_types_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.contact_types_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Commit transaction
COMMIT;
