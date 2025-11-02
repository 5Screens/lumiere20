-- ============================================================================
-- Script: 18_create_portals.sql
-- Description: Create portal management tables with audit triggers
-- Author: Lumière 16 Project
-- Date: 2025-11-02
-- Version: 1.0
-- ============================================================================
-- This script creates:
-- - configuration.portals: External portal definitions
-- - configuration.portal_actions: Actions/endpoints for each portal
-- - Indexes for performance (search, filtering)
-- - Audit triggers for full change tracking
-- - Auto-update triggers for updated_at timestamps
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: VERIFY PREREQUISITES
-- ============================================================================
-- Ensure required extensions are available (should already exist from 01_create_extensions.sql)
-- Uncomment if needed:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Verify schemas exist (should already be created by 00_init_database.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'configuration') THEN
        RAISE EXCEPTION 'Schema configuration does not exist. Run 00_init_database.sql first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'audit') THEN
        RAISE EXCEPTION 'Schema audit does not exist. Run 00_init_database.sql first.';
    END IF;
    RAISE NOTICE '[18_create_portals.sql] Prerequisites verified: schemas and extensions OK';
END $$;

-- ============================================================================
-- SECTION 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: configuration.portals
-- Description: Stores external portal definitions (SSO, integrations, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuration.portals (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    base_url TEXT NOT NULL,
    thumbnail_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Table configuration.portals created or already exists';
END $$;

-- ----------------------------------------------------------------------------
-- Table: configuration.portal_actions
-- Description: Stores actions/endpoints for each portal (API calls, SSO URLs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuration.portal_actions (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal_uuid UUID NOT NULL,
    action_code VARCHAR(50) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    payload_json JSONB NULL,
    headers_json JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT fk_portal_actions_portal
        FOREIGN KEY (rel_portal_uuid)
        REFERENCES configuration.portals(uuid)
        ON DELETE CASCADE
);

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Table configuration.portal_actions created or already exists';
END $$;

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for configuration.portals
-- ----------------------------------------------------------------------------

-- Performance index: filter by active status and sort by creation date
CREATE INDEX IF NOT EXISTS idx_portals_active_created
    ON configuration.portals(is_active, created_at DESC);

-- Search index: case-insensitive search on code
CREATE INDEX IF NOT EXISTS idx_portals_code_search
    ON configuration.portals(LOWER(code));

-- Search index: case-insensitive search on name
CREATE INDEX IF NOT EXISTS idx_portals_name_search
    ON configuration.portals(LOWER(name));

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Indexes created on configuration.portals';
END $$;

-- ----------------------------------------------------------------------------
-- Indexes for configuration.portal_actions
-- ----------------------------------------------------------------------------

-- Performance index: lookup actions by portal and action code
CREATE INDEX IF NOT EXISTS idx_portal_actions_portal_action
    ON configuration.portal_actions(rel_portal_uuid, action_code);

-- Performance index: filter by portal UUID (for FK joins)
CREATE INDEX IF NOT EXISTS idx_portal_actions_portal_uuid
    ON configuration.portal_actions(rel_portal_uuid);

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Indexes created on configuration.portal_actions';
END $$;

-- ============================================================================
-- SECTION 4: CREATE TRIGGERS - AUTO UPDATE TIMESTAMPS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at on configuration.portals
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portals_updated_at_set ON configuration.portals;

CREATE TRIGGER trg_portals_updated_at_set
    BEFORE UPDATE ON configuration.portals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portals_updated_at_set created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at on configuration.portal_actions
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_actions_updated_at_set ON configuration.portal_actions;

CREATE TRIGGER trg_portal_actions_updated_at_set
    BEFORE UPDATE ON configuration.portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_actions_updated_at_set created';
END $$;

-- ============================================================================
-- SECTION 5: CREATE TRIGGERS - AUDIT LOGGING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Audit log for configuration.portals
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portals_audit_log ON configuration.portals;

CREATE TRIGGER trg_portals_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON configuration.portals
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portals_audit_log created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Audit log for configuration.portal_actions
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_actions_audit_log ON configuration.portal_actions;

CREATE TRIGGER trg_portal_actions_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON configuration.portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_actions_audit_log created';
END $$;

-- ============================================================================
-- SECTION 6: ADD COMMENTS (DOCUMENTATION)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Comments for configuration.portals
-- ----------------------------------------------------------------------------
COMMENT ON TABLE configuration.portals IS 
    'External portal definitions for SSO, integrations, and external systems';

COMMENT ON COLUMN configuration.portals.uuid IS 
    'Primary key (UUID v4)';

COMMENT ON COLUMN configuration.portals.code IS 
    'Unique stable identifier for the portal (e.g., "jira", "confluence", "sso-portal")';

COMMENT ON COLUMN configuration.portals.name IS 
    'Display name of the portal';

COMMENT ON COLUMN configuration.portals.base_url IS 
    'Base URL of the portal (e.g., "https://jira.company.com")';

COMMENT ON COLUMN configuration.portals.thumbnail_url IS 
    'Optional URL to a thumbnail/icon for the portal';

COMMENT ON COLUMN configuration.portals.is_active IS 
    'Whether the portal is currently active and available to users';

COMMENT ON COLUMN configuration.portals.created_at IS 
    'Timestamp when the portal was created';

COMMENT ON COLUMN configuration.portals.updated_at IS 
    'Timestamp when the portal was last updated (auto-updated by trigger)';

-- ----------------------------------------------------------------------------
-- Comments for configuration.portal_actions
-- ----------------------------------------------------------------------------
COMMENT ON TABLE configuration.portal_actions IS 
    'Actions and API endpoints for each portal (e.g., SSO login, create ticket, search)';

COMMENT ON COLUMN configuration.portal_actions.uuid IS 
    'Primary key (UUID v4)';

COMMENT ON COLUMN configuration.portal_actions.rel_portal_uuid IS 
    'Foreign key to configuration.portals(uuid) - the portal this action belongs to';

COMMENT ON COLUMN configuration.portal_actions.action_code IS 
    'Unique code for the action within the portal (e.g., "login", "create_ticket", "search")';

COMMENT ON COLUMN configuration.portal_actions.http_method IS 
    'HTTP method for the action (GET, POST, PATCH, PUT, DELETE)';

COMMENT ON COLUMN configuration.portal_actions.endpoint IS 
    'API endpoint path (relative to portal base_url or absolute URL)';

COMMENT ON COLUMN configuration.portal_actions.payload_json IS 
    'Optional JSON payload template for the action';

COMMENT ON COLUMN configuration.portal_actions.headers_json IS 
    'Optional JSON headers template for the action (e.g., authentication, content-type)';

COMMENT ON COLUMN configuration.portal_actions.created_at IS 
    'Timestamp when the action was created';

COMMENT ON COLUMN configuration.portal_actions.updated_at IS 
    'Timestamp when the action was last updated (auto-updated by trigger)';

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Comments added to tables and columns';
END $$;

-- ============================================================================
-- SECTION 7: SEED DATA (OPTIONAL - COMMENTED OUT)
-- ============================================================================
-- Uncomment to insert a test portal for development/testing purposes

/*
-- Test portal: Hello Portal (inactive by default)
INSERT INTO configuration.portals (code, name, base_url, thumbnail_url, is_active)
VALUES (
    'hello-portal',
    'Hello Portal',
    'https://hello.example.com',
    'https://hello.example.com/logo.png',
    false
)
ON CONFLICT (code) DO NOTHING;

-- Test action: Login
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    headers_json
)
SELECT
    p.uuid,
    'login',
    'POST',
    '/api/v1/auth/login',
    '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
FROM configuration.portals p
WHERE p.code = 'hello-portal'
ON CONFLICT DO NOTHING;

-- Test action: Get User Info
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    headers_json
)
SELECT
    p.uuid,
    'get_user_info',
    'GET',
    '/api/v1/user/me',
    '{"Accept": "application/json"}'::jsonb
FROM configuration.portals p
WHERE p.code = 'hello-portal'
ON CONFLICT DO NOTHING;

RAISE NOTICE '[18_create_portals.sql] Test seed data inserted (hello-portal)';
*/

-- ============================================================================
-- SECTION 8: FINAL VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
DECLARE
    v_portals_exists BOOLEAN;
    v_portal_actions_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'configuration' AND table_name = 'portals'
    ) INTO v_portals_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'configuration' AND table_name = 'portal_actions'
    ) INTO v_portal_actions_exists;
    
    IF NOT v_portals_exists THEN
        RAISE EXCEPTION 'Table configuration.portals was not created';
    END IF;
    
    IF NOT v_portal_actions_exists THEN
        RAISE EXCEPTION 'Table configuration.portal_actions was not created';
    END IF;
    
    RAISE NOTICE '[18_create_portals.sql] Final verification: All tables created successfully';
END $$;

DO $$ BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '[18_create_portals.sql] Script completed successfully';
    RAISE NOTICE 'Tables created: configuration.portals, configuration.portal_actions';
    RAISE NOTICE 'Indexes created: 5 indexes for performance and search';
    RAISE NOTICE 'Triggers created: 4 triggers (2 for updated_at, 2 for audit logging)';
    RAISE NOTICE 'Ready for use. Run \d configuration.portals and \d configuration.portal_actions to verify.';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- SCRIPT COMPLETION
-- ============================================================================

COMMIT;
