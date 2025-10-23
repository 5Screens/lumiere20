-- =====================================================
-- Script: 17_populate_table_metadata.sql
-- Description: Populate table_metadata for configuration.persons and core.tickets tables
--              Includes multilingual support configuration
-- Author: System
-- Date: 2024-09-24
-- Updated: 2025-10-21 - Added multilingual support
-- =====================================================

BEGIN;

-- Clean existing metadata for persons table
DELETE FROM administration.table_metadata WHERE table_name = 'persons';

-- Insert column-level metadata for configuration.persons
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
('persons', 'Person', NULL, NULL, 'uuid', 'person.uuid', 'Identifiant unique',
 'uuid', false, 'uuid_generate_v4()',
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 0,
 NULL, NULL, NULL),

-- first_name
('persons', 'Person', NULL, NULL, 'first_name', 'person.first_name', 'Prénom de la personne',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le prénom', true, false,
 NULL, NULL, NULL, NULL, 'Prénom de la personne',
 true, 10,
 NULL, NULL, NULL),

-- last_name
('persons', 'Person', NULL, NULL, 'last_name', 'person.last_name', 'Nom de famille de la personne',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Entrez le nom', true, false,
 NULL, NULL, NULL, NULL, 'Nom de famille',
 true, 20,
 NULL, NULL, NULL),

-- job_role
('persons', 'Person', NULL, NULL, 'job_role', 'person.job_role', 'Rôle/Fonction dans l''organisation',
 'string', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Fonction occupée', false, false,
 NULL, NULL, NULL, NULL, 'Fonction ou rôle dans l''entreprise',
 true, 30,
 NULL, NULL, NULL),

-- ref_entity_uuid
('persons', 'Person', NULL, NULL, 'ref_entity_uuid', 'person.entity', 'Entité d''appartenance',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.entities', 'uuid',
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez une entité', false, false,
 'entities', 'name', 'uuid', true, 'Entité d''appartenance',
 true, 40,
 NULL, NULL, NULL),

-- email
('persons', 'Person', NULL, NULL, 'email', 'person.email', 'Adresse email professionnelle',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'email@example.com', true, false,
 NULL, NULL, NULL, NULL, 'Email professionnel unique',
 true, 50,
 NULL, NULL, NULL),

-- active
('persons', 'Person', NULL, NULL, 'active', 'person.active', 'Statut actif/inactif',
 'boolean', true, 'true',
 true, true, true,
 'checkbox', '{"trueLabel": "Actif", "falseLabel": "Inactif"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Indique si la personne est active',
 true, 60,
 NULL, NULL, NULL),

-- critical_user
('persons', 'Person', NULL, NULL, 'critical_user', 'person.critical_user', 'Utilisateur avec privilèges critiques',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Critique", "falseLabel": "Standard"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Utilisateur avec accès critiques',
 true, 70,
 NULL, NULL, NULL),

-- external_user
('persons', 'Person', NULL, NULL, 'external_user', 'person.external_user', 'Utilisateur externe à l''organisation',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Externe", "falseLabel": "Interne"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Utilisateur externe',
 true, 80,
 NULL, NULL, NULL),

-- ref_location_uuid
('persons', 'Person', NULL, NULL, 'ref_location_uuid', 'person.location', 'Localisation physique',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.locations', 'uuid',
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez une localisation', false, false,
 'locations', 'name', 'uuid', true, 'Localisation physique',
 true, 90,
 NULL, NULL, NULL),

-- floor
('persons', 'Person', NULL, NULL, 'floor', 'person.floor', 'Étage du bâtiment',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 1, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Ex: 3ème étage', false, false,
 NULL, NULL, NULL, NULL, 'Étage',
 true, 100,
 NULL, NULL, NULL),

-- room
('persons', 'Person', NULL, NULL, 'room', 'person.room', 'Numéro de bureau/salle',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 1, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Ex: B-301', false, false,
 NULL, NULL, NULL, NULL, 'Numéro de bureau',
 true, 110,
 NULL, NULL, NULL),

-- ref_approving_manager_uuid
('persons', 'Person', NULL, NULL, 'ref_approving_manager_uuid', 'person.approving_manager', 'Manager approbateur',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un manager', false, false,
 'persons', 'person_name', 'uuid', true, 'Manager approbateur',
 true, 120,
 NULL, NULL, NULL),

-- business_phone
('persons', 'Person', NULL, NULL, 'business_phone', 'person.business_phone', 'Numéro de téléphone fixe',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', '+33 1 23 45 67 89', false, false,
 NULL, NULL, NULL, NULL, 'Téléphone fixe professionnel',
 true, 130,
 NULL, NULL, NULL),

