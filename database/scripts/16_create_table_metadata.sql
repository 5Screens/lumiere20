-- =====================================================
-- Script: 16_create_table_metadata.sql
-- Description: Create administration schema and table_metadata table for dynamic filtering
--              Includes multilingual support columns
-- Author: System
-- Date: 2024-09-24
-- Updated: 2025-10-21 - Added multilingual support
-- =====================================================

BEGIN;

-- Drop table if exists to recreate from scratch
DROP TABLE IF EXISTS administration.table_metadata CASCADE;

-- Create administration schema if not exists
CREATE SCHEMA IF NOT EXISTS administration;

-- Create table_metadata table
CREATE TABLE administration.table_metadata (
    -- Primary key
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Table identification
    table_name VARCHAR(50) NOT NULL,
    object_name VARCHAR(50), -- Object name for end-user (e.g., "Person", "Task")
    table_label VARCHAR(100), -- Display name in UI (e.g., "Users" for "users")
    table_description TEXT, -- Table description
    
    -- Column identification (NULL if row describes the table itself)
    column_name VARCHAR(50),
    column_label VARCHAR(100), -- Display name in UI
    column_description TEXT, -- Column description
    
    -- Data type information
    data_type VARCHAR(20), -- "string", "number", "boolean", "date", "datetime", "json", etc.
    data_is_nullable BOOLEAN DEFAULT TRUE, -- Does the column accept NULL?
    data_default_value TEXT, -- Default value (e.g., "CURRENT_TIMESTAMP" for dates)
    
    -- Display properties
    data_is_visible BOOLEAN DEFAULT TRUE, -- Is the column visible in views?
    data_is_sortable BOOLEAN DEFAULT FALSE, -- Can we sort on this column?
    data_is_filterable BOOLEAN DEFAULT FALSE, -- Is the column filterable?
    
    -- Filter configuration (if data_is_filterable = TRUE)
    filter_type VARCHAR(20), -- "checkbox", "search", "date_range", "select", etc.
    filter_options JSONB, -- Filter-specific options (e.g., {"minChars": 2, "debounce": 300})
    
    -- Relationships with other tables (foreign keys)
    is_foreign_key BOOLEAN DEFAULT FALSE,
    related_table VARCHAR(50), -- Related table (e.g., "departments" for a "department_id" column)
    related_column VARCHAR(50), -- Related column (e.g., "id")
    
    -- Multilingual support (added 2025-10-21)
    is_multilang BOOLEAN DEFAULT FALSE, -- Is this column multilingual?
    related_translation_table VARCHAR(100), -- Translation table (e.g., "translations.ticket_status_translation")
    translation_foreign_key VARCHAR(50), -- Foreign key column in translation table (e.g., "ticket_status_uuid")
    translation_label_column VARCHAR(50) DEFAULT 'label', -- Column containing the translated label
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Form configuration
    form_field_type VARCHAR(50), -- "sTextField", "sSelectField", "sRichTextEditor", etc.
    form_placeholder TEXT, -- Help text or placeholder
    form_required BOOLEAN DEFAULT FALSE, -- Required field
    form_readonly BOOLEAN DEFAULT FALSE, -- Read-only field
    form_endpoint TEXT, -- API endpoint for dynamic fields (e.g., select)
    form_display_field TEXT, -- Field to display for selects
    form_value_field TEXT, -- Field to use as value for selects
    form_lazy_search BOOLEAN DEFAULT FALSE, -- If true, endpoint supports pagination (limit, offset, search)
    form_helper_text TEXT, -- Help text
    form_visible BOOLEAN DEFAULT TRUE, -- Visible in form
    form_order INTEGER DEFAULT 0, -- Display order in form
    
    -- For relationships (e.g., sFilteredSearchField)
    form_related_table VARCHAR(50), -- Related table
    form_columns_config JSONB, -- Column configuration for related tables
    
    -- For conditional fields
    form_visibility_condition TEXT -- Condition to display field (e.g., "status=Open")
);

-- Create indexes for performance
CREATE INDEX idx_table_metadata_table ON administration.table_metadata(table_name);
CREATE INDEX idx_table_metadata_column ON administration.table_metadata(column_name);
CREATE INDEX idx_table_metadata_filterable ON administration.table_metadata(table_name, column_name) 
    WHERE data_is_filterable = TRUE;
CREATE INDEX idx_table_metadata_sortable ON administration.table_metadata(table_name, column_name) 
    WHERE data_is_sortable = TRUE;

-- Add audit trigger
CREATE TRIGGER trg_audit_table_metadata
    AFTER INSERT OR UPDATE OR DELETE ON administration.table_metadata
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION administration.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_metadata_updated_at
    BEFORE UPDATE ON administration.table_metadata
    FOR EACH ROW
    EXECUTE FUNCTION administration.update_updated_at_column();

COMMIT;

-- Create role if not exists and grant permissions
DO $$
BEGIN
    -- Check if the role exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lumiere_user') THEN
        CREATE ROLE lumiere_user WITH LOGIN PASSWORD 'lumiere_password';
        RAISE NOTICE 'Role lumiere_user created';
    END IF;
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA administration TO lumiere_user;
    GRANT ALL PRIVILEGES ON TABLE administration.table_metadata TO lumiere_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA administration TO lumiere_user;
    
    -- Also grant to postgres user (the owner)
    GRANT USAGE ON SCHEMA administration TO postgres;
    GRANT ALL PRIVILEGES ON TABLE administration.table_metadata TO postgres;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA administration TO postgres;
    
    RAISE NOTICE 'Permissions granted successfully';
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error, just grant to postgres
        RAISE NOTICE 'Granting permissions to postgres user only: %', SQLERRM;
        GRANT USAGE ON SCHEMA administration TO postgres;
        GRANT ALL PRIVILEGES ON TABLE administration.table_metadata TO postgres;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA administration TO postgres;
END;
$$;
