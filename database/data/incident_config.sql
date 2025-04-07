-- Script: incident_config.sql
-- Description: Population of incident-related tables with test data
-- Date: 2025-04-07

-- Populate incident_urgencies table
INSERT INTO configuration.incident_urgencies (code, value) VALUES
('CRITICAL', 1),
('HIGH', 2),
('MEDIUM', 3),
('LOW', 4);

-- Populate incident_impacts table
INSERT INTO configuration.incident_impacts (code, value) VALUES
('ENTERPRISE', 1),
('DEPARTMENT', 2),
('WORKGROUP', 3),
('USER', 4);

-- Populate incident_cause_codes table
INSERT INTO configuration.incident_cause_codes (code) VALUES
('HARDWARE_FAILURE'),
('SOFTWARE_BUG'),
('NETWORK_ISSUE'),
('HUMAN_ERROR'),
('SECURITY_BREACH'),
('THIRD_PARTY_OUTAGE'),
('CONFIGURATION_ERROR'),
('CAPACITY_ISSUE'),
('UNKNOWN');

-- Populate contact_types table
INSERT INTO configuration.contact_types (code) VALUES
('PHONE'),
('EMAIL'),
('CHAT'),
('SELF_SERVICE_PORTAL'),
('WALK_IN'),
('SOCIAL_MEDIA'),
('AUTOMATED_ALERT');

-- Populate incident_priorities table (based on urgency and impact)
INSERT INTO configuration.incident_priorities (code, rel_incident_urgency_code, rel_incident_impact_code, priority_level) VALUES
-- Critical urgency combinations
('P1', 'CRITICAL', 'ENTERPRISE', 1),
('P2', 'CRITICAL', 'DEPARTMENT', 2),
('P2', 'CRITICAL', 'WORKGROUP', 2),
('P3', 'CRITICAL', 'USER', 3),

-- High urgency combinations
('P2', 'HIGH', 'ENTERPRISE', 2),
('P3', 'HIGH', 'DEPARTMENT', 3),
('P3', 'HIGH', 'WORKGROUP', 3),
('P4', 'HIGH', 'USER', 4),

-- Medium urgency combinations
('P3', 'MEDIUM', 'ENTERPRISE', 3),
('P4', 'MEDIUM', 'DEPARTMENT', 4),
('P4', 'MEDIUM', 'WORKGROUP', 4),
('P5', 'MEDIUM', 'USER', 5),

-- Low urgency combinations
('P4', 'LOW', 'ENTERPRISE', 4),
('P5', 'LOW', 'DEPARTMENT', 5),
('P5', 'LOW', 'WORKGROUP', 5),
('P5', 'LOW', 'USER', 5);

-- Populate incident_urgencies_labels table (English and French)
INSERT INTO translations.incident_urgencies_labels (rel_incident_urgency_code, language, label) VALUES
('CRITICAL', 'en', 'Critical'),
('HIGH', 'en', 'High'),
('MEDIUM', 'en', 'Medium'),
('LOW', 'en', 'Low'),
('CRITICAL', 'fr', 'Critique'),
('HIGH', 'fr', 'Élevée'),
('MEDIUM', 'fr', 'Moyenne'),
('LOW', 'fr', 'Faible');

-- Populate incident_impacts_labels table (English and French)
INSERT INTO translations.incident_impacts_labels (rel_incident_impact_code, language, label) VALUES
('ENTERPRISE', 'en', 'Enterprise-wide'),
('DEPARTMENT', 'en', 'Department'),
('WORKGROUP', 'en', 'Workgroup'),
('USER', 'en', 'Single User'),
('ENTERPRISE', 'fr', 'Entreprise entière'),
('DEPARTMENT', 'fr', 'Département'),
('WORKGROUP', 'fr', 'Groupe de travail'),
('USER', 'fr', 'Utilisateur unique');

-- Populate incident_cause_codes_labels table (English and French)
INSERT INTO translations.incident_cause_codes_labels (rel_incident_cause_code_code, language, label) VALUES
('HARDWARE_FAILURE', 'en', 'Hardware Failure'),
('SOFTWARE_BUG', 'en', 'Software Bug'),
('NETWORK_ISSUE', 'en', 'Network Issue'),
('HUMAN_ERROR', 'en', 'Human Error'),
('SECURITY_BREACH', 'en', 'Security Breach'),
('THIRD_PARTY_OUTAGE', 'en', 'Third-party Outage'),
('CONFIGURATION_ERROR', 'en', 'Configuration Error'),
('CAPACITY_ISSUE', 'en', 'Capacity Issue'),
('UNKNOWN', 'en', 'Unknown Cause'),
('HARDWARE_FAILURE', 'fr', 'Défaillance matérielle'),
('SOFTWARE_BUG', 'fr', 'Bogue logiciel'),
('NETWORK_ISSUE', 'fr', 'Problème réseau'),
('HUMAN_ERROR', 'fr', 'Erreur humaine'),
('SECURITY_BREACH', 'fr', 'Faille de sécurité'),
('THIRD_PARTY_OUTAGE', 'fr', 'Panne tierce partie'),
('CONFIGURATION_ERROR', 'fr', 'Erreur de configuration'),
('CAPACITY_ISSUE', 'fr', 'Problème de capacité'),
('UNKNOWN', 'fr', 'Cause inconnue');

-- Populate contact_types_labels table (English and French)
INSERT INTO translations.contact_types_labels (rel_contact_type_code, language, label) VALUES
('PHONE', 'en', 'Phone'),
('EMAIL', 'en', 'Email'),
('CHAT', 'en', 'Chat'),
('SELF_SERVICE_PORTAL', 'en', 'Self-service Portal'),
('WALK_IN', 'en', 'Walk-in'),
('SOCIAL_MEDIA', 'en', 'Social Media'),
('AUTOMATED_ALERT', 'en', 'Automated Alert'),
('PHONE', 'fr', 'Téléphone'),
('EMAIL', 'fr', 'Email'),
('CHAT', 'fr', 'Chat'),
('SELF_SERVICE_PORTAL', 'fr', 'Portail libre-service'),
('WALK_IN', 'fr', 'En personne'),
('SOCIAL_MEDIA', 'fr', 'Réseaux sociaux'),
('AUTOMATED_ALERT', 'fr', 'Alerte automatisée');
