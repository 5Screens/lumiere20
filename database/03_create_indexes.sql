-- Script: 03_create_indexes.sql
-- Description: Création des index pour Lumiere v16
-- Date: 2025-02-03

-- Activation du mode transaction
BEGIN;

-- Indexes pour configuration_items (schéma data)
CREATE INDEX idx_configuration_items_nom ON data.configuration_items (nom);
CREATE INDEX idx_configuration_items_dates ON data.configuration_items (created_at, updated_at);

-- Indexes pour persons (schéma configuration)
CREATE INDEX idx_persons_nom_prenom ON configuration.persons (nom, prenom);
CREATE INDEX idx_persons_email ON configuration.persons (email);
CREATE INDEX idx_persons_dates ON configuration.persons (created_at, updated_at);

-- Indexes pour entities (schéma configuration)
CREATE INDEX idx_entities_nom ON configuration.entities (nom);
CREATE INDEX idx_entities_dates ON configuration.entities (created_at, updated_at);

-- Indexes pour ticket_types (schéma configuration)
CREATE INDEX idx_ticket_types_code ON configuration.ticket_types (code);
CREATE INDEX idx_ticket_types_dates ON configuration.ticket_types (created_at, updated_at);

-- Indexes pour ticket_status (schéma configuration)
CREATE INDEX idx_ticket_status_code ON configuration.ticket_status (code);
CREATE INDEX idx_ticket_status_dates ON configuration.ticket_status (created_at, updated_at);

-- Indexes pour symptoms (schéma configuration)
CREATE INDEX idx_symptoms_code ON configuration.symptoms (code);
CREATE INDEX idx_symptoms_dates ON configuration.symptoms (created_at, updated_at);

-- Indexes pour les tables de traduction (schéma translations)
CREATE INDEX idx_ticket_types_translation_langue ON translations.ticket_types_translation (langue);
CREATE INDEX idx_ticket_types_translation_dates ON translations.ticket_types_translation (created_at, updated_at);

CREATE INDEX idx_ticket_status_translation_langue ON translations.ticket_status_translation (langue);
CREATE INDEX idx_ticket_status_translation_dates ON translations.ticket_status_translation (created_at, updated_at);

CREATE INDEX idx_symptoms_translation_langue ON translations.symptoms_translation (langue);
CREATE INDEX idx_symptoms_translation_dates ON translations.symptoms_translation (created_at, updated_at);

-- Indexes pour persons_entities (schéma configuration)
CREATE INDEX idx_persons_entities_person ON configuration.persons_entities (person_uuid);
CREATE INDEX idx_persons_entities_entity ON configuration.persons_entities (entity_uuid);
CREATE INDEX idx_persons_entities_dates ON configuration.persons_entities (created_at, updated_at);

-- Indexes pour tickets (schéma core)
CREATE INDEX idx_tickets_titre ON core.tickets (titre);
CREATE INDEX idx_tickets_configuration_item ON core.tickets (configuration_item_uuid);
CREATE INDEX idx_tickets_requested_by ON core.tickets (requested_by_uuid);
CREATE INDEX idx_tickets_requested_for ON core.tickets (requested_for_uuid);
CREATE INDEX idx_tickets_writer ON core.tickets (writer_uuid);
CREATE INDEX idx_tickets_type ON core.tickets (ticket_type_uuid);
CREATE INDEX idx_tickets_status ON core.tickets (ticket_status_uuid);
CREATE INDEX idx_tickets_dates ON core.tickets (created_at, updated_at);

-- Index pour la recherche full-text sur les tickets
CREATE INDEX idx_tickets_full_text ON core.tickets 
USING gin(to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(description,'')));

-- Validation des modifications
COMMIT;

-- Commentaires sur les index créés
COMMENT ON INDEX data.idx_configuration_items_nom IS 'Index pour la recherche par nom des éléments de configuration';
COMMENT ON INDEX configuration.idx_persons_nom_prenom IS 'Index pour la recherche par nom et prénom des personnes';
COMMENT ON INDEX configuration.idx_persons_email IS 'Index pour la recherche par email des personnes';
COMMENT ON INDEX configuration.idx_entities_nom IS 'Index pour la recherche par nom des entités';
COMMENT ON INDEX core.idx_tickets_full_text IS 'Index pour la recherche full-text sur le titre et la description des tickets';
