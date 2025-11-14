-- ============================================================================
-- Script: 18_portals_seed_data.sql
-- Description: Seed data for portal management tables
-- Author: Lumière 16 Project
-- Date: 2025-11-14
-- Version: 2.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 0: INSERT PORTAL MODELS
-- ============================================================================

INSERT INTO core.portal_models (name, description, is_active)
VALUES 
    ('PortalViewV1', 'Portal view version 1 with full features', true),
    ('PortalPOC', 'Proof of concept portal view', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- ============================================================================
-- SECTION 1: INSERT PORTALS
-- ============================================================================

-- Portal 1: Self-Service Lumière (main portal)
INSERT INTO core.portals (
    code,
    name,
    base_url,
    thumbnail_url,
    is_active,
    view_component,
    title,
    subtitle,
    welcome_template,
    logo_url,
    theme_primary_color,
    theme_secondary_color,
    show_chat,
    show_alerts,
    show_actions,
    show_widgets,
    chat_default_message
)
VALUES (
    'self-service-l',
    'Self-Service Lumière',
    'http://localhost:7240',
    NULL,
    true,
    'PortalViewV1',
    'Lumière Self-service',
    'Portail des employés',
    'Bienvenue {firstName} !',
    NULL,
    '#FF6B00',
    '#111111',
    true,
    true,
    true,
    true,
    'Assistant virtuel disponible 24/7'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    view_component = EXCLUDED.view_component,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    welcome_template = EXCLUDED.welcome_template,
    logo_url = EXCLUDED.logo_url,
    theme_primary_color = EXCLUDED.theme_primary_color,
    theme_secondary_color = EXCLUDED.theme_secondary_color,
    show_chat = EXCLUDED.show_chat,
    show_alerts = EXCLUDED.show_alerts,
    show_actions = EXCLUDED.show_actions,
    show_widgets = EXCLUDED.show_widgets,
    chat_default_message = EXCLUDED.chat_default_message,
    updated_at = now();

-- Portal 2: Self-Service Support (support portal)
INSERT INTO core.portals (
    code,
    name,
    base_url,
    thumbnail_url,
    is_active,
    view_component,
    title,
    subtitle,
    welcome_template,
    logo_url,
    theme_primary_color,
    theme_secondary_color,
    show_chat,
    show_alerts,
    show_actions,
    show_widgets,
    chat_default_message
)
VALUES (
    'self-service-s',
    'Self-Service Support',
    'http://localhost:7240',
    NULL,
    true,
    'PortalViewV1',
    'Support Technique',
    'Portail de support IT',
    'Bonjour {firstName}, comment puis-je vous aider ?',
    NULL,
    '#2196F3',
    '#111111',
    true,
    true,
    true,
    true,
    'Support technique disponible'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    view_component = EXCLUDED.view_component,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    welcome_template = EXCLUDED.welcome_template,
    logo_url = EXCLUDED.logo_url,
    theme_primary_color = EXCLUDED.theme_primary_color,
    theme_secondary_color = EXCLUDED.theme_secondary_color,
    show_chat = EXCLUDED.show_chat,
    show_alerts = EXCLUDED.show_alerts,
    show_actions = EXCLUDED.show_actions,
    show_widgets = EXCLUDED.show_widgets,
    chat_default_message = EXCLUDED.chat_default_message,
    updated_at = now();

-- Portal 3: POC Portal (demo/test portal)
INSERT INTO core.portals (
    code,
    name,
    base_url,
    thumbnail_url,
    is_active,
    view_component,
    title,
    subtitle,
    welcome_template,
    logo_url,
    theme_primary_color,
    theme_secondary_color,
    show_chat,
    show_alerts,
    show_actions,
    show_widgets,
    chat_default_message
)
VALUES (
    'poc',
    'POC Portal',
    'http://localhost:7240',
    NULL,
    true,
    'PortalViewV1',
    'Administration Lumière',
    'Gestion et supervision',
    'Bienvenue {firstName} !',
    NULL,
    '#1976D2',
    '#111111',
    true,
    true,
    true,
    true,
    'Support administrateur disponible'
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    is_active = EXCLUDED.is_active,
    view_component = EXCLUDED.view_component,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    welcome_template = EXCLUDED.welcome_template,
    logo_url = EXCLUDED.logo_url,
    theme_primary_color = EXCLUDED.theme_primary_color,
    theme_secondary_color = EXCLUDED.theme_secondary_color,
    show_chat = EXCLUDED.show_chat,
    show_alerts = EXCLUDED.show_alerts,
    show_actions = EXCLUDED.show_actions,
    show_widgets = EXCLUDED.show_widgets,
    chat_default_message = EXCLUDED.chat_default_message,
    updated_at = now();

-- ============================================================================
-- SECTION 2: INSERT PORTAL ACTIONS (Global actions)
-- ============================================================================

INSERT INTO core.portal_actions (
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
    is_visible
)
VALUES 
(
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
    true
),
(
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
    true
),
(
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
    'Je n''arrive pas à me connecter',
    'Signalez un problème de connexion à votre compte',
    'fontawesome',
    'fa-exclamation-triangle',
    true,
    true
),
(
    'OTHER_REQUEST',
    'POST',
    '/api/v1/tickets',
    jsonb_build_object(
        'ticket_type_code', 'REQUEST',
        'ticket_status_code', 'NEW',
        'title', 'Autre demande',
        'description', 'Autre demande depuis le portail',
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
    true
)
ON CONFLICT (action_code) DO UPDATE SET
    http_method = EXCLUDED.http_method,
    endpoint = EXCLUDED.endpoint,
    payload_json = EXCLUDED.payload_json,
    headers_json = EXCLUDED.headers_json,
    display_title = EXCLUDED.display_title,
    description = EXCLUDED.description,
    icon_type = EXCLUDED.icon_type,
    icon_value = EXCLUDED.icon_value,
    is_quick_action = EXCLUDED.is_quick_action,
    is_visible = EXCLUDED.is_visible,
    updated_at = now();

-- ============================================================================
-- SECTION 3: INSERT PORTAL ALERTS (Global alerts)
-- ============================================================================

INSERT INTO core.portal_alerts (
    message,
    alert_type,
    start_date,
    end_date,
    is_active
)
VALUES 
(
    'Maintenance programmée ce soir de 22h à minuit. Les services seront temporairement indisponibles.',
    'warning',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
),
(
    'Bienvenue sur le nouveau portail Lumière 16 !',
    'info',
    NOW(),
    NULL,
    true
);

-- ============================================================================
-- SECTION 4: INSERT PORTAL WIDGETS (Global widgets)
-- ============================================================================

INSERT INTO core.portal_widgets (
    widget_code,
    display_title,
    widget_type,
    api_endpoint,
    api_method,
    api_params,
    refresh_interval,
    is_visible
)
VALUES 
(
    'PENDING_VALIDATIONS',
    'Validations en attente',
    'counter',
    '/api/v1/tickets/count',
    'GET',
    jsonb_build_object('status', 'PENDING_VALIDATION'),
    300,
    true
),
(
    'PENDING_QUESTIONS',
    'Questions en attente',
    'counter',
    '/api/v1/tickets/count',
    'GET',
    jsonb_build_object('status', 'WAITING_FOR_RESPONSE'),
    300,
    true
),
(
    'UNREAD_NOTIFICATIONS',
    'Notifications non lues',
    'counter',
    '/api/v1/notifications/count',
    'GET',
    jsonb_build_object('read', false),
    60,
    true
),
(
    'ACTIVE_TICKETS',
    'Tickets en cours',
    'list',
    '/api/v1/tickets',
    'GET',
    jsonb_build_object('status', 'IN_PROGRESS', 'limit', 5),
    300,
    true
),
(
    'CRITICAL_INCIDENTS',
    'Incidents critiques',
    'list',
    '/api/v1/tickets',
    'GET',
    jsonb_build_object('type', 'INCIDENT', 'priority', 'HIGH', 'limit', 5),
    180,
    true
),
(
    'ASSIGNED_TASKS',
    'Tâches assignées',
    'list',
    '/api/v1/tickets',
    'GET',
    jsonb_build_object('type', 'TASK', 'assigned_to_me', true, 'limit', 5),
    300,
    true
)
ON CONFLICT (widget_code) DO UPDATE SET
    display_title = EXCLUDED.display_title,
    widget_type = EXCLUDED.widget_type,
    api_endpoint = EXCLUDED.api_endpoint,
    api_method = EXCLUDED.api_method,
    api_params = EXCLUDED.api_params,
    refresh_interval = EXCLUDED.refresh_interval,
    is_visible = EXCLUDED.is_visible,
    updated_at = now();

-- ============================================================================
-- SECTION 5: LINK ACTIONS TO PORTALS (Junction table)
-- ============================================================================

-- Link all actions to all portals
INSERT INTO core.portal__portal_actions (rel_portal, rel_portal_action, display_order)
SELECT 
    p.uuid,
    pa.uuid,
    ROW_NUMBER() OVER (PARTITION BY p.uuid ORDER BY pa.action_code)
FROM core.portals p
CROSS JOIN core.portal_actions pa
WHERE p.code IN ('self-service-l', 'self-service-s', 'poc')
  AND pa.action_code IN ('CREATE_TASK', 'CREATE_INCIDENT', 'REPORT_CONNECTION_ISSUE', 'OTHER_REQUEST')
ON CONFLICT (rel_portal, rel_portal_action) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- ============================================================================
-- SECTION 6: LINK ALERTS TO PORTALS (Junction table)
-- ============================================================================

-- Link all alerts to self-service portals
INSERT INTO core.portal__portal_alerts (rel_portal, rel_portal_alert, display_order)
SELECT 
    p.uuid,
    pa.uuid,
    ROW_NUMBER() OVER (PARTITION BY p.uuid ORDER BY pa.created_at)
FROM core.portals p
CROSS JOIN core.portal_alerts pa
WHERE p.code IN ('self-service-l', 'self-service-s')
ON CONFLICT (rel_portal, rel_portal_alert) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- ============================================================================
-- SECTION 7: LINK WIDGETS TO PORTALS (Junction table)
-- ============================================================================

-- Link widgets to self-service-l: PENDING_VALIDATIONS, PENDING_QUESTIONS, UNREAD_NOTIFICATIONS
INSERT INTO core.portal__portal_widgets (rel_portal, rel_portal_widget, display_order)
SELECT 
    p.uuid,
    pw.uuid,
    CASE pw.widget_code
        WHEN 'PENDING_VALIDATIONS' THEN 1
        WHEN 'PENDING_QUESTIONS' THEN 2
        WHEN 'UNREAD_NOTIFICATIONS' THEN 3
    END
FROM core.portals p
CROSS JOIN core.portal_widgets pw
WHERE p.code = 'self-service-l'
  AND pw.widget_code IN ('PENDING_VALIDATIONS', 'PENDING_QUESTIONS', 'UNREAD_NOTIFICATIONS')
ON CONFLICT (rel_portal, rel_portal_widget) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- Link widgets to self-service-s: ACTIVE_TICKETS, CRITICAL_INCIDENTS, ASSIGNED_TASKS
INSERT INTO core.portal__portal_widgets (rel_portal, rel_portal_widget, display_order)
SELECT 
    p.uuid,
    pw.uuid,
    CASE pw.widget_code
        WHEN 'ACTIVE_TICKETS' THEN 1
        WHEN 'CRITICAL_INCIDENTS' THEN 2
        WHEN 'ASSIGNED_TASKS' THEN 3
    END
FROM core.portals p
CROSS JOIN core.portal_widgets pw
WHERE p.code = 'self-service-s'
  AND pw.widget_code IN ('ACTIVE_TICKETS', 'CRITICAL_INCIDENTS', 'ASSIGNED_TASKS')
ON CONFLICT (rel_portal, rel_portal_widget) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- ============================================================================
-- SECTION 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_portals_count INTEGER;
    v_actions_count INTEGER;
    v_alerts_count INTEGER;
    v_widgets_count INTEGER;
    v_portal_actions_count INTEGER;
    v_portal_alerts_count INTEGER;
    v_portal_widgets_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_portals_count FROM core.portals;
    SELECT COUNT(*) INTO v_actions_count FROM core.portal_actions;
    SELECT COUNT(*) INTO v_alerts_count FROM core.portal_alerts;
    SELECT COUNT(*) INTO v_widgets_count FROM core.portal_widgets;
    SELECT COUNT(*) INTO v_portal_actions_count FROM core.portal__portal_actions;
    SELECT COUNT(*) INTO v_portal_alerts_count FROM core.portal__portal_alerts;
    SELECT COUNT(*) INTO v_portal_widgets_count FROM core.portal__portal_widgets;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '[18_portals_seed_data.sql] Seed data inserted successfully';
    RAISE NOTICE 'Portals: %', v_portals_count;
    RAISE NOTICE 'Actions: %', v_actions_count;
    RAISE NOTICE 'Alerts: %', v_alerts_count;
    RAISE NOTICE 'Widgets: %', v_widgets_count;
    RAISE NOTICE 'Portal-Action links: %', v_portal_actions_count;
    RAISE NOTICE 'Portal-Alert links: %', v_portal_alerts_count;
    RAISE NOTICE 'Portal-Widget links: %', v_portal_widgets_count;
    RAISE NOTICE '============================================================================';
END $$;

COMMIT;
