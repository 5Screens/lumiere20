-- ============================================================================
-- Migration Script: Remove rel_portal_uuid from portal_actions, portal_alerts, portal_widgets
-- Description: This script removes the direct foreign key relationships and 
--              relies solely on junction tables for portal relationships
-- ============================================================================

BEGIN;

-- Step 1: Drop existing data from junction tables (will be re-inserted)
DELETE FROM core.portal__portal_actions;
DELETE FROM core.portal__portal_alerts;
DELETE FROM core.portal__portal_widgets;

-- Step 2: Drop foreign key constraints and indexes
ALTER TABLE core.portal_actions DROP CONSTRAINT IF EXISTS fk_portal_actions_portal;
DROP INDEX IF EXISTS idx_portal_actions_portal_action;
DROP INDEX IF EXISTS idx_portal_actions_portal_uuid;
DROP INDEX IF EXISTS idx_portal_actions_quick_actions;

ALTER TABLE core.portal_alerts DROP CONSTRAINT IF EXISTS fk_portal_alerts_portal;
DROP INDEX IF EXISTS idx_portal_alerts_portal_active;

ALTER TABLE core.portal_widgets DROP CONSTRAINT IF EXISTS fk_portal_widgets_portal;
DROP INDEX IF EXISTS idx_portal_widgets_portal_visible;
DROP INDEX IF EXISTS idx_portal_widgets_code;
ALTER TABLE core.portal_widgets DROP CONSTRAINT IF EXISTS uq_portal_widgets_code;

-- Step 3: Drop rel_portal_uuid columns
ALTER TABLE core.portal_actions DROP COLUMN IF EXISTS rel_portal_uuid;
ALTER TABLE core.portal_actions DROP COLUMN IF EXISTS display_order;
ALTER TABLE core.portal_alerts DROP COLUMN IF EXISTS rel_portal_uuid;
ALTER TABLE core.portal_alerts DROP COLUMN IF EXISTS display_order;
ALTER TABLE core.portal_widgets DROP COLUMN IF EXISTS rel_portal_uuid;
ALTER TABLE core.portal_widgets DROP COLUMN IF EXISTS display_order;

-- Step 4: Add UNIQUE constraints on action_code and widget_code
ALTER TABLE core.portal_actions ADD CONSTRAINT uq_portal_actions_code UNIQUE (action_code);
ALTER TABLE core.portal_widgets ADD CONSTRAINT uq_portal_widgets_code UNIQUE (widget_code);

-- Step 5: Create new indexes
CREATE INDEX IF NOT EXISTS idx_portal_actions_quick_actions
    ON core.portal_actions(is_quick_action, is_visible)
    WHERE is_quick_action = true AND is_visible = true;

CREATE INDEX IF NOT EXISTS idx_portal_alerts_active
    ON core.portal_alerts(is_active, start_date, end_date)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_portal_widgets_visible
    ON core.portal_widgets(is_visible)
    WHERE is_visible = true;

-- Step 6: Clear existing actions, alerts, widgets (they will be re-inserted as global entities)
DELETE FROM core.portal_actions;
DELETE FROM core.portal_alerts;
DELETE FROM core.portal_widgets;

