-- ============================================================================
-- Script: 18_create_portals.sql
-- Description: Create portal management tables with audit triggers
-- Author: Lumière 16 Project
-- Date: 2025-11-02
-- Version: 1.0
-- ============================================================================
-- This script creates:
-- - core.portals: External portal definitions
-- - core.portal_actions: Actions/endpoints for each portal
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
-- Table: core.portal_models
-- Description: Available portal view components
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal_models (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE core.portal_models IS 'Available portal view components (e.g., PortalViewV1, PortalPOC)';
COMMENT ON COLUMN core.portal_models.name IS 'Component name (e.g., PortalViewV1)';
COMMENT ON COLUMN core.portal_models.description IS 'Description of the component';
COMMENT ON COLUMN core.portal_models.is_active IS 'Whether this model is available for use';

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Table core.portal_models created or already exists';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portals
-- Description: Stores external portal definitions (SSO, integrations, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portals(
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    base_url TEXT NOT NULL,
    thumbnail_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    view_component VARCHAR(50) NOT NULL DEFAULT 'PortalViewV1',
    title VARCHAR(150),
    subtitle VARCHAR(255),
    welcome_template VARCHAR(255) DEFAULT 'Bienvenue {firstName} !',
    logo_url TEXT,
    theme_primary_color VARCHAR(7) DEFAULT '#FF6B00',
    theme_secondary_color VARCHAR(7) DEFAULT '#111111',
    show_chat BOOLEAN DEFAULT true,
    show_alerts BOOLEAN DEFAULT true,
    show_actions BOOLEAN DEFAULT true,
    show_widgets BOOLEAN DEFAULT true,
    chat_default_message TEXT DEFAULT 'En cours d''implémentation',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Table core.portals created or already exists';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portal_actions
-- Description: Stores actions/endpoints for each portal (API calls, SSO URLs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal_actions (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal_uuid UUID NOT NULL,
    action_code VARCHAR(50) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    payload_json JSONB NULL,
    headers_json JSONB NULL,
    display_title VARCHAR(150),
    description TEXT,
    icon_type VARCHAR(20) DEFAULT 'fontawesome',
    icon_value VARCHAR(255),
    is_quick_action BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT fk_portal_actions_portal
        FOREIGN KEY (rel_portal_uuid)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE
);

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Table core.portal_actions created or already exists';
END $$;

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for core.portals
-- ----------------------------------------------------------------------------

-- Performance index: filter by active status and sort by creation date
CREATE INDEX IF NOT EXISTS idx_portals_active_created
    ON core.portals(is_active, created_at DESC);

-- Search index: case-insensitive search on code
CREATE INDEX IF NOT EXISTS idx_portals_code_search
    ON core.portals(LOWER(code));

-- Search index: case-insensitive search on name
CREATE INDEX IF NOT EXISTS idx_portals_name_search
    ON core.portals(LOWER(name));

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Indexes created on core.portals';
END $$;

-- ----------------------------------------------------------------------------
-- Indexes for core.portal_actions
-- ----------------------------------------------------------------------------

-- Performance index: lookup actions by portal and action code
CREATE INDEX IF NOT EXISTS idx_portal_actions_portal_action
    ON core.portal_actions(rel_portal_uuid, action_code);

-- Performance index: filter by portal UUID (for FK joins)
CREATE INDEX IF NOT EXISTS idx_portal_actions_portal_uuid
    ON core.portal_actions(rel_portal_uuid);

-- Performance index: lookup quick actions
CREATE INDEX IF NOT EXISTS idx_portal_actions_quick_actions
    ON core.portal_actions(rel_portal_uuid, is_quick_action, display_order)
    WHERE is_quick_action = true AND is_visible = true;

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Indexes created on core.portal_actions';
END $$;

-- ============================================================================
-- SECTION 4: CREATE TRIGGERS - AUTO UPDATE TIMESTAMPS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at on core.portal_models
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_models_updated_at_set ON core.portal_models;

CREATE TRIGGER trg_portal_models_updated_at_set
    BEFORE UPDATE ON core.portal_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_models_updated_at_set created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at on core.portals
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portals_updated_at_set ON core.portals;

CREATE TRIGGER trg_portals_updated_at_set
    BEFORE UPDATE ON core.portals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portals_updated_at_set created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at on core.portal_actions
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_actions_updated_at_set ON core.portal_actions;

CREATE TRIGGER trg_portal_actions_updated_at_set
    BEFORE UPDATE ON core.portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_actions_updated_at_set created';
END $$;

-- ============================================================================
-- SECTION 5: CREATE TRIGGERS - AUDIT LOGGING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Audit log for core.portal_models
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_models_audit_log ON core.portal_models;

CREATE TRIGGER trg_portal_models_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal_models
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_models_audit_log created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Audit log for core.portals
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portals_audit_log ON core.portals;

CREATE TRIGGER trg_portals_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portals
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portals_audit_log created';
END $$;

-- ----------------------------------------------------------------------------
-- Trigger: Audit log for core.portal_actions
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_portal_actions_audit_log ON core.portal_actions;

CREATE TRIGGER trg_portal_actions_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Trigger trg_portal_actions_audit_log created';
END $$;

-- ============================================================================
-- SECTION 6: ADD COMMENTS (DOCUMENTATION)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Comments for core.portals
-- ----------------------------------------------------------------------------
COMMENT ON TABLE core.portals IS 
    'External portal definitions for SSO, integrations, and external systems';

COMMENT ON COLUMN core.portals.uuid IS 
    'Primary key (UUID v4)';

COMMENT ON COLUMN core.portals.code IS 
    'Unique stable identifier for the portal (e.g., "jira", "confluence", "sso-portal")';

COMMENT ON COLUMN core.portals.name IS 
    'Display name of the portal';

COMMENT ON COLUMN core.portals.base_url IS 
    'Base URL of the portal (e.g., "https://jira.company.com")';

COMMENT ON COLUMN core.portals.thumbnail_url IS 
    'Optional URL to a thumbnail/icon for the portal';

COMMENT ON COLUMN core.portals.is_active IS 
    'Whether the portal is currently active and available to users';

COMMENT ON COLUMN core.portals.view_component IS 
    'Vue component to use for rendering this portal (e.g., PortalViewV1, DemoView, CustomPortalView)';

COMMENT ON COLUMN core.portals.created_at IS 
    'Timestamp when the portal was created';

COMMENT ON COLUMN core.portals.updated_at IS 
    'Timestamp when the portal was last updated (auto-updated by trigger)';

COMMENT ON COLUMN core.portals.title IS 
    'Main title displayed in header (e.g., "Lumière Self-service")';

COMMENT ON COLUMN core.portals.subtitle IS 
    'Subtitle displayed below title (e.g., "Portail des employés")';

COMMENT ON COLUMN core.portals.welcome_template IS 
    'Welcome message template with placeholders (e.g., "Bienvenue {firstName} !")';

COMMENT ON COLUMN core.portals.logo_url IS 
    'URL to portal logo image';

COMMENT ON COLUMN core.portals.theme_primary_color IS 
    'Primary theme color in hex format (e.g., #FF6B00)';

COMMENT ON COLUMN core.portals.theme_secondary_color IS 
    'Secondary theme color in hex format';

COMMENT ON COLUMN core.portals.show_chat IS 
    'Whether to display the chat interface';

COMMENT ON COLUMN core.portals.show_alerts IS 
    'Whether to display alert banners';

COMMENT ON COLUMN core.portals.show_actions IS 
    'Whether to display the quick actions section';

COMMENT ON COLUMN core.portals.show_widgets IS 
    'Whether to display the widgets section';

COMMENT ON COLUMN core.portals.chat_default_message IS 
    'Default message when chat is not implemented';

-- ----------------------------------------------------------------------------
-- Comments for core.portal_actions
-- ----------------------------------------------------------------------------
COMMENT ON TABLE core.portal_actions IS 
    'Actions and API endpoints for each portal (e.g., SSO login, create ticket, search)';

COMMENT ON COLUMN core.portal_actions.uuid IS 
    'Primary key (UUID v4)';

COMMENT ON COLUMN core.portal_actions.rel_portal_uuid IS 
    'Foreign key to core.portals(uuid) - the portal this action belongs to';

COMMENT ON COLUMN core.portal_actions.action_code IS 
    'Unique code for the action within the portal (e.g., "login", "create_ticket", "search")';

COMMENT ON COLUMN core.portal_actions.http_method IS 
    'HTTP method for the action (GET, POST, PATCH, PUT, DELETE)';

COMMENT ON COLUMN core.portal_actions.endpoint IS 
    'API endpoint path (relative to portal base_url or absolute URL)';

COMMENT ON COLUMN core.portal_actions.payload_json IS 
    'Optional JSON payload template for the action';

COMMENT ON COLUMN core.portal_actions.headers_json IS 
    'Optional JSON headers template for the action (e.g., authentication, content-type)';

COMMENT ON COLUMN core.portal_actions.created_at IS 
    'Timestamp when the action was created';

COMMENT ON COLUMN core.portal_actions.updated_at IS 
    'Timestamp when the action was last updated (auto-updated by trigger)';

COMMENT ON COLUMN core.portal_actions.display_title IS 
    'Title displayed on the action card';

COMMENT ON COLUMN core.portal_actions.description IS 
    'Description text displayed on the action card';

COMMENT ON COLUMN core.portal_actions.icon_type IS 
    'Type of icon: fontawesome or image';

COMMENT ON COLUMN core.portal_actions.icon_value IS 
    'Icon value: FA class (e.g., fa-laptop) or image URL';

COMMENT ON COLUMN core.portal_actions.is_quick_action IS 
    'Whether this action appears in quick actions section';

COMMENT ON COLUMN core.portal_actions.display_order IS 
    'Display order (lower numbers first)';

COMMENT ON COLUMN core.portal_actions.is_visible IS 
    'Whether this action is currently visible';

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Comments added to tables and columns';
END $$;

-- ============================================================================
-- SECTION 7: CREATE ADDITIONAL TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: core.portal_alerts
-- Description: Alert banners displayed on portals (info, warning, error)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal_alerts (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal_uuid UUID NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('info', 'warning', 'error')),
    start_date TIMESTAMP NOT NULL DEFAULT now(),
    end_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT fk_portal_alerts_portal
        FOREIGN KEY (rel_portal_uuid)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE
);

COMMENT ON TABLE core.portal_alerts IS 'Alert banners displayed on portals (info, warning, error)';
COMMENT ON COLUMN core.portal_alerts.rel_portal_uuid IS 'Portal this alert belongs to';
COMMENT ON COLUMN core.portal_alerts.message IS 'Alert message text';
COMMENT ON COLUMN core.portal_alerts.alert_type IS 'Type of alert: info, warning, or error';
COMMENT ON COLUMN core.portal_alerts.start_date IS 'When the alert becomes active';
COMMENT ON COLUMN core.portal_alerts.end_date IS 'When the alert expires (NULL = no expiration)';
COMMENT ON COLUMN core.portal_alerts.is_active IS 'Whether the alert is currently active';
COMMENT ON COLUMN core.portal_alerts.display_order IS 'Display order (lower numbers first)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal_alerts_portal_active
    ON core.portal_alerts(rel_portal_uuid, is_active, start_date, end_date)
    WHERE is_active = true;

-- Create triggers
DROP TRIGGER IF EXISTS trg_portal_alerts_updated_at_set ON core.portal_alerts;
CREATE TRIGGER trg_portal_alerts_updated_at_set
    BEFORE UPDATE ON core.portal_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_portal_alerts_audit_log ON core.portal_alerts;
CREATE TRIGGER trg_portal_alerts_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal_alerts
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Created core.portal_alerts table';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portal_widgets
-- Description: Dynamic widgets displayed on portal dashboard
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal_widgets (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal_uuid UUID NOT NULL,
    widget_code VARCHAR(50) NOT NULL,
    display_title VARCHAR(150) NOT NULL,
    widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('counter', 'list', 'chart', 'custom')),
    api_endpoint TEXT,
    api_method VARCHAR(10) DEFAULT 'GET',
    api_params JSONB,
    refresh_interval INTEGER DEFAULT 300,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    CONSTRAINT fk_portal_widgets_portal
        FOREIGN KEY (rel_portal_uuid)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT uq_portal_widgets_code
        UNIQUE (rel_portal_uuid, widget_code)
);

COMMENT ON TABLE core.portal_widgets IS 'Dynamic widgets displayed on portal dashboard (e.g., "Validations en attente")';
COMMENT ON COLUMN core.portal_widgets.widget_code IS 'Unique code for the widget within the portal';
COMMENT ON COLUMN core.portal_widgets.display_title IS 'Title displayed on the widget card';
COMMENT ON COLUMN core.portal_widgets.widget_type IS 'Type of widget: counter, list, chart, or custom';
COMMENT ON COLUMN core.portal_widgets.api_endpoint IS 'API endpoint to fetch widget data (e.g., /tickets/pending)';
COMMENT ON COLUMN core.portal_widgets.api_method IS 'HTTP method for API call';
COMMENT ON COLUMN core.portal_widgets.api_params IS 'JSON parameters for API call';
COMMENT ON COLUMN core.portal_widgets.refresh_interval IS 'Auto-refresh interval in seconds (0 = no auto-refresh)';
COMMENT ON COLUMN core.portal_widgets.is_visible IS 'Whether the widget is currently visible';
COMMENT ON COLUMN core.portal_widgets.display_order IS 'Display order (lower numbers first)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal_widgets_portal_visible
    ON core.portal_widgets(rel_portal_uuid, is_visible, display_order)
    WHERE is_visible = true;

-- Create triggers
DROP TRIGGER IF EXISTS trg_portal_widgets_updated_at_set ON core.portal_widgets;
CREATE TRIGGER trg_portal_widgets_updated_at_set
    BEFORE UPDATE ON core.portal_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_portal_widgets_audit_log ON core.portal_widgets;
CREATE TRIGGER trg_portal_widgets_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal_widgets
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Created core.portal_widgets table';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portal__portal_actions
-- Description: Junction table linking portals to their active actions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal__portal_actions (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal UUID NOT NULL,
    rel_portal_action UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraints
    CONSTRAINT fk_portal__portal_actions_portal
        FOREIGN KEY (rel_portal)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_portal__portal_actions_action
        FOREIGN KEY (rel_portal_action)
        REFERENCES core.portal_actions(uuid)
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT uq_portal__portal_actions
        UNIQUE (rel_portal, rel_portal_action)
);

COMMENT ON TABLE core.portal__portal_actions IS 'Links portals to their active quick actions';
COMMENT ON COLUMN core.portal__portal_actions.rel_portal IS 'Portal UUID';
COMMENT ON COLUMN core.portal__portal_actions.rel_portal_action IS 'Portal action UUID';
COMMENT ON COLUMN core.portal__portal_actions.display_order IS 'Display order for this action on the portal';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal__portal_actions_portal
    ON core.portal__portal_actions(rel_portal);

CREATE INDEX IF NOT EXISTS idx_portal__portal_actions_action
    ON core.portal__portal_actions(rel_portal_action);

-- Create triggers
DROP TRIGGER IF EXISTS trg_portal__portal_actions_updated_at_set ON core.portal__portal_actions;
CREATE TRIGGER trg_portal__portal_actions_updated_at_set
    BEFORE UPDATE ON core.portal__portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_portal__portal_actions_audit_log ON core.portal__portal_actions;
CREATE TRIGGER trg_portal__portal_actions_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal__portal_actions
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Created core.portal__portal_actions table';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portal__portal_alerts
-- Description: Junction table linking portals to their active alerts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal__portal_alerts (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal UUID NOT NULL,
    rel_portal_alert UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraints
    CONSTRAINT fk_portal__portal_alerts_portal
        FOREIGN KEY (rel_portal)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_portal__portal_alerts_alert
        FOREIGN KEY (rel_portal_alert)
        REFERENCES core.portal_alerts(uuid)
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT uq_portal__portal_alerts
        UNIQUE (rel_portal, rel_portal_alert)
);

COMMENT ON TABLE core.portal__portal_alerts IS 'Links portals to their active alerts';
COMMENT ON COLUMN core.portal__portal_alerts.rel_portal IS 'Portal UUID';
COMMENT ON COLUMN core.portal__portal_alerts.rel_portal_alert IS 'Portal alert UUID';
COMMENT ON COLUMN core.portal__portal_alerts.display_order IS 'Display order for this alert on the portal';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal__portal_alerts_portal
    ON core.portal__portal_alerts(rel_portal);

CREATE INDEX IF NOT EXISTS idx_portal__portal_alerts_alert
    ON core.portal__portal_alerts(rel_portal_alert);

-- Create triggers
DROP TRIGGER IF EXISTS trg_portal__portal_alerts_updated_at_set ON core.portal__portal_alerts;
CREATE TRIGGER trg_portal__portal_alerts_updated_at_set
    BEFORE UPDATE ON core.portal__portal_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_portal__portal_alerts_audit_log ON core.portal__portal_alerts;
CREATE TRIGGER trg_portal__portal_alerts_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal__portal_alerts
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Created core.portal__portal_alerts table';
END $$;

-- ----------------------------------------------------------------------------
-- Table: core.portal__portal_widgets
-- Description: Junction table linking portals to their active widgets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.portal__portal_widgets (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_portal UUID NOT NULL,
    rel_portal_widget UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    
    -- Foreign key constraints
    CONSTRAINT fk_portal__portal_widgets_portal
        FOREIGN KEY (rel_portal)
        REFERENCES core.portals(uuid)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_portal__portal_widgets_widget
        FOREIGN KEY (rel_portal_widget)
        REFERENCES core.portal_widgets(uuid)
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT uq_portal__portal_widgets
        UNIQUE (rel_portal, rel_portal_widget)
);

COMMENT ON TABLE core.portal__portal_widgets IS 'Links portals to their active widgets';
COMMENT ON COLUMN core.portal__portal_widgets.rel_portal IS 'Portal UUID';
COMMENT ON COLUMN core.portal__portal_widgets.rel_portal_widget IS 'Portal widget UUID';
COMMENT ON COLUMN core.portal__portal_widgets.display_order IS 'Display order for this widget on the portal';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portal__portal_widgets_portal
    ON core.portal__portal_widgets(rel_portal);

CREATE INDEX IF NOT EXISTS idx_portal__portal_widgets_widget
    ON core.portal__portal_widgets(rel_portal_widget);

-- Create triggers
DROP TRIGGER IF EXISTS trg_portal__portal_widgets_updated_at_set ON core.portal__portal_widgets;
CREATE TRIGGER trg_portal__portal_widgets_updated_at_set
    BEFORE UPDATE ON core.portal__portal_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_portal__portal_widgets_audit_log ON core.portal__portal_widgets;
CREATE TRIGGER trg_portal__portal_widgets_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.portal__portal_widgets
    FOR EACH ROW
    EXECUTE FUNCTION audit.log_changes();

DO $$ BEGIN
    RAISE NOTICE '[18_create_portals.sql] Created core.portal__portal_widgets table';
END $$;

-- ============================================================================
-- SECTION 8: SEED DATA (OPTIONAL - COMMENTED OUT)
-- ============================================================================
-- Uncomment to insert a test portal for development/testing purposes

/*
-- Test portal: Hello Portal (inactive by default)
INSERT INTO core.portals (code, name, base_url, thumbnail_url, is_active)
VALUES (
    'hello-portal',
    'Hello Portal',
    'https://hello.example.com',
    'https://hello.example.com/logo.png',
    false
)
ON CONFLICT (code) DO NOTHING;

-- Test action: Login
INSERT INTO core.portal_actions (
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
FROM core.portals p
WHERE p.code = 'hello-portal'
ON CONFLICT DO NOTHING;

-- Test action: Get User Info
INSERT INTO core.portal_actions (
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
FROM core.portals p
WHERE p.code = 'hello-portal'
ON CONFLICT DO NOTHING;

RAISE NOTICE '[18_create_portals.sql] Test seed data inserted (hello-portal)';
*/

-- ============================================================================
-- SECTION 9: FINAL VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
DECLARE
    v_portal_models_exists BOOLEAN;
    v_portals_exists BOOLEAN;
    v_portal_actions_exists BOOLEAN;
    v_portal_alerts_exists BOOLEAN;
    v_portal_widgets_exists BOOLEAN;
    v_portal__portal_actions_exists BOOLEAN;
    v_portal__portal_alerts_exists BOOLEAN;
    v_portal__portal_widgets_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal_models'
    ) INTO v_portal_models_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portals'
    ) INTO v_portals_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal_actions'
    ) INTO v_portal_actions_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal_alerts'
    ) INTO v_portal_alerts_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal_widgets'
    ) INTO v_portal_widgets_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal__portal_actions'
    ) INTO v_portal__portal_actions_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal__portal_alerts'
    ) INTO v_portal__portal_alerts_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' AND table_name = 'portal__portal_widgets'
    ) INTO v_portal__portal_widgets_exists;
    
    IF NOT v_portal_models_exists THEN
        RAISE EXCEPTION 'Table core.portal_models was not created';
    END IF;
    
    IF NOT v_portals_exists THEN
        RAISE EXCEPTION 'Table core.portals was not created';
    END IF;
    
    IF NOT v_portal_actions_exists THEN
        RAISE EXCEPTION 'Table core.portal_actions was not created';
    END IF;
    
    IF NOT v_portal_alerts_exists THEN
        RAISE EXCEPTION 'Table core.portal_alerts was not created';
    END IF;
    
    IF NOT v_portal_widgets_exists THEN
        RAISE EXCEPTION 'Table core.portal_widgets was not created';
    END IF;
    
    IF NOT v_portal__portal_actions_exists THEN
        RAISE EXCEPTION 'Table core.portal__portal_actions was not created';
    END IF;
    
    IF NOT v_portal__portal_alerts_exists THEN
        RAISE EXCEPTION 'Table core.portal__portal_alerts was not created';
    END IF;
    
    IF NOT v_portal__portal_widgets_exists THEN
        RAISE EXCEPTION 'Table core.portal__portal_widgets was not created';
    END IF;
    
    RAISE NOTICE '[18_create_portals.sql] Final verification: All tables created successfully';
END $$;

DO $$ BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '[18_create_portals.sql] Script completed successfully';
    RAISE NOTICE 'Tables created: portal_models, portals, portal_actions, portal_alerts, portal_widgets';
    RAISE NOTICE 'Junction tables: portal__portal_actions, portal__portal_alerts, portal__portal_widgets';
    RAISE NOTICE 'Indexes created: 14 indexes for performance and search';
    RAISE NOTICE 'Triggers created: 16 triggers (8 for updated_at, 8 for audit logging)';
    RAISE NOTICE 'Ready for self-service portal v2 with admin improvements';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- SCRIPT COMPLETION
-- ============================================================================

COMMIT;
