-- Script: locations.sql
-- Description: Données de test pour la table configuration.locations
-- Date: 2025-02-13

BEGIN;

-- Création d'une table temporaire pour les villes et leurs coordonnées
CREATE TEMP TABLE temp_cities (
    city TEXT,
    region TEXT,
    postal_code TEXT
);

INSERT INTO temp_cities (city, region, postal_code) VALUES
-- Île-de-France
('Paris', 'Île-de-France', '75001'),
('Versailles', 'Île-de-France', '78000'),
('Boulogne-Billancourt', 'Île-de-France', '92100'),
('Saint-Denis', 'Île-de-France', '93200'),
('Créteil', 'Île-de-France', '94000'),

-- Auvergne-Rhône-Alpes
('Lyon', 'Auvergne-Rhône-Alpes', '69001'),
('Grenoble', 'Auvergne-Rhône-Alpes', '38000'),
('Saint-Étienne', 'Auvergne-Rhône-Alpes', '42000'),
('Clermont-Ferrand', 'Auvergne-Rhône-Alpes', '63000'),
('Annecy', 'Auvergne-Rhône-Alpes', '74000'),

-- Provence-Alpes-Côte d'Azur
('Marseille', 'Provence-Alpes-Côte d''Azur', '13001'),
('Nice', 'Provence-Alpes-Côte d''Azur', '06000'),
('Toulon', 'Provence-Alpes-Côte d''Azur', '83000'),
('Aix-en-Provence', 'Provence-Alpes-Côte d''Azur', '13100'),
('Avignon', 'Provence-Alpes-Côte d''Azur', '84000'),

-- Occitanie
('Toulouse', 'Occitanie', '31000'),
('Montpellier', 'Occitanie', '34000'),
('Nîmes', 'Occitanie', '30000'),
('Perpignan', 'Occitanie', '66000'),
('Béziers', 'Occitanie', '34500'),
('Lille', 'Hauts-de-France', '59000'),
('Amiens', 'Hauts-de-France', '80000'),
('Valenciennes', 'Hauts-de-France', '59300'),
('Dunkerque', 'Hauts-de-France', '59140'),
('Calais', 'Hauts-de-France', '62100'),
('Strasbourg', 'Grand Est', '67000'),
('Reims', 'Grand Est', '51100'),
('Metz', 'Grand Est', '57000'),
('Mulhouse', 'Grand Est', '68100'),
('Nancy', 'Grand Est', '54000'),
('Nantes', 'Pays de la Loire', '44000'),
('Angers', 'Pays de la Loire', '49000'),
('Le Mans', 'Pays de la Loire', '72000'),
('Saint-Nazaire', 'Pays de la Loire', '44600'),
('Cholet', 'Pays de la Loire', '49300'),
('Rennes', 'Bretagne', '35000'),
('Brest', 'Bretagne', '29200'),
('Quimper', 'Bretagne', '29000'),
('Saint-Malo', 'Bretagne', '35400'),
('Vannes', 'Bretagne', '56000'),
('Rouen', 'Normandie', '76000'),
('Caen', 'Normandie', '14000'),
('Le Havre', 'Normandie', '76600'),
('Cherbourg', 'Normandie', '50100'),
('Évreux', 'Normandie', '27000'),
('Dijon', 'Bourgogne-Franche-Comté', '21000'),
('Besançon', 'Bourgogne-Franche-Comté', '25000'),
('Belfort', 'Bourgogne-Franche-Comté', '90000'),
('Nevers', 'Bourgogne-Franche-Comté', '58000'),
('Auxerre', 'Bourgogne-Franche-Comté', '89000'),
('Orléans', 'Centre-Val de Loire', '45000'),
('Tours', 'Centre-Val de Loire', '37000'),
('Bourges', 'Centre-Val de Loire', '18000'),
('Blois', 'Centre-Val de Loire', '41000'),
('Châteauroux', 'Centre-Val de Loire', '36000'),
('Bordeaux', 'Nouvelle-Aquitaine', '33000'),
('Limoges', 'Nouvelle-Aquitaine', '87000'),
('Poitiers', 'Nouvelle-Aquitaine', '86000'),
('Pau', 'Nouvelle-Aquitaine', '64000'),
('La Rochelle', 'Nouvelle-Aquitaine', '17000');

-- Création d'une table temporaire pour stocker les UUIDs des entités
CREATE TEMP TABLE temp_entity_locations AS
SELECT uuid, name, entity_type, headquarters_location
FROM configuration.entities
WHERE entity_type IN ('COMPANY', 'BRANCH')
AND headquarters_location IS NOT NULL;

-- Insertion des locations
INSERT INTO configuration.locations (
    name,
    primary_entity_uuid,
    status,
    site_created_on,
    site_id,
    type,
    business_criticality,
    opening_hours,
    phone,
    time_zone,
    street,
    city,
    state_province,
    country,
    postal_code,
    comments,
    alternative_site_reference,
    wan_design,
    network_telecom_service
)
SELECT 
    'Site ' || tc.city as name,
    -- Association avec l'entité correspondante basée sur la ville
    (
        SELECT e.uuid 
        FROM temp_entity_locations e 
        WHERE e.headquarters_location LIKE tc.city || '%'
        LIMIT 1
    ) as primary_entity_uuid,
    'ACTIVE' as status,
    (CURRENT_TIMESTAMP - ((random() * 365)::integer || ' days')::interval) as site_created_on,
    'SITE-' || tc.postal_code as site_id,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'MAIN_OFFICE'
        WHEN 1 THEN 'BRANCH_OFFICE'
        ELSE 'DATA_CENTER'
    END as type,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'HIGH'
        WHEN 1 THEN 'MEDIUM'
        ELSE 'LOW'
    END as business_criticality,
    '8:00-19:00' as opening_hours,
    '+33 ' || (random() * 9 + 1)::integer::text || 
    repeat('0', 8 - length(((random() * 99999999)::integer)::text)) || 
    ((random() * 99999999)::integer)::text as phone,
    'Europe/Paris' as time_zone,
    CASE 
        WHEN random() < 0.3 THEN tc.postal_code || ' ' || tc.city
        ELSE ((random() * 99 + 1)::integer)::text || ' rue ' || 
            CASE (random() * 5)::integer
                WHEN 0 THEN 'de la République'
                WHEN 1 THEN 'Victor Hugo'
                WHEN 2 THEN 'du Général de Gaulle'
                WHEN 3 THEN 'Jean Jaurès'
                ELSE 'de la Liberté'
            END
    END as street,
    tc.city,
    tc.region as state_province,
    'France' as country,
    tc.postal_code,
    'Site créé le ' || CURRENT_TIMESTAMP::date as comments,
    'REF-' || tc.postal_code as alternative_site_reference,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'MPLS'
        WHEN 1 THEN 'SD-WAN'
        ELSE 'HYBRID'
    END as wan_design,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'FIBER'
        WHEN 1 THEN 'COPPER'
        ELSE 'SATELLITE'
    END as network_telecom_service
FROM temp_cities tc;

-- Nettoyage
DROP TABLE temp_cities;
DROP TABLE temp_entity_locations;

COMMIT;
