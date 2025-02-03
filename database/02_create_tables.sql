-- Script: 02_create_tables.sql
-- Description: Création des tables pour Lumiere v16
-- Date: 2025-02-03

-- Activation du mode transaction
BEGIN;

-- Création des schémas
CREATE SCHEMA IF NOT EXISTS configuration;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS data;
CREATE SCHEMA IF NOT EXISTS translations;

-- Configuration du search_path pour inclure tous les schémas
SET search_path TO configuration, core, data, translations, public;
ALTER DATABASE lumiere_v16 SET search_path TO configuration, core, data, translations, public;

-- Tables du schéma data --

-- Configuration Items
CREATE TABLE data.configuration_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tables du schéma configuration --

-- Persons
CREATE TABLE configuration.persons (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Entities
CREATE TABLE configuration.entities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Types
CREATE TABLE configuration.ticket_types (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Status
CREATE TABLE configuration.ticket_status (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Symptoms
CREATE TABLE configuration.symptoms (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tables du schéma translations --

-- Ticket Types Translation
CREATE TABLE translations.ticket_types_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_uuid UUID NOT NULL REFERENCES configuration.ticket_types(uuid) ON DELETE RESTRICT,
    langue VARCHAR(5) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_type_uuid, langue)
);

-- Ticket Status Translation
CREATE TABLE translations.ticket_status_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_status_uuid UUID NOT NULL REFERENCES configuration.ticket_status(uuid) ON DELETE RESTRICT,
    langue VARCHAR(5) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_status_uuid, langue)
);

-- Symptoms Translation
CREATE TABLE translations.symptoms_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symptom_uuid UUID NOT NULL REFERENCES configuration.symptoms(uuid) ON DELETE RESTRICT,
    langue VARCHAR(5) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symptom_uuid, langue)
);

-- Tables de Relations --

-- Persons Entities (relation many-to-many)
CREATE TABLE configuration.persons_entities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    entity_uuid UUID NOT NULL REFERENCES configuration.entities(uuid) ON DELETE RESTRICT,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_uuid, entity_uuid)
);

-- Tickets (table centrale avec multiples relations)
CREATE TABLE core.tickets (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    configuration_item_uuid UUID NOT NULL REFERENCES data.configuration_items(uuid) ON DELETE RESTRICT,
    requested_by_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    requested_for_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    writer_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    ticket_type_uuid UUID NOT NULL REFERENCES configuration.ticket_types(uuid) ON DELETE RESTRICT,
    ticket_status_uuid UUID NOT NULL REFERENCES configuration.ticket_status(uuid) ON DELETE RESTRICT,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Commentaires pour documenter les contraintes de clés étrangères
COMMENT ON CONSTRAINT tickets_configuration_item_uuid_fkey ON core.tickets IS 'Lien vers l''élément de configuration concerné';
COMMENT ON CONSTRAINT tickets_requested_by_uuid_fkey ON core.tickets IS 'Personne qui demande le ticket';
COMMENT ON CONSTRAINT tickets_requested_for_uuid_fkey ON core.tickets IS 'Personne pour qui le ticket est créé';
COMMENT ON CONSTRAINT tickets_writer_uuid_fkey ON core.tickets IS 'Personne qui écrit le ticket';
COMMENT ON CONSTRAINT tickets_ticket_type_uuid_fkey ON core.tickets IS 'Type du ticket';
COMMENT ON CONSTRAINT tickets_ticket_status_uuid_fkey ON core.tickets IS 'Statut du ticket';

-- Validation des modifications
COMMIT;
