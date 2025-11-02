-- =====================================================
-- Script: 17_populate_table_metadata_sprint.sql
-- Description: Populate table_metadata for SPRINT tickets (core.tickets table)
--              Includes sprint-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-31
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Sprint'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Sprint';

-- Insert column-level metadata for SPRINT tickets (common fields + specific fields)
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
('tickets', 'Sprint', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du sprint',
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
('tickets', 'Sprint', NULL, NULL, 'title', 'sprint.name', 'Nom du sprint',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le nom du sprint', true, false,
 NULL, NULL, NULL, NULL, 'Nom descriptif du sprint',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Sprint', NULL, NULL, 'description', 'sprint.goal', 'Objectif du sprint',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez l''objectif du sprint', false, false,
 NULL, NULL, NULL, NULL, 'Objectif et description du sprint',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Sprint', NULL, NULL, 'ticket_type_code', 'sprint.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (SPRINT)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Sprint', NULL, NULL, 'ticket_status_code', 'sprint.state', 'État du sprint',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez l''état', true, false,
 'ticket_status', 'label', 'code', false, 'État actuel du sprint',
 true, 40,
 NULL, NULL, NULL),

-- requested_by_uuid
('tickets', 'Sprint', NULL, NULL, 'requested_by_uuid', 'sprint.reported_by', 'Créé par',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le sprint',
 true, 50,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Sprint', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, false,
 NULL, NULL,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Rédacteur du sprint',
 false, 0,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Sprint', NULL, NULL, 'created_at', 'common.created_at', 'Date de création',
 'timestamp', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Date de création du sprint',
 false, 0,
 NULL, NULL, NULL),

-- updated_at
('tickets', 'Sprint', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de modification',
 'timestamp', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Date de dernière modification',
 false, 0,
 NULL, NULL, NULL),

-- closed_at
('tickets', 'Sprint', NULL, NULL, 'closed_at', 'common.closed_at', 'Date de clôture',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, 'Date de clôture du sprint',
 false, 0,
 NULL, NULL, NULL),

-- =====================================================
-- SPRINT-SPECIFIC FIELDS (stored in core_extended_attributes JSONB)
-- =====================================================

-- project_id (relation to parent project)
('tickets', 'Sprint', NULL, NULL, 'project_id', 'sprint.project_id', 'Projet parent',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un projet', false, false,
 'tickets?ticket_type=PROJECT', 'title', 'uuid', true, 'Projet auquel appartient ce sprint',
 true, 60,
 NULL, NULL, NULL),

-- start_date
('tickets', 'Sprint', NULL, NULL, 'start_date', 'sprint.start_date', 'Date de début',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de début', false, false,
 NULL, NULL, NULL, NULL, 'Date de début du sprint',
 true, 70,
 NULL, NULL, NULL),

-- end_date
('tickets', 'Sprint', NULL, NULL, 'end_date', 'sprint.end_date', 'Date de fin',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de fin', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin du sprint',
 true, 80,
 NULL, NULL, NULL),

-- actual_velocity
('tickets', 'Sprint', NULL, NULL, 'actual_velocity', 'sprint.actual_velocity', 'Vélocité réelle',
 'integer', true, NULL,
 true, true, true,
 'search', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez la vélocité réelle', false, false,
 NULL, NULL, NULL, NULL, 'Vélocité réelle du sprint (story points)',
 true, 90,
 NULL, NULL, NULL),

-- estimated_velocity
('tickets', 'Sprint', NULL, NULL, 'estimated_velocity', 'sprint.estimated_velocity', 'Vélocité estimée',
 'integer', true, NULL,
 true, true, true,
 'search', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez la vélocité estimée', false, false,
 NULL, NULL, NULL, NULL, 'Vélocité estimée du sprint (story points)',
 true, 100,
 NULL, NULL, NULL);

COMMIT;

-- Display summary
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM administration.table_metadata
    WHERE table_name = 'tickets' AND object_name = 'Sprint';
    
    RAISE NOTICE 'Successfully populated % metadata entries for Sprint tickets', v_count;
END $$;
