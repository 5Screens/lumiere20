-- =====================================================
-- Script: 17_populate_table_metadata.sql
-- Description: Populate table_metadata for configuration.persons table
-- Author: System
-- Date: 2024-09-24
-- =====================================================

BEGIN;

-- Clean existing metadata for persons table
DELETE FROM administration.table_metadata WHERE table_name = 'persons';

-- Insert table-level metadata
INSERT INTO administration.table_metadata (
    table_name, table_label, table_description, 
    column_name, data_is_visible, data_is_sortable, data_is_filterable
) VALUES 
('persons', 'Personnes', 'Table des personnes/utilisateurs du système', NULL, true, false, false);

-- Insert column-level metadata for configuration.persons
INSERT INTO administration.table_metadata (
    table_name, column_name, column_label, column_description,
    data_type, data_is_nullable, data_default_value,
    data_is_visible, data_is_sortable, data_is_filterable,
    filter_type, filter_options,
    is_foreign_key, related_table, related_column,
    form_field_type, form_placeholder, form_required, form_readonly,
    form_endpoint, form_display_field, form_value_field, form_helper_text,
    form_visible, form_order
) VALUES 
-- uuid
('persons', 'uuid', 'person.uuid', 'Identifiant unique',
 'uuid', false, 'uuid_generate_v4()',
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 0),

-- first_name
('persons', 'first_name', 'person.first_name', 'Prénom de la personne',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Entrez le prénom', true, false,
 NULL, NULL, NULL, 'Prénom de la personne',
 true, 10),

-- last_name
('persons', 'last_name', 'person.last_name', 'Nom de famille de la personne',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Entrez le nom', true, false,
 NULL, NULL, NULL, 'Nom de famille',
 true, 20),

-- job_role
('persons', 'job_role', 'person.job_role', 'Rôle/Fonction dans l''organisation',
 'string', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Fonction occupée', false, false,
 NULL, NULL, NULL, 'Fonction ou rôle dans l''entreprise',
 true, 30),

-- ref_entity_uuid
('persons', 'ref_entity_uuid', 'person.entity', 'Entité d''appartenance',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.entities', 'uuid',
 'sSelectField', 'Sélectionnez une entité', false, false,
 'entities', 'name', 'uuid', 'Entité d''appartenance',
 true, 40),

-- email
('persons', 'email', 'person.email', 'Adresse email professionnelle',
 'string', false, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'email@example.com', true, false,
 NULL, NULL, NULL, 'Email professionnel unique',
 true, 50),

-- active
('persons', 'active', 'person.active', 'Statut actif/inactif',
 'boolean', true, 'true',
 true, true, true,
 'checkbox', '{"trueLabel": "Actif", "falseLabel": "Inactif"}'::jsonb,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Indique si la personne est active',
 true, 60),

-- critical_user
('persons', 'critical_user', 'person.critical_user', 'Utilisateur avec privilèges critiques',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Critique", "falseLabel": "Standard"}'::jsonb,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Utilisateur avec accès critiques',
 true, 70),

-- external_user
('persons', 'external_user', 'person.external_user', 'Utilisateur externe à l''organisation',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Externe", "falseLabel": "Interne"}'::jsonb,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Utilisateur externe',
 true, 80),

-- ref_location_uuid
('persons', 'ref_location_uuid', 'person.location', 'Localisation physique',
 'uuid', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 true, 'configuration.locations', 'uuid',
 'sSelectField', 'Sélectionnez une localisation', false, false,
 'locations', 'name', 'uuid', 'Localisation physique',
 true, 90),

-- floor
('persons', 'floor', 'person.floor', 'Étage du bâtiment',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 1, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Ex: 3ème étage', false, false,
 NULL, NULL, NULL, 'Étage',
 true, 100),

-- room
('persons', 'room', 'person.room', 'Numéro de bureau/salle',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 1, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Ex: B-301', false, false,
 NULL, NULL, NULL, 'Numéro de bureau',
 true, 110),

-- ref_approving_manager_uuid
('persons', 'ref_approving_manager_uuid', 'person.approving_manager', 'Manager approbateur',
 'uuid', true, NULL,
 true, true, true,
 'select', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 'sFilteredSearchField', 'Recherchez un manager', false, false,
 'persons', 'full_name', 'uuid', 'Manager approbateur',
 true, 120),

-- business_phone
('persons', 'business_phone', 'person.business_phone', 'Numéro de téléphone fixe',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', '+33 1 23 45 67 89', false, false,
 NULL, NULL, NULL, 'Téléphone fixe professionnel',
 true, 130),

-- business_mobile_phone
('persons', 'business_mobile_phone', 'person.business_mobile_phone', 'Numéro de mobile professionnel',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', '+33 6 12 34 56 78', false, false,
 NULL, NULL, NULL, 'Mobile professionnel',
 true, 140),

