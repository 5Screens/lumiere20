-- Script to create the rel_tickets_groups_persons table
-- This table manages ticket assignments and watchers
-- Created on: 2025-04-01

-- Start transaction
BEGIN;

-- Create enum type for relation type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relation_type') THEN
        CREATE TYPE core.relation_type AS ENUM ('WATCHER', 'ASSIGNED','ACCESS_GRANTED');
    END IF;
END
$$;

-- Create the rel_tickets_groups_persons table
CREATE TABLE IF NOT EXISTS core.rel_tickets_groups_persons (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rel_ticket UUID NOT NULL REFERENCES core.tickets(uuid) ON DELETE CASCADE,
    rel_assigned_to_group UUID REFERENCES configuration.groups(uuid) ON DELETE CASCADE,
    rel_assigned_to_person UUID REFERENCES configuration.persons(uuid) ON DELETE SET NULL,
    type core.relation_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure ended_at is after created_at when provided
    CONSTRAINT check_ended_after_created CHECK (ended_at IS NULL OR ended_at > created_at)
);

-- Add comments for documentation
COMMENT ON TABLE core.rel_tickets_groups_persons IS 'Table storing ticket assignments and watchers information';
COMMENT ON COLUMN core.rel_tickets_groups_persons.uuid IS 'Primary key';
COMMENT ON COLUMN core.rel_tickets_groups_persons.rel_ticket IS 'Reference to the ticket UUID';
COMMENT ON COLUMN core.rel_tickets_groups_persons.rel_assigned_to_group IS 'Reference to the group UUID';
COMMENT ON COLUMN core.rel_tickets_groups_persons.rel_assigned_to_person IS 'Optional reference to the person UUID';
COMMENT ON COLUMN core.rel_tickets_groups_persons.type IS 'Type of relation: WATCHER or ASSIGNED';
COMMENT ON COLUMN core.rel_tickets_groups_persons.created_at IS 'Date when the assignment/watch was created';
COMMENT ON COLUMN core.rel_tickets_groups_persons.updated_at IS 'Date when the assignment/watch was last updated';
COMMENT ON COLUMN core.rel_tickets_groups_persons.ended_at IS 'Optional date when the assignment/watch ended';

-- Create indexes for better query performance
CREATE INDEX idx_rel_tickets_groups_persons_ticket ON core.rel_tickets_groups_persons(rel_ticket);
CREATE INDEX idx_rel_tickets_groups_persons_group ON core.rel_tickets_groups_persons(rel_assigned_to_group);
CREATE INDEX idx_rel_tickets_groups_persons_person ON core.rel_tickets_groups_persons(rel_assigned_to_person);
CREATE INDEX idx_rel_tickets_groups_persons_type ON core.rel_tickets_groups_persons(type);
CREATE INDEX idx_rel_tickets_groups_persons_active ON core.rel_tickets_groups_persons(rel_ticket, ended_at) 
    WHERE ended_at IS NULL;

-- Add audit trigger for the table
CREATE TRIGGER trg_audit_rel_tickets_groups_persons
AFTER INSERT OR UPDATE OR DELETE ON core.rel_tickets_groups_persons
FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Commit transaction
COMMIT;
