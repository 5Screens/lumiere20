-- =====================================================
-- Script: 17_populate_table_metadata_knowledge.sql
-- Description: Populate table_metadata for KNOWLEDGE tickets (core.tickets table)
--              Includes knowledge-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2025-10-29
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Knowledge_article'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Knowledge_article';

-- Insert column-level metadata for KNOWLEDGE tickets (common fields + specific fields)
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
('tickets', 'Knowledge_article', NULL, NULL, 'uuid', 'common.uuid', 'Identifiant unique du ticket',
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
('tickets', 'Knowledge_article', NULL, NULL, 'title', 'knowledge_article.title', 'Titre de l''article',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le titre de l''article', true, false,
 NULL, NULL, NULL, NULL, 'Titre descriptif de l''article de connaissance',
 true, 10,
 NULL, NULL, NULL),

-- description
('tickets', 'Knowledge_article', NULL, NULL, 'description', 'knowledge_article.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Décrivez l''article en détail', true, false,
 NULL, NULL, NULL, NULL, 'Description complète de l''article',
 true, 20,
 NULL, NULL, NULL),

-- ticket_type_code
('tickets', 'Knowledge_article', NULL, NULL, 'ticket_type_code', 'knowledge_article.type', 'Type de ticket',
 'text', false, NULL,
 true, true, false,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', false, 'Type de ticket (KNOWLEDGE)',
 true, 30,
 NULL, NULL, NULL),

-- ticket_status_code
('tickets', 'Knowledge_article', NULL, NULL, 'ticket_status_code', 'knowledge_article.publication_status', 'Statut de publication',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 true, 'translations.ticket_status_translation', 'ticket_status_uuid', 'label',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', false, 'Statut de publication de l''article',
 true, 40,
 NULL, NULL, NULL),

-- writer_uuid
('tickets', 'Knowledge_article', NULL, NULL, 'writer_uuid', 'common.writer_name', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'person_name', 'uuid', true, 'Personne ayant créé l''article',
 true, 50,
 NULL, NULL, NULL),

-- assigned_to_group (relation via core.rel_tickets_groups_persons)
('tickets', 'Knowledge_article', NULL, NULL, 'assigned_to_group', 'knowledge_article.assigned_group', 'Équipe assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.groups', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'knowledge_article.assigned_group_placeholder', true, false,
 'groups', 'group_name', 'uuid', false, 'Équipe responsable de l''article',
 true, 60,
 NULL, NULL, NULL),

-- assigned_to_person (relation via core.rel_tickets_groups_persons)
('tickets', 'Knowledge_article', NULL, NULL, 'assigned_to_person', 'knowledge_article.assigned_to_person', 'Personne assignée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'knowledge_article.assigned_to_person_placeholder', false, false,
 'persons', 'person_name', 'uuid', true, 'Personne responsable de l''article',
 true, 70,
 NULL, NULL, NULL),

-- configuration_item_uuid
('tickets', 'Knowledge_article', NULL, NULL, 'configuration_item_uuid', 'knowledge_article.configuration_item', 'Élément de configuration',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.configuration_items', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un CI', false, false,
 'configuration_items', 'name', 'uuid', true, 'CI concerné par l''article',
 true, 80,
 NULL, NULL, NULL),

-- created_at
('tickets', 'Knowledge_article', NULL, NULL, 'created_at', 'common.created_at', 'Date de création',
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
('tickets', 'Knowledge_article', NULL, NULL, 'updated_at', 'common.updated_at', 'Date de dernière modification',
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
('tickets', 'Knowledge_article', NULL, NULL, 'closed_at', 'knowledge_article.closed_at', 'Date de fermeture',
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
('tickets', 'Knowledge_article', NULL, NULL, 'core_extended_attributes', 'knowledge_article.core_attributes', 'Attributs étendus système',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Attributs étendus gérés par le système',
 false, 120,
 NULL, NULL, NULL),

-- rel_category (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_category', 'knowledge_article.category', 'Catégorie de l''article',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.knowledge_setup_codes', 'code',
 true, 'translations.knowledge_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez la catégorie', true, false,
 'knowledge_setup?metadata=CATEGORY', 'label', 'code', false, 'Catégorie de classification',
 true, 130,
 NULL, NULL, NULL),

-- keywords (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'keywords', 'knowledge_article.keywords', 'Mots-clés',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 2}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTagsList', 'Ajoutez des mots-clés', false, false,
 NULL, NULL, NULL, NULL, 'Mots-clés pour la recherche',
 true, 140,
 NULL, NULL, NULL),

-- rel_service (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_service', 'knowledge_article.service', 'Service concerné',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.services', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un service', false, false,
 'services', 'name', 'uuid', false, 'Service métier concerné',
 true, 150,
 NULL, NULL, NULL),

-- rel_service_offerings (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_service_offerings', 'knowledge_article.service_offerings', 'Offre de service',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.service_offerings', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une offre', false, false,
 'service_offerings', 'name', 'uuid', false, 'Offre de service concernée',
 true, 160,
 NULL, NULL, NULL),

-- rel_lang (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_lang', 'knowledge_article.lang', 'Langue de l''article',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'translations.languages', 'locale',
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez la langue', true, false,
 'languages?is_active=yes', 'label', 'locale', false, 'Langue de rédaction',
 true, 170,
 NULL, NULL, NULL),

-- rel_confidentiality_level (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_confidentiality_level', 'knowledge_article.confidentiality_level', 'Niveau de confidentialité',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.knowledge_setup_codes', 'code',
 true, 'translations.knowledge_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le niveau', true, false,
 'knowledge_setup?metadata=CONFIDENTIALITY_LEVEL', 'label', 'code', false, 'Niveau de confidentialité requis',
 true, 180,
 NULL, NULL, NULL),

-- rel_involved_process (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_involved_process', 'knowledge_article.involved_process', 'Processus concerné',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 true, 'translations.ticket_types_translation', 'ticket_type_uuid', 'label',
 'sSelectField', 'Sélectionnez le processus', false, false,
 'ticket_types', 'label', 'code', false, 'Processus ITSM concerné',
 true, 190,
 NULL, NULL, NULL),

-- summary (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'summary', 'knowledge_article.summary', 'Résumé',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Résumé de l''article', false, false,
 NULL, NULL, NULL, NULL, 'Résumé court de l''article',
 true, 200,
 NULL, NULL, NULL),

-- prerequisites (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'prerequisites', 'knowledge_article.prerequisites', 'Prérequis',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Prérequis nécessaires', false, false,
 NULL, NULL, NULL, NULL, 'Prérequis pour utiliser cet article',
 true, 210,
 NULL, NULL, NULL),

-- limitations (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'limitations', 'knowledge_article.limitations', 'Limitations',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Limitations connues', false, false,
 NULL, NULL, NULL, NULL, 'Limitations de l''article',
 true, 220,
 NULL, NULL, NULL),

-- security_notes (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'security_notes', 'knowledge_article.security_notes', 'Notes de sécurité',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sRichTextEditor', 'Notes de sécurité', false, false,
 NULL, NULL, NULL, NULL, 'Considérations de sécurité',
 true, 230,
 NULL, NULL, NULL),

-- version (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'version', 'knowledge_article.version', 'Version',
 'text', true, NULL,
 true, true, true,
 'search', '{"minChars": 1}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Version de l''article', true, false,
 NULL, NULL, NULL, NULL, 'Numéro de version',
 true, 240,
 NULL, NULL, NULL),

-- last_review_at (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'last_review_at', 'knowledge_article.last_review_at', 'Dernière révision',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Date de dernière révision', false, false,
 NULL, NULL, NULL, NULL, 'Date de la dernière révision',
 true, 250,
 NULL, NULL, NULL),

-- next_review_at (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'next_review_at', 'knowledge_article.next_review_at', 'Prochaine révision',
 'datetime', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sDatePicker', 'Date de prochaine révision', false, false,
 NULL, NULL, NULL, NULL, 'Date de la prochaine révision planifiée',
 true, 260,
 NULL, NULL, NULL),

-- license_type (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'license_type', 'knowledge_article.license_type', 'Type de licence',
 'text', true, NULL,
 true, true, true,
 'search', '{"minChars": 2}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Type de licence', false, false,
 NULL, NULL, NULL, NULL, 'Type de licence applicable',
 true, 270,
 NULL, NULL, NULL),

-- rel_target_audience (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'rel_target_audience', 'knowledge_article.target_audience', 'Public cible',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.knowledge_setup_codes', 'code',
 true, 'translations.knowledge_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le public cible', false, false,
 'knowledge_setup?metadata=TARGET_AUDIENCE', 'label', 'code', false, 'Public cible de l''article',
 true, 280,
 NULL, NULL, NULL),

-- business_scope (JSONB field)
('tickets', 'Knowledge_article', NULL, NULL, 'business_scope', 'knowledge_article.business_scope', 'Périmètre métier',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.knowledge_setup_codes', 'code',
 true, 'translations.knowledge_setup_label', 'rel_change_setup_code', 'label',
 'sSelectField', 'Sélectionnez le périmètre', false, false,
 'knowledge_setup?metadata=BUSINESS_SCOPE', 'label', 'code', false, 'Périmètre métier de l''article',
 true, 290,
 NULL, NULL, NULL);

COMMIT;
