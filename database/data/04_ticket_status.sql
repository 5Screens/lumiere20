-- Script: 04_ticket_status.sql
-- Description: Insertion des statuts de tickets et leurs traductions
-- Date: 2025-10-14
-- Structure: Chaque type de ticket a ses propres sections de traduction dédiées

BEGIN;

-- ============================================================================
-- SECTION 1: INSERTION DES STATUTS
-- ============================================================================

-- Statuts pour INCIDENT
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('INVESTIGATING', 'INCIDENT'),
    ('DIAGNOSED', 'INCIDENT'),
    ('WORKAROUND', 'INCIDENT'),
    ('ESCALATED', 'INCIDENT');

-- Statuts pour PROBLEM
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('ROOT_CAUSE_IDENTIFIED', 'PROBLEM'),
    ('SOLUTION_PROPOSED', 'PROBLEM'),
    ('SOLUTION_APPROVED', 'PROBLEM'),
    ('KNOWN_ERROR', 'PROBLEM');

-- Statuts pour CHANGE
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('REQUESTED', 'CHANGE'),
    ('EVALUATED', 'CHANGE'),
    ('APPROVED', 'CHANGE'),
    ('REJECTED', 'CHANGE'),
    ('SCHEDULED', 'CHANGE'),
    ('IMPLEMENTED', 'CHANGE'),
    ('REVIEWED', 'CHANGE');

-- Statuts pour REQUEST
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('SUBMITTED', 'REQUEST'),
    ('APPROVED_REQUEST', 'REQUEST'),
    ('REJECTED_REQUEST', 'REQUEST'),
    ('FULFILLED', 'REQUEST');

-- Statuts pour PROJECT
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('INITIATED', 'PROJECT'),
    ('PLANNING', 'PROJECT'),
    ('EXECUTING', 'PROJECT'),
    ('MONITORING', 'PROJECT'),
    ('COMPLETED', 'PROJECT');

-- Statuts pour SPRINT
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('PLANNED', 'SPRINT'),
    ('ACTIVE', 'SPRINT'),
    ('CLOSED', 'SPRINT'),
    ('DRAFT', 'SPRINT'),
    ('CANCELLED', 'SPRINT');

-- Statuts pour EPIC
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('IN_PREPARATION', 'EPIC'),
    ('OPEN', 'EPIC'),
    ('IN_PROGRESS', 'EPIC'),
    ('DONE', 'EPIC'),
    ('CANCELLED', 'EPIC'),
    ('ARCHIVED', 'EPIC');

-- Statuts pour USER_STORY
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('DRAFT', 'USER_STORY'),
    ('TO_DO', 'USER_STORY'),
    ('READY', 'USER_STORY'),
    ('IN_PROGRESS', 'USER_STORY'),
    ('IN_REVIEW', 'USER_STORY'),
    ('IN_TEST', 'USER_STORY'),
    ('DONE', 'USER_STORY'),
    ('CANCELLED', 'USER_STORY');

-- Statuts pour DEFECT
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('NEW', 'DEFECT'),
    ('TRIAGE', 'DEFECT'),
    ('ACKNOWLEDGED', 'DEFECT'),
    ('IN_PROGRESS', 'DEFECT'),
    ('IN_REVIEW', 'DEFECT'),
    ('IN_TEST', 'DEFECT'),
    ('RESOLVED', 'DEFECT'),
    ('CLOSED', 'DEFECT'),
    ('REOPENED', 'DEFECT'),
    ('CANCELLED', 'DEFECT');

-- Statuts pour TASK
INSERT INTO configuration.ticket_status (code, rel_ticket_type) VALUES
    ('NEW', 'TASK'),
    ('ASSIGNED', 'TASK'),
    ('IN_PROGRESS', 'TASK'),
    ('PENDING', 'TASK'),
    ('RESOLVED', 'TASK'),
    ('CLOSED', 'TASK'),
    ('CANCELLED', 'TASK'),
    ('REOPENED', 'TASK');

-- ============================================================================
-- SECTION 2: TRADUCTIONS FRANÇAISES (fr)
-- ============================================================================

