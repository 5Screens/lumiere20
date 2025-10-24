-- =====================================================
-- Script: 17_populate_table_metadata_incident.sql
-- Description: Populate table_metadata for INCIDENT tickets (core.tickets table)
--              Includes incident-specific fields stored in core_extended_attributes JSONB
-- Author: System
-- Date: 2024-09-24
-- Updated: 2025-10-24 - Split from main metadata file
-- =====================================================

BEGIN;

-- Clean existing metadata for tickets table with object_name = 'Incident'
DELETE FROM administration.table_metadata WHERE table_name = 'tickets' AND object_name = 'Incident';

-- Insert column-level metadata for INCIDENT-specific fields
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
-- impact (JSONB field)
('tickets', 'Incident', NULL, NULL, 'impact', 'incident.impact', 'Niveau d''impact de l''incident',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''impact', true, false,
 'incident_setup?metadata=IMPACT', 'label', 'code', false, 'Niveau d''impact sur l''organisation',
 true, 140,
 NULL, NULL, NULL),

-- urgency (JSONB field)
('tickets', 'Incident', NULL, NULL, 'urgency', 'incident.urgency', 'Niveau d''urgence de l''incident',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez l''urgence', true, false,
 'incident_setup?metadata=URGENCY', 'label', 'code', false, 'Niveau d''urgence de résolution',
 true, 141,
 NULL, NULL, NULL),

-- priority (JSONB field)
('tickets', 'Incident', NULL, NULL, 'priority', 'incident.priority', 'Priorité calculée de l''incident',
 'integer', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sSelectField', 'Priorité', false, false,
 'incident_priorities', 'priority', 'priority', false, 'Priorité basée sur impact et urgence',
 true, 142,
 NULL, NULL, NULL),

-- cause_code (JSONB field)
('tickets', 'Incident', NULL, NULL, 'cause_code', 'incident.cause_code', 'Code de cause de l''incident',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez la cause', false, false,
 'incident_setup?metadata=CAUSE_CODE', 'label', 'code', false, 'Cause identifiée de l''incident',
 true, 143,
 NULL, NULL, NULL),

-- resolution_code (JSONB field)
('tickets', 'Incident', NULL, NULL, 'resolution_code', 'incident.resolution_code', 'Code de résolution de l''incident',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.incident_setup_codes', 'code',
 true, 'translations.incident_setup_labels', 'rel_incident_setup_code', 'label',
 'sSelectField', 'Sélectionnez la résolution', false, false,
 'incident_setup?metadata=RESOLUTION_CODE', 'label', 'code', false, 'Type de résolution appliquée',
 true, 144,
 NULL, NULL, NULL),

-- contact_type (JSONB field)
('tickets', 'Incident', NULL, NULL, 'contact_type', 'incident.contact_type', 'Type de contact initial',
 'text', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.contact_types', 'code',
 true, 'translations.contact_types_labels', 'rel_contact_type_code', 'label',
 'sSelectField', 'Sélectionnez le type de contact', false, false,
 'contact_types', 'label', 'code', false, 'Moyen de contact initial',
 true, 145,
 NULL, NULL, NULL),

-- symptoms_uuid (JSONB field)
('tickets', 'Incident', NULL, NULL, 'symptoms_uuid', 'incident.symptoms', 'Symptôme de l''incident',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.symptoms', 'uuid',
 true, 'translations.symptoms_translation', 'symptom_code', 'label',
 'sSelectField', 'Sélectionnez le symptôme', false, false,
 'symptoms', 'label', 'uuid', false, 'Symptôme observé',
 true, 146,
 NULL, NULL, NULL),

-- rel_service (JSONB field)
('tickets', 'Incident', NULL, NULL, 'rel_service', 'incident.service', 'Service impacté',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.services', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un service', false, false,
 'services', 'name', 'uuid', false, 'Service métier impacté',
 true, 147,
 NULL, NULL, NULL),

-- rel_service_offerings (JSONB field)
('tickets', 'Incident', NULL, NULL, 'rel_service_offerings', 'incident.service_offerings', 'Offre de service impactée',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'data.service_offerings', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez une offre', false, false,
 'service_offerings', 'name', 'uuid', false, 'Offre de service impactée',
 true, 148,
 NULL, NULL, NULL),

-- rel_problem_id (relation via core.rel_parent_child_tickets)
('tickets', 'Incident', NULL, NULL, 'rel_problem_id', 'incident.problem_id', 'Problème lié',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un problème', false, false,
 'tickets?ticket_type=PROBLEM', 'title', 'uuid', true, 'Problème connu lié à cet incident',
 true, 149,
 NULL, NULL, NULL),

-- rel_change_request (relation via core.rel_parent_child_tickets)
('tickets', 'Incident', NULL, NULL, 'rel_change_request', 'incident.change_request', 'Demande de changement liée',
 'uuid', true, NULL,
 true, false, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'core.tickets', 'uuid',
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un changement', false, false,
 'tickets?ticket_type=CHANGE', 'title', 'uuid', true, 'Changement à l''origine de l''incident',
 true, 150,
 NULL, NULL, NULL);

COMMIT;
