-- =====================================================
-- Script: 17_populate_table_metadata_task.sql
-- Description: Populate table_metadata for TASK tickets (core.tickets table)
--              Includes common ticket fields
-- Author: System
-- Date: 2024-09-24
-- Updated: 2025-10-24 - Split from main metadata file
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Task'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Task';

-- Insert column-level metadata for TASK tickets
INSERT INTO administration.table_metadata (
    table_name, object_name, table_label, table_description, column_name, column_label, column_description,
    data_type, data_is_nullable, data_default_value,
    data_is_visible, data_is_sortable, data_is_filterable,
    filter_type, filter_options,
    is_foreign_key, related_table, related_column,
    is_multilang, related_translation_table, translation_foreign_key, translation_label_column,
    form_field_type, form_placeholder, form_required, form_readonly,
    form_endpoint, form_display_field, form_value_field, form_lazy_search, form_helper_text,
    form_visible, form_order,
    form_related_table, form_columns_config, form_visibility_condition
) VALUES 
-- uuid
('tickets', 'Task', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du ticket',
 'uuid', false, 'uuid_generate_v4()',
 true, false, true,
 'search', '{"minChars": 8}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 0,
 NULL, NULL, NULL),

-- title
('tickets', 'Task', NULL, NULL, 'title', 'task.title', 'Titre du ticket',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre du ticket', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif du ticket',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Task', NULL, NULL, 'description', 'task.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextArea', 'Décrivez le ticket en détail', false, false,
 NULL, NULL, NULL, NULL, 'Description complète du ticket',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Task', NULL, NULL, 'ticket_type_code', 'task.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (TASK, INCIDENT, PROBLEM, etc.)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Task', NULL, NULL, 'ticket_status_code', 'task.status', 'Statut du ticket',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel du ticket',
 true, 40,
 NULL, NULL, NULL),

-- requested_by_uuid
('tickets', 'Task', NULL, NULL, 'requested_by_uuid', 'task.requested_by', 'Demandé par',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant fait la demande',
 true, 50,
 NULL, NULL, NULL),

-- requested_for_uuid
('tickets', 'Task', NULL, NULL, 'requested_for_uuid', 'task.requested_for', 'Demandé pour',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne bénéficiaire de la demande',
 true, 60,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Task', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le ticket',
 true, 70,
 NULL, NULL, NULL),

-- assigned_to_group (relation via core.rel_tickets_groups_persons)
('tickets', 'Task', NULL, NULL, 'assigned_to_group', 'task.assigned_team_label', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'task.assigned_team_placeholder', false, false,
 'groups', 'group_name', 'uuid', false, 'Équipe en charge de la tâche',
 true, 75,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Task', NULL, NULL, 'assigned_to_person', 'task.assigned_to_label', 'Personne assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'task.assigned_to_placeholder', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne assignée à la tâche',
 true, 76,
 NULL, NULL, NULL),

-- configuration_item_uuid
('tickets', 'Task', NULL, NULL, 'configuration_item_uuid', 'ticket.configuration_item', 'Élément de configuration',
 'uuid', true, NULL,
 true, false, false,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.configuration_items', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un CI', false, false,
 'configuration_items', 'name', 'uuid', true, 'CI concerné par le ticket',
 true, 80,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Task', NULL, NULL, 'created_at', 'common.created_at', 'Date de création du ticket',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 90,
 NULL, NULL, NULL),

-- updated_at
('tickets', 'Task', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 100,
 NULL, NULL, NULL),

-- closed_at
('tickets', 'Task', NULL, NULL, 'closed_at', 'task.closed_at', 'Date de fermeture du ticket',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, false,
 NULL, NULL, NULL, NULL, NULL,
 false, 110,
 NULL, NULL, NULL),

-- core_extended_attributes
('tickets', 'Task', NULL, NULL, 'core_extended_attributes', 'ticket.core_attributes', 'Attributs étendus système',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus gérés par le système',
 false, 120,
 NULL, NULL, NULL),

-- user_extended_attributes
('tickets', 'Task', NULL, NULL, 'user_extended_attributes', 'ticket.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 130,
 NULL, NULL, NULL);

COMMIT;
