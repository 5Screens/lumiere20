-- Script: 04_ticket_status.sql
-- Description: Insertion des statuts de tickets et leurs traductions
-- Date: 2025-03-25

BEGIN;

-- Insertion des statuts de tickets génériques (applicables à tous les types)
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('NEW', NULL),           -- Nouveau ticket
    ('ASSIGNED', NULL),      -- Ticket assigné
    ('IN_PROGRESS', NULL),   -- En cours de traitement
    ('PENDING', NULL),       -- En attente (ex: attente d'information)
    ('RESOLVED', NULL),      -- Résolu
    ('CLOSED', NULL),        -- Fermé
    ('CANCELLED', NULL),     -- Annulé
    ('REOPENED', NULL);      -- Réouvert

-- Insertion des statuts spécifiques aux incidents
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('INVESTIGATING', 'INCIDENT'),     -- Investigation en cours
    ('DIAGNOSED', 'INCIDENT'),         -- Diagnostic établi
    ('WORKAROUND', 'INCIDENT'),        -- Solution de contournement appliquée
    ('ESCALATED', 'INCIDENT');         -- Escaladé à un niveau supérieur

-- Insertion des statuts spécifiques aux problèmes
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('ROOT_CAUSE_IDENTIFIED', 'PROBLEM'),    -- Cause racine identifiée
    ('SOLUTION_PROPOSED', 'PROBLEM'),        -- Solution proposée
    ('SOLUTION_APPROVED', 'PROBLEM'),        -- Solution approuvée
    ('KNOWN_ERROR', 'PROBLEM');              -- Erreur connue

-- Insertion des statuts spécifiques aux changements
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('REQUESTED', 'CHANGE'),           -- Demande de changement soumise
    ('EVALUATED', 'CHANGE'),           -- Évaluation effectuée
    ('APPROVED', 'CHANGE'),            -- Approuvé
    ('REJECTED', 'CHANGE'),            -- Rejeté
    ('SCHEDULED', 'CHANGE'),           -- Planifié
    ('IMPLEMENTED', 'CHANGE'),         -- Implémenté
    ('REVIEWED', 'CHANGE');            -- Revue post-implémentation effectuée

-- Insertion des statuts spécifiques aux demandes
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('SUBMITTED', 'REQUEST'),          -- Demande soumise
    ('APPROVED_REQUEST', 'REQUEST'),   -- Demande approuvée
    ('REJECTED_REQUEST', 'REQUEST'),   -- Demande rejetée
    ('FULFILLED', 'REQUEST');          -- Demande satisfaite

-- Insertion des statuts spécifiques aux projets
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('INITIATED', 'PROJECT'),          -- Projet initié
    ('PLANNING', 'PROJECT'),           -- En phase de planification
    ('EXECUTING', 'PROJECT'),          -- En phase d'exécution
    ('MONITORING', 'PROJECT'),         -- En phase de surveillance
    ('COMPLETED', 'PROJECT');          -- Projet terminé

-- Insertion des statuts spécifiques aux sprints
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('PLANNED', 'SPRINT'),             -- Sprint planifié
    ('ACTIVE', 'SPRINT'),              -- Sprint actif
    ('CLOSED', 'SPRINT'),              -- Sprint fermé
    ('DRAFT', 'SPRINT'),               -- Sprint en brouillon
    ('CANCELLED', 'SPRINT');           -- Sprint annulé

-- Insertion des traductions en français
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        -- Statuts génériques
        WHEN 'NEW' THEN 'Nouveau'
        WHEN 'ASSIGNED' THEN 'Assigné'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'PENDING' THEN 'En attente'
        WHEN 'RESOLVED' THEN 'Résolu'
        WHEN 'CLOSED' THEN 'Fermé'
        WHEN 'CANCELLED' THEN 'Annulé'
        WHEN 'REOPENED' THEN 'Réouvert'
        -- Statuts spécifiques aux incidents
        WHEN 'INVESTIGATING' THEN 'En investigation'
        WHEN 'DIAGNOSED' THEN 'Diagnostiqué'
        WHEN 'WORKAROUND' THEN 'Solution de contournement'
        WHEN 'ESCALATED' THEN 'Escaladé'
        -- Statuts spécifiques aux problèmes
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Cause racine identifiée'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solution proposée'
        WHEN 'SOLUTION_APPROVED' THEN 'Solution approuvée'
        WHEN 'KNOWN_ERROR' THEN 'Erreur connue'
        -- Statuts spécifiques aux changements
        WHEN 'REQUESTED' THEN 'Demandé'
        WHEN 'EVALUATED' THEN 'Évalué'
        WHEN 'APPROVED' THEN 'Approuvé'
        WHEN 'REJECTED' THEN 'Rejeté'
        WHEN 'SCHEDULED' THEN 'Planifié'
        WHEN 'IMPLEMENTED' THEN 'Implémenté'
        WHEN 'REVIEWED' THEN 'Revu'
        -- Statuts spécifiques aux demandes
        WHEN 'SUBMITTED' THEN 'Soumis'
        WHEN 'APPROVED_REQUEST' THEN 'Demande approuvée'
        WHEN 'REJECTED_REQUEST' THEN 'Demande rejetée'
        WHEN 'FULFILLED' THEN 'Satisfait'
        -- Statuts spécifiques aux projets
        WHEN 'INITIATED' THEN 'Initié'
        WHEN 'PLANNING' THEN 'En planification'
        WHEN 'EXECUTING' THEN 'En exécution'
        WHEN 'MONITORING' THEN 'En surveillance'
        WHEN 'COMPLETED' THEN 'Terminé'
        -- Statuts spécifiques aux sprints
        WHEN 'PLANNED' THEN 'Planifié'
        WHEN 'ACTIVE' THEN 'Actif'
        WHEN 'CLOSED' THEN 'Fermé'
        WHEN 'DRAFT' THEN 'Brouillon'
        WHEN 'CANCELLED' THEN 'Annulé'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en anglais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        -- Statuts génériques
        WHEN 'NEW' THEN 'New'
        WHEN 'ASSIGNED' THEN 'Assigned'
        WHEN 'IN_PROGRESS' THEN 'In Progress'
        WHEN 'PENDING' THEN 'Pending'
        WHEN 'RESOLVED' THEN 'Resolved'
        WHEN 'CLOSED' THEN 'Closed'
        WHEN 'CANCELLED' THEN 'Cancelled'
        WHEN 'REOPENED' THEN 'Reopened'
        -- Statuts spécifiques aux incidents
        WHEN 'INVESTIGATING' THEN 'Investigating'
        WHEN 'DIAGNOSED' THEN 'Diagnosed'
        WHEN 'WORKAROUND' THEN 'Workaround Applied'
        WHEN 'ESCALATED' THEN 'Escalated'
        -- Statuts spécifiques aux problèmes
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Root Cause Identified'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solution Proposed'
        WHEN 'SOLUTION_APPROVED' THEN 'Solution Approved'
        WHEN 'KNOWN_ERROR' THEN 'Known Error'
        -- Statuts spécifiques aux changements
        WHEN 'REQUESTED' THEN 'Requested'
        WHEN 'EVALUATED' THEN 'Evaluated'
        WHEN 'APPROVED' THEN 'Approved'
        WHEN 'REJECTED' THEN 'Rejected'
        WHEN 'SCHEDULED' THEN 'Scheduled'
        WHEN 'IMPLEMENTED' THEN 'Implemented'
        WHEN 'REVIEWED' THEN 'Reviewed'
        -- Statuts spécifiques aux demandes
        WHEN 'SUBMITTED' THEN 'Submitted'
        WHEN 'APPROVED_REQUEST' THEN 'Request Approved'
        WHEN 'REJECTED_REQUEST' THEN 'Request Rejected'
        WHEN 'FULFILLED' THEN 'Fulfilled'
        -- Statuts spécifiques aux projets
        WHEN 'INITIATED' THEN 'Initiated'
        WHEN 'PLANNING' THEN 'Planning'
        WHEN 'EXECUTING' THEN 'Executing'
        WHEN 'MONITORING' THEN 'Monitoring'
        WHEN 'COMPLETED' THEN 'Completed'
        -- Statuts spécifiques aux sprints
        WHEN 'PLANNED' THEN 'Planned'
        WHEN 'ACTIVE' THEN 'Active'
        WHEN 'CLOSED' THEN 'Closed'
        WHEN 'DRAFT' THEN 'Draft'
        WHEN 'CANCELLED' THEN 'Cancelled'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en espagnol
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        -- Statuts génériques
        WHEN 'NEW' THEN 'Nuevo'
        WHEN 'ASSIGNED' THEN 'Asignado'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'PENDING' THEN 'Pendiente'
        WHEN 'RESOLVED' THEN 'Resuelto'
        WHEN 'CLOSED' THEN 'Cerrado'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'REOPENED' THEN 'Reabierto'
        -- Statuts spécifiques aux incidents
        WHEN 'INVESTIGATING' THEN 'Investigando'
        WHEN 'DIAGNOSED' THEN 'Diagnosticado'
        WHEN 'WORKAROUND' THEN 'Solución provisional'
        WHEN 'ESCALATED' THEN 'Escalado'
        -- Statuts spécifiques aux problèmes
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Causa raíz identificada'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solución propuesta'
        WHEN 'SOLUTION_APPROVED' THEN 'Solución aprobada'
        WHEN 'KNOWN_ERROR' THEN 'Error conocido'
        -- Statuts spécifiques aux changements
        WHEN 'REQUESTED' THEN 'Solicitado'
        WHEN 'EVALUATED' THEN 'Evaluado'
        WHEN 'APPROVED' THEN 'Aprobado'
        WHEN 'REJECTED' THEN 'Rechazado'
        WHEN 'SCHEDULED' THEN 'Programado'
        WHEN 'IMPLEMENTED' THEN 'Implementado'
        WHEN 'REVIEWED' THEN 'Revisado'
        -- Statuts spécifiques aux demandes
        WHEN 'SUBMITTED' THEN 'Enviado'
        WHEN 'APPROVED_REQUEST' THEN 'Solicitud aprobada'
        WHEN 'REJECTED_REQUEST' THEN 'Solicitud rechazada'
        WHEN 'FULFILLED' THEN 'Completado'
        -- Statuts spécifiques aux projets
        WHEN 'INITIATED' THEN 'Iniciado'
        WHEN 'PLANNING' THEN 'Planificación'
        WHEN 'EXECUTING' THEN 'Ejecución'
        WHEN 'MONITORING' THEN 'Monitoreo'
        WHEN 'COMPLETED' THEN 'Completado'
        -- Statuts spécifiques aux sprints
        WHEN 'PLANNED' THEN 'Planificado'
        WHEN 'ACTIVE' THEN 'Activo'
        WHEN 'CLOSED' THEN 'Cerrado'
        WHEN 'DRAFT' THEN 'Borrador'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status;

-- Insertion des traductions en portugais
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        -- Statuts génériques
        WHEN 'NEW' THEN 'Novo'
        WHEN 'ASSIGNED' THEN 'Atribuído'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'PENDING' THEN 'Pendente'
        WHEN 'RESOLVED' THEN 'Resolvido'
        WHEN 'CLOSED' THEN 'Fechado'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'REOPENED' THEN 'Reaberto'
        -- Statuts spécifiques aux incidents
        WHEN 'INVESTIGATING' THEN 'Investigando'
        WHEN 'DIAGNOSED' THEN 'Diagnosticado'
        WHEN 'WORKAROUND' THEN 'Solução alternativa'
        WHEN 'ESCALATED' THEN 'Escalado'
        -- Statuts spécifiques aux problèmes
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Causa raiz identificada'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solução proposta'
        WHEN 'SOLUTION_APPROVED' THEN 'Solução aprovada'
        WHEN 'KNOWN_ERROR' THEN 'Erro conhecido'
        -- Statuts spécifiques aux changements
        WHEN 'REQUESTED' THEN 'Solicitado'
        WHEN 'EVALUATED' THEN 'Avaliado'
        WHEN 'APPROVED' THEN 'Aprovado'
        WHEN 'REJECTED' THEN 'Rejeitado'
        WHEN 'SCHEDULED' THEN 'Agendado'
        WHEN 'IMPLEMENTED' THEN 'Implementado'
        WHEN 'REVIEWED' THEN 'Revisado'
        -- Statuts spécifiques aux demandes
        WHEN 'SUBMITTED' THEN 'Submetido'
        WHEN 'APPROVED_REQUEST' THEN 'Solicitação aprovada'
        WHEN 'REJECTED_REQUEST' THEN 'Solicitação rejeitada'
        WHEN 'FULFILLED' THEN 'Atendido'
        -- Statuts spécifiques aux projets
        WHEN 'INITIATED' THEN 'Iniciado'
        WHEN 'PLANNING' THEN 'Planejamento'
        WHEN 'EXECUTING' THEN 'Execução'
        WHEN 'MONITORING' THEN 'Monitoramento'
        WHEN 'COMPLETED' THEN 'Concluído'
        -- Statuts spécifiques aux sprints
        WHEN 'PLANNED' THEN 'Planejado'
        WHEN 'ACTIVE' THEN 'Ativo'
        WHEN 'CLOSED' THEN 'Fechado'
        WHEN 'DRAFT' THEN 'Rascunho'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status;

COMMIT;