-- Traductions pour INCIDENT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'INVESTIGATING' THEN 'En investigation'
        WHEN 'DIAGNOSED' THEN 'Diagnostiqué'
        WHEN 'WORKAROUND' THEN 'Solution de contournement'
        WHEN 'ESCALATED' THEN 'Escaladé'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'INCIDENT';

-- Traductions pour PROBLEM
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Cause racine identifiée'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solution proposée'
        WHEN 'SOLUTION_APPROVED' THEN 'Solution approuvée'
        WHEN 'KNOWN_ERROR' THEN 'Erreur connue'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROBLEM';

-- Traductions pour CHANGE
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'REQUESTED' THEN 'Demandé'
        WHEN 'EVALUATED' THEN 'Évalué'
        WHEN 'APPROVED' THEN 'Approuvé'
        WHEN 'REJECTED' THEN 'Rejeté'
        WHEN 'SCHEDULED' THEN 'Planifié'
        WHEN 'IMPLEMENTED' THEN 'Implémenté'
        WHEN 'REVIEWED' THEN 'Revu'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'CHANGE';

-- Traductions pour REQUEST
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'SUBMITTED' THEN 'Soumis'
        WHEN 'APPROVED_REQUEST' THEN 'Demande approuvée'
        WHEN 'REJECTED_REQUEST' THEN 'Demande rejetée'
        WHEN 'FULFILLED' THEN 'Satisfait'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'REQUEST';

-- Traductions pour PROJECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'INITIATED' THEN 'Initié'
        WHEN 'PLANNING' THEN 'En planification'
        WHEN 'EXECUTING' THEN 'En exécution'
        WHEN 'MONITORING' THEN 'En surveillance'
        WHEN 'COMPLETED' THEN 'Terminé'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROJECT';

-- Traductions pour SPRINT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'PLANNED' THEN 'Planifié'
        WHEN 'ACTIVE' THEN 'Actif'
        WHEN 'CLOSED' THEN 'Fermé'
        WHEN 'DRAFT' THEN 'Brouillon'
        WHEN 'CANCELLED' THEN 'Annulé'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'SPRINT';

-- Traductions pour EPIC
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'IN_PREPARATION' THEN 'En préparation'
        WHEN 'OPEN' THEN 'Ouvert'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'DONE' THEN 'Terminé'
        WHEN 'CANCELLED' THEN 'Annulé'
        WHEN 'ARCHIVED' THEN 'Archivé'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'EPIC';

-- Traductions pour USER_STORY
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'DRAFT' THEN 'Brouillon'
        WHEN 'TO_DO' THEN 'À faire'
        WHEN 'READY' THEN 'Prête'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'IN_REVIEW' THEN 'En revue'
        WHEN 'IN_TEST' THEN 'En test'
        WHEN 'DONE' THEN 'Terminée'
        WHEN 'CANCELLED' THEN 'Annulée'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'USER_STORY';

-- Traductions pour DEFECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'NEW' THEN 'Nouveau'
        WHEN 'TRIAGE' THEN 'Triage'
        WHEN 'ACKNOWLEDGED' THEN 'Reconnu'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'IN_REVIEW' THEN 'En revue'
        WHEN 'IN_TEST' THEN 'En test'
        WHEN 'RESOLVED' THEN 'Résolu'
        WHEN 'CLOSED' THEN 'Fermé'
        WHEN 'REOPENED' THEN 'Réouvert'
        WHEN 'CANCELLED' THEN 'Annulé'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'DEFECT';

-- Traductions pour TASK
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'fr', 
    CASE code
        WHEN 'NEW' THEN 'Nouvelle'
        WHEN 'ASSIGNED' THEN 'Assignée'
        WHEN 'IN_PROGRESS' THEN 'En cours'
        WHEN 'PENDING' THEN 'En attente'
        WHEN 'RESOLVED' THEN 'Résolue'
        WHEN 'CLOSED' THEN 'Fermée'
        WHEN 'CANCELLED' THEN 'Annulée'
        WHEN 'REOPENED' THEN 'Réouverte'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'TASK';

-- ============================================================================
-- SECTION 3: TRADUCTIONS ANGLAISES (en)
-- ============================================================================

