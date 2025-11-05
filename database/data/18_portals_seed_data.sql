-- ============================================================================
-- Script: 18_portals_seed_data.sql
-- Description: Insert test data for portal management system (Self-Service v1)
-- Author: Lumière 16 Project
-- Date: 2025-11-05
-- Version: 2.0
-- ============================================================================
-- This script inserts:
-- - Enhanced portal configuration for employee self-service
-- - Quick actions with icons and descriptions
-- - Alert banners
-- - Dashboard widgets
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: INSERT TEST PORTALS
-- ============================================================================

-- Portal 1: Demo Portal (Active) - Self-Service v1
-- Purpose: Employee self-service portal with full v1 configuration
INSERT INTO core.portals (
    code, 
    name, 
    base_url, 
    thumbnail_url, 
    is_active,
    title,
    subtitle,
    welcome_template,
    logo_url,
    theme_primary_color,
    theme_secondary_color,
    show_chat,
    show_alerts,
    chat_default_message
)
VALUES (
    'demo-portal',
    'Demo Portal - Création de Tickets',
    'http://localhost:7240',
    NULL,
    true,
    'Lumière Self-service',
    'Portail des employés',
    'Bienvenue {firstName} !',
    NULL,
    '#FF6B00',
    '#111111',
    true,
    true,
    'En cours d''implémentation'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    welcome_template = EXCLUDED.welcome_template,
    logo_url = EXCLUDED.logo_url,
    theme_primary_color = EXCLUDED.theme_primary_color,
    theme_secondary_color = EXCLUDED.theme_secondary_color,
    show_chat = EXCLUDED.show_chat,
    show_alerts = EXCLUDED.show_alerts,
    chat_default_message = EXCLUDED.chat_default_message,
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
-- Actions for demo-portal (Quick Actions with v1 enhancements)
-- ----------------------------------------------------------------------------

-- Action 1: Demander l'accès à une application
INSERT INTO core.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json,
    display_title,
    description,
    icon_type,
    icon_value,
    is_quick_action,
    display_order,
    is_visible
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
    ),
    'Demander l''accès à une application',
    'Demandez l''accès à une nouvelle application ou service',
    'fontawesome',
    'fa-laptop',
    true,
    1,
    true
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- Action 2: Demander un matériel physique
INSERT INTO core.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json,
    display_title,
    description,
    icon_type,
    icon_value,
    is_quick_action,
    display_order,
    is_visible
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
    ),
    'Demander un matériel physique',
    'Demandez du matériel informatique (PC, écran, clavier, etc.)',
    'fontawesome',
    'fa-desktop',
    true,
    2,
    true
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- Action 3: JE N'ARRIVE PAS A ME CONNECTER
INSERT INTO core.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json,
    display_title,
    description,
    icon_type,
    icon_value,
    is_quick_action,
    display_order,
    is_visible
)
SELECT
    p.uuid,
    'REPORT_CONNECTION_ISSUE',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'INCIDENT',
        'ticket_status_code', 'NEW',
        'title', 'Problème de connexion',
        'description', 'Je n''arrive pas à me connecter',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    ),
    'JE N''ARRIVE PAS A ME CONNECTER',
    'Signalez un problème de connexion à votre compte ou application',
    'fontawesome',
    'fa-exclamation-triangle',
    true,
    3,
    true
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- Action 4: Autre demande
INSERT INTO core.portal_actions (
    rel_portal_uuid,
    action_code,
    http_method,
    endpoint,
    payload_json,
    headers_json,
    display_title,
    description,
    icon_type,
    icon_value,
    is_quick_action,
    display_order,
    is_visible
)
SELECT
    p.uuid,
    'OTHER_REQUEST',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'TASK',
        'ticket_status_code', 'NEW',
        'title', 'Autre demande',
        'description', 'Demande personnalisée',
        'writer_uuid', 'efd1c5ce-8ab0-446a-95cd-c8262217dff0',
        'requested_by_uuid', 'feabfba9-884b-4fe2-88ea-b53ca52cc10d',
        'requested_for_uuid', '1e65c43e-da9e-4592-a3a9-bef1cf2d52e2'
    ),
    jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
    ),
    'Autre demande',
    'Pour toute autre demande non listée ci-dessus',
    'fontawesome',
    'fa-question-circle',
    true,
    4,
    true
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Actions for support-portal
-- ----------------------------------------------------------------------------