-- Step 7: Insert global actions
INSERT INTO core.portal_actions (action_code, http_method, endpoint, payload_json, headers_json, display_title, description, icon_type, icon_value, is_quick_action, is_visible)
VALUES 
('CREATE_TASK', 'POST', '/api/v1/tickets', 
    '{"ticket_type_code":"TASK","ticket_status_code":"NEW","title":"Nouvelle tâche depuis le portail","description":"Cette tâche a été créée via le portail de démonstration","writer_uuid":"efd1c5ce-8ab0-446a-95cd-c8262217dff0","requested_by_uuid":"feabfba9-884b-4fe2-88ea-b53ca52cc10d","requested_for_uuid":"1e65c43e-da9e-4592-a3a9-bef1cf2d52e2"}'::jsonb,
    '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    'Demander l''accès à une application', 'Demandez l''accès à une nouvelle application ou service', 'fontawesome', 'fa-laptop', true, true),
    
('CREATE_INCIDENT', 'POST', '/api/v1/tickets',
    '{"ticket_type_code":"INCIDENT","ticket_status_code":"NEW","title":"Nouvel incident depuis le portail","description":"Cet incident a été créé via le portail de démonstration","writer_uuid":"efd1c5ce-8ab0-446a-95cd-c8262217dff0","requested_by_uuid":"feabfba9-884b-4fe2-88ea-b53ca52cc10d","requested_for_uuid":"1e65c43e-da9e-4592-a3a9-bef1cf2d52e2"}'::jsonb,
    '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    'Demander un matériel physique', 'Demandez du matériel informatique (PC, écran, clavier, etc.)', 'fontawesome', 'fa-desktop', true, true),
    
('REPORT_CONNECTION_ISSUE', 'POST', '/api/v1/tickets',
    '{"ticket_type_code":"INCIDENT","ticket_status_code":"NEW","title":"Problème de connexion","description":"Je n''arrive pas à me connecter","writer_uuid":"efd1c5ce-8ab0-446a-95cd-c8262217dff0","requested_by_uuid":"feabfba9-884b-4fe2-88ea-b53ca52cc10d","requested_for_uuid":"1e65c43e-da9e-4592-a3a9-bef1cf2d52e2"}'::jsonb,
    '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    'Je n''arrive pas à me connecter', 'Signalez un problème de connexion à votre compte', 'fontawesome', 'fa-exclamation-triangle', true, true),
    
('OTHER_REQUEST', 'POST', '/api/v1/tickets',
    '{"ticket_type_code":"REQUEST","ticket_status_code":"NEW","title":"Autre demande","description":"Autre demande depuis le portail","writer_uuid":"efd1c5ce-8ab0-446a-95cd-c8262217dff0","requested_by_uuid":"feabfba9-884b-4fe2-88ea-b53ca52cc10d","requested_for_uuid":"1e65c43e-da9e-4592-a3a9-bef1cf2d52e2"}'::jsonb,
    '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    'Autre demande', 'Pour toute autre demande non listée ci-dessus', 'fontawesome', 'fa-question-circle', true, true);

-- Step 8: Insert global alerts
INSERT INTO core.portal_alerts (message, alert_type, start_date, end_date, is_active)
VALUES 
('Maintenance programmée ce soir de 22h à minuit. Les services seront temporairement indisponibles.', 'warning', NOW(), NOW() + INTERVAL '7 days', true),
('Bienvenue sur le nouveau portail Lumière 16 !', 'info', NOW(), NULL, true);

-- Step 9: Insert global widgets
INSERT INTO core.portal_widgets (widget_code, display_title, widget_type, api_endpoint, api_method, api_params, refresh_interval, is_visible)
VALUES 
('PENDING_VALIDATIONS', 'Validations en attente', 'counter', '/api/v1/tickets/count', 'GET', '{"status":"PENDING_VALIDATION"}'::jsonb, 300, true),
('PENDING_QUESTIONS', 'Questions en attente', 'counter', '/api/v1/tickets/count', 'GET', '{"status":"WAITING_FOR_RESPONSE"}'::jsonb, 300, true),
('UNREAD_NOTIFICATIONS', 'Notifications non lues', 'counter', '/api/v1/notifications/count', 'GET', '{"read":false}'::jsonb, 60, true),
('ACTIVE_TICKETS', 'Tickets en cours', 'list', '/api/v1/tickets', 'GET', '{"status":"IN_PROGRESS","limit":5}'::jsonb, 300, true),
('CRITICAL_INCIDENTS', 'Incidents critiques', 'list', '/api/v1/tickets', 'GET', '{"type":"INCIDENT","priority":"HIGH","limit":5}'::jsonb, 180, true),
('ASSIGNED_TASKS', 'Tâches assignées', 'list', '/api/v1/tickets', 'GET', '{"type":"TASK","assigned_to_me":true,"limit":5}'::jsonb, 300, true);

-- Step 10: Link actions to portals via junction table
INSERT INTO core.portal__portal_actions (rel_portal, rel_portal_action, display_order)
SELECT 
    p.uuid,
    pa.uuid,
    ROW_NUMBER() OVER (PARTITION BY p.uuid ORDER BY pa.action_code)
FROM core.portals p
CROSS JOIN core.portal_actions pa
WHERE p.code IN ('self-service-l', 'self-service-s', 'poc')
  AND pa.action_code IN ('CREATE_TASK', 'CREATE_INCIDENT', 'REPORT_CONNECTION_ISSUE', 'OTHER_REQUEST');

-- Step 11: Link alerts to portals via junction table
INSERT INTO core.portal__portal_alerts (rel_portal, rel_portal_alert, display_order)
SELECT 
    p.uuid,
    pa.uuid,
    ROW_NUMBER() OVER (PARTITION BY p.uuid ORDER BY pa.created_at)
FROM core.portals p
CROSS JOIN core.portal_alerts pa
WHERE p.code IN ('self-service-l', 'self-service-s');

-- Step 12: Link widgets to portals via junction table
-- self-service-l gets: PENDING_VALIDATIONS, PENDING_QUESTIONS, UNREAD_NOTIFICATIONS
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
  AND pw.widget_code IN ('PENDING_VALIDATIONS', 'PENDING_QUESTIONS', 'UNREAD_NOTIFICATIONS');

-- self-service-s gets: ACTIVE_TICKETS, CRITICAL_INCIDENTS, ASSIGNED_TASKS
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
  AND pw.widget_code IN ('ACTIVE_TICKETS', 'CRITICAL_INCIDENTS', 'ASSIGNED_TASKS');

COMMIT;

-- Verification queries
SELECT 'Portals' AS table_name, COUNT(*) AS count FROM core.portals
UNION ALL
SELECT 'Portal Actions' AS table_name, COUNT(*) AS count FROM core.portal_actions
UNION ALL
SELECT 'Portal Alerts' AS table_name, COUNT(*) AS count FROM core.portal_alerts
UNION ALL
SELECT 'Portal Widgets' AS table_name, COUNT(*) AS count FROM core.portal_widgets
UNION ALL
SELECT 'Portal-Action Links' AS table_name, COUNT(*) AS count FROM core.portal__portal_actions
UNION ALL
SELECT 'Portal-Alert Links' AS table_name, COUNT(*) AS count FROM core.portal__portal_alerts
UNION ALL
SELECT 'Portal-Widget Links' AS table_name, COUNT(*) AS count FROM core.portal__portal_widgets;
