-- Script: entities.sql
-- Description: Données de test pour la table configuration.entities
-- Date: 2025-02-13

BEGIN;

-- Entreprises principales (COMPANY)
INSERT INTO configuration.entities (name, entity_id, entity_type, headquarters_location, is_active) VALUES
('Lumiere Group', 'LUM001', 'COMPANY', 'Paris, France', true),
('Lumiere Technologies', 'LUM002', 'COMPANY', 'Lyon, France', true),
('Lumiere Services', 'LUM003', 'COMPANY', 'Marseille, France', true);

-- Mise à jour des relations parent pour les entreprises principales
UPDATE configuration.entities SET parent_uuid = (SELECT uuid FROM configuration.entities WHERE entity_id = 'LUM001') WHERE entity_id IN ('LUM002', 'LUM003');

-- Succursales (BRANCH) pour Lumiere Group
INSERT INTO configuration.entities (name, entity_id, entity_type, headquarters_location, is_active, parent_uuid)
SELECT 
    'Lumiere ' || city || ' Branch',
    'BR' || LPAD(CAST(ROW_NUMBER() OVER () AS VARCHAR), 3, '0'),
    'BRANCH',
    city || ', ' || country,
    true,
    (SELECT uuid FROM configuration.entities WHERE entity_id = 'LUM001')
FROM (VALUES
    ('Paris', 'France'),
    ('Lyon', 'France'),
    ('Marseille', 'France'),
    ('Bordeaux', 'France'),
    ('Toulouse', 'France'),
    ('Nantes', 'France'),
    ('Strasbourg', 'France'),
    ('Lille', 'France'),
    ('Nice', 'France'),
    ('Rennes', 'France')
) AS cities(city, country);

-- Départements (DEPARTMENT) pour chaque succursale
INSERT INTO configuration.entities (name, entity_id, entity_type, is_active, parent_uuid)
SELECT 
    dep.dep_name,
    'DEP' || LPAD(CAST(ROW_NUMBER() OVER () AS VARCHAR), 3, '0'),
    'DEPARTMENT',
    true,
    br.uuid
FROM configuration.entities br
CROSS JOIN (VALUES
    ('IT Department'),
    ('Human Resources'),
    ('Finance'),
    ('Marketing'),
    ('Sales'),
    ('Operations'),
    ('Research & Development'),
    ('Customer Service'),
    ('Legal'),
    ('Procurement')
) AS dep(dep_name)
WHERE br.entity_type = 'BRANCH';

-- Fournisseurs (SUPPLIER)
INSERT INTO configuration.entities (name, entity_id, entity_type, headquarters_location, is_active)
SELECT 
    'Supplier ' || supplier_name,
    'SUP' || LPAD(CAST(ROW_NUMBER() OVER () AS VARCHAR), 3, '0'),
    'SUPPLIER',
    city || ', ' || country,
    true
FROM (VALUES
    ('TechPro Solutions', 'Paris', 'France'),
    ('DataSys Corp', 'Lyon', 'France'),
    ('NetworkGear', 'Marseille', 'France'),
    ('CloudServe', 'Bordeaux', 'France'),
    ('SecureIT', 'Toulouse', 'France'),
    ('SoftwarePro', 'Nantes', 'France'),
    ('HardwareHub', 'Strasbourg', 'France'),
    ('ConsultingPlus', 'Lille', 'France'),
    ('ITServices', 'Nice', 'France'),
    ('TechSupport', 'Rennes', 'France')
) AS suppliers(supplier_name, city, country);

-- Clients (CUSTOMER)
INSERT INTO configuration.entities (name, entity_id, entity_type, headquarters_location, is_active)
SELECT 
    customer_name,
    'CUS' || LPAD(CAST(ROW_NUMBER() OVER () AS VARCHAR), 3, '0'),
    'CUSTOMER',
    city || ', ' || country,
    true
FROM (
    SELECT 
        'Customer ' || generate_series(1, 80) AS customer_name,
        (ARRAY['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Nantes', 'Strasbourg', 'Lille', 'Nice', 'Rennes'])[1 + mod(generate_series(1, 80)-1, 10)] AS city,
        'France' AS country
) AS customers;

COMMIT;
