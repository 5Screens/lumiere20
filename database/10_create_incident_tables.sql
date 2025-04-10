-- Script: 10_create_incident_tables.sql
-- Description: Creation of incident-related tables in the configuration schema
-- Date: 2025-04-07

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create incident_urgencies table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_urgencies') THEN
        DROP TABLE configuration.incident_urgencies CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_urgencies (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    value INTEGER NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_impacts table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_impacts') THEN
        DROP TABLE configuration.incident_impacts CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_impacts (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    value INTEGER NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_cause_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_cause_codes') THEN
        DROP TABLE configuration.incident_cause_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_cause_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_types table
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
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_priorities table (without labels)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_priorities') THEN
        DROP TABLE configuration.incident_priorities CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_priorities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    rel_incident_urgency_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_urgencies(code),
    rel_incident_impact_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_impacts(code),
    priority_level INTEGER NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_urgency_code, rel_incident_impact_code)
);

-- Create incident_urgencies_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'incident_urgencies_labels') THEN
        DROP TABLE translations.incident_urgencies_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.incident_urgencies_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_incident_urgency_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_urgencies(code),
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_urgency_code, language)
);

-- Create incident_impacts_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'incident_impacts_labels') THEN
        DROP TABLE translations.incident_impacts_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.incident_impacts_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_incident_impact_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_impacts(code),
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_impact_code, language)
);

-- Create incident_cause_codes_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'incident_cause_codes_labels') THEN
        DROP TABLE translations.incident_cause_codes_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.incident_cause_codes_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_incident_cause_code_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_cause_codes(code),
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_cause_code_code, language)
);

-- Create contact_types_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'contact_types_labels') THEN
        DROP TABLE translations.contact_types_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.contact_types_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_contact_type_code VARCHAR(50) NOT NULL REFERENCES configuration.contact_types(code),
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_contact_type_code, language)
);

-- Create incident_resolution_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'incident_resolution_codes') THEN
        DROP TABLE configuration.incident_resolution_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.incident_resolution_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_resolution_codes_labels table in translations schema
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'incident_resolution_codes_labels') THEN
        DROP TABLE translations.incident_resolution_codes_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.incident_resolution_codes_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_incident_resolution_code VARCHAR(50) NOT NULL REFERENCES configuration.incident_resolution_codes(code),
    language VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_incident_resolution_code, language)
);

-- Add audit triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_urgencies') THEN
        DROP TRIGGER audit_incident_urgencies ON configuration.incident_urgencies;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_urgencies
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_urgencies
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_impacts') THEN
        DROP TRIGGER audit_incident_impacts ON configuration.incident_impacts;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_impacts
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_impacts
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_cause_codes') THEN
        DROP TRIGGER audit_incident_cause_codes ON configuration.incident_cause_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_cause_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_cause_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_urgencies_labels') THEN
        DROP TRIGGER audit_incident_urgencies_labels ON translations.incident_urgencies_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_urgencies_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.incident_urgencies_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_impacts_labels') THEN
        DROP TRIGGER audit_incident_impacts_labels ON translations.incident_impacts_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_impacts_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.incident_impacts_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_cause_codes_labels') THEN
        DROP TRIGGER audit_incident_cause_codes_labels ON translations.incident_cause_codes_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_cause_codes_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.incident_cause_codes_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

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

-- Add audit trigger for incident_resolution_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_resolution_codes') THEN
        DROP TRIGGER audit_incident_resolution_codes ON configuration.incident_resolution_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_resolution_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.incident_resolution_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add audit trigger for incident_resolution_codes_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_incident_resolution_codes_labels') THEN
        DROP TRIGGER audit_incident_resolution_codes_labels ON translations.incident_resolution_codes_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_incident_resolution_codes_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.incident_resolution_codes_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
