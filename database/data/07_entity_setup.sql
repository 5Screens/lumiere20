-- Script: entity_setup.sql
-- Description: Données de test pour les tables entity_setup_codes et entity_setup_labels
-- Date: 2025-08-07

-- Activation du mode transaction
BEGIN;

-- Insertion des données de test pour entity_setup_codes avec metadata=CATEGORY
INSERT INTO configuration.entity_setup_codes (metadata, code) VALUES
('CATEGORY', 'COMPANY'),
('CATEGORY', 'BRANCH'),
('CATEGORY', 'DEPARTMENT'),
('CATEGORY', 'SUPPLIER'),
('CATEGORY', 'CUSTOMER');

-- Insertion des traductions pour le français
INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label) VALUES
('COMPANY', 'fr', 'Entreprise'),
('BRANCH', 'fr', 'Succursale'),
('DEPARTMENT', 'fr', 'Département'),
('SUPPLIER', 'fr', 'Fournisseur'),
('CUSTOMER', 'fr', 'Client');

-- Insertion des traductions pour l'anglais
INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label) VALUES
('COMPANY', 'en', 'Company'),
('BRANCH', 'en', 'Branch'),
('DEPARTMENT', 'en', 'Department'),
('SUPPLIER', 'en', 'Supplier'),
('CUSTOMER', 'en', 'Customer');

-- Insertion des traductions pour l'espagnol
INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label) VALUES
('COMPANY', 'es', 'Empresa'),
('BRANCH', 'es', 'Sucursal'),
('DEPARTMENT', 'es', 'Departamento'),
('SUPPLIER', 'es', 'Proveedor'),
('CUSTOMER', 'es', 'Cliente');

-- Insertion des traductions pour le portugais
INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label) VALUES
('COMPANY', 'pt', 'Empresa'),
('BRANCH', 'pt', 'Filial'),
('DEPARTMENT', 'pt', 'Departamento'),
('SUPPLIER', 'pt', 'Fornecedor'),
('CUSTOMER', 'pt', 'Cliente');

-- Fin de la transaction
COMMIT;
