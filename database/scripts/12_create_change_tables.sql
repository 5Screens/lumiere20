-- Script: 12_create_change_tables.sql
-- Description: Création des tables nécessaires à la gestion des changements
-- Date: 2025-04-16

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- 1. Create change_questions_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'change_questions_codes') THEN
        DROP TABLE configuration.change_questions_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.change_questions_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    question_id VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create change_questions_labels table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'change_questions_labels') THEN
        DROP TABLE translations.change_questions_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.change_questions_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_change_question_code VARCHAR(50) NOT NULL REFERENCES configuration.change_questions_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_change_question_code, lang)
);

-- 3. Create change_options_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'change_options_codes') THEN
        DROP TABLE configuration.change_options_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.change_options_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    question_id VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    weight INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create change_options_labels table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'change_options_labels') THEN
        DROP TABLE translations.change_options_labels CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.change_options_labels (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_change_option_code VARCHAR(50) NOT NULL REFERENCES configuration.change_options_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_change_option_code, lang)
);

-- 5. Create change_setup_codes table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'configuration' AND tablename = 'change_setup_codes') THEN
        DROP TABLE configuration.change_setup_codes CASCADE;
    END IF;
END
$$;

CREATE TABLE configuration.change_setup_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata VARCHAR(50),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create change_setup_label table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'translations' AND tablename = 'change_setup_label') THEN
        DROP TABLE translations.change_setup_label CASCADE;
    END IF;
END
$$;

CREATE TABLE translations.change_setup_label (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_change_setup_code VARCHAR(50) NOT NULL REFERENCES configuration.change_setup_codes(code) ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_change_setup_code, lang)
);

-- Add audit triggers
-- Trigger for change_questions_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_questions_codes') THEN
        DROP TRIGGER audit_change_questions_codes ON configuration.change_questions_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_change_questions_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.change_questions_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for change_questions_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_questions_labels') THEN
        DROP TRIGGER audit_change_questions_labels ON translations.change_questions_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_change_questions_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.change_questions_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for change_options_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_options_codes') THEN
        DROP TRIGGER audit_change_options_codes ON configuration.change_options_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_change_options_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.change_options_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for change_options_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_options_labels') THEN
        DROP TRIGGER audit_change_options_labels ON translations.change_options_labels;
    END IF;
END
$$;

CREATE TRIGGER audit_change_options_labels
AFTER INSERT OR UPDATE OR DELETE ON translations.change_options_labels
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for change_setup_codes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_setup_codes') THEN
        DROP TRIGGER audit_change_setup_codes ON configuration.change_setup_codes;
    END IF;
END
$$;

CREATE TRIGGER audit_change_setup_codes
AFTER INSERT OR UPDATE OR DELETE ON configuration.change_setup_codes
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Trigger for change_setup_label
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_change_setup_label') THEN
        DROP TRIGGER audit_change_setup_label ON translations.change_setup_label;
    END IF;
END
$$;

CREATE TRIGGER audit_change_setup_label
AFTER INSERT OR UPDATE OR DELETE ON translations.change_setup_label
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add comments
COMMENT ON TABLE configuration.change_questions_codes IS 'Table stockant les codes des questions de changement';
COMMENT ON COLUMN configuration.change_questions_codes.metadata IS 'Code de métadonnées';
COMMENT ON COLUMN configuration.change_questions_codes.question_id IS 'Identifiant de la question';
COMMENT ON COLUMN configuration.change_questions_codes.code IS 'Code unique identifiant la question';

COMMENT ON TABLE translations.change_questions_labels IS 'Table stockant les traductions des questions de changement';
COMMENT ON COLUMN translations.change_questions_labels.rel_change_question_code IS 'Référence au code de la question de changement';
COMMENT ON COLUMN translations.change_questions_labels.lang IS 'Code de langue pour la traduction';
COMMENT ON COLUMN translations.change_questions_labels.label IS 'Libellé traduit pour la question de changement';

COMMENT ON TABLE configuration.change_options_codes IS 'Table stockant les codes des options de changement';
COMMENT ON COLUMN configuration.change_options_codes.metadata IS 'Code de métadonnées';
COMMENT ON COLUMN configuration.change_options_codes.question_id IS 'Identifiant de la question associée';
COMMENT ON COLUMN configuration.change_options_codes.code IS 'Code unique identifiant l''option';
COMMENT ON COLUMN configuration.change_options_codes.weight IS 'Poids numérique associé à l''option';

COMMENT ON TABLE translations.change_options_labels IS 'Table stockant les traductions des options de changement';
COMMENT ON COLUMN translations.change_options_labels.rel_change_option_code IS 'Référence au code de l''option de changement';
COMMENT ON COLUMN translations.change_options_labels.lang IS 'Code de langue pour la traduction';
COMMENT ON COLUMN translations.change_options_labels.label IS 'Libellé traduit pour l''option de changement';

COMMENT ON TABLE configuration.change_setup_codes IS 'Table stockant les codes de configuration de changement';
COMMENT ON COLUMN configuration.change_setup_codes.metadata IS 'Code de métadonnées';
COMMENT ON COLUMN configuration.change_setup_codes.code IS 'Code unique identifiant la configuration';

COMMENT ON TABLE translations.change_setup_label IS 'Table stockant les traductions des configurations de changement';
COMMENT ON COLUMN translations.change_setup_label.rel_change_setup_code IS 'Référence au code de la configuration de changement';
COMMENT ON COLUMN translations.change_setup_label.lang IS 'Code de langue pour la traduction';
COMMENT ON COLUMN translations.change_setup_label.label IS 'Libellé traduit pour la configuration de changement';

-- Commit transaction
COMMIT;