-- Action: Create Support Request
INSERT INTO core.portal_actions (
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
FROM core.portals p
WHERE p.code = 'support-portal'
ON CONFLICT DO NOTHING;

-- Action: Report Problem
INSERT INTO core.portal_actions (
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
FROM core.portals p
WHERE p.code = 'support-portal'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Actions for admin-portal (inactive portal)
-- ----------------------------------------------------------------------------

-- Action: Admin Task
INSERT INTO core.portal_actions (
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
FROM core.portals p
WHERE p.code = 'admin-portal'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 3: INSERT PORTAL ALERTS
-- ============================================================================

-- Insert warning alert for maintenance (demo-portal)
INSERT INTO core.portal_alerts (
    rel_portal_uuid,
    message,
    alert_type,
    start_date,
    end_date,
    is_active,
    display_order
)
SELECT
    p.uuid,
    'ALERTE IMPORTANTE : INTERVENTION PROGRAMMÉE ! Porte : Samedi 9 novembre 2025 | Heure : de 23h00 à 3h00 | Service impacté : Accès VPN et messagerie Outlook.',
    'warning',
    '2025-11-05 00:00:00',
    '2025-11-10 00:00:00',
    true,
    1
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT DO NOTHING;

DO $$ BEGIN
    RAISE NOTICE '[18_portals_seed_data.sql] Inserted portal alerts';
END $$;

-- ============================================================================
-- SECTION 4: INSERT PORTAL WIDGETS
-- ============================================================================

-- Widget: Validations en attente (demo-portal)
INSERT INTO core.portal_widgets (
    rel_portal_uuid,
    widget_code,
    display_title,
    widget_type,
    api_endpoint,
    api_method,
    api_params,
    refresh_interval,
    is_visible,
    display_order
)
SELECT
    p.uuid,
    'PENDING_VALIDATIONS',
    'Validations en attente',
    'counter',
    '/api/v1/tickets/search/tasks',
    'POST',
    jsonb_build_object(
        'filters', jsonb_build_object(
            'mode', 'include',
            'operator', 'AND',
            'conditions', jsonb_build_array(
                jsonb_build_object(
                    'column', 'ticket_status_code',
                    'operator', 'equals',
                    'value', jsonb_build_array('PENDING_VALIDATION')
                )
            )
        ),
        'pagination', jsonb_build_object('page', 1, 'limit', 1)
    ),
    300,
    true,
    1
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT (rel_portal_uuid, widget_code) DO NOTHING;

-- Widget: Questions en attente (demo-portal)
INSERT INTO core.portal_widgets (
    rel_portal_uuid,
    widget_code,
    display_title,
    widget_type,
    api_endpoint,
    api_method,
    api_params,
    refresh_interval,
    is_visible,
    display_order
)
SELECT
    p.uuid,
    'PENDING_QUESTIONS',
    'Questions en attente',
    'counter',
    '/api/v1/tickets/search/tasks',
    'POST',
    jsonb_build_object(
        'filters', jsonb_build_object(
            'mode', 'include',
            'operator', 'AND',
            'conditions', jsonb_build_array(
                jsonb_build_object(
                    'column', 'ticket_status_code',
                    'operator', 'equals',
                    'value', jsonb_build_array('PENDING_USER_INFO')
                )
            )
        ),
        'pagination', jsonb_build_object('page', 1, 'limit', 1)
    ),
    300,
    true,
    2
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT (rel_portal_uuid, widget_code) DO NOTHING;

-- Widget: Notifications non lues (demo-portal)
INSERT INTO core.portal_widgets (
    rel_portal_uuid,
    widget_code,
    display_title,
    widget_type,
    api_endpoint,
    api_method,
    api_params,
    refresh_interval,
    is_visible,
    display_order
)
SELECT
    p.uuid,
    'UNREAD_NOTIFICATIONS',
    'Notifications non lues',
    'counter',
    '/api/v1/notifications/unread',
    'GET',
    NULL,
    60,
    true,
    3
FROM core.portals p
WHERE p.code = 'demo-portal'
ON CONFLICT (rel_portal_uuid, widget_code) DO NOTHING;

DO $$ BEGIN
    RAISE NOTICE '[18_portals_seed_data.sql] Inserted portal widgets';
END $$;

-- ============================================================================
-- SECTION 5: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_portal_count INTEGER;
    v_action_count INTEGER;
    v_alert_count INTEGER;
    v_widget_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_portal_count FROM core.portals;
    SELECT COUNT(*) INTO v_action_count FROM core.portal_actions;
    SELECT COUNT(*) INTO v_alert_count FROM core.portal_alerts;
    SELECT COUNT(*) INTO v_widget_count FROM core.portal_widgets;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '[18_portals_seed_data.sql] Seed data inserted successfully';
    RAISE NOTICE 'Total portals: %', v_portal_count;
    RAISE NOTICE 'Total actions: %', v_action_count;
    RAISE NOTICE 'Total alerts: %', v_alert_count;
    RAISE NOTICE 'Total widgets: %', v_widget_count;
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Active portals:';
    RAISE NOTICE '  - demo-portal: http://localhost:7240/demo-portal (Self-Service v1)';
    RAISE NOTICE '  - support-portal: http://localhost:7240/support-portal';
    RAISE NOTICE 'Inactive portals:';
    RAISE NOTICE '  - admin-portal (disabled for testing)';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- SCRIPT COMPLETION
-- ============================================================================

COMMIT;