-- business_mobile_phone
('persons', 'Person', NULL, NULL, 'business_mobile_phone', 'person.business_mobile_phone', 'Numéro de mobile professionnel',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', '+33 6 12 34 56 78', false, false,
 NULL, NULL, NULL, NULL, 'Mobile professionnel',
 true, 140,
 NULL, NULL, NULL),

-- personal_mobile_phone
('persons', 'Person', NULL, NULL, 'personal_mobile_phone', 'person.personal_mobile_phone', 'Numéro de mobile personnel',
 'string', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', '+33 6 12 34 56 78', false, false,
 NULL, NULL, NULL, NULL, 'Mobile personnel (confidentiel)',
 true, 150,
 NULL, NULL, NULL),

-- language
('persons', 'Person', NULL, NULL, 'language', 'person.language', 'Langue préférée',
 'string', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez une langue', false, false,
 NULL, NULL, NULL, NULL, 'Langue d''interface préférée',
 true, 160,
 NULL, NULL, NULL),

-- notification
('persons', 'Person', NULL, NULL, 'notification', 'person.notification', 'Recevoir les notifications',
 'boolean', true, 'true',
 true, true, true,
 'checkbox', '{"trueLabel": "Activées", "falseLabel": "Désactivées"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Recevoir les notifications par email',
 true, 170,
 NULL, NULL, NULL),

-- time_zone
('persons', 'Person', NULL, NULL, 'time_zone', 'person.time_zone', 'Fuseau horaire de l''utilisateur',
 'string', true, NULL,
 true, true, true,
 'select', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez un fuseau horaire', false, false,
 NULL, NULL, NULL, NULL, 'Fuseau horaire pour l''affichage des dates',
 true, 180,
 NULL, NULL, NULL),

-- date_format
('persons', 'Person', NULL, NULL, 'date_format', 'person.date_format', 'Format d''affichage des dates',
 'string', true, NULL,
 true, false, true,
 'select', '{"options": ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sSelectField', 'Sélectionnez un format', false, false,
 NULL, NULL, NULL, NULL, 'Format préféré pour l''affichage des dates',
 true, 190,
 NULL, NULL, NULL),

-- internal_id
('persons', 'Person', NULL, NULL, 'internal_id', 'person.internal_id', 'Identifiant interne/matricule',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sTextField', 'Matricule employé', false, false,
 NULL, NULL, NULL, NULL, 'Identifiant interne ou matricule',
 true, 200,
 NULL, NULL, NULL),

-- password (hidden in lists, shown in forms)
('persons', 'Person', NULL, NULL, 'password', 'person.password', 'Mot de passe de connexion',
 'string', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sPasswordField', 'Entrez le mot de passe', false, false,
 NULL, NULL, NULL, NULL, 'Mot de passe sécurisé',
 true, 210,
 NULL, NULL, NULL),

-- password_needs_reset
('persons', 'Person', NULL, NULL, 'password_needs_reset', 'person.password_needs_reset', 'Le mot de passe doit être changé',
 'boolean', true, 'false',
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Force le changement de mot de passe à la prochaine connexion',
 true, 220,
 NULL, NULL, NULL),

-- locked_out
('persons', 'Person', NULL, NULL, 'locked_out', 'person.locked_out', 'Compte verrouillé',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Verrouillé", "falseLabel": "Déverrouillé"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, NULL, 'Compte verrouillé suite à tentatives de connexion échouées',
 true, 230,
 NULL, NULL, NULL),

-- roles (JSONB field)
('persons', 'Person', NULL, NULL, 'roles', 'person.roles', 'Rôles et permissions',
 'json', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, NULL, 'Rôles et permissions JSON',
 true, 240,
 NULL, NULL, NULL),

-- photo
('persons', 'Person', NULL, NULL, 'photo', 'person.photo', 'Photo de profil',
 'string', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 'sFileUploader', 'Télécharger une photo', false, false,
 NULL, NULL, NULL, NULL, 'Photo de profil (base64 ou URL)',
 true, 250,
 NULL, NULL, NULL),

-- created_at
('persons', 'Person', NULL, NULL, 'created_at', 'person.created_at', 'Date de création',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 260,
 NULL, NULL, NULL),

-- updated_at
('persons', 'Person', NULL, NULL, 'updated_at', 'person.updated_at', 'Date de dernière modification',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 false, NULL, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL, NULL,
 false, 270,
 NULL, NULL, NULL);

-- =====================================================
-- TICKETS TABLE METADATA
-- =====================================================
-- Note: This metadata applies to ALL ticket types (TASK, INCIDENT, PROBLEM, CHANGE, etc.)
-- since they all share the same core.tickets table

-- Clean existing metadata for tickets table
DELETE FROM administration.table_metadata WHERE table_name = 'tickets';

-- Insert column-level metadata for core.tickets
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
 true, false, false,
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
