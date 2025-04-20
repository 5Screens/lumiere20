-- Script: 13_knowledge_articles_setup.sql
-- Description: Données de test pour la configuration des articles de connaissance
-- Date: 2025-04-20

-- Begin transaction
BEGIN;

-- 1. Catégories d'articles de connaissance
INSERT INTO configuration.knowledge_setup_codes (metadata, code)
VALUES 
    ('CATEGORY', 'MODE_OPERATOIRE'),
    ('CATEGORY', 'PROCEDURE_PAS_A_PAS'),
    ('CATEGORY', 'GUIDE_DEPANNAGE'),
    ('CATEGORY', 'FAQ'),
    ('CATEGORY', 'TUTORIEL'),
    ('CATEGORY', 'GUIDE_INSTALLATION'),
    ('CATEGORY', 'GUIDE_CONFIGURATION'),
    ('CATEGORY', 'RELEASE_NOTES'),
    ('CATEGORY', 'POLITIQUE_SECURITE'),
    ('CATEGORY', 'CHARTE_UTILISATION'),
    ('CATEGORY', 'MATRICE_COMPATIBILITE'),
    ('CATEGORY', 'GUIDE_UTILISATEUR'),
    ('CATEGORY', 'GUIDE_ADMINISTRATEUR'),
    ('CATEGORY', 'SCRIPT_AUTOMATISATION'),
    ('CATEGORY', 'REFERENCE_TECHNIQUE'),
    ('CATEGORY', 'GLOSSAIRE'),
    ('CATEGORY', 'CHECKLIST_VALIDATION'),
    ('CATEGORY', 'BEST_PRACTICES'),
    ('CATEGORY', 'ETUDE_CAS'),
    ('CATEGORY', 'QUESTION_METIER');

-- Traductions des catégories
INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
VALUES
    ('MODE_OPERATOIRE', 'fr', 'Mode opératoire'),
    ('PROCEDURE_PAS_A_PAS', 'fr', 'Procédure pas à pas'),
    ('GUIDE_DEPANNAGE', 'fr', 'Guide de dépannage'),
    ('FAQ', 'fr', 'Foire aux questions (FAQ)'),
    ('TUTORIEL', 'fr', 'How-to / Tutoriel'),
    ('GUIDE_INSTALLATION', 'fr', 'Guide d''installation'),
    ('GUIDE_CONFIGURATION', 'fr', 'Guide de configuration'),
    ('RELEASE_NOTES', 'fr', 'Notice de mise à jour / Release Notes'),
    ('POLITIQUE_SECURITE', 'fr', 'Politique de sécurité'),
    ('CHARTE_UTILISATION', 'fr', 'Charte d''utilisation'),
    ('MATRICE_COMPATIBILITE', 'fr', 'Matrice de compatibilité'),
    ('GUIDE_UTILISATEUR', 'fr', 'Guide utilisateur'),
    ('GUIDE_ADMINISTRATEUR', 'fr', 'Guide administrateur'),
    ('SCRIPT_AUTOMATISATION', 'fr', 'Script d''automatisation'),
    ('REFERENCE_TECHNIQUE', 'fr', 'Référence technique'),
    ('GLOSSAIRE', 'fr', 'Glossaire / Terminologie'),
    ('CHECKLIST_VALIDATION', 'fr', 'Checklist de validation'),
    ('BEST_PRACTICES', 'fr', 'Bonnes pratiques / Best Practices'),
    ('ETUDE_CAS', 'fr', 'Étude de cas'),
    ('QUESTION_METIER', 'fr', 'Question fréquente métier'),
    -- Traductions anglaises
    ('MODE_OPERATOIRE', 'en', 'Operating Mode'),
    ('PROCEDURE_PAS_A_PAS', 'en', 'Step-by-Step Procedure'),
    ('GUIDE_DEPANNAGE', 'en', 'Troubleshooting Guide'),
    ('FAQ', 'en', 'Frequently Asked Questions (FAQ)'),
    ('TUTORIEL', 'en', 'How-to / Tutorial'),
    ('GUIDE_INSTALLATION', 'en', 'Installation Guide'),
    ('GUIDE_CONFIGURATION', 'en', 'Configuration Guide'),
    ('RELEASE_NOTES', 'en', 'Release Notes'),
    ('POLITIQUE_SECURITE', 'en', 'Security Policy'),
    ('CHARTE_UTILISATION', 'en', 'Usage Charter'),
    ('MATRICE_COMPATIBILITE', 'en', 'Compatibility Matrix'),
    ('GUIDE_UTILISATEUR', 'en', 'User Guide'),
    ('GUIDE_ADMINISTRATEUR', 'en', 'Administrator Guide'),
    ('SCRIPT_AUTOMATISATION', 'en', 'Automation Script'),
    ('REFERENCE_TECHNIQUE', 'en', 'Technical Reference'),
    ('GLOSSAIRE', 'en', 'Glossary / Terminology'),
    ('CHECKLIST_VALIDATION', 'en', 'Validation Checklist'),
    ('BEST_PRACTICES', 'en', 'Best Practices'),
    ('ETUDE_CAS', 'en', 'Case Study'),
    ('QUESTION_METIER', 'en', 'Common Business Question');

