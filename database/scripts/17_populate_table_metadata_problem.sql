-- =====================================================
-- Script: 17_populate_table_metadata_problem.sql
-- Description: Populate table_metadata for PROBLEM tickets (core.tickets table)
--              Includes problem-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-26
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Problem'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Problem';

-- Insert column-level metadata for PROBLEM tickets (common fields + specific fields)
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
('tickets', 'Problem', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du ticket',
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
('tickets', 'Problem', NULL, NULL, 'title', 'problem.title', 'Titre du problème',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre du problème', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif du problème',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Problem', NULL, NULL, 'description', 'problem.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextArea', 'Décrivez le problème en détail', false, false,
 NULL, NULL, NULL, NULL, 'Description complète du problème',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Problem', NULL, NULL, 'ticket_type_code', 'problem.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (PROBLEM)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Problem', NULL, NULL, 'ticket_status_code', 'problem.status', 'Statut du problème',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel du problème',
 true, 40,
 NULL, NULL, NULL),

-- requested_by_uuid
('tickets', 'Problem', NULL, NULL, 'requested_by_uuid', 'problem.requested_by', 'Demandé par',
 'uuid', true, NULL,
 true, false, false,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant fait la demande',
 true, 50,
 NULL, NULL, NULL),

-- requested_for_uuid
('tickets', 'Problem', NULL, NULL, 'requested_for_uuid', 'problem.requested_for', 'Demandé pour',
 'uuid', true, NULL,
 true, false, false,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne bénéficiaire de la demande',
 true, 60,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Problem', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le problème',
 true, 70,
 NULL, NULL, NULL),

-- assigned_to_group (relation via core.rel_tickets_groups_persons)
('tickets', 'Problem', NULL, NULL, 'assigned_to_group', 'problem.assigned_group', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'problem.assigned_group_placeholder', false, false,
 'groups', 'group_name', 'uuid', false, 'Équipe en charge du problème',
 true, 75,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Problem', NULL, NULL, 'assigned_to_person', 'problem.assigned_to_person', 'Personne assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'problem.assigned_to_person_placeholder', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne assignée au problème',
 true, 76,
 NULL, NULL, NULL),

-- configuration_item_uuid
('tickets', 'Problem', NULL, NULL, 'configuration_item_uuid', 'problem.configuration_item', 'Élément de configuration',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.configuration_items', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un CI', false, false,
 'configuration_items', 'name', 'uuid', true, 'CI concerné par le problème',
 true, 80,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Problem', NULL, NULL, 'created_at', 'common.created_at', 'Date de création du problème',
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
('tickets', 'Problem', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
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
('tickets', 'Problem', NULL, NULL, 'closed_at', 'problem.closed_at', 'Date de fermeture du problème',
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
('tickets', 'Problem', NULL, NULL, 'core_extended_attributes', 'problem.core_attributes', 'Attributs étendus système',
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
('tickets', 'Problem', NULL, NULL, 'user_extended_attributes', 'problem.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 130,
 NULL, NULL, NULL),

-- rel_problem_categories_code (JSONB field)
('tickets', 'Problem', NULL, NULL, 'rel_problem_categories_code', 'problem.category', 'Catégorie du problème',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.problem_categories', 'code',
 true, 'translations.problem_categories_labels', 'rel_problem_category_code', 'label',
 'sSelectField', 'Sélectionnez la catégorie', true, false,
 'problem_categories', 'label', 'code', false, 'Catégorie de classification du problème',
 true, 140,
 NULL, NULL, NULL),

-- impact (JSONB field)
('tickets', 'Problem', NULL, NULL, 'impact', 'problem.impact', 'Niveau d''impact du problème',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''impact', true, false,
 'incident_setup?metadata=IMPACT', 'label', 'code', false, 'Niveau d''impact sur l''organisation',
 true, 141,
 NULL, NULL, NULL),

-- urgency (JSONB field)
('tickets', 'Problem', NULL, NULL, 'urgency', 'problem.urgency', 'Niveau d''urgence du problème',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''urgence', true, false,
 'incident_setup?metadata=URGENCY', 'label', 'code', false, 'Niveau d''urgence de résolution',
 true, 142,
 NULL, NULL, NULL),

-- rel_service (JSONB field)
('tickets', 'Problem', NULL, NULL, 'rel_service', 'problem.service', 'Service impacté',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.services', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un service', false, false,
 'services', 'name', 'uuid', false, 'Service métier impacté',
 true, 143,
 NULL, NULL, NULL),

-- rel_service_offerings (JSONB field)
('tickets', 'Problem', NULL, NULL, 'rel_service_offerings', 'problem.service_offerings', 'Offre de service impactée',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.service_offerings', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une offre', false, false,
 'service_offerings', 'name', 'uuid', false, 'Offre de service impactée',
 true, 144,
 NULL, NULL, NULL),

-- symptoms_description (JSONB field)
('tickets', 'Problem', NULL, NULL, 'symptoms_description', 'problem.symptoms_description', 'Description des symptômes',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez les symptômes observés', false, false,
 NULL, NULL, NULL, NULL, 'Description détaillée des symptômes',
 true, 145,
 NULL, NULL, NULL),

-- workaround (JSONB field)
('tickets', 'Problem', NULL, NULL, 'workaround', 'problem.workaround', 'Solution de contournement',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez la solution de contournement', false, false,
 NULL, NULL, NULL, NULL, 'Solution temporaire en attendant la résolution',
 true, 146,
 NULL, NULL, NULL),

-- root_cause (JSONB field)
('tickets', 'Problem', NULL, NULL, 'root_cause', 'problem.root_cause', 'Cause racine',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez la cause racine identifiée', false, false,
 NULL, NULL, NULL, NULL, 'Cause racine du problème',
 true, 147,
 NULL, NULL, NULL),

-- definitive_solution (JSONB field)
('tickets', 'Problem', NULL, NULL, 'definitive_solution', 'problem.definitive_solution', 'Solution définitive',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez la solution définitive', false, false,
 NULL, NULL, NULL, NULL, 'Solution permanente mise en place',
 true, 148,
 NULL, NULL, NULL),

-- target_resolution_date (JSONB field)
('tickets', 'Problem', NULL, NULL, 'target_resolution_date', 'problem.target_resolution_date', 'Date de résolution cible',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date cible', false, false,
 NULL, NULL, NULL, NULL, 'Date de résolution prévue',
 true, 149,
 NULL, NULL, NULL),

-- actual_resolution_date (JSONB field)
('tickets', 'Problem', NULL, NULL, 'actual_resolution_date', 'problem.actual_resolution_date', 'Date de résolution réelle',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date réelle', false, false,
 NULL, NULL, NULL, NULL, 'Date de résolution effective',
 true, 150,
 NULL, NULL, NULL),

-- actual_resolution_workload (JSONB field)
('tickets', 'Problem', NULL, NULL, 'actual_resolution_workload', 'problem.actual_resolution_workload', 'Charge de travail réelle',
 'numeric', true, NULL,
 true, true, true,
 'search', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez la charge en heures', false, false,
 NULL, NULL, NULL, NULL, 'Charge de travail en heures',
 true, 151,
 NULL, NULL, NULL),

-- closure_justification (JSONB field)
('tickets', 'Problem', NULL, NULL, 'closure_justification', 'problem.closure_justification', 'Justification de clôture',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Justifiez la clôture du problème', false, false,
 NULL, NULL, NULL, NULL, 'Justification de la clôture',
 true, 152,
 NULL, NULL, NULL);

COMMIT;
