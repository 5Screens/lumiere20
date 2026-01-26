/**
 * Seed file for ITSM workflows
 * Creates workflows for: INCIDENT, PROBLEM, CHANGE, KNOWLEDGE
 * Based on ITIL best practices
 */

// ============================================
// INCIDENT WORKFLOW (ITIL-based)
// ============================================
const incidentStatuses = [
  { code: 'NEW', name: 'New', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'ASSIGNED', name: 'Assigned', categoryCode: 'BACKLOG', isInitial: false, posX: 250, posY: 200 },
  { code: 'IN_PROGRESS', name: 'In Progress', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 100 },
  { code: 'PENDING', name: 'Pending', categoryCode: 'ON_HOLD', isInitial: false, posX: 400, posY: 300 },
  { code: 'RESOLVED', name: 'Resolved', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 150 },
  { code: 'CLOSED', name: 'Closed', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 150 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 300 },
];

const incidentStatusTranslations = [
  // NEW
  { code: 'NEW', locale: 'fr', value: 'Nouveau' },
  { code: 'NEW', locale: 'en', value: 'New' },
  { code: 'NEW', locale: 'es', value: 'Nuevo' },
  { code: 'NEW', locale: 'pt', value: 'Novo' },
  { code: 'NEW', locale: 'de', value: 'Neu' },
  { code: 'NEW', locale: 'it', value: 'Nuovo' },
  // ASSIGNED
  { code: 'ASSIGNED', locale: 'fr', value: 'Assigné' },
  { code: 'ASSIGNED', locale: 'en', value: 'Assigned' },
  { code: 'ASSIGNED', locale: 'es', value: 'Asignado' },
  { code: 'ASSIGNED', locale: 'pt', value: 'Atribuído' },
  { code: 'ASSIGNED', locale: 'de', value: 'Zugewiesen' },
  { code: 'ASSIGNED', locale: 'it', value: 'Assegnato' },
  // IN_PROGRESS
  { code: 'IN_PROGRESS', locale: 'fr', value: 'En cours' },
  { code: 'IN_PROGRESS', locale: 'en', value: 'In Progress' },
  { code: 'IN_PROGRESS', locale: 'es', value: 'En progreso' },
  { code: 'IN_PROGRESS', locale: 'pt', value: 'Em andamento' },
  { code: 'IN_PROGRESS', locale: 'de', value: 'In Bearbeitung' },
  { code: 'IN_PROGRESS', locale: 'it', value: 'In corso' },
  // PENDING
  { code: 'PENDING', locale: 'fr', value: 'En attente' },
  { code: 'PENDING', locale: 'en', value: 'Pending' },
  { code: 'PENDING', locale: 'es', value: 'Pendiente' },
  { code: 'PENDING', locale: 'pt', value: 'Pendente' },
  { code: 'PENDING', locale: 'de', value: 'Ausstehend' },
  { code: 'PENDING', locale: 'it', value: 'In sospeso' },
  // RESOLVED
  { code: 'RESOLVED', locale: 'fr', value: 'Résolu' },
  { code: 'RESOLVED', locale: 'en', value: 'Resolved' },
  { code: 'RESOLVED', locale: 'es', value: 'Resuelto' },
  { code: 'RESOLVED', locale: 'pt', value: 'Resolvido' },
  { code: 'RESOLVED', locale: 'de', value: 'Gelöst' },
  { code: 'RESOLVED', locale: 'it', value: 'Risolto' },
  // CLOSED
  { code: 'CLOSED', locale: 'fr', value: 'Clôturé' },
  { code: 'CLOSED', locale: 'en', value: 'Closed' },
  { code: 'CLOSED', locale: 'es', value: 'Cerrado' },
  { code: 'CLOSED', locale: 'pt', value: 'Fechado' },
  { code: 'CLOSED', locale: 'de', value: 'Geschlossen' },
  { code: 'CLOSED', locale: 'it', value: 'Chiuso' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const incidentTransitions = [
  // From NEW
  { from: 'NEW', to: 'ASSIGNED', name: 'Assign', nameFr: 'Assigner' },
  { from: 'NEW', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From ASSIGNED
  { from: 'ASSIGNED', to: 'IN_PROGRESS', name: 'Start work', nameFr: 'Démarrer' },
  { from: 'ASSIGNED', to: 'PENDING', name: 'Put on hold', nameFr: 'Mettre en attente' },
  { from: 'ASSIGNED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'PENDING', name: 'Put on hold', nameFr: 'Mettre en attente' },
  { from: 'IN_PROGRESS', to: 'RESOLVED', name: 'Resolve', nameFr: 'Résoudre' },
  { from: 'IN_PROGRESS', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From PENDING
  { from: 'PENDING', to: 'IN_PROGRESS', name: 'Resume', nameFr: 'Reprendre' },
  { from: 'PENDING', to: 'RESOLVED', name: 'Resolve', nameFr: 'Résoudre' },
  { from: 'PENDING', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From RESOLVED
  { from: 'RESOLVED', to: 'CLOSED', name: 'Close', nameFr: 'Clôturer' },
  { from: 'RESOLVED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
  // From CLOSED (reopen)
  { from: 'CLOSED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
];

// ============================================
// PROBLEM WORKFLOW (ITIL-based)
// ============================================
const problemStatuses = [
  { code: 'NEW', name: 'New', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'INVESTIGATION', name: 'Investigation', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 250, posY: 150 },
  { code: 'ROOT_CAUSE_IDENTIFIED', name: 'Root Cause Identified', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 100 },
  { code: 'WORKAROUND_AVAILABLE', name: 'Workaround Available', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 250 },
  { code: 'PENDING_CHANGE', name: 'Pending Change', categoryCode: 'ON_HOLD', isInitial: false, posX: 550, posY: 200 },
  { code: 'RESOLVED', name: 'Resolved', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 150 },
  { code: 'CLOSED', name: 'Closed', categoryCode: 'DONE', isInitial: false, posX: 850, posY: 150 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 300 },
];

const problemStatusTranslations = [
  // NEW
  { code: 'NEW', locale: 'fr', value: 'Nouveau' },
  { code: 'NEW', locale: 'en', value: 'New' },
  { code: 'NEW', locale: 'es', value: 'Nuevo' },
  { code: 'NEW', locale: 'pt', value: 'Novo' },
  { code: 'NEW', locale: 'de', value: 'Neu' },
  { code: 'NEW', locale: 'it', value: 'Nuovo' },
  // INVESTIGATION
  { code: 'INVESTIGATION', locale: 'fr', value: 'Investigation' },
  { code: 'INVESTIGATION', locale: 'en', value: 'Investigation' },
  { code: 'INVESTIGATION', locale: 'es', value: 'Investigación' },
  { code: 'INVESTIGATION', locale: 'pt', value: 'Investigação' },
  { code: 'INVESTIGATION', locale: 'de', value: 'Untersuchung' },
  { code: 'INVESTIGATION', locale: 'it', value: 'Indagine' },
  // ROOT_CAUSE_IDENTIFIED
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'fr', value: 'Cause racine identifiée' },
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'en', value: 'Root Cause Identified' },
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'es', value: 'Causa raíz identificada' },
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'pt', value: 'Causa raiz identificada' },
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'de', value: 'Ursache identifiziert' },
  { code: 'ROOT_CAUSE_IDENTIFIED', locale: 'it', value: 'Causa radice identificata' },
  // WORKAROUND_AVAILABLE
  { code: 'WORKAROUND_AVAILABLE', locale: 'fr', value: 'Contournement disponible' },
  { code: 'WORKAROUND_AVAILABLE', locale: 'en', value: 'Workaround Available' },
  { code: 'WORKAROUND_AVAILABLE', locale: 'es', value: 'Solución alternativa disponible' },
  { code: 'WORKAROUND_AVAILABLE', locale: 'pt', value: 'Solução alternativa disponível' },
  { code: 'WORKAROUND_AVAILABLE', locale: 'de', value: 'Workaround verfügbar' },
  { code: 'WORKAROUND_AVAILABLE', locale: 'it', value: 'Soluzione alternativa disponibile' },
  // PENDING_CHANGE
  { code: 'PENDING_CHANGE', locale: 'fr', value: 'En attente de changement' },
  { code: 'PENDING_CHANGE', locale: 'en', value: 'Pending Change' },
  { code: 'PENDING_CHANGE', locale: 'es', value: 'Pendiente de cambio' },
  { code: 'PENDING_CHANGE', locale: 'pt', value: 'Aguardando mudança' },
  { code: 'PENDING_CHANGE', locale: 'de', value: 'Änderung ausstehend' },
  { code: 'PENDING_CHANGE', locale: 'it', value: 'In attesa di cambiamento' },
  // RESOLVED
  { code: 'RESOLVED', locale: 'fr', value: 'Résolu' },
  { code: 'RESOLVED', locale: 'en', value: 'Resolved' },
  { code: 'RESOLVED', locale: 'es', value: 'Resuelto' },
  { code: 'RESOLVED', locale: 'pt', value: 'Resolvido' },
  { code: 'RESOLVED', locale: 'de', value: 'Gelöst' },
  { code: 'RESOLVED', locale: 'it', value: 'Risolto' },
  // CLOSED
  { code: 'CLOSED', locale: 'fr', value: 'Clôturé' },
  { code: 'CLOSED', locale: 'en', value: 'Closed' },
  { code: 'CLOSED', locale: 'es', value: 'Cerrado' },
  { code: 'CLOSED', locale: 'pt', value: 'Fechado' },
  { code: 'CLOSED', locale: 'de', value: 'Geschlossen' },
  { code: 'CLOSED', locale: 'it', value: 'Chiuso' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const problemTransitions = [
  // From NEW
  { from: 'NEW', to: 'INVESTIGATION', name: 'Start investigation', nameFr: 'Démarrer l\'investigation' },
  { from: 'NEW', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From INVESTIGATION
  { from: 'INVESTIGATION', to: 'ROOT_CAUSE_IDENTIFIED', name: 'Identify root cause', nameFr: 'Identifier la cause racine' },
  { from: 'INVESTIGATION', to: 'WORKAROUND_AVAILABLE', name: 'Document workaround', nameFr: 'Documenter le contournement' },
  { from: 'INVESTIGATION', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From ROOT_CAUSE_IDENTIFIED
  { from: 'ROOT_CAUSE_IDENTIFIED', to: 'WORKAROUND_AVAILABLE', name: 'Document workaround', nameFr: 'Documenter le contournement' },
  { from: 'ROOT_CAUSE_IDENTIFIED', to: 'PENDING_CHANGE', name: 'Request change', nameFr: 'Demander un changement' },
  { from: 'ROOT_CAUSE_IDENTIFIED', to: 'RESOLVED', name: 'Resolve', nameFr: 'Résoudre' },
  // From WORKAROUND_AVAILABLE
  { from: 'WORKAROUND_AVAILABLE', to: 'ROOT_CAUSE_IDENTIFIED', name: 'Identify root cause', nameFr: 'Identifier la cause racine' },
  { from: 'WORKAROUND_AVAILABLE', to: 'PENDING_CHANGE', name: 'Request change', nameFr: 'Demander un changement' },
  { from: 'WORKAROUND_AVAILABLE', to: 'RESOLVED', name: 'Resolve', nameFr: 'Résoudre' },
  // From PENDING_CHANGE
  { from: 'PENDING_CHANGE', to: 'RESOLVED', name: 'Change completed', nameFr: 'Changement terminé' },
  { from: 'PENDING_CHANGE', to: 'INVESTIGATION', name: 'Back to investigation', nameFr: 'Retour à l\'investigation' },
  // From RESOLVED
  { from: 'RESOLVED', to: 'CLOSED', name: 'Close', nameFr: 'Clôturer' },
  { from: 'RESOLVED', to: 'INVESTIGATION', name: 'Reopen', nameFr: 'Réouvrir' },
  // From CLOSED
  { from: 'CLOSED', to: 'INVESTIGATION', name: 'Reopen', nameFr: 'Réouvrir' },
];

// ============================================
// CHANGE WORKFLOW (ITIL-based with CAB approval)
// ============================================
const changeStatuses = [
  { code: 'DRAFT', name: 'Draft', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'SUBMITTED', name: 'Submitted', categoryCode: 'BACKLOG', isInitial: false, posX: 250, posY: 200 },
  { code: 'UNDER_REVIEW', name: 'Under Review', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 150 },
  { code: 'APPROVED', name: 'Approved', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 550, posY: 100 },
  { code: 'REJECTED', name: 'Rejected', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 300 },
  { code: 'SCHEDULED', name: 'Scheduled', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 700, posY: 100 },
  { code: 'IMPLEMENTING', name: 'Implementing', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 850, posY: 150 },
  { code: 'COMPLETED', name: 'Completed', categoryCode: 'DONE', isInitial: false, posX: 1000, posY: 100 },
  { code: 'FAILED', name: 'Failed', categoryCode: 'DONE', isInitial: false, posX: 1000, posY: 250 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 300 },
];

const changeStatusTranslations = [
  // DRAFT
  { code: 'DRAFT', locale: 'fr', value: 'Brouillon' },
  { code: 'DRAFT', locale: 'en', value: 'Draft' },
  { code: 'DRAFT', locale: 'es', value: 'Borrador' },
  { code: 'DRAFT', locale: 'pt', value: 'Rascunho' },
  { code: 'DRAFT', locale: 'de', value: 'Entwurf' },
  { code: 'DRAFT', locale: 'it', value: 'Bozza' },
  // SUBMITTED
  { code: 'SUBMITTED', locale: 'fr', value: 'Soumis' },
  { code: 'SUBMITTED', locale: 'en', value: 'Submitted' },
  { code: 'SUBMITTED', locale: 'es', value: 'Enviado' },
  { code: 'SUBMITTED', locale: 'pt', value: 'Submetido' },
  { code: 'SUBMITTED', locale: 'de', value: 'Eingereicht' },
  { code: 'SUBMITTED', locale: 'it', value: 'Inviato' },
  // UNDER_REVIEW
  { code: 'UNDER_REVIEW', locale: 'fr', value: 'En revue' },
  { code: 'UNDER_REVIEW', locale: 'en', value: 'Under Review' },
  { code: 'UNDER_REVIEW', locale: 'es', value: 'En revisión' },
  { code: 'UNDER_REVIEW', locale: 'pt', value: 'Em revisão' },
  { code: 'UNDER_REVIEW', locale: 'de', value: 'In Prüfung' },
  { code: 'UNDER_REVIEW', locale: 'it', value: 'In revisione' },
  // APPROVED
  { code: 'APPROVED', locale: 'fr', value: 'Approuvé' },
  { code: 'APPROVED', locale: 'en', value: 'Approved' },
  { code: 'APPROVED', locale: 'es', value: 'Aprobado' },
  { code: 'APPROVED', locale: 'pt', value: 'Aprovado' },
  { code: 'APPROVED', locale: 'de', value: 'Genehmigt' },
  { code: 'APPROVED', locale: 'it', value: 'Approvato' },
  // REJECTED
  { code: 'REJECTED', locale: 'fr', value: 'Rejeté' },
  { code: 'REJECTED', locale: 'en', value: 'Rejected' },
  { code: 'REJECTED', locale: 'es', value: 'Rechazado' },
  { code: 'REJECTED', locale: 'pt', value: 'Rejeitado' },
  { code: 'REJECTED', locale: 'de', value: 'Abgelehnt' },
  { code: 'REJECTED', locale: 'it', value: 'Rifiutato' },
  // SCHEDULED
  { code: 'SCHEDULED', locale: 'fr', value: 'Planifié' },
  { code: 'SCHEDULED', locale: 'en', value: 'Scheduled' },
  { code: 'SCHEDULED', locale: 'es', value: 'Programado' },
  { code: 'SCHEDULED', locale: 'pt', value: 'Agendado' },
  { code: 'SCHEDULED', locale: 'de', value: 'Geplant' },
  { code: 'SCHEDULED', locale: 'it', value: 'Programmato' },
  // IMPLEMENTING
  { code: 'IMPLEMENTING', locale: 'fr', value: 'En cours d\'implémentation' },
  { code: 'IMPLEMENTING', locale: 'en', value: 'Implementing' },
  { code: 'IMPLEMENTING', locale: 'es', value: 'Implementando' },
  { code: 'IMPLEMENTING', locale: 'pt', value: 'Implementando' },
  { code: 'IMPLEMENTING', locale: 'de', value: 'Wird implementiert' },
  { code: 'IMPLEMENTING', locale: 'it', value: 'In implementazione' },
  // COMPLETED
  { code: 'COMPLETED', locale: 'fr', value: 'Terminé' },
  { code: 'COMPLETED', locale: 'en', value: 'Completed' },
  { code: 'COMPLETED', locale: 'es', value: 'Completado' },
  { code: 'COMPLETED', locale: 'pt', value: 'Concluído' },
  { code: 'COMPLETED', locale: 'de', value: 'Abgeschlossen' },
  { code: 'COMPLETED', locale: 'it', value: 'Completato' },
  // FAILED
  { code: 'FAILED', locale: 'fr', value: 'Échoué' },
  { code: 'FAILED', locale: 'en', value: 'Failed' },
  { code: 'FAILED', locale: 'es', value: 'Fallido' },
  { code: 'FAILED', locale: 'pt', value: 'Falhou' },
  { code: 'FAILED', locale: 'de', value: 'Fehlgeschlagen' },
  { code: 'FAILED', locale: 'it', value: 'Fallito' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const changeTransitions = [
  // From DRAFT
  { from: 'DRAFT', to: 'SUBMITTED', name: 'Submit for approval', nameFr: 'Soumettre pour approbation' },
  { from: 'DRAFT', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From SUBMITTED
  { from: 'SUBMITTED', to: 'UNDER_REVIEW', name: 'Start review', nameFr: 'Démarrer la revue' },
  { from: 'SUBMITTED', to: 'DRAFT', name: 'Return to draft', nameFr: 'Retourner en brouillon' },
  { from: 'SUBMITTED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From UNDER_REVIEW
  { from: 'UNDER_REVIEW', to: 'APPROVED', name: 'Approve', nameFr: 'Approuver' },
  { from: 'UNDER_REVIEW', to: 'REJECTED', name: 'Reject', nameFr: 'Rejeter' },
  { from: 'UNDER_REVIEW', to: 'DRAFT', name: 'Request changes', nameFr: 'Demander des modifications' },
  // From APPROVED
  { from: 'APPROVED', to: 'SCHEDULED', name: 'Schedule', nameFr: 'Planifier' },
  { from: 'APPROVED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From REJECTED
  { from: 'REJECTED', to: 'DRAFT', name: 'Revise', nameFr: 'Réviser' },
  // From SCHEDULED
  { from: 'SCHEDULED', to: 'IMPLEMENTING', name: 'Start implementation', nameFr: 'Démarrer l\'implémentation' },
  { from: 'SCHEDULED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IMPLEMENTING
  { from: 'IMPLEMENTING', to: 'COMPLETED', name: 'Complete', nameFr: 'Terminer' },
  { from: 'IMPLEMENTING', to: 'FAILED', name: 'Mark as failed', nameFr: 'Marquer comme échoué' },
  // From FAILED
  { from: 'FAILED', to: 'DRAFT', name: 'Revise and retry', nameFr: 'Réviser et réessayer' },
  // From COMPLETED (post-implementation review)
  { from: 'COMPLETED', to: 'FAILED', name: 'Mark as failed', nameFr: 'Marquer comme échoué' },
];

// ============================================
// KNOWLEDGE WORKFLOW (Publication lifecycle)
// ============================================
const knowledgeStatuses = [
  { code: 'DRAFT', name: 'Draft', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'IN_REVIEW', name: 'In Review', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 300, posY: 150 },
  { code: 'APPROVED', name: 'Approved', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 500, posY: 100 },
  { code: 'PUBLISHED', name: 'Published', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 150 },
  { code: 'OUTDATED', name: 'Outdated', categoryCode: 'ON_HOLD', isInitial: false, posX: 700, posY: 300 },
  { code: 'RETIRED', name: 'Retired', categoryCode: 'DONE', isInitial: false, posX: 900, posY: 200 },
];

const knowledgeStatusTranslations = [
  // DRAFT
  { code: 'DRAFT', locale: 'fr', value: 'Brouillon' },
  { code: 'DRAFT', locale: 'en', value: 'Draft' },
  { code: 'DRAFT', locale: 'es', value: 'Borrador' },
  { code: 'DRAFT', locale: 'pt', value: 'Rascunho' },
  { code: 'DRAFT', locale: 'de', value: 'Entwurf' },
  { code: 'DRAFT', locale: 'it', value: 'Bozza' },
  // IN_REVIEW
  { code: 'IN_REVIEW', locale: 'fr', value: 'En revue' },
  { code: 'IN_REVIEW', locale: 'en', value: 'In Review' },
  { code: 'IN_REVIEW', locale: 'es', value: 'En revisión' },
  { code: 'IN_REVIEW', locale: 'pt', value: 'Em revisão' },
  { code: 'IN_REVIEW', locale: 'de', value: 'In Prüfung' },
  { code: 'IN_REVIEW', locale: 'it', value: 'In revisione' },
  // APPROVED
  { code: 'APPROVED', locale: 'fr', value: 'Approuvé' },
  { code: 'APPROVED', locale: 'en', value: 'Approved' },
  { code: 'APPROVED', locale: 'es', value: 'Aprobado' },
  { code: 'APPROVED', locale: 'pt', value: 'Aprovado' },
  { code: 'APPROVED', locale: 'de', value: 'Genehmigt' },
  { code: 'APPROVED', locale: 'it', value: 'Approvato' },
  // PUBLISHED
  { code: 'PUBLISHED', locale: 'fr', value: 'Publié' },
  { code: 'PUBLISHED', locale: 'en', value: 'Published' },
  { code: 'PUBLISHED', locale: 'es', value: 'Publicado' },
  { code: 'PUBLISHED', locale: 'pt', value: 'Publicado' },
  { code: 'PUBLISHED', locale: 'de', value: 'Veröffentlicht' },
  { code: 'PUBLISHED', locale: 'it', value: 'Pubblicato' },
  // OUTDATED
  { code: 'OUTDATED', locale: 'fr', value: 'Obsolète' },
  { code: 'OUTDATED', locale: 'en', value: 'Outdated' },
  { code: 'OUTDATED', locale: 'es', value: 'Desactualizado' },
  { code: 'OUTDATED', locale: 'pt', value: 'Desatualizado' },
  { code: 'OUTDATED', locale: 'de', value: 'Veraltet' },
  { code: 'OUTDATED', locale: 'it', value: 'Obsoleto' },
  // RETIRED
  { code: 'RETIRED', locale: 'fr', value: 'Retiré' },
  { code: 'RETIRED', locale: 'en', value: 'Retired' },
  { code: 'RETIRED', locale: 'es', value: 'Retirado' },
  { code: 'RETIRED', locale: 'pt', value: 'Retirado' },
  { code: 'RETIRED', locale: 'de', value: 'Zurückgezogen' },
  { code: 'RETIRED', locale: 'it', value: 'Ritirato' },
];

const knowledgeTransitions = [
  // From DRAFT
  { from: 'DRAFT', to: 'IN_REVIEW', name: 'Submit for review', nameFr: 'Soumettre pour revue' },
  // From IN_REVIEW
  { from: 'IN_REVIEW', to: 'APPROVED', name: 'Approve', nameFr: 'Approuver' },
  { from: 'IN_REVIEW', to: 'DRAFT', name: 'Request changes', nameFr: 'Demander des modifications' },
  // From APPROVED
  { from: 'APPROVED', to: 'PUBLISHED', name: 'Publish', nameFr: 'Publier' },
  { from: 'APPROVED', to: 'DRAFT', name: 'Return to draft', nameFr: 'Retourner en brouillon' },
  // From PUBLISHED
  { from: 'PUBLISHED', to: 'OUTDATED', name: 'Mark as outdated', nameFr: 'Marquer comme obsolète' },
  { from: 'PUBLISHED', to: 'RETIRED', name: 'Retire', nameFr: 'Retirer' },
  { from: 'PUBLISHED', to: 'DRAFT', name: 'Revise', nameFr: 'Réviser' },
  // From OUTDATED
  { from: 'OUTDATED', to: 'DRAFT', name: 'Update', nameFr: 'Mettre à jour' },
  { from: 'OUTDATED', to: 'RETIRED', name: 'Retire', nameFr: 'Retirer' },
  // From RETIRED (reactivate)
  { from: 'RETIRED', to: 'DRAFT', name: 'Reactivate', nameFr: 'Réactiver' },
];

// ============================================
// GENERIC WORKFLOW SEEDING FUNCTION
// ============================================

/**
 * Create a workflow with statuses and transitions
 * @param {import('@prisma/client').PrismaClient} prisma 
 * @param {string} ticketTypeCode 
 * @param {string} workflowName 
 * @param {string} workflowDescription 
 * @param {Array} statuses 
 * @param {Array} statusTranslations 
 * @param {Array} transitions 
 */
async function createWorkflow(prisma, ticketTypeCode, workflowName, workflowDescription, statuses, statusTranslations, transitions) {
  console.log(`\nSeeding ${ticketTypeCode} workflow...`);

  // 1. Get ticket type uuid
  const ticketType = await prisma.ticket_types.findUnique({
    where: { code: ticketTypeCode }
  });

  if (!ticketType) {
    console.error(`  - Ticket type ${ticketTypeCode} not found. Run ticket-types seed first.`);
    return;
  }

  // 2. Get workflow status categories
  const categories = await prisma.workflow_status_categories.findMany();
  const categoryMap = {};
  for (const cat of categories) {
    categoryMap[cat.code] = cat.uuid;
  }

  if (Object.keys(categoryMap).length === 0) {
    console.error('  - No workflow status categories found. Run workflow-status-categories seed first.');
    return;
  }

  // 3. Check if workflow already exists
  let workflow = await prisma.workflows.findFirst({
    where: {
      entity_type: 'tickets',
      rel_entity_type_uuid: ticketType.uuid
    }
  });

  if (workflow) {
    console.log(`  - Workflow for ${ticketTypeCode} already exists (uuid: ${workflow.uuid})`);
  } else {
    // Create workflow
    workflow = await prisma.workflows.create({
      data: {
        entity_type: 'tickets',
        rel_entity_type_uuid: ticketType.uuid,
        name: workflowName,
        description: workflowDescription,
        is_active: true
      }
    });
    console.log(`  - Created workflow for ${ticketTypeCode} (uuid: ${workflow.uuid})`);
  }

  // 4. Create or update statuses
  const statusUuidMap = {};
  
  for (const status of statuses) {
    const categoryUuid = categoryMap[status.categoryCode];
    if (!categoryUuid) {
      console.warn(`  - Category ${status.categoryCode} not found, skipping status ${status.code}`);
      continue;
    }

    // Check if status exists
    let existingStatus = await prisma.workflow_statuses.findFirst({
      where: {
        rel_workflow_uuid: workflow.uuid,
        name: status.name
      }
    });

    if (existingStatus) {
      statusUuidMap[status.code] = existingStatus.uuid;
      console.log(`  - Status '${status.name}' already exists`);
    } else {
      const newStatus = await prisma.workflow_statuses.create({
        data: {
          rel_workflow_uuid: workflow.uuid,
          name: status.name,
          rel_category_uuid: categoryUuid,
          is_initial: status.isInitial,
          allow_all_inbound: false,
          position_x: status.posX,
          position_y: status.posY
        }
      });
      statusUuidMap[status.code] = newStatus.uuid;
      console.log(`  - Created status '${status.name}'`);
    }
  }

  // 5. Create translations for statuses
  console.log('  - Creating status translations...');
  for (const trans of statusTranslations) {
    const statusUuid = statusUuidMap[trans.code];
    if (!statusUuid) continue;

    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: 'workflow_statuses',
          entity_uuid: statusUuid,
          field_name: 'name',
          locale: trans.locale
        }
      },
      update: { value: trans.value },
      create: {
        entity_type: 'workflow_statuses',
        entity_uuid: statusUuid,
        field_name: 'name',
        locale: trans.locale,
        value: trans.value
      }
    });
  }

  // 6. Create transitions
  console.log('  - Creating transitions...');
  for (const trans of transitions) {
    const fromStatusUuid = statusUuidMap[trans.from];
    const toStatusUuid = statusUuidMap[trans.to];

    if (!fromStatusUuid || !toStatusUuid) {
      console.warn(`  - Skipping transition ${trans.from} -> ${trans.to}: status not found`);
      continue;
    }

    // Check if transition already exists
    const existingTransition = await prisma.workflow_transitions.findFirst({
      where: {
        rel_workflow_uuid: workflow.uuid,
        rel_to_status_uuid: toStatusUuid,
        sources: {
          some: {
            rel_from_status_uuid: fromStatusUuid
          }
        }
      }
    });

    if (existingTransition) {
      console.log(`  - Transition '${trans.name}' (${trans.from} -> ${trans.to}) already exists`);
      continue;
    }

    // Create transition
    const newTransition = await prisma.workflow_transitions.create({
      data: {
        rel_workflow_uuid: workflow.uuid,
        name: trans.name,
        rel_to_status_uuid: toStatusUuid
      }
    });

    // Create transition source
    await prisma.workflow_transition_sources.create({
      data: {
        rel_transition_uuid: newTransition.uuid,
        rel_from_status_uuid: fromStatusUuid
      }
    });

    console.log(`  - Created transition '${trans.name}' (${trans.from} -> ${trans.to})`);
  }

  console.log(`${ticketTypeCode} workflow seeding completed!`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

/**
 * Seed all ITSM workflows
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedItsmWorkflows(prisma) {
  console.log('='.repeat(50));
  console.log('Seeding ITSM workflows...');
  console.log('='.repeat(50));

  // Incident workflow
  await createWorkflow(
    prisma,
    'INCIDENT',
    'Incident Workflow',
    'ITIL-based incident management workflow',
    incidentStatuses,
    incidentStatusTranslations,
    incidentTransitions
  );

  // Problem workflow
  await createWorkflow(
    prisma,
    'PROBLEM',
    'Problem Workflow',
    'ITIL-based problem management workflow with root cause analysis',
    problemStatuses,
    problemStatusTranslations,
    problemTransitions
  );

  // Change workflow
  await createWorkflow(
    prisma,
    'CHANGE',
    'Change Workflow',
    'ITIL-based change management workflow with CAB approval',
    changeStatuses,
    changeStatusTranslations,
    changeTransitions
  );

  // Knowledge workflow
  await createWorkflow(
    prisma,
    'KNOWLEDGE',
    'Knowledge Workflow',
    'Knowledge article publication lifecycle workflow',
    knowledgeStatuses,
    knowledgeStatusTranslations,
    knowledgeTransitions
  );

  console.log('\n' + '='.repeat(50));
  console.log('ITSM workflows seeding completed!');
  console.log('='.repeat(50));
}

module.exports = { seedItsmWorkflows };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedItsmWorkflows(prisma)
    .then(() => {
      console.log('Seed completed successfully');
      prisma.$disconnect();
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}