-- 2. Codes d'audience cible
INSERT INTO configuration.knowledge_setup_codes (metadata, code)
VALUES 
    ('TARGET_AUDIENCE', 'ALL'),
    ('TARGET_AUDIENCE', 'SUPPORT'),
    ('TARGET_AUDIENCE', 'BUSINESS'),
    ('TARGET_AUDIENCE', 'TECHNICAL'),
    ('TARGET_AUDIENCE', 'PROJECT');

-- Traductions des audiences cibles
INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
VALUES
    ('ALL', 'fr', 'Tous'),
    ('SUPPORT', 'fr', 'Support'),
    ('BUSINESS', 'fr', 'Métier'),
    ('TECHNICAL', 'fr', 'Technique'),
    ('PROJECT', 'fr', 'Projet'),
    -- Traductions anglaises
    ('ALL', 'en', 'All'),
    ('SUPPORT', 'en', 'Support'),
    ('BUSINESS', 'en', 'Business'),
    ('TECHNICAL', 'en', 'Technical'),
    ('PROJECT', 'en', 'Project');

-- 3. Niveaux de confidentialité
INSERT INTO configuration.knowledge_setup_codes (metadata, code)
VALUES 
    ('CONFIDENTIALITY', 'PUBLIC'),
    ('CONFIDENTIALITY', 'INTERNAL'),
    ('CONFIDENTIALITY', 'INTERNAL_RESTRICTED'),
    ('CONFIDENTIALITY', 'CONFIDENTIAL'),
    ('CONFIDENTIALITY', 'CONFIDENTIAL_HR'),
    ('CONFIDENTIALITY', 'SECRET'),
    ('CONFIDENTIALITY', 'TOP_SECRET'),
    ('CONFIDENTIALITY', 'SENSITIVE_PERSONAL_DATA'),
    ('CONFIDENTIALITY', 'REGULATED_INFO'),
    ('CONFIDENTIALITY', 'INTELLECTUAL_PROPERTY');

-- Traductions des niveaux de confidentialité
INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
VALUES
    ('PUBLIC', 'fr', 'Public'),
    ('INTERNAL', 'fr', 'Interne'),
    ('INTERNAL_RESTRICTED', 'fr', 'Interne Restreint'),
    ('CONFIDENTIAL', 'fr', 'Confidentiel'),
    ('CONFIDENTIAL_HR', 'fr', 'Confidentiel RH'),
    ('SECRET', 'fr', 'Secret'),
    ('TOP_SECRET', 'fr', 'Très Secret'),
    ('SENSITIVE_PERSONAL_DATA', 'fr', 'Données personnelles sensibles'),
    ('REGULATED_INFO', 'fr', 'Informations réglementées (GDPR/PII)'),
    ('INTELLECTUAL_PROPERTY', 'fr', 'Propriété intellectuelle'),
    -- Traductions anglaises
    ('PUBLIC', 'en', 'Public'),
    ('INTERNAL', 'en', 'Internal'),
    ('INTERNAL_RESTRICTED', 'en', 'Internal Restricted'),
    ('CONFIDENTIAL', 'en', 'Confidential'),
    ('CONFIDENTIAL_HR', 'en', 'HR Confidential'),
    ('SECRET', 'en', 'Secret'),
    ('TOP_SECRET', 'en', 'Top Secret'),
    ('SENSITIVE_PERSONAL_DATA', 'en', 'Sensitive Personal Data'),
    ('REGULATED_INFO', 'en', 'Regulated Information (GDPR/PII)'),
    ('INTELLECTUAL_PROPERTY', 'en', 'Intellectual Property');

-- 4. Périmètre métier
INSERT INTO configuration.knowledge_setup_codes (metadata, code)
VALUES 
    ('BUSINESS_SCOPE', 'CORE_BUSINESS'),
    ('BUSINESS_SCOPE', 'REVENUE_SERVICE'),
    ('BUSINESS_SCOPE', 'CUSTOMER_PORTAL'),
    ('BUSINESS_SCOPE', 'FIELD_OPERATIONS'),
    ('BUSINESS_SCOPE', 'EMPLOYEE_PRODUCTIVITY'),
    ('BUSINESS_SCOPE', 'REGULATORY'),
    ('BUSINESS_SCOPE', 'SECURITY_CONTROL'),
    ('BUSINESS_SCOPE', 'DATA_PROTECTION'),
    ('BUSINESS_SCOPE', 'SHARED_SERVICE'),
    ('BUSINESS_SCOPE', 'DEPARTMENT_SPECIFIC'),
    ('BUSINESS_SCOPE', 'BACK_OFFICE'),
    ('BUSINESS_SCOPE', 'TEST_ENVIRONMENT'),
    ('BUSINESS_SCOPE', 'OPTIONAL_ENHANCEMENT'),
    ('BUSINESS_SCOPE', 'TRAINING'),
    ('BUSINESS_SCOPE', 'LEGACY_MAINTENANCE');

-- Traductions des périmètres métier
INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
VALUES
    ('CORE_BUSINESS', 'fr', 'Core Business Process'),
    ('REVENUE_SERVICE', 'fr', 'Revenue Generating Service'),
    ('CUSTOMER_PORTAL', 'fr', 'Customer-Facing Portal'),
    ('FIELD_OPERATIONS', 'fr', 'Field Operations Support'),
    ('EMPLOYEE_PRODUCTIVITY', 'fr', 'Employee Productivity Tool'),
    ('REGULATORY', 'fr', 'Regulatory & Compliance'),
    ('SECURITY_CONTROL', 'fr', 'Information Security Control'),
    ('DATA_PROTECTION', 'fr', 'Data Protection / GDPR'),
    ('SHARED_SERVICE', 'fr', 'Enterprise Shared Service'),
    ('DEPARTMENT_SPECIFIC', 'fr', 'Department-Specific Function'),
    ('BACK_OFFICE', 'fr', 'Back-Office Automation'),
    ('TEST_ENVIRONMENT', 'fr', 'Testing / Staging Environment'),
    ('OPTIONAL_ENHANCEMENT', 'fr', 'Optional Enhancement'),
    ('TRAINING', 'fr', 'Training & Onboarding'),
    ('LEGACY_MAINTENANCE', 'fr', 'Legacy System Maintenance'),
    -- Traductions anglaises
    ('CORE_BUSINESS', 'en', 'Core Business Process'),
    ('REVENUE_SERVICE', 'en', 'Revenue Generating Service'),
    ('CUSTOMER_PORTAL', 'en', 'Customer-Facing Portal'),
    ('FIELD_OPERATIONS', 'en', 'Field Operations Support'),
    ('EMPLOYEE_PRODUCTIVITY', 'en', 'Employee Productivity Tool'),
    ('REGULATORY', 'en', 'Regulatory & Compliance'),
    ('SECURITY_CONTROL', 'en', 'Information Security Control'),
    ('DATA_PROTECTION', 'en', 'Data Protection / GDPR'),
    ('SHARED_SERVICE', 'en', 'Enterprise Shared Service'),
    ('DEPARTMENT_SPECIFIC', 'en', 'Department-Specific Function'),
    ('BACK_OFFICE', 'en', 'Back-Office Automation'),
    ('TEST_ENVIRONMENT', 'en', 'Testing / Staging Environment'),
    ('OPTIONAL_ENHANCEMENT', 'en', 'Optional Enhancement'),
    ('TRAINING', 'en', 'Training & Onboarding'),
    ('LEGACY_MAINTENANCE', 'en', 'Legacy System Maintenance');

-- 5. Statuts de publication
INSERT INTO configuration.knowledge_setup_codes (metadata, code)
VALUES 
    ('PUBLICATION_STATUS', 'DRAFT'),
    ('PUBLICATION_STATUS', 'IN_REVIEW'),
    ('PUBLICATION_STATUS', 'PENDING_APPROVAL'),
    ('PUBLICATION_STATUS', 'APPROVED'),
    ('PUBLICATION_STATUS', 'REVISIONS_REQUIRED'),
    ('PUBLICATION_STATUS', 'REJECTED'),
    ('PUBLICATION_STATUS', 'PUBLISHED'),
    ('PUBLICATION_STATUS', 'ARCHIVED');

-- Traductions des statuts de publication
INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
VALUES
    ('DRAFT', 'fr', 'Brouillon'),
    ('IN_REVIEW', 'fr', 'En révision'),
    ('PENDING_APPROVAL', 'fr', 'En attente d''approbation'),
    ('APPROVED', 'fr', 'Approuvé'),
    ('REVISIONS_REQUIRED', 'fr', 'Révisions requises'),
    ('REJECTED', 'fr', 'Rejeté'),
    ('PUBLISHED', 'fr', 'Publié'),
    ('ARCHIVED', 'fr', 'Retiré / Archivé'),
    -- Traductions anglaises
    ('DRAFT', 'en', 'Draft'),
    ('IN_REVIEW', 'en', 'In Review'),
    ('PENDING_APPROVAL', 'en', 'Pending Approval'),
    ('APPROVED', 'en', 'Approved'),
    ('REVISIONS_REQUIRED', 'en', 'Revisions Required'),
    ('REJECTED', 'en', 'Rejected'),
    ('PUBLISHED', 'en', 'Published'),
    ('ARCHIVED', 'en', 'Archived / Withdrawn');

-- Commit transaction
COMMIT;
