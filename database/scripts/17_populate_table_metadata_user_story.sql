-- =====================================================
-- Script: 17_populate_table_metadata_user_story.sql
-- Description: Populate table_metadata for USER_STORY tickets (core.tickets table)
--              Includes user story-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-31
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Story'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Story';

-- Insert column-level metadata for USER_STORY tickets (common fields + specific fields)
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
('tickets', 'Story', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique de la user story',
 'uuid', false, 'uuid_generate_v4()',
 true, false, false,
 'search', '{"minChars": 8}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 0,
 NULL, NULL, NULL),

-- title
('tickets', 'Story', NULL, NULL, 'title', 'story.title', 'Titre de la user story',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre de la user story', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif de la user story',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Story', NULL, NULL, 'description', 'story.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez la user story en détail', false, false,
 NULL, NULL, NULL, NULL, 'Description complète de la user story',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Story', NULL, NULL, 'ticket_type_code', 'story.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (USER_STORY)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Story', NULL, NULL, 'ticket_status_code', 'story.status', 'Statut de la user story',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel de la user story',
 true, 40,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Story', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé la user story',
 true, 50,
 NULL, NULL, NULL),

-- requested_for_uuid
('tickets', 'Story', NULL, NULL, 'requested_for_uuid', 'story.reporter', 'Product Owner / Reporter',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez le product owner', false, false,
 'persons', 'person_name', 'uuid', true, 'Product owner ou stakeholder',
 true, 60,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Story', NULL, NULL, 'assigned_to_person', 'story.assigned_to_person', 'Développeur assigné',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'story.assigned_to_person_placeholder', false, false,
 'persons', 'person_name', 'uuid', true, 'Développeur en charge de la story',
 true, 70,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Story', NULL, NULL, 'created_at', 'common.created_at', 'Date de création',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 80,
 NULL, NULL, NULL),

-- updated_at
('tickets', 'Story', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 90,
 NULL, NULL, NULL),

-- closed_at
('tickets', 'Story', NULL, NULL, 'closed_at', 'common.closed_at', 'Date de fermeture',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, false,
 NULL, NULL, NULL, NULL, NULL,
 false, 100,
 NULL, NULL, NULL),

-- core_extended_attributes
('tickets', 'Story', NULL, NULL, 'core_extended_attributes', 'story.core_attributes', 'Attributs étendus système',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus gérés par le système',
 false, 110,
 NULL, NULL, NULL),

-- user_extended_attributes
('tickets', 'Story', NULL, NULL, 'user_extended_attributes', 'story.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 120,
 NULL, NULL, NULL),

-- project_id (JSONB field - calculated from relations)
('tickets', 'Story', NULL, NULL, 'project_id', 'story.project_id', 'Projet parent',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Sélectionnez le projet', true, false,
 'tickets?ticket_type=PROJECT', 'title', 'uuid', false, 'Projet auquel appartient la story',
 true, 130,
 NULL, NULL, NULL),

-- epic_id (JSONB field - calculated from relations)
('tickets', 'Story', NULL, NULL, 'epic_id', 'story.epic_id', 'Epic parent',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez l''epic', false, false,
 'tickets/{project_id}/epics', 'title', 'uuid', false, 'Epic auquel appartient la story',
 true, 140,
 NULL, NULL, NULL),

-- sprint_id (JSONB field - calculated from relations)
('tickets', 'Story', NULL, NULL, 'sprint_id', 'story.sprint_id', 'Sprint',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez le sprint', false, false,
 'tickets/{project_id}/sprints', 'title', 'uuid', false, 'Sprint dans lequel la story est planifiée',
 true, 150,
 NULL, NULL, NULL),

-- story_points (JSONB field)
('tickets', 'Story', NULL, NULL, 'story_points', 'story.story_points', 'Points de story',
 'integer', true, NULL,
 true, true, true,
 'search', '{"minValue": 0, "maxValue": 100}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez les points de story', false, false,
 NULL, NULL, NULL, NULL, 'Estimation en points de story (Fibonacci)',
 true, 160,
 NULL, NULL, NULL),

-- priority (JSONB field)
('tickets', 'Story', NULL, NULL, 'priority', 'story.priority', 'Priorité',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez la priorité', false, false,
 NULL, NULL, NULL, NULL, 'Priorité de la user story',
 true, 170,
 NULL, NULL, NULL),

-- acceptance_criteria (JSONB field)
('tickets', 'Story', NULL, NULL, 'acceptance_criteria', 'story.acceptance_criteria', 'Critères d''acceptation',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez les critères d''acceptation', false, false,
 NULL, NULL, NULL, NULL, 'Critères d''acceptation de la story',
 true, 180,
 NULL, NULL, NULL),

-- tags (JSONB field)
('tickets', 'Story', NULL, NULL, 'tags', 'story.tags', 'Tags',
 'text', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTagsList', 'Ajoutez des tags', false, false,
 NULL, NULL, NULL, NULL, 'Tags associés à la story',
 true, 190,
 NULL, NULL, NULL);

COMMIT;