-- Traductions pour INCIDENT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'INVESTIGATING' THEN 'Investigating'
        WHEN 'DIAGNOSED' THEN 'Diagnosed'
        WHEN 'WORKAROUND' THEN 'Workaround Applied'
        WHEN 'ESCALATED' THEN 'Escalated'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'INCIDENT';

-- Traductions pour PROBLEM
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Root Cause Identified'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solution Proposed'
        WHEN 'SOLUTION_APPROVED' THEN 'Solution Approved'
        WHEN 'KNOWN_ERROR' THEN 'Known Error'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROBLEM';

-- Traductions pour CHANGE
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'REQUESTED' THEN 'Requested'
        WHEN 'EVALUATED' THEN 'Evaluated'
        WHEN 'APPROVED' THEN 'Approved'
        WHEN 'REJECTED' THEN 'Rejected'
        WHEN 'SCHEDULED' THEN 'Scheduled'
        WHEN 'IMPLEMENTED' THEN 'Implemented'
        WHEN 'REVIEWED' THEN 'Reviewed'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'CHANGE';

-- Traductions pour REQUEST
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'SUBMITTED' THEN 'Submitted'
        WHEN 'APPROVED_REQUEST' THEN 'Request Approved'
        WHEN 'REJECTED_REQUEST' THEN 'Request Rejected'
        WHEN 'FULFILLED' THEN 'Fulfilled'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'REQUEST';

-- Traductions pour PROJECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'INITIATED' THEN 'Initiated'
        WHEN 'PLANNING' THEN 'Planning'
        WHEN 'EXECUTING' THEN 'Executing'
        WHEN 'MONITORING' THEN 'Monitoring'
        WHEN 'COMPLETED' THEN 'Completed'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROJECT';

-- Traductions pour SPRINT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'PLANNED' THEN 'Planned'
        WHEN 'ACTIVE' THEN 'Active'
        WHEN 'CLOSED' THEN 'Closed'
        WHEN 'DRAFT' THEN 'Draft'
        WHEN 'CANCELLED' THEN 'Cancelled'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'SPRINT';

-- Traductions pour EPIC
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'IN_PREPARATION' THEN 'In Preparation'
        WHEN 'OPEN' THEN 'Open'
        WHEN 'IN_PROGRESS' THEN 'In Progress'
        WHEN 'DONE' THEN 'Done'
        WHEN 'CANCELLED' THEN 'Cancelled'
        WHEN 'ARCHIVED' THEN 'Archived'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'EPIC';

-- Traductions pour USER_STORY
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'DRAFT' THEN 'Draft'
        WHEN 'TO_DO' THEN 'To Do'
        WHEN 'READY' THEN 'Ready'
        WHEN 'IN_PROGRESS' THEN 'In Progress'
        WHEN 'IN_REVIEW' THEN 'In Review'
        WHEN 'IN_TEST' THEN 'In Test'
        WHEN 'DONE' THEN 'Done'
        WHEN 'CANCELLED' THEN 'Cancelled'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'USER_STORY';

-- Traductions pour DEFECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'en', 
    CASE code
        WHEN 'NEW' THEN 'New'
        WHEN 'TRIAGE' THEN 'Triage'
        WHEN 'ACKNOWLEDGED' THEN 'Acknowledged'
        WHEN 'IN_PROGRESS' THEN 'In Progress'
        WHEN 'IN_REVIEW' THEN 'In Review'
        WHEN 'IN_TEST' THEN 'In Test'
        WHEN 'RESOLVED' THEN 'Resolved'
        WHEN 'CLOSED' THEN 'Closed'
        WHEN 'REOPENED' THEN 'Reopened'
        WHEN 'CANCELLED' THEN 'Cancelled'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'DEFECT';

-- Traductions pour TASK
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
FROM configuration.ticket_status
WHERE rel_ticket_type = 'TASK';

-- ============================================================================
-- SECTION 4: TRADUCTIONS ESPAGNOLES (es)
-- ============================================================================

