-- =====================================================
-- Script: 17_populate_table_metadata_project.sql
-- Description: Populate table_metadata for PROJECT tickets (core.tickets table)
--              Includes project-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-30
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Project'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Project';

-- Insert column-level metadata for PROJECT tickets (common fields + specific fields)
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
('tickets', 'Project', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du projet',
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
('tickets', 'Project', NULL, NULL, 'title', 'project.name', 'Nom du projet',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le nom du projet', true, false,
 NULL, NULL, NULL, NULL, 'Nom descriptif du projet',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Project', NULL, NULL, 'description', 'project.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez le projet en détail', false, false,
 NULL, NULL, NULL, NULL, 'Description complète du projet',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Project', NULL, NULL, 'ticket_type_code', 'project.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (PROJECT)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Project', NULL, NULL, 'ticket_status_code', 'project.status', 'Statut du projet',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel du projet',
 true, 40,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Project', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le projet',
 true, 50,
 NULL, NULL, NULL),

-- assigned_to_group (relation via core.rel_tickets_groups_persons)
('tickets', 'Project', NULL, NULL, 'assigned_to_group', 'project.team_id', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'project.team_id_placeholder', true, false,
 'groups', 'group_name', 'uuid', false, 'Équipe en charge du projet',
 true, 60,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Project', NULL, NULL, 'assigned_to_person', 'project.lead_user_id', 'Chef de projet',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'project.lead_user_id_placeholder', true, false,
 'persons', 'person_name', 'uuid', true, 'Chef de projet assigné',
 true, 70,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Project', NULL, NULL, 'created_at', 'common.created_at', 'Date de création du projet',
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
('tickets', 'Project', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
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
('tickets', 'Project', NULL, NULL, 'closed_at', 'common.closed_at', 'Date de fermeture du projet',
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
('tickets', 'Project', NULL, NULL, 'core_extended_attributes', 'project.core_attributes', 'Attributs étendus système',
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
('tickets', 'Project', NULL, NULL, 'user_extended_attributes', 'project.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 120,
 NULL, NULL, NULL),

-- key (JSONB field)
('tickets', 'Project', NULL, NULL, 'key', 'project.key', 'Code unique du projet',
 'text', true, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le code du projet', true, false,
 NULL, NULL, NULL, NULL, 'Code unique identifiant le projet',
 true, 130,
 NULL, NULL, NULL),

-- start_date (JSONB field)
('tickets', 'Project', NULL, NULL, 'start_date', 'project.start_date', 'Date de début du projet',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de début', false, false,
 NULL, NULL, NULL, NULL, 'Date de début prévue/effective',
 true, 140,
 NULL, NULL, NULL),

-- end_date (JSONB field)
('tickets', 'Project', NULL, NULL, 'end_date', 'project.end_date', 'Date de fin du projet',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Sélectionnez la date de fin', false, false,
 NULL, NULL, NULL, NULL, 'Date de fin prévue/effective',
 true, 150,
 NULL, NULL, NULL),

-- visibility (JSONB field)
('tickets', 'Project', NULL, NULL, 'visibility', 'project.visibility', 'Niveau de visibilité',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.project_setup_codes', 'code',
 true, 'translations.project_setup_label', 'rel_project_setup_code', 'label',
 'sSelectField', 'Sélectionnez la visibilité', false, false,
 'project_setup?metadata=VISIBILITY', 'label', 'code', false, 'Niveau de visibilité du projet',
 true, 160,
 NULL, NULL, NULL),

-- project_type (JSONB field)
('tickets', 'Project', NULL, NULL, 'project_type', 'project.project_type', 'Type de projet',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.project_setup_codes', 'code',
 true, 'translations.project_setup_label', 'rel_project_setup_code', 'label',
 'sSelectField', 'Sélectionnez le type de projet', false, false,
 'project_setup?metadata=CATEGORY', 'label', 'code', false, 'Catégorie du projet',
 true, 170,
 NULL, NULL, NULL),

-- issue_type_scheme_id (JSONB field)
('tickets', 'Project', NULL, NULL, 'issue_type_scheme_id', 'project.issue_type_scheme_id', 'Schéma des types de tickets',
 'text', true, NULL,
 true, false, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.symptoms', 'code',
 true, 'translations.symptoms_translation', 'symptom_code', 'label',
 'sPickList', 'Sélectionnez les symptômes', false, false,
 'symptoms', 'label', 'code', false, 'Types de tickets autorisés dans le projet',
 true, 180,
 NULL, NULL, NULL);

COMMIT;
