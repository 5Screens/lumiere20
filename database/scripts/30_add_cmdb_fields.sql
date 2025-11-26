-- Script: 30_add_cmdb_fields.sql
-- Description: Add ci_type and extended_core_fields to configuration_items table
-- Date: 2025-11-21

BEGIN;

-- Add ci_type column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'data' 
        AND table_name = 'configuration_items' 
        AND column_name = 'ci_type'
    ) THEN
        ALTER TABLE data.configuration_items 
        ADD COLUMN ci_type VARCHAR(50) DEFAULT 'GENERIC';
    END IF;
END $$;

-- Add extended_core_fields column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'data' 
        AND table_name = 'configuration_items' 
        AND column_name = 'extended_core_fields'
    ) THEN
        ALTER TABLE data.configuration_items 
        ADD COLUMN extended_core_fields JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index on ci_type
CREATE INDEX IF NOT EXISTS idx_ci_type 
ON data.configuration_items (ci_type);

-- Create GIN index on JSONB for fast search
CREATE INDEX IF NOT EXISTS idx_ci_extended_fields_gin 
ON data.configuration_items USING GIN (extended_core_fields);

-- Update existing records with default ci_type
UPDATE data.configuration_items 
SET ci_type = 'GENERIC' 
WHERE ci_type IS NULL;

-- Make ci_type NOT NULL
ALTER TABLE data.configuration_items 
ALTER COLUMN ci_type SET NOT NULL;

COMMIT;