-- personal_mobile_phone
('persons', 'personal_mobile_phone', 'person.personal_mobile_phone', 'Numéro de mobile personnel',
 'string', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sTextField', '+33 6 12 34 56 78', false, false,
 NULL, NULL, NULL, 'Mobile personnel (confidentiel)',
 true, 150),

-- language
('persons', 'language', 'person.language', 'Langue préférée',
 'string', true, NULL,
 true, true, true,
 'checkbox', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 'sSelectField', 'Sélectionnez une langue', false, false,
 NULL, NULL, NULL, 'Langue d''interface préférée',
 true, 160),

-- notification
('persons', 'notification', 'person.notification', 'Recevoir les notifications',
 'boolean', true, 'true',
 true, true, true,
 'checkbox', '{"trueLabel": "Activées", "falseLabel": "Désactivées"}'::jsonb,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Recevoir les notifications par email',
 true, 170),

-- time_zone
('persons', 'time_zone', 'person.time_zone', 'Fuseau horaire de l''utilisateur',
 'string', true, NULL,
 true, true, true,
 'select', '{"multiple": false}'::jsonb,
 false, NULL, NULL,
 'sSelectField', 'Sélectionnez un fuseau horaire', false, false,
 NULL, NULL, NULL, 'Fuseau horaire pour l''affichage des dates',
 true, 180),

-- date_format
('persons', 'date_format', 'person.date_format', 'Format d''affichage des dates',
 'string', true, NULL,
 true, false, true,
 'select', '{"options": ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}'::jsonb,
 false, NULL, NULL,
 'sSelectField', 'Sélectionnez un format', false, false,
 NULL, NULL, NULL, 'Format préféré pour l''affichage des dates',
 true, 190),

-- internal_id
('persons', 'internal_id', 'person.internal_id', 'Identifiant interne/matricule',
 'string', true, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Matricule employé', false, false,
 NULL, NULL, NULL, 'Identifiant interne ou matricule',
 true, 200),

-- password (hidden in lists, shown in forms)
('persons', 'password', 'person.password', 'Mot de passe de connexion',
 'string', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sPasswordField', 'Entrez le mot de passe', false, false,
 NULL, NULL, NULL, 'Mot de passe sécurisé',
 true, 210),

-- password_needs_reset
('persons', 'password_needs_reset', 'person.password_needs_reset', 'Le mot de passe doit être changé',
 'boolean', true, 'false',
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Force le changement de mot de passe à la prochaine connexion',
 true, 220),

-- locked_out
('persons', 'locked_out', 'person.locked_out', 'Compte verrouillé',
 'boolean', true, 'false',
 true, true, true,
 'checkbox', '{"trueLabel": "Verrouillé", "falseLabel": "Déverrouillé"}'::jsonb,
 false, NULL, NULL,
 'sCheckbox', NULL, false, false,
 NULL, NULL, NULL, 'Compte verrouillé suite à tentatives de connexion échouées',
 true, 230),

-- roles (JSONB field)
('persons', 'roles', 'person.roles', 'Rôles et permissions',
 'json', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, 'Rôles et permissions JSON',
 true, 240),

-- photo
('persons', 'photo', 'person.photo', 'Photo de profil',
 'string', true, NULL,
 true, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sFileUploader', 'Télécharger une photo', false, false,
 NULL, NULL, NULL, 'Photo de profil (base64 ou URL)',
 true, 250),

-- created_at
('persons', 'created_at', 'person.created_at', 'Date de création',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 260),

-- updated_at
('persons', 'updated_at', 'person.updated_at', 'Date de dernière modification',
 'datetime', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 270);

-- =====================================================
-- TICKETS TABLE METADATA
-- =====================================================
-- Note: This metadata applies to ALL ticket types (TASK, INCIDENT, PROBLEM, CHANGE, etc.)
-- since they all share the same core.tickets table

-- Clean existing metadata for tickets table
DELETE FROM administration.table_metadata WHERE table_name = 'tickets';

-- Insert table-level metadata
INSERT INTO administration.table_metadata (
    table_name, table_label, table_description, 
    column_name, data_is_visible, data_is_sortable, data_is_filterable
) VALUES 
('tickets', 'Tickets', 'Table des tickets du système (TASK, INCIDENT, PROBLEM, CHANGE, etc.)', NULL, true, false, false);

