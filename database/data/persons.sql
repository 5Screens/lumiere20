-- Script: persons.sql
-- Description: Génération de 500 personnes pour la table configuration.persons
-- Date: 2025-02-13

BEGIN;

-- Création d'une table temporaire pour les prénoms français courants
CREATE TEMPORARY TABLE temp_first_names (
    name VARCHAR(100),
    gender CHAR(1)
);

INSERT INTO temp_first_names (name, gender) VALUES
    ('Jean', 'M'), ('Pierre', 'M'), ('Michel', 'M'), ('Philippe', 'M'), ('Thomas', 'M'),
    ('Nicolas', 'M'), ('François', 'M'), ('Laurent', 'M'), ('Antoine', 'M'), ('Julien', 'M'),
    ('Marie', 'F'), ('Sophie', 'F'), ('Catherine', 'F'), ('Isabelle', 'F'), ('Anne', 'F'),
    ('Claire', 'F'), ('Julie', 'F'), ('Caroline', 'F'), ('Céline', 'F'), ('Émilie', 'F');

-- Création d'une table temporaire pour les noms de famille français courants
CREATE TEMPORARY TABLE temp_last_names (name VARCHAR(100));

INSERT INTO temp_last_names (name) VALUES
    ('Martin'), ('Bernard'), ('Dubois'), ('Thomas'), ('Robert'),
    ('Richard'), ('Petit'), ('Durand'), ('Leroy'), ('Moreau'),
    ('Simon'), ('Laurent'), ('Lefebvre'), ('Michel'), ('Garcia'),
    ('David'), ('Bertrand'), ('Roux'), ('Vincent'), ('Fournier');

-- Création d'une table temporaire pour les rôles professionnels
CREATE TEMPORARY TABLE temp_job_roles (role VARCHAR(255));

INSERT INTO temp_job_roles (role) VALUES
    ('Développeur Full Stack'), ('Ingénieur DevOps'), ('Chef de Projet'),
    ('Architecte Solution'), ('Analyste Business'), ('Responsable Support'),
    ('Administrateur Système'), ('Ingénieur Sécurité'), ('Product Owner'),
    ('Scrum Master'), ('Développeur Frontend'), ('Développeur Backend'),
    ('Responsable QA'), ('Testeur'), ('Analyste Données');

-- Insertion de 10000 personnes
INSERT INTO configuration.persons (
    first_name,
    last_name,
    job_role,
    ref_entity_uuid,
    email,
    active,
    critical_user,
    external_user,
    notification,
    time_zone,
    language,
    ref_approving_manager_uuid,
    business_phone,
    business_mobile_phone
)
WITH random_persons AS (
    SELECT 
        f.name as first_name,
        l.name as last_name,
        j.role as job_role,
        e.uuid as entity_uuid,
        ROW_NUMBER() OVER (ORDER BY random()) as rn
    FROM temp_first_names f
    CROSS JOIN temp_last_names l
    CROSS JOIN temp_job_roles j
    CROSS JOIN (
        SELECT uuid 
        FROM configuration.entities 
        WHERE entity_type IN ('DEPARTMENT', 'BRANCH')
        ORDER BY random()
    ) e
    LIMIT 10000
)
SELECT
    p.first_name,
    p.last_name,
    p.job_role,
    p.entity_uuid,
    LOWER(
        REPLACE(
            CONCAT(
                LEFT(p.first_name, 1),
                '.',
                p.last_name,
                CASE 
                    WHEN p.rn = 1 THEN ''
                    ELSE p.rn::TEXT
                END,
                '@lumiere.fr'
            ),
            ' ',
            ''
        )
    ) as email,
    true as active,
    (random() < 0.1) as critical_user,
    (random() < 0.2) as external_user,
    true as notification,
    'Europe/Paris' as time_zone,
    CASE WHEN random() < 0.8 THEN 'fr' ELSE 'en' END as language,
    CASE 
        WHEN rn <= 1000 THEN NULL  -- Les 50 premiers n'ont pas de manager
        ELSE (
            SELECT uuid 
            FROM configuration.persons 
            WHERE rn <= 50 
            ORDER BY random() 
            LIMIT 1
        )
    END as approving_manager_uuid,
    CONCAT('+33 1 ', LPAD(CAST(FLOOR(random() * 99999999) as VARCHAR), 8, '0')) as business_phone,
    CONCAT('+33 6 ', LPAD(CAST(FLOOR(random() * 99999999) as VARCHAR), 8, '0')) as business_mobile_phone
FROM random_persons p;

-- Nettoyage des tables temporaires
DROP TABLE temp_first_names;
DROP TABLE temp_last_names;
DROP TABLE temp_job_roles;

COMMIT;