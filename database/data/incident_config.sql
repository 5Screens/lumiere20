-- Script: incident_config.sql
-- Description: Population of incident-related tables with test data
-- Date: 2025-04-07

-- Populate incident_setup_codes table (replaces incident_urgencies, incident_impacts, incident_cause_codes, incident_resolution_codes)
INSERT INTO configuration.incident_setup_codes (metadata, code, value) VALUES
-- Urgencies
('URGENCY', 'CRITICAL', 1),
('URGENCY', 'HIGH', 2),
('URGENCY', 'MEDIUM', 3),
('URGENCY', 'LOW', 4),
-- Impacts
('IMPACT', 'ENTERPRISE', 1),
('IMPACT', 'DEPARTMENT', 2),
('IMPACT', 'WORKGROUP', 3),
('IMPACT', 'USER', 4),
-- Cause codes
('CAUSE_CODE', 'HARDWARE_FAILURE', NULL),
('CAUSE_CODE', 'SOFTWARE_BUG', NULL),
('CAUSE_CODE', 'NETWORK_ISSUE', NULL),
('CAUSE_CODE', 'HUMAN_ERROR', NULL),
('CAUSE_CODE', 'SECURITY_BREACH', NULL),
('CAUSE_CODE', 'THIRD_PARTY_OUTAGE', NULL),
('CAUSE_CODE', 'CONFIGURATION_ERROR', NULL),
('CAUSE_CODE', 'CAPACITY_ISSUE', NULL),
('CAUSE_CODE', 'UNKNOWN', NULL);

-- Populate contact_types table
INSERT INTO configuration.contact_types (code) VALUES
('PHONE'),
('EMAIL'),
('CHAT'),
('SELF_SERVICE_PORTAL'),
('WALK_IN'),
('SOCIAL_MEDIA'),
('AUTOMATED_ALERT');

-- Populate incident_priorities table (updated to reference incident_setup_codes)
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

-- Populate incident_setup_labels table (replaces all incident-related labels tables)
INSERT INTO translations.incident_setup_labels (rel_incident_setup_code, lang, label) VALUES
-- Urgency labels (English and French)
('CRITICAL', 'en', 'Critical'),
('HIGH', 'en', 'High'),
('MEDIUM', 'en', 'Medium'),
('LOW', 'en', 'Low'),
('CRITICAL', 'fr', 'Critique'),
('HIGH', 'fr', 'Élevée'),
('MEDIUM', 'fr', 'Moyenne'),
('LOW', 'fr', 'Faible'),
-- Impact labels (English and French)
('ENTERPRISE', 'en', 'Enterprise-wide'),
('DEPARTMENT', 'en', 'Department'),
('WORKGROUP', 'en', 'Workgroup'),
('USER', 'en', 'Single User'),
('ENTERPRISE', 'fr', 'Entreprise entière'),
('DEPARTMENT', 'fr', 'Département'),
('WORKGROUP', 'fr', 'Groupe de travail'),
('USER', 'fr', 'Utilisateur unique'),
-- Cause code labels (English and French)
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

-- Add resolution codes to incident_setup_codes table
INSERT INTO configuration.incident_setup_codes (metadata, code, value) VALUES
-- Resolution codes
('RESOLUTION_CODE', 'FIXED', NULL),
('RESOLUTION_CODE', 'WORKAROUND_PROVIDED', NULL),
('RESOLUTION_CODE', 'SELF_RESOLVED', NULL),
('RESOLUTION_CODE', 'DUPLICATE', NULL),
('RESOLUTION_CODE', 'NOT_REPRODUCIBLE', NULL),
('RESOLUTION_CODE', 'KNOWN_ISSUE', NULL),
('RESOLUTION_CODE', 'THIRD_PARTY_RESOLUTION', NULL),
('RESOLUTION_CODE', 'CONFIGURATION_CHANGE', NULL),
('RESOLUTION_CODE', 'NO_ACTION_REQUIRED', NULL),
('RESOLUTION_CODE', 'REFERRED_TO_CHANGE', NULL);

-- Add resolution code labels to incident_setup_labels table
INSERT INTO translations.incident_setup_labels (rel_incident_setup_code, lang, label) VALUES
-- Resolution code labels (English and French)
('FIXED', 'en', 'Fixed'),
('WORKAROUND_PROVIDED', 'en', 'Workaround Provided'),
('SELF_RESOLVED', 'en', 'Self Resolved'),
('DUPLICATE', 'en', 'Duplicate'),
('NOT_REPRODUCIBLE', 'en', 'Not Reproducible'),
('KNOWN_ISSUE', 'en', 'Known Issue'),
('THIRD_PARTY_RESOLUTION', 'en', 'Third-party Resolution'),
('CONFIGURATION_CHANGE', 'en', 'Configuration Change'),
('NO_ACTION_REQUIRED', 'en', 'No Action Required'),
('REFERRED_TO_CHANGE', 'en', 'Referred to Change'),
('FIXED', 'fr', 'Résolu'),
('WORKAROUND_PROVIDED', 'fr', 'Solution de contournement fournie'),
('SELF_RESOLVED', 'fr', 'Résolu automatiquement'),
('DUPLICATE', 'fr', 'Doublon'),
('NOT_REPRODUCIBLE', 'fr', 'Non reproductible'),
('KNOWN_ISSUE', 'fr', 'Problème connu'),
('THIRD_PARTY_RESOLUTION', 'fr', 'Résolution par un tiers'),
('CONFIGURATION_CHANGE', 'fr', 'Changement de configuration'),
('NO_ACTION_REQUIRED', 'fr', 'Aucune action requise'),
('REFERRED_TO_CHANGE', 'fr', 'Référé à un changement');
