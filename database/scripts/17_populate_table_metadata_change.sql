-- =====================================================
-- Script: 17_populate_table_metadata_change.sql
-- Description: Populate table_metadata for CHANGE tickets (core.tickets table)
--              Includes change-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-27
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Change'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Change';

-- Insert column-level metadata for CHANGE tickets (common fields + specific fields)
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
('tickets', 'Change', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du changement',
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
('tickets', 'Change', NULL, NULL, 'title', 'change.title', 'Titre du changement',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre du changement', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif du changement',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Change', NULL, NULL, 'description', 'change.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez le changement en détail', true, false,
 NULL, NULL, NULL, NULL, 'Description complète du changement',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Change', NULL, NULL, 'ticket_type_code', 'change.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (CHANGE)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Change', NULL, NULL, 'ticket_status_code', 'change.status', 'Statut du changement',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel du changement',
 true, 40,
 NULL, NULL, NULL),

-- requested_for_uuid
('tickets', 'Change', NULL, NULL, 'requested_for_uuid', 'change.requested_for', 'Demandé pour',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne pour qui le changement est demandé',
 true, 50,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Change', NULL, NULL, 'writer_uuid', 'change.writer', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, true,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le changement',
 false, 60,
 NULL, NULL, NULL),

-- configuration_item_uuid
('tickets', 'Change', NULL, NULL, 'configuration_item_uuid', 'change.configuration_item', 'Élément de configuration',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.configuration_items', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un CI', false, false,
 'configuration_items', 'name', 'uuid', true, 'CI impacté par le changement',
 true, 70,
 NULL, NULL, NULL),

-- assigned_to_group (relational field)
('tickets', 'Change', NULL, NULL, 'assigned_to_group', 'change.assigned_group', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un groupe', true, false,
 'groups', 'group_name', 'uuid', false, 'Groupe en charge du changement',
 true, 80,
 NULL, NULL, NULL),

-- assigned_to_person (relational field)
('tickets', 'Change', NULL, NULL, 'assigned_to_person', 'change.assigned_to_person', 'Personne assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne responsable du changement',
 true, 90,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Change', NULL, NULL, 'created_at', 'common.creation_date', 'Date de création',
 'timestamp', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 100,
 NULL, NULL, NULL),

-- updated_at
('tickets', 'Change', NULL, NULL, 'updated_at', 'common.modification_date', 'Date de modification',
 'timestamp', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 110,
 NULL, NULL, NULL),

-- closed_at
('tickets', 'Change', NULL, NULL, 'closed_at', 'change.closed_at', 'Date de clôture',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 120,
 NULL, NULL, NULL),

-- ============================================================================
-- CHANGE-SPECIFIC FIELDS (stored in core_extended_attributes JSONB)
-- ============================================================================

-- rel_services
('tickets', 'Change', NULL, NULL, 'rel_services', 'change.service', 'Service',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.services', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un service', true, false,
 'services', 'name', 'uuid', false, 'Service concerné par le changement',
 true, 130,
 NULL, NULL, NULL),

-- rel_service_offerings
('tickets', 'Change', NULL, NULL, 'rel_service_offerings', 'change.service_offerings', 'Offre de service',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.service_offerings', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une offre', true, false,
 'service_offerings', 'name', 'uuid', false, 'Offre de service concernée',
 true, 140,
 NULL, NULL, NULL),

-- rel_change_type_code
('tickets', 'Change', NULL, NULL, 'rel_change_type_code', 'change.type', 'Type de changement',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le type', false, false,
 'change_setup?metadata=type', 'label', 'code', false, 'Type de changement',
 true, 150,
 NULL, NULL, NULL),

-- rel_change_justifications_code
('tickets', 'Change', NULL, NULL, 'rel_change_justifications_code', 'change.justification', 'Justification',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez la justification', false, false,
 'change_setup?metadata=justification', 'label', 'code', false, 'Justification du changement',
 true, 160,
 NULL, NULL, NULL),

-- rel_change_objective
('tickets', 'Change', NULL, NULL, 'rel_change_objective', 'change.objective', 'Objectif',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''objectif', false, false,
 'change_setup?metadata=objective', 'label', 'code', false, 'Objectif du changement',
 true, 170,
 NULL, NULL, NULL),

-- rel_cab_validation_status
('tickets', 'Change', NULL, NULL, 'rel_cab_validation_status', 'change.cab_validation_status', 'Statut validation CAB',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le statut', false, false,
 'change_setup?metadata=cab_validation_status', 'label', 'code', false, 'Statut de validation CAB',
 true, 180,
 NULL, NULL, NULL),

-- post_change_evaluation
('tickets', 'Change', NULL, NULL, 'post_change_evaluation', 'change.post_change_evaluation', 'Évaluation post-changement',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''évaluation', false, false,
 'change_setup?metadata=post_implementation_evaluation', 'label', 'code', false, 'Évaluation après mise en œuvre',
 true, 190,
 NULL, NULL, NULL),

 --validation level
 ('tickets', 'Change', NULL, NULL, 'validation_level', 'change.validation_level', 'Niveau de validation',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.change_setup_codes', 'code',
 true, 'translations.change_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le niveau', false, false,
 'change_setup?metadata=validation_level', 'label', 'code', false, 'Niveau de validation',
 true, 200,
 NULL, NULL, NULL),

-- requested_start_date_at
('tickets', 'Change', NULL, NULL, 'requested_start_date_at', 'change.requested_start_date', 'Date de début demandée',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de début souhaitée',
 true, 200,
 NULL, NULL, NULL),

-- requested_end_date_at
('tickets', 'Change', NULL, NULL, 'requested_end_date_at', 'change.requested_end_date', 'Date de fin demandée',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin souhaitée',
 true, 210,
 NULL, NULL, NULL),

-- planned_start_date_at
('tickets', 'Change', NULL, NULL, 'planned_start_date_at', 'change.planned_start_date', 'Date de début planifiée',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de début planifiée',
 true, 220,
 NULL, NULL, NULL),

-- planned_end_date_at
('tickets', 'Change', NULL, NULL, 'planned_end_date_at', 'change.planned_end_date', 'Date de fin planifiée',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin planifiée',
 true, 230,
 NULL, NULL, NULL),

-- validated_at
('tickets', 'Change', NULL, NULL, 'validated_at', 'change.validated_at', 'Date de validation',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de validation du changement',
 true, 240,
 NULL, NULL, NULL),

-- actual_start_date_at
('tickets', 'Change', NULL, NULL, 'actual_start_date_at', 'change.actual_start_date', 'Date de début effective',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de début réelle',
 true, 250,
 NULL, NULL, NULL),

-- actual_end_date_at
('tickets', 'Change', NULL, NULL, 'actual_end_date_at', 'change.actual_end_date', 'Date de fin effective',
 'timestamp', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin réelle',
 true, 260,
 NULL, NULL, NULL),

-- elapsed_time
('tickets', 'Change', NULL, NULL, 'elapsed_time', 'change.elapsed_time', 'Temps écoulé',
 'integer', true, NULL,
 true, true, true,
 'number', '{"min": 0}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le temps en minutes', false, false,
 NULL, NULL, NULL, NULL, 'Temps écoulé en minutes',
 true, 270,
 NULL, NULL, NULL);

COMMIT;

-- Verification query
SELECT 
    column_name,
    column_label,
    data_type,
    data_is_filterable,
    filter_type,
    form_field_type
FROM administration.table_metadata
WHERE table_name = 'tickets' AND object_name = 'Change'
ORDER BY form_order;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Table metadata for CHANGE tickets populated successfully!';
END $$;
