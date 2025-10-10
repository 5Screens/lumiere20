-- Script: 02_create_tables_fixed.sql
-- Description: Création des tables pour Lumiere v17 (sans références circulaires)
-- Date: 2025-02-03
-- Stratégie: Créer les tables sans FK circulaires, puis ajouter les FK après

-- Activation du mode transaction
BEGIN;

-- Création des schémas
CREATE SCHEMA IF NOT EXISTS configuration;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS data;
CREATE SCHEMA IF NOT EXISTS translations;

-- Configuration du search_path pour inclure tous les schémas
SET search_path TO configuration, core, data, translations, public;
-- Note: Le ALTER DATABASE doit être exécuté avec le nom de la base courante
DO $$
BEGIN
    EXECUTE format('ALTER DATABASE %I SET search_path TO configuration, core, data, translations, public', current_database());
END
$$;

-- ============================================================================
-- PHASE 1: Création des tables SANS les contraintes FK circulaires
-- ============================================================================

-- Configuration Items (pas de FK)
CREATE TABLE data.configuration_items (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Types (pas de FK)
CREATE TABLE configuration.ticket_types (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Status (FK vers ticket_types uniquement)
CREATE TABLE configuration.ticket_status (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    rel_ticket_type VARCHAR(50) REFERENCES configuration.ticket_types(code),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, rel_ticket_type)
);

-- Symptoms (pas de FK)
CREATE TABLE configuration.symptoms (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Entities (SANS FK vers persons pour éviter la circularité)
CREATE TABLE configuration.entities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(50) NOT NULL UNIQUE,
    external_id VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('COMPANY', 'BRANCH', 'DEPARTMENT', 'SUPPLIER', 'CUSTOMER')), 
    budget_approver_uuid UUID,  -- FK ajoutée plus tard
    rel_headquarters_location UUID,  -- FK vers locations ajoutée plus tard
    is_active BOOLEAN NOT NULL DEFAULT true,
    parent_uuid UUID,  -- FK ajoutée plus tard (auto-référence)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations (SANS FK vers entities/groups/ticket_status pour éviter la circularité)
CREATE TABLE configuration.locations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_entity_uuid UUID,  -- FK ajoutée plus tard
    field_service_group_uuid UUID,  -- FK ajoutée plus tard
    rel_status_uuid UUID,  -- FK ajoutée plus tard
    site_created_on TIMESTAMP WITH TIME ZONE,
    site_id VARCHAR(100),
    type VARCHAR(100),
    business_criticality VARCHAR(50),
    opening_hours VARCHAR(255),
    parent_uuid UUID,  -- FK ajoutée plus tard (auto-référence)
    phone VARCHAR(50),
    time_zone VARCHAR(100),
    street VARCHAR(255),
    city VARCHAR(255),
    state_province VARCHAR(255),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    comments TEXT,
    alternative_site_reference VARCHAR(255),
    wan_design TEXT,
    network_telecom_service TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Persons (SANS FK vers entities pour éviter la circularité)
CREATE TABLE configuration.persons (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_role VARCHAR(255),
    ref_entity_uuid UUID,  -- FK ajoutée plus tard
    password VARCHAR(255),
    password_needs_reset BOOLEAN DEFAULT false,
    locked_out BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    critical_user BOOLEAN DEFAULT false,
    external_user BOOLEAN DEFAULT false,
    date_format VARCHAR(50),
    internal_id VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    notification BOOLEAN DEFAULT true,
    time_zone VARCHAR(100),
    ref_location_uuid UUID,  -- FK ajoutée plus tard
    floor VARCHAR(50),
    room VARCHAR(50),
    ref_approving_manager_uuid UUID,  -- FK ajoutée plus tard (auto-référence)
    business_phone VARCHAR(50),
    business_mobile_phone VARCHAR(50),
    personal_mobile_phone VARCHAR(50),
    language VARCHAR(10),
    roles JSONB,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Groups (FK vers persons OK maintenant)
CREATE TABLE configuration.groups (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255) NOT NULL,
    support_level INTEGER CHECK (support_level >= 0),
    description TEXT,
    rel_supervisor UUID REFERENCES configuration.persons(uuid),
    rel_manager UUID REFERENCES configuration.persons(uuid),
    rel_schedule UUID,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Services (SANS FK vers entities/persons/groups pour éviter la circularité)
CREATE TABLE data.services (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owning_entity_uuid UUID,  -- FK ajoutée plus tard
    owned_by_uuid UUID,  -- FK ajoutée plus tard
    managed_by_uuid UUID,  -- FK ajoutée plus tard
    business_criticality VARCHAR(50),
    lifecycle_status VARCHAR(50),
    version VARCHAR(50),
    operational VARCHAR(50),
    legal_regulatory VARCHAR(50),
    reputational VARCHAR(50),
    financial VARCHAR(50),
    comments TEXT,
    cab_uuid UUID,  -- FK ajoutée plus tard
    parent_uuid UUID,  -- FK ajoutée plus tard (auto-référence)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Person Groups (relation many-to-many)
CREATE TABLE configuration.rel_persons_groups (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_member UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE CASCADE,
    rel_group UUID NOT NULL REFERENCES configuration.groups(uuid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rel_member, rel_group)
);

-- Person Delegates (relation many-to-many)
CREATE TABLE configuration.rel_persons_delegates (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE CASCADE,
    delegate_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_delegation_period CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT no_self_delegation CHECK (person_uuid != delegate_uuid)
);

-- Entity Locations
CREATE TABLE configuration.rel_entities_locations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_uuid UUID NOT NULL REFERENCES configuration.entities(uuid) ON DELETE CASCADE,
    location_uuid UUID NOT NULL REFERENCES configuration.locations(uuid) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Service Offerings
CREATE TABLE data.service_offerings (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    business_criticality VARCHAR(50),
    environment VARCHAR(100),
    price_model VARCHAR(100),
    currency VARCHAR(3),
    service_uuid UUID NOT NULL REFERENCES data.services(uuid) ON DELETE CASCADE,
    operator_entity_uuid UUID NOT NULL REFERENCES configuration.entities(uuid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_offering_period CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Service Subscriptions
CREATE TABLE data.rel_subscribers_serviceofferings (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_uuid UUID NOT NULL,
    service_offering_uuid UUID NOT NULL REFERENCES data.service_offerings(uuid) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_subscription_period CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Ticket Types Translation
CREATE TABLE translations.ticket_types_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_uuid UUID NOT NULL REFERENCES configuration.ticket_types(uuid) ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(5) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_type_uuid, lang)
);

-- Ticket Status Translation
CREATE TABLE translations.ticket_status_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_status_uuid UUID NOT NULL REFERENCES configuration.ticket_status(uuid) ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE,
    lang VARCHAR(5) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_status_uuid, lang)
);

-- Symptoms Translation
CREATE TABLE translations.symptoms_translation (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symptom_code VARCHAR(50) NOT NULL,
    lang VARCHAR(5) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symptom_code, lang),
    CONSTRAINT symptoms_translation_symptom_code_fkey 
        FOREIGN KEY (symptom_code) 
        REFERENCES configuration.symptoms(code) 
        ON DELETE RESTRICT 
        DEFERRABLE INITIALLY IMMEDIATE
);

-- Persons Entities (relation many-to-many)
CREATE TABLE configuration.rel_persons_entities (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    entity_uuid UUID NOT NULL REFERENCES configuration.entities(uuid) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_uuid, entity_uuid)
);