-- Traductions pour INCIDENT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'INVESTIGATING' THEN 'Investigando'
        WHEN 'DIAGNOSED' THEN 'Diagnosticado'
        WHEN 'WORKAROUND' THEN 'Solución provisional'
        WHEN 'ESCALATED' THEN 'Escalado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'INCIDENT';

-- Traductions pour PROBLEM
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Causa raíz identificada'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solución propuesta'
        WHEN 'SOLUTION_APPROVED' THEN 'Solución aprobada'
        WHEN 'KNOWN_ERROR' THEN 'Error conocido'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROBLEM';

-- Traductions pour CHANGE
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'REQUESTED' THEN 'Solicitado'
        WHEN 'EVALUATED' THEN 'Evaluado'
        WHEN 'APPROVED' THEN 'Aprobado'
        WHEN 'REJECTED' THEN 'Rechazado'
        WHEN 'SCHEDULED' THEN 'Programado'
        WHEN 'IMPLEMENTED' THEN 'Implementado'
        WHEN 'REVIEWED' THEN 'Revisado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'CHANGE';

-- Traductions pour REQUEST
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'SUBMITTED' THEN 'Enviado'
        WHEN 'APPROVED_REQUEST' THEN 'Solicitud aprobada'
        WHEN 'REJECTED_REQUEST' THEN 'Solicitud rechazada'
        WHEN 'FULFILLED' THEN 'Completado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'REQUEST';

-- Traductions pour PROJECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'INITIATED' THEN 'Iniciado'
        WHEN 'PLANNING' THEN 'Planificación'
        WHEN 'EXECUTING' THEN 'Ejecución'
        WHEN 'MONITORING' THEN 'Monitoreo'
        WHEN 'COMPLETED' THEN 'Completado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROJECT';

-- Traductions pour SPRINT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'PLANNED' THEN 'Planificado'
        WHEN 'ACTIVE' THEN 'Activo'
        WHEN 'CLOSED' THEN 'Cerrado'
        WHEN 'DRAFT' THEN 'Borrador'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'SPRINT';

-- Traductions pour EPIC
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'IN_PREPARATION' THEN 'En preparación'
        WHEN 'OPEN' THEN 'Abierto'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'DONE' THEN 'Completado'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'ARCHIVED' THEN 'Archivado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'EPIC';

-- Traductions pour USER_STORY
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'DRAFT' THEN 'Borrador'
        WHEN 'TO_DO' THEN 'Por hacer'
        WHEN 'READY' THEN 'Listo'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'IN_REVIEW' THEN 'En revisión'
        WHEN 'IN_TEST' THEN 'En prueba'
        WHEN 'DONE' THEN 'Terminado'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'USER_STORY';

-- Traductions pour DEFECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'NEW' THEN 'Nuevo'
        WHEN 'TRIAGE' THEN 'Clasificación'
        WHEN 'ACKNOWLEDGED' THEN 'Reconocido'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'IN_REVIEW' THEN 'En revisión'
        WHEN 'IN_TEST' THEN 'En prueba'
        WHEN 'RESOLVED' THEN 'Resuelto'
        WHEN 'CLOSED' THEN 'Cerrado'
        WHEN 'REOPENED' THEN 'Reabierto'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'DEFECT';

-- Traductions pour TASK
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'es', 
    CASE code
        WHEN 'NEW' THEN 'Nueva'
        WHEN 'ASSIGNED' THEN 'Asignada'
        WHEN 'IN_PROGRESS' THEN 'En progreso'
        WHEN 'PENDING' THEN 'Pendiente'
        WHEN 'RESOLVED' THEN 'Resuelta'
        WHEN 'CLOSED' THEN 'Cerrada'
        WHEN 'CANCELLED' THEN 'Cancelada'
        WHEN 'REOPENED' THEN 'Reabierta'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'TASK';

-- ============================================================================
-- SECTION 5: TRADUCTIONS PORTUGAISES (pt)
-- ============================================================================

-- Traductions pour INCIDENT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'INVESTIGATING' THEN 'Investigando'
        WHEN 'DIAGNOSED' THEN 'Diagnosticado'
        WHEN 'WORKAROUND' THEN 'Solução alternativa'
        WHEN 'ESCALATED' THEN 'Escalado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'INCIDENT';

