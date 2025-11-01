-- =====================================================
-- Script: 17_populate_table_metadata_defect.sql
-- Description: Populate table_metadata for DEFECT tickets (core.tickets table)
--              Includes defect-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-11-01
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Defect'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Defect';

-- Insert column-level metadata for DEFECT tickets (common fields + specific fields)
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
('tickets', 'Defect', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du défaut',
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
('tickets', 'Defect', NULL, NULL, 'title', 'defect.title', 'Titre du défaut',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre du défaut', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif du défaut',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Defect', NULL, NULL, 'description', 'defect.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez le défaut en détail', true, false,
 NULL, NULL, NULL, NULL, 'Description complète du défaut',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Defect', NULL, NULL, 'ticket_type_code', 'defect.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (DEFECT)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Defect', NULL, NULL, 'ticket_status_code', 'defect.status', 'Statut du défaut',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut actuel du défaut',
 true, 40,
 NULL, NULL, NULL),

-- requested_by_uuid
('tickets', 'Defect', NULL, NULL, 'requested_by_uuid', 'defect.reported_by', 'Rapporté par',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant rapporté le défaut',
 true, 50,
 NULL, NULL, NULL),

-- requested_for_uuid
('tickets', 'Defect', NULL, NULL, 'requested_for_uuid', 'defect.detected_by', 'Détecté par',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant détecté le défaut',
 true, 60,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Defect', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé le défaut',
 true, 70,
 NULL, NULL, NULL),

-- assigned_to_group (relation via core.rel_tickets_groups_persons)
('tickets', 'Defect', NULL, NULL, 'assigned_to_group', 'defect.team_id', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Sélectionnez une équipe', false, false,
 'groups', 'group_name', 'uuid', false, 'Équipe en charge du défaut',
 true, 75,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Defect', NULL, NULL, 'assigned_to_person', 'defect.assigned_to_person', 'Personne assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Sélectionnez une personne', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne assignée au défaut',
 true, 76,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Defect', NULL, NULL, 'created_at', 'common.created_at', 'Date de création du défaut',
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
('tickets', 'Defect', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
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
('tickets', 'Defect', NULL, NULL, 'closed_at', 'defect.closed_at', 'Date de fermeture du défaut',
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
('tickets', 'Defect', NULL, NULL, 'core_extended_attributes', 'defect.core_attributes', 'Attributs étendus système',
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
('tickets', 'Defect', NULL, NULL, 'user_extended_attributes', 'defect.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 130,
 NULL, NULL, NULL),

-- severity (JSONB field)
('tickets', 'Defect', NULL, NULL, 'severity', 'defect.severity', 'Sévérité du défaut',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.defect_setup_codes', 'code',
 true, 'translations.defect_setup_labels', 'rel_defect_setup_code', 'label',
 'sSelectField', 'Sélectionnez la sévérité', true, false,
 'defect_setup?metadata=SEVERITY', 'label', 'code', false, 'Niveau de sévérité du défaut',
 true, 140,
 NULL, NULL, NULL),

-- environment (JSONB field)
('tickets', 'Defect', NULL, NULL, 'environment', 'defect.environment', 'Environnement',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.defect_setup_codes', 'code',
 true, 'translations.defect_setup_labels', 'rel_defect_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''environnement', true, false,
 'defect_setup?metadata=ENVIRONMENT', 'label', 'code', false, 'Environnement où le défaut a été détecté',
 true, 141,
 NULL, NULL, NULL),

-- impact_area (JSONB field)
('tickets', 'Defect', NULL, NULL, 'impact_area', 'defect.impact_area', 'Zone d''impact',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.defect_setup_codes', 'code',
 true, 'translations.defect_setup_labels', 'rel_defect_setup_code', 'label',
 'sSelectField', 'Sélectionnez la zone d''impact', true, false,
 'defect_setup?metadata=IMPACT', 'label', 'code', false, 'Zone fonctionnelle impactée',
 true, 142,
 NULL, NULL, NULL),

-- steps_to_reproduce (JSONB field)
('tickets', 'Defect', NULL, NULL, 'steps_to_reproduce', 'defect.steps_to_reproduce', 'Étapes pour reproduire',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez les étapes', false, false,
 NULL, NULL, NULL, NULL, 'Étapes détaillées pour reproduire le défaut',
 true, 143,
 NULL, NULL, NULL),

-- expected_behavior (JSONB field)
('tickets', 'Defect', NULL, NULL, 'expected_behavior', 'defect.expected_behavior', 'Comportement attendu',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez le comportement attendu', false, false,
 NULL, NULL, NULL, NULL, 'Comportement attendu du système',
 true, 144,
 NULL, NULL, NULL),

-- workaround (JSONB field)
('tickets', 'Defect', NULL, NULL, 'workaround', 'defect.workaround', 'Solution de contournement',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez la solution de contournement', false, false,
 NULL, NULL, NULL, NULL, 'Solution temporaire pour contourner le défaut',
 true, 145,
 NULL, NULL, NULL),

-- tags (JSONB field - array)
('tickets', 'Defect', NULL, NULL, 'tags', 'defect.tags', 'Tags associés',
 'text', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTagsList', 'Ajoutez des tags', false, false,
 NULL, NULL, NULL, NULL, 'Tags pour catégoriser le défaut',
 true, 146,
 NULL, NULL, NULL),

-- project_id (relation via core.rel_parent_child_tickets)
('tickets', 'Defect', NULL, NULL, 'project_id', 'defect.project_id', 'Projet associé',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un projet', true, false,
 'tickets?ticket_type=PROJECT', 'title', 'uuid', false, 'Projet auquel appartient le défaut',
 true, 147,
 NULL, NULL, NULL);

COMMIT;
