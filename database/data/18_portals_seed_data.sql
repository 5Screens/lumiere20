-- ============================================================================
-- Script: 18_portals_seed_data.sql
-- Description: Insert test data for portal management system
-- Author: Lumière 16 Project
-- Date: 2025-11-02
-- Version: 1.0
-- ============================================================================
-- This script inserts:
-- - Demo portal for testing the Portal Runner application
-- - Actions configured to work with the Lumière API
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: INSERT TEST PORTALS
-- ============================================================================

-- Portal 1: Demo Portal (Active)
-- Purpose: Test portal for Portal Runner application
INSERT INTO configuration.portals (code, name, base_url, thumbnail_url, is_active)
VALUES (
    'demo-portal',
    'Demo Portal - Création de Tickets',
    'http://localhost:7240',
    NULL,
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Portal 2: Support Portal (Active)
-- Purpose: Portal for end-user ticket creation
INSERT INTO configuration.portals (code, name, base_url, thumbnail_url, is_active)
VALUES (
    'support-portal',
    'Portail Support Utilisateurs',
    'http://localhost:7240',
    NULL,
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Portal 3: Admin Portal (Inactive)
-- Purpose: Administrative portal (disabled for testing)
INSERT INTO configuration.portals (code, name, base_url, thumbnail_url, is_active)
VALUES (
    'admin-portal',
    'Portail Administration',
    'http://localhost:7240',
    NULL,
    false
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- ============================================================================
-- SECTION 2: INSERT PORTAL ACTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Actions for demo-portal
-- ----------------------------------------------------------------------------

-- Action: Create Task
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json
)
SELECT
    p.uuid,
    'CREATE_TASK',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'TASK',
        'ticket_status_code', 'NEW',
        'title', 'Nouvelle tâche depuis le portail',
        'description', 'Cette tâche a été créée via le portail de démonstration',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    )
FROM configuration.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- Action: Create Incident
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json
)
SELECT
    p.uuid,
    'CREATE_INCIDENT',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'INCIDENT',
        'ticket_status_code', 'NEW',
        'title', 'Nouvel incident depuis le portail',
        'description', 'Cet incident a été créé via le portail de démonstration',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    )
FROM configuration.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Actions for support-portal
-- ----------------------------------------------------------------------------

-- Action: Create Support Request
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json
)
SELECT
    p.uuid,
    'CREATE_SUPPORT_REQUEST',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'TASK',
        'ticket_status_code', 'NEW',
        'title', 'Demande de support utilisateur',
        'description', 'Demande créée depuis le portail support',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    )
FROM configuration.portals p
WHERE p.code = 'support-portal'
ON CONFLICT DO NOTHING;

-- Action: Report Problem
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json
)
SELECT
    p.uuid,
    'REPORT_PROBLEM',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'PROBLEM',
        'ticket_status_code', 'NEW',
        'title', 'Signalement de problème',
        'description', 'Problème signalé depuis le portail support',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    )
FROM configuration.portals p
WHERE p.code = 'support-portal'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Actions for admin-portal (inactive portal)
-- ----------------------------------------------------------------------------

-- Action: Admin Task
INSERT INTO configuration.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json
)
SELECT
    p.uuid,
    'ADMIN_TASK',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'TASK',
        'ticket_status_code', 'NEW',
        'title', 'Tâche administrative',
        'description', 'Tâche créée depuis le portail admin (désactivé)',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    )
FROM configuration.portals p
WHERE p.code = 'admin-portal'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_portal_count INTEGER;
    v_action_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_portal_count FROM configuration.portals;
    SELECT COUNT(*) INTO v_action_count FROM configuration.portal_actions;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '[18_portals_seed_data.sql] Seed data inserted successfully';
    RAISE NOTICE 'Total portals: %', v_portal_count;
    RAISE NOTICE 'Total actions: %', v_action_count;
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Active portals:';
    RAISE NOTICE '  - demo-portal: http://localhost:7240/demo-portal';
    RAISE NOTICE '  - support-portal: http://localhost:7240/support-portal';
    RAISE NOTICE 'Inactive portals:';
    RAISE NOTICE '  - admin-portal (disabled for testing)';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- SCRIPT COMPLETION
-- ============================================================================

COMMIT;