-- Tickets (table centrale)
CREATE TABLE core.tickets (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    configuration_item_uuid UUID REFERENCES data.configuration_items(uuid) ON DELETE RESTRICT,
    requested_by_uuid UUID REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    requested_for_uuid UUID REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    writer_uuid UUID NOT NULL REFERENCES configuration.persons(uuid) ON DELETE RESTRICT,
    ticket_type_code VARCHAR(50) NOT NULL REFERENCES configuration.ticket_types(code) ON DELETE RESTRICT,
    ticket_status_code VARCHAR(50) NOT NULL,
    core_extended_attributes JSONB,
    user_extended_attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Commentaires pour documenter les contraintes de clés étrangères
COMMENT ON CONSTRAINT tickets_configuration_item_uuid_fkey ON core.tickets IS 'Lien vers l''élément de configuration concerné (optionnel)';
COMMENT ON CONSTRAINT tickets_requested_by_uuid_fkey ON core.tickets IS 'Personne qui demande le ticket';
COMMENT ON CONSTRAINT tickets_requested_for_uuid_fkey ON core.tickets IS 'Personne pour qui le ticket est créé';
COMMENT ON CONSTRAINT tickets_writer_uuid_fkey ON core.tickets IS 'Personne qui écrit le ticket';
COMMENT ON CONSTRAINT tickets_ticket_type_code_fkey ON core.tickets IS 'Type du ticket';
-- Note: ticket_status_code n'a pas de FK car ticket_status a une contrainte composite UNIQUE(code, rel_ticket_type)

-- Relation parent-enfant entre tickets
CREATE TABLE core.rel_parent_child_tickets (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_parent_ticket_uuid UUID NOT NULL REFERENCES core.tickets(uuid) ON DELETE CASCADE,
    rel_child_ticket_uuid UUID NOT NULL REFERENCES core.tickets(uuid) ON DELETE CASCADE,
    dependency_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT no_self_reference CHECK (rel_parent_ticket_uuid != rel_child_ticket_uuid)
);

COMMENT ON TABLE core.rel_parent_child_tickets IS 'Table de relation entre tickets parents et enfants';
COMMENT ON CONSTRAINT rel_parent_child_tickets_rel_parent_ticket_uuid_fkey ON core.rel_parent_child_tickets IS 'Référence au ticket parent';
COMMENT ON CONSTRAINT rel_parent_child_tickets_rel_child_ticket_uuid_fkey ON core.rel_parent_child_tickets IS 'Référence au ticket enfant';
COMMENT ON COLUMN core.rel_parent_child_tickets.dependency_code IS 'Code de catégorisation du type de relation entre tickets';
COMMENT ON COLUMN core.rel_parent_child_tickets.ended_at IS 'Date de fin de la relation parent-enfant entre tickets';

-- ============================================================================
-- PHASE 2: Ajout des contraintes FK circulaires
-- ============================================================================

-- Entities: Ajout des FK vers persons, locations et auto-référence
ALTER TABLE configuration.entities 
    ADD CONSTRAINT entities_budget_approver_uuid_fkey 
    FOREIGN KEY (budget_approver_uuid) REFERENCES configuration.persons(uuid);

ALTER TABLE configuration.entities 
    ADD CONSTRAINT entities_parent_uuid_fkey 
    FOREIGN KEY (parent_uuid) REFERENCES configuration.entities(uuid);

ALTER TABLE configuration.entities 
    ADD CONSTRAINT entities_headquarters_location_fkey 
    FOREIGN KEY (rel_headquarters_location) REFERENCES configuration.locations(uuid);

-- Persons: Ajout des FK vers entities, locations et auto-référence
ALTER TABLE configuration.persons 
    ADD CONSTRAINT persons_ref_entity_uuid_fkey 
    FOREIGN KEY (ref_entity_uuid) REFERENCES configuration.entities(uuid);

ALTER TABLE configuration.persons 
    ADD CONSTRAINT persons_ref_location_uuid_fkey 
    FOREIGN KEY (ref_location_uuid) REFERENCES configuration.locations(uuid);

ALTER TABLE configuration.persons 
    ADD CONSTRAINT persons_ref_approving_manager_uuid_fkey 
    FOREIGN KEY (ref_approving_manager_uuid) REFERENCES configuration.persons(uuid);

-- Locations: Ajout des FK vers entities, groups, ticket_status et auto-référence
ALTER TABLE configuration.locations 
    ADD CONSTRAINT locations_primary_entity_uuid_fkey 
    FOREIGN KEY (primary_entity_uuid) REFERENCES configuration.entities(uuid);

ALTER TABLE configuration.locations 
    ADD CONSTRAINT locations_field_service_group_uuid_fkey 
    FOREIGN KEY (field_service_group_uuid) REFERENCES configuration.groups(uuid);

ALTER TABLE configuration.locations 
    ADD CONSTRAINT locations_rel_status_uuid_fkey 
    FOREIGN KEY (rel_status_uuid) REFERENCES configuration.ticket_status(uuid);

ALTER TABLE configuration.locations 
    ADD CONSTRAINT locations_parent_uuid_fkey 
    FOREIGN KEY (parent_uuid) REFERENCES configuration.locations(uuid);

-- Services: Ajout des FK vers entities, persons, groups et auto-référence
ALTER TABLE data.services 
    ADD CONSTRAINT services_owning_entity_uuid_fkey 
    FOREIGN KEY (owning_entity_uuid) REFERENCES configuration.entities(uuid);

ALTER TABLE data.services 
    ADD CONSTRAINT services_owned_by_uuid_fkey 
    FOREIGN KEY (owned_by_uuid) REFERENCES configuration.persons(uuid);

ALTER TABLE data.services 
    ADD CONSTRAINT services_managed_by_uuid_fkey 
    FOREIGN KEY (managed_by_uuid) REFERENCES configuration.persons(uuid);

ALTER TABLE data.services 
    ADD CONSTRAINT services_cab_uuid_fkey 
    FOREIGN KEY (cab_uuid) REFERENCES configuration.groups(uuid);

ALTER TABLE data.services 
    ADD CONSTRAINT services_parent_uuid_fkey 
    FOREIGN KEY (parent_uuid) REFERENCES data.services(uuid);

-- Tickets: Ajout de la FK vers ticket_status (contrainte composite)
-- Note: ticket_status a une contrainte UNIQUE(code, rel_ticket_type)
-- On ne peut pas créer une FK simple sur code seul, donc on laisse sans FK
-- La validation sera faite au niveau applicatif

-- Validation des modifications
COMMIT;
