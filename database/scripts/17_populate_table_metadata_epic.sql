-- =====================================================
-- Script: 17_populate_table_metadata_epic.sql
-- Description: Populate table_metadata for EPIC tickets (core.tickets table)
--              Includes epic-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-31
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Epic'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Epic';

-- Insert column-level metadata for EPIC tickets (common fields + specific fields)
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
('tickets', 'Epic', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du ticket',
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
('tickets', 'Epic', NULL, NULL, 'title', 'epic.name', 'Nom de l''epic',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le nom de l''epic', true, false,
 NULL, NULL, NULL, NULL, 'Nom descriptif de l''epic',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Epic', NULL, NULL, 'description', 'epic.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez l''epic en détail', false, false,
 NULL, NULL, NULL, NULL, 'Description complète de l''epic',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Epic', NULL, NULL, 'ticket_type_code', 'epic.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (EPIC)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Epic', NULL, NULL, 'ticket_status_code', 'epic.status', 'Statut de l''epic',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel de l''epic',
 true, 40,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Epic', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé l''epic',
 true, 50,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Epic', NULL, NULL, 'created_at', 'common.created_at', 'Date de création de l''epic',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 60,
 NULL, NULL, NULL),

-- updated_at
('tickets', 'Epic', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 70,
 NULL, NULL, NULL),

-- closed_at
('tickets', 'Epic', NULL, NULL, 'closed_at', 'epic.closed_at', 'Date de fermeture de l''epic',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, false,
 NULL, NULL, NULL, NULL, NULL,
 false, 80,
 NULL, NULL, NULL),

-- core_extended_attributes
('tickets', 'Epic', NULL, NULL, 'core_extended_attributes', 'epic.core_attributes', 'Attributs étendus système',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus gérés par le système',
 false, 90,
 NULL, NULL, NULL),

-- user_extended_attributes
('tickets', 'Epic', NULL, NULL, 'user_extended_attributes', 'epic.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 100,
 NULL, NULL, NULL),

-- project_id (JSONB field - relation via core.rel_parent_child_tickets)
('tickets', 'Epic', NULL, NULL, 'project_id', 'epic.project_id', 'Projet parent',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un projet', false, false,
 'tickets?ticket_type=PROJECT', 'title', 'uuid', true, 'Projet auquel appartient cet epic',
 true, 110,
 NULL, NULL, NULL),

-- start_date (JSONB field)
('tickets', 'Epic', NULL, NULL, 'start_date', 'epic.start_date', 'Date de début de l''epic',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de début', false, false,
 NULL, NULL, NULL, NULL, 'Date de début prévue/effective',
 true, 120,
 NULL, NULL, NULL),

-- end_date (JSONB field)
('tickets', 'Epic', NULL, NULL, 'end_date', 'epic.end_date', 'Date de fin de l''epic',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de fin', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin prévue/effective',
 true, 130,
 NULL, NULL, NULL),

-- progress_percent (JSONB field)
('tickets', 'Epic', NULL, NULL, 'progress_percent', 'epic.progress_percent', 'Pourcentage d''avancement',
 'integer', true, NULL,
 true, true, true,
 'search', '{"min": 0, "max": 100}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le pourcentage (0-100)', false, false,
 NULL, NULL, NULL, NULL, 'Pourcentage d''avancement de l''epic',
 true, 140,
 NULL, NULL, NULL),

-- color (JSONB field)
('tickets', 'Epic', NULL, NULL, 'color', 'epic.color', 'Couleur de l''epic',
 'text', true, NULL,
 true, true, true,
 'search', '{"minChars": 3}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Code couleur hexadécimal', false, false,
 NULL, NULL, NULL, NULL, 'Couleur associée à l''epic (ex: #FF6B6B)',
 true, 150,
 NULL, NULL, NULL),

-- tags (JSONB field)
('tickets', 'Epic', NULL, NULL, 'tags', 'epic.tags', 'Tags de l''epic',
 'text', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTagsList', 'Ajoutez des tags', false, false,
 NULL, NULL, NULL, NULL, 'Tags pour catégoriser l''epic',
 true, 160,
 NULL, NULL, NULL),

-- stories_count (calculated field)
('tickets', 'Epic', NULL, NULL, 'stories_count', 'epic.stories_count', 'Nombre de user stories',
 'integer', true, NULL,
 true, true, true,
 'between', '{"min": 0}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Nombre de user stories liées',
 false, 170,
 NULL, NULL, NULL),

-- tasks_count (calculated field)
('tickets', 'Epic', NULL, NULL, 'tasks_count', 'epic.tasks_count', 'Nombre de tâches',
 'integer', true, NULL,
 true, true, true,
 'between', '{"min": 0}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Nombre de tâches liées',
 false, 180,
 NULL, NULL, NULL),

-- attachments_count (calculated field)
('tickets', 'Epic', NULL, NULL, 'attachments_count', 'epic.attachments_count', 'Nombre de pièces jointes',
 'integer', true, NULL,
 true, true, true,
 'between', '{"min": 0}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Nombre de pièces jointes',
 false, 190,
 NULL, NULL, NULL);

COMMIT;