-- Insert column-level metadata for core.tickets
INSERT INTO administration.table_metadata (
    table_name, column_name, column_label, column_description,
    data_type, data_is_nullable, data_default_value,
    data_is_visible, data_is_sortable, data_is_filterable,
    filter_type, filter_options,
    is_foreign_key, related_table, related_column,
    form_field_type, form_placeholder, form_required, form_readonly,
    form_endpoint, form_display_field, form_value_field, form_helper_text,
    form_visible, form_order
) VALUES 
-- uuid
('tickets', 'uuid', 'ticket.uuid', 'Identifiant unique du ticket',
 'uuid', false, 'uuid_generate_v4()',
 true, false, true,
 'search', '{"minChars": 8}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 0),

-- title
('tickets', 'title', 'ticket.title', 'Titre du ticket',
 'text', false, NULL,
 true, true, true,
 'search', '{"minChars": 2, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextField', 'Entrez le titre du ticket', true, false,
 NULL, NULL, NULL, 'Titre descriptif du ticket',
 true, 10),

-- description
('tickets', 'description', 'ticket.description', 'Description détaillée',
 'text', true, NULL,
 true, false, true,
 'search', '{"minChars": 3, "debounce": 300}'::jsonb,
 false, NULL, NULL,
 'sTextArea', 'Décrivez le ticket en détail', false, false,
 NULL, NULL, NULL, 'Description complète du ticket',
 true, 20),

-- ticket_type_code
('tickets', 'ticket_type_code', 'ticket.type', 'Type de ticket',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_types', 'code',
 'sSelectField', 'Sélectionnez le type', true, false,
 'ticket_types', 'label', 'code', 'Type de ticket (TASK, INCIDENT, PROBLEM, etc.)',
 true, 30),

-- ticket_status_code
('tickets', 'ticket_status_code', 'ticket.status', 'Statut du ticket',
 'text', false, NULL,
 true, true, true,
 'checkbox', '{"multiple": true}'::jsonb,
 true, 'configuration.ticket_status', 'code',
 'sSelectField', 'Sélectionnez le statut', true, false,
 'ticket_status', 'label', 'code', 'Statut actuel du ticket',
 true, 40),

-- requested_by_uuid
('tickets', 'requested_by_uuid', 'ticket.requested_by', 'Demandé par',
 'uuid', true, NULL,
 true, false, true,
 'select', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'full_name', 'uuid', 'Personne ayant fait la demande',
 true, 50),

-- requested_for_uuid
('tickets', 'requested_for_uuid', 'ticket.requested_for', 'Demandé pour',
 'uuid', true, NULL,
 true, false, true,
 'select', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 'sFilteredSearchField', 'Recherchez une personne', false, false,
 'persons', 'full_name', 'uuid', 'Personne bénéficiaire de la demande',
 true, 60),

-- writer_uuid
('tickets', 'writer_uuid', 'ticket.writer', 'Rédacteur',
 'uuid', false, NULL,
 true, false, true,
 'select', '{"multiple": false}'::jsonb,
 true, 'configuration.persons', 'uuid',
 'sFilteredSearchField', 'Recherchez un rédacteur', true, false,
 'persons', 'full_name', 'uuid', 'Personne ayant créé le ticket',
 true, 70),

-- configuration_item_uuid
('tickets', 'configuration_item_uuid', 'ticket.configuration_item', 'Élément de configuration',
 'uuid', true, NULL,
 true, false, true,
 'select', '{"multiple": false}'::jsonb,
 true, 'data.configuration_items', 'uuid',
 'sFilteredSearchField', 'Recherchez un CI', false, false,
 'configuration_items', 'name', 'uuid', 'CI concerné par le ticket',
 true, 80),

-- created_at
('tickets', 'created_at', 'ticket.created_at', 'Date de création',
 'date', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 90),

-- updated_at
('tickets', 'updated_at', 'ticket.updated_at', 'Date de modification',
 'date', false, 'CURRENT_TIMESTAMP',
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, true,
 NULL, NULL, NULL, NULL,
 false, 100),

-- closed_at
('tickets', 'closed_at', 'ticket.closed_at', 'Date de clôture',
 'date', true, NULL,
 true, true, true,
 'date_range', '{"format": "YYYY-MM-DD HH:mm:ss"}'::jsonb,
 false, NULL, NULL,
 NULL, NULL, false, false,
 NULL, NULL, NULL, NULL,
 false, 110),

-- core_extended_attributes
('tickets', 'core_extended_attributes', 'ticket.core_attributes', 'Attributs étendus système',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, 'Attributs étendus gérés par le système',
 false, 120),

-- user_extended_attributes
('tickets', 'user_extended_attributes', 'ticket.user_attributes', 'Attributs étendus utilisateur',
 'json', true, NULL,
 false, false, false,
 NULL, NULL,
 false, NULL, NULL,
 'sJsonEditor', '{}', false, false,
 NULL, NULL, NULL, 'Attributs étendus personnalisables',
 false, 130);

COMMIT;
