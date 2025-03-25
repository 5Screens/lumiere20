-- Script: 04_ticket_status.sql
-- Description: Insertion des statuts de tickets et leurs traductions
-- Date: 2025-03-25

BEGIN;

-- Insertion des statuts de tickets
INSERT INTO configuration.ticket_status (code) VALUES
    ('NEW'),           -- Nouveau ticket
    ('ASSIGNED'),      -- Ticket assigné
    ('IN_PROGRESS'),   -- En cours de traitement
    ('PENDING'),       -- En attente (ex: attente d'information)
    ('RESOLVED'),      -- Résolu
    ('CLOSED'),        -- Fermé
    ('CANCELLED'),     -- Annulé
    ('REOPENED');      -- Réouvert

-- Insertion des traductions en français
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'NEW' THEN 'Nouveau'
        WHEN 'ASSIGNED' THEN 'Assigné'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'PENDING' THEN 'En attente'
        WHEN 'RESOLVED' THEN 'Résolu'
        WHEN 'CLOSED' THEN 'Fermé'
        WHEN 'CANCELLED' THEN 'Annulé'
        WHEN 'REOPENED' THEN 'Réouvert'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en anglais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'NEW' THEN 'New'
        WHEN 'ASSIGNED' THEN 'Assigned'
        WHEN 'IN_PROGRESS' THEN 'In Progress'
        WHEN 'PENDING' THEN 'Pending'
        WHEN 'RESOLVED' THEN 'Resolved'
        WHEN 'CLOSED' THEN 'Closed'
        WHEN 'CANCELLED' THEN 'Cancelled'
        WHEN 'REOPENED' THEN 'Reopened'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en espagnol
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'NEW' THEN 'Nuevo'
        WHEN 'ASSIGNED' THEN 'Asignado'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'PENDING' THEN 'Pendiente'
        WHEN 'RESOLVED' THEN 'Resuelto'
        WHEN 'CLOSED' THEN 'Cerrado'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'REOPENED' THEN 'Reabierto'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en portugais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'NEW' THEN 'Novo'
        WHEN 'ASSIGNED' THEN 'Atribuído'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'PENDING' THEN 'Pendente'
        WHEN 'RESOLVED' THEN 'Resolvido'
        WHEN 'CLOSED' THEN 'Fechado'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'REOPENED' THEN 'Reaberto'
    END
FROM configuration.ticket_status;

COMMIT;