-- Traductions pour PROBLEM
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'ROOT_CAUSE_IDENTIFIED' THEN 'Causa raiz identificada'
        WHEN 'SOLUTION_PROPOSED' THEN 'Solução proposta'
        WHEN 'SOLUTION_APPROVED' THEN 'Solução aprovada'
        WHEN 'KNOWN_ERROR' THEN 'Erro conhecido'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROBLEM';

-- Traductions pour CHANGE
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'REQUESTED' THEN 'Solicitado'
        WHEN 'EVALUATED' THEN 'Avaliado'
        WHEN 'APPROVED' THEN 'Aprovado'
        WHEN 'REJECTED' THEN 'Rejeitado'
        WHEN 'SCHEDULED' THEN 'Agendado'
        WHEN 'IMPLEMENTED' THEN 'Implementado'
        WHEN 'REVIEWED' THEN 'Revisado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'CHANGE';

-- Traductions pour REQUEST
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'SUBMITTED' THEN 'Submetido'
        WHEN 'APPROVED_REQUEST' THEN 'Solicitação aprovada'
        WHEN 'REJECTED_REQUEST' THEN 'Solicitação rejeitada'
        WHEN 'FULFILLED' THEN 'Atendido'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'REQUEST';

-- Traductions pour PROJECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'INITIATED' THEN 'Iniciado'
        WHEN 'PLANNING' THEN 'Planejamento'
        WHEN 'EXECUTING' THEN 'Execução'
        WHEN 'MONITORING' THEN 'Monitoramento'
        WHEN 'COMPLETED' THEN 'Concluído'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'PROJECT';

-- Traductions pour SPRINT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'PLANNED' THEN 'Planejado'
        WHEN 'ACTIVE' THEN 'Ativo'
        WHEN 'CLOSED' THEN 'Fechado'
        WHEN 'DRAFT' THEN 'Rascunho'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'SPRINT';

-- Traductions pour EPIC
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'IN_PREPARATION' THEN 'Em preparação'
        WHEN 'OPEN' THEN 'Aberto'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'DONE' THEN 'Concluído'
        WHEN 'CANCELLED' THEN 'Cancelado'
        WHEN 'ARCHIVED' THEN 'Arquivado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'EPIC';

-- Traductions pour USER_STORY
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'DRAFT' THEN 'Rascunho'
        WHEN 'TO_DO' THEN 'A fazer'
        WHEN 'READY' THEN 'Pronto'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'IN_REVIEW' THEN 'Em revisão'
        WHEN 'IN_TEST' THEN 'Em teste'
        WHEN 'DONE' THEN 'Concluído'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'USER_STORY';

-- Traductions pour DEFECT
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'NEW' THEN 'Novo'
        WHEN 'TRIAGE' THEN 'Triagem'
        WHEN 'ACKNOWLEDGED' THEN 'Reconhecido'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'IN_REVIEW' THEN 'Em revisão'
        WHEN 'IN_TEST' THEN 'Em teste'
        WHEN 'RESOLVED' THEN 'Resolvido'
        WHEN 'CLOSED' THEN 'Fechado'
        WHEN 'REOPENED' THEN 'Reaberto'
        WHEN 'CANCELLED' THEN 'Cancelado'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'DEFECT';

-- Traductions pour TASK
INSERT INTO translations.ticket_status_translation (ticket_status_uuid, lang, label)
SELECT uuid, 'pt', 
    CASE code
        WHEN 'NEW' THEN 'Nova'
        WHEN 'ASSIGNED' THEN 'Atribuída'
        WHEN 'IN_PROGRESS' THEN 'Em andamento'
        WHEN 'PENDING' THEN 'Pendente'
        WHEN 'RESOLVED' THEN 'Resolvida'
        WHEN 'CLOSED' THEN 'Fechada'
        WHEN 'CANCELLED' THEN 'Cancelada'
        WHEN 'REOPENED' THEN 'Reaberta'
    END
FROM configuration.ticket_status
WHERE rel_ticket_type = 'TASK';

COMMIT;
