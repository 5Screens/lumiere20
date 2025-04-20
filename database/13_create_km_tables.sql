-- Script: 13_create_km_tables.sql
-- Description: Création des tables nécessaires à la gestion des articles de connaissance
-- Date: 2025-04-20

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- 1. Create knowledge_setup_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'knowledge_setup_codes') THEN
        DROP TABLE configuration.knowledge_setup_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.knowledge_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create knowledge_setup_label table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'knowledge_setup_label') THEN
        DROP TABLE translations.knowledge_setup_label CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.knowledge_setup_label (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_change_setup_code VARCHAR(50) NOT NULL REFERENCES configuration.knowledge_setup_codes(code) ON DELETE CASCADE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_change_setup_code, lang)
);

-- 3. Create knowledge_article_versions table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'core' AND tablename = 'knowledge_article_versions') THEN
        DROP TABLE core.knowledge_article_versions CASCADE;
    END IF;
END
$$;

CREATE TABLE core.knowledge_article_versions (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_article_uuid UUID NOT NULL,
    version_number INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_summary TEXT,
    full_article JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    UNIQUE(rel_article_uuid, version_number)
);

-- Add audit triggers
-- Trigger for knowledge_setup_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_knowledge_setup_codes') THEN
        DROP TRIGGER audit_knowledge_setup_codes ON configuration.knowledge_setup_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_knowledge_setup_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.knowledge_setup_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for knowledge_setup_label
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_knowledge_setup_label') THEN
        DROP TRIGGER audit_knowledge_setup_label ON translations.knowledge_setup_label;
    END IF;
END
$$;

CREATE TRIGGER audit_knowledge_setup_label
AFTER INSERT OR UPDATE OR DELETE ON translations.knowledge_setup_label
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add comments
COMMENT ON TABLE configuration.knowledge_setup_codes IS 'Table contenant les codes de configuration pour la gestion des articles de connaissance';
COMMENT ON TABLE translations.knowledge_setup_label IS 'Table contenant les traductions des libellés de configuration pour la gestion des articles de connaissance';
COMMENT ON TABLE core.knowledge_article_versions IS 'Table contenant les versions des articles de connaissance';

-- 4. Create attachments table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'core' AND tablename = 'attachments') THEN
        DROP TABLE core.attachments CASCADE;
    END IF;
END
$$;

CREATE TABLE core.attachments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Référence vers l'objet parent
    object_type VARCHAR(50) NOT NULL,   -- ex: 'knowledge_article', 'incident', 'change_request'
    object_uuid UUID NOT NULL,
    -- Métadonnées fichier
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 CHAR(64) NOT NULL,
    storage_uri TEXT NOT NULL,  -- ex: s3://itsm-files/2025/04/<uuid>
    -- Audit
    uploaded_by UUID NOT NULL REFERENCES configuration.persons(uuid),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by object
CREATE INDEX idx_attachments_object ON core.attachments(object_type, object_uuid);

-- Add audit trigger for attachments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_attachments') THEN
        DROP TRIGGER audit_attachments ON core.attachments;
    END IF;
END
$$;

CREATE TRIGGER audit_attachments
AFTER INSERT OR UPDATE OR DELETE ON core.attachments
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add comment
COMMENT ON TABLE core.attachments IS 'Table contenant les métadonnées des fichiers joints aux différents objets du système (tickets, articles de connaissance, etc.)';

-- Commit transaction
COMMIT;
