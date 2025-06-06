-- Script: 03_alter_tables_add_ended_at.sql
-- Description: Ajout de la colonne ended_at à la table rel_parent_child_tickets
-- Date: 2025-06-06

-- Activation du mode transaction
BEGIN;

-- Ajout de la colonne ended_at à la table rel_parent_child_tickets
ALTER TABLE core.rel_parent_child_tickets
ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN core.rel_parent_child_tickets.ended_at IS 'Date de fin de la relation parent-enfant entre tickets';

COMMIT;
