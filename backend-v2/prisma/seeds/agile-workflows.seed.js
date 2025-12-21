/**
 * Seed file for Agile workflows
 * Creates workflows for: USER_STORY, PROJECT, SPRINT, EPIC, DEFECT
 * Based on Agile/Scrum best practices
 */

// ============================================
// USER STORY WORKFLOW (Kanban-style)
// ============================================
const userStoryStatuses = [
  { code: 'BACKLOG', name: 'Backlog', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'READY', name: 'Ready', categoryCode: 'BACKLOG', isInitial: false, posX: 250, posY: 200 },
  { code: 'IN_PROGRESS', name: 'In Progress', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 150 },
  { code: 'IN_REVIEW', name: 'In Review', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 550, posY: 150 },
  { code: 'TESTING', name: 'Testing', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 700, posY: 150 },
  { code: 'DONE', name: 'Done', categoryCode: 'DONE', isInitial: false, posX: 850, posY: 200 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 550, posY: 350 },
];

const userStoryStatusTranslations = [
  // BACKLOG
  { code: 'BACKLOG', locale: 'fr', value: 'Backlog' },
  { code: 'BACKLOG', locale: 'en', value: 'Backlog' },
  { code: 'BACKLOG', locale: 'es', value: 'Backlog' },
  { code: 'BACKLOG', locale: 'pt', value: 'Backlog' },
  { code: 'BACKLOG', locale: 'de', value: 'Backlog' },
  { code: 'BACKLOG', locale: 'it', value: 'Backlog' },
  // READY
  { code: 'READY', locale: 'fr', value: 'Prêt' },
  { code: 'READY', locale: 'en', value: 'Ready' },
  { code: 'READY', locale: 'es', value: 'Listo' },
  { code: 'READY', locale: 'pt', value: 'Pronto' },
  { code: 'READY', locale: 'de', value: 'Bereit' },
  { code: 'READY', locale: 'it', value: 'Pronto' },
  // IN_PROGRESS
  { code: 'IN_PROGRESS', locale: 'fr', value: 'En cours' },
  { code: 'IN_PROGRESS', locale: 'en', value: 'In Progress' },
  { code: 'IN_PROGRESS', locale: 'es', value: 'En progreso' },
  { code: 'IN_PROGRESS', locale: 'pt', value: 'Em andamento' },
  { code: 'IN_PROGRESS', locale: 'de', value: 'In Bearbeitung' },
  { code: 'IN_PROGRESS', locale: 'it', value: 'In corso' },
  // IN_REVIEW
  { code: 'IN_REVIEW', locale: 'fr', value: 'En revue' },
  { code: 'IN_REVIEW', locale: 'en', value: 'In Review' },
  { code: 'IN_REVIEW', locale: 'es', value: 'En revisión' },
  { code: 'IN_REVIEW', locale: 'pt', value: 'Em revisão' },
  { code: 'IN_REVIEW', locale: 'de', value: 'In Prüfung' },
  { code: 'IN_REVIEW', locale: 'it', value: 'In revisione' },
  // TESTING
  { code: 'TESTING', locale: 'fr', value: 'En test' },
  { code: 'TESTING', locale: 'en', value: 'Testing' },
  { code: 'TESTING', locale: 'es', value: 'En pruebas' },
  { code: 'TESTING', locale: 'pt', value: 'Em teste' },
  { code: 'TESTING', locale: 'de', value: 'Im Test' },
  { code: 'TESTING', locale: 'it', value: 'In test' },
  // DONE
  { code: 'DONE', locale: 'fr', value: 'Terminé' },
  { code: 'DONE', locale: 'en', value: 'Done' },
  { code: 'DONE', locale: 'es', value: 'Hecho' },
  { code: 'DONE', locale: 'pt', value: 'Concluído' },
  { code: 'DONE', locale: 'de', value: 'Erledigt' },
  { code: 'DONE', locale: 'it', value: 'Completato' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const userStoryTransitions = [
  // From BACKLOG
  { from: 'BACKLOG', to: 'READY', name: 'Refine', nameFr: 'Affiner' },
  { from: 'BACKLOG', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From READY
  { from: 'READY', to: 'IN_PROGRESS', name: 'Start', nameFr: 'Démarrer' },
  { from: 'READY', to: 'BACKLOG', name: 'Back to backlog', nameFr: 'Retour au backlog' },
  { from: 'READY', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'IN_REVIEW', name: 'Submit for review', nameFr: 'Soumettre pour revue' },
  { from: 'IN_PROGRESS', to: 'READY', name: 'Block', nameFr: 'Bloquer' },
  { from: 'IN_PROGRESS', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IN_REVIEW
  { from: 'IN_REVIEW', to: 'TESTING', name: 'Approve', nameFr: 'Approuver' },
  { from: 'IN_REVIEW', to: 'IN_PROGRESS', name: 'Request changes', nameFr: 'Demander des modifications' },
  // From TESTING
  { from: 'TESTING', to: 'DONE', name: 'Accept', nameFr: 'Accepter' },
  { from: 'TESTING', to: 'IN_PROGRESS', name: 'Reject', nameFr: 'Rejeter' },
  // From DONE (reopen)
  { from: 'DONE', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
];

// ============================================
// PROJECT WORKFLOW
// ============================================
const projectStatuses = [
  { code: 'PLANNING', name: 'Planning', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'ACTIVE', name: 'Active', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 300, posY: 150 },
  { code: 'ON_HOLD', name: 'On Hold', categoryCode: 'ON_HOLD', isInitial: false, posX: 300, posY: 300 },
  { code: 'COMPLETED', name: 'Completed', categoryCode: 'DONE', isInitial: false, posX: 500, posY: 150 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 500, posY: 300 },
  { code: 'ARCHIVED', name: 'Archived', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 200 },
];

const projectStatusTranslations = [
  // PLANNING
  { code: 'PLANNING', locale: 'fr', value: 'Planification' },
  { code: 'PLANNING', locale: 'en', value: 'Planning' },
  { code: 'PLANNING', locale: 'es', value: 'Planificación' },
  { code: 'PLANNING', locale: 'pt', value: 'Planejamento' },
  { code: 'PLANNING', locale: 'de', value: 'Planung' },
  { code: 'PLANNING', locale: 'it', value: 'Pianificazione' },
  // ACTIVE
  { code: 'ACTIVE', locale: 'fr', value: 'Actif' },
  { code: 'ACTIVE', locale: 'en', value: 'Active' },
  { code: 'ACTIVE', locale: 'es', value: 'Activo' },
  { code: 'ACTIVE', locale: 'pt', value: 'Ativo' },
  { code: 'ACTIVE', locale: 'de', value: 'Aktiv' },
  { code: 'ACTIVE', locale: 'it', value: 'Attivo' },
  // ON_HOLD
  { code: 'ON_HOLD', locale: 'fr', value: 'En pause' },
  { code: 'ON_HOLD', locale: 'en', value: 'On Hold' },
  { code: 'ON_HOLD', locale: 'es', value: 'En espera' },
  { code: 'ON_HOLD', locale: 'pt', value: 'Em espera' },
  { code: 'ON_HOLD', locale: 'de', value: 'Pausiert' },
  { code: 'ON_HOLD', locale: 'it', value: 'In pausa' },
  // COMPLETED
  { code: 'COMPLETED', locale: 'fr', value: 'Terminé' },
  { code: 'COMPLETED', locale: 'en', value: 'Completed' },
  { code: 'COMPLETED', locale: 'es', value: 'Completado' },
  { code: 'COMPLETED', locale: 'pt', value: 'Concluído' },
  { code: 'COMPLETED', locale: 'de', value: 'Abgeschlossen' },
  { code: 'COMPLETED', locale: 'it', value: 'Completato' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
  // ARCHIVED
  { code: 'ARCHIVED', locale: 'fr', value: 'Archivé' },
  { code: 'ARCHIVED', locale: 'en', value: 'Archived' },
  { code: 'ARCHIVED', locale: 'es', value: 'Archivado' },
  { code: 'ARCHIVED', locale: 'pt', value: 'Arquivado' },
  { code: 'ARCHIVED', locale: 'de', value: 'Archiviert' },
  { code: 'ARCHIVED', locale: 'it', value: 'Archiviato' },
];

const projectTransitions = [
  // From PLANNING
  { from: 'PLANNING', to: 'ACTIVE', name: 'Start project', nameFr: 'Démarrer le projet' },
  { from: 'PLANNING', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From ACTIVE
  { from: 'ACTIVE', to: 'ON_HOLD', name: 'Pause', nameFr: 'Mettre en pause' },
  { from: 'ACTIVE', to: 'COMPLETED', name: 'Complete', nameFr: 'Terminer' },
  { from: 'ACTIVE', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From ON_HOLD
  { from: 'ON_HOLD', to: 'ACTIVE', name: 'Resume', nameFr: 'Reprendre' },
  { from: 'ON_HOLD', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From COMPLETED
  { from: 'COMPLETED', to: 'ARCHIVED', name: 'Archive', nameFr: 'Archiver' },
  { from: 'COMPLETED', to: 'ACTIVE', name: 'Reopen', nameFr: 'Réouvrir' },
  // From CANCELLED
  { from: 'CANCELLED', to: 'ARCHIVED', name: 'Archive', nameFr: 'Archiver' },
  { from: 'CANCELLED', to: 'PLANNING', name: 'Restart', nameFr: 'Redémarrer' },
];

// ============================================
// SPRINT WORKFLOW (Scrum-based)
// ============================================
const sprintStatuses = [
  { code: 'PLANNING', name: 'Planning', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'ACTIVE', name: 'Active', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 300, posY: 200 },
  { code: 'REVIEW', name: 'Review', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 500, posY: 150 },
  { code: 'RETROSPECTIVE', name: 'Retrospective', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 700, posY: 150 },
  { code: 'CLOSED', name: 'Closed', categoryCode: 'DONE', isInitial: false, posX: 900, posY: 200 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 500, posY: 350 },
];

const sprintStatusTranslations = [
  // PLANNING
  { code: 'PLANNING', locale: 'fr', value: 'Planification' },
  { code: 'PLANNING', locale: 'en', value: 'Planning' },
  { code: 'PLANNING', locale: 'es', value: 'Planificación' },
  { code: 'PLANNING', locale: 'pt', value: 'Planejamento' },
  { code: 'PLANNING', locale: 'de', value: 'Planung' },
  { code: 'PLANNING', locale: 'it', value: 'Pianificazione' },
  // ACTIVE
  { code: 'ACTIVE', locale: 'fr', value: 'Actif' },
  { code: 'ACTIVE', locale: 'en', value: 'Active' },
  { code: 'ACTIVE', locale: 'es', value: 'Activo' },
  { code: 'ACTIVE', locale: 'pt', value: 'Ativo' },
  { code: 'ACTIVE', locale: 'de', value: 'Aktiv' },
  { code: 'ACTIVE', locale: 'it', value: 'Attivo' },
  // REVIEW
  { code: 'REVIEW', locale: 'fr', value: 'Revue' },
  { code: 'REVIEW', locale: 'en', value: 'Review' },
  { code: 'REVIEW', locale: 'es', value: 'Revisión' },
  { code: 'REVIEW', locale: 'pt', value: 'Revisão' },
  { code: 'REVIEW', locale: 'de', value: 'Review' },
  { code: 'REVIEW', locale: 'it', value: 'Revisione' },
  // RETROSPECTIVE
  { code: 'RETROSPECTIVE', locale: 'fr', value: 'Rétrospective' },
  { code: 'RETROSPECTIVE', locale: 'en', value: 'Retrospective' },
  { code: 'RETROSPECTIVE', locale: 'es', value: 'Retrospectiva' },
  { code: 'RETROSPECTIVE', locale: 'pt', value: 'Retrospectiva' },
  { code: 'RETROSPECTIVE', locale: 'de', value: 'Retrospektive' },
  { code: 'RETROSPECTIVE', locale: 'it', value: 'Retrospettiva' },
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

const sprintTransitions = [
  // From PLANNING
  { from: 'PLANNING', to: 'ACTIVE', name: 'Start sprint', nameFr: 'Démarrer le sprint' },
  { from: 'PLANNING', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From ACTIVE
  { from: 'ACTIVE', to: 'REVIEW', name: 'End sprint', nameFr: 'Terminer le sprint' },
  { from: 'ACTIVE', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From REVIEW
  { from: 'REVIEW', to: 'RETROSPECTIVE', name: 'Start retrospective', nameFr: 'Démarrer la rétrospective' },
  // From RETROSPECTIVE
  { from: 'RETROSPECTIVE', to: 'CLOSED', name: 'Close sprint', nameFr: 'Clôturer le sprint' },
];

// ============================================
// EPIC WORKFLOW (High-level feature tracking)
// ============================================
const epicStatuses = [
  { code: 'DRAFT', name: 'Draft', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'DEFINED', name: 'Defined', categoryCode: 'BACKLOG', isInitial: false, posX: 250, posY: 200 },
  { code: 'IN_PROGRESS', name: 'In Progress', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 150 },
  { code: 'PARTIALLY_DONE', name: 'Partially Done', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 550, posY: 150 },
  { code: 'DONE', name: 'Done', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 200 },
  { code: 'CANCELLED', name: 'Cancelled', categoryCode: 'DONE', isInitial: false, posX: 400, posY: 350 },
];

const epicStatusTranslations = [
  // DRAFT
  { code: 'DRAFT', locale: 'fr', value: 'Brouillon' },
  { code: 'DRAFT', locale: 'en', value: 'Draft' },
  { code: 'DRAFT', locale: 'es', value: 'Borrador' },
  { code: 'DRAFT', locale: 'pt', value: 'Rascunho' },
  { code: 'DRAFT', locale: 'de', value: 'Entwurf' },
  { code: 'DRAFT', locale: 'it', value: 'Bozza' },
  // DEFINED
  { code: 'DEFINED', locale: 'fr', value: 'Défini' },
  { code: 'DEFINED', locale: 'en', value: 'Defined' },
  { code: 'DEFINED', locale: 'es', value: 'Definido' },
  { code: 'DEFINED', locale: 'pt', value: 'Definido' },
  { code: 'DEFINED', locale: 'de', value: 'Definiert' },
  { code: 'DEFINED', locale: 'it', value: 'Definito' },
  // IN_PROGRESS
  { code: 'IN_PROGRESS', locale: 'fr', value: 'En cours' },
  { code: 'IN_PROGRESS', locale: 'en', value: 'In Progress' },
  { code: 'IN_PROGRESS', locale: 'es', value: 'En progreso' },
  { code: 'IN_PROGRESS', locale: 'pt', value: 'Em andamento' },
  { code: 'IN_PROGRESS', locale: 'de', value: 'In Bearbeitung' },
  { code: 'IN_PROGRESS', locale: 'it', value: 'In corso' },
  // PARTIALLY_DONE
  { code: 'PARTIALLY_DONE', locale: 'fr', value: 'Partiellement terminé' },
  { code: 'PARTIALLY_DONE', locale: 'en', value: 'Partially Done' },
  { code: 'PARTIALLY_DONE', locale: 'es', value: 'Parcialmente completado' },
  { code: 'PARTIALLY_DONE', locale: 'pt', value: 'Parcialmente concluído' },
  { code: 'PARTIALLY_DONE', locale: 'de', value: 'Teilweise erledigt' },
  { code: 'PARTIALLY_DONE', locale: 'it', value: 'Parzialmente completato' },
  // DONE
  { code: 'DONE', locale: 'fr', value: 'Terminé' },
  { code: 'DONE', locale: 'en', value: 'Done' },
  { code: 'DONE', locale: 'es', value: 'Hecho' },
  { code: 'DONE', locale: 'pt', value: 'Concluído' },
  { code: 'DONE', locale: 'de', value: 'Erledigt' },
  { code: 'DONE', locale: 'it', value: 'Completato' },
  // CANCELLED
  { code: 'CANCELLED', locale: 'fr', value: 'Annulé' },
  { code: 'CANCELLED', locale: 'en', value: 'Cancelled' },
  { code: 'CANCELLED', locale: 'es', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'pt', value: 'Cancelado' },
  { code: 'CANCELLED', locale: 'de', value: 'Abgebrochen' },
  { code: 'CANCELLED', locale: 'it', value: 'Annullato' },
];

const epicTransitions = [
  // From DRAFT
  { from: 'DRAFT', to: 'DEFINED', name: 'Define', nameFr: 'Définir' },
  { from: 'DRAFT', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From DEFINED
  { from: 'DEFINED', to: 'IN_PROGRESS', name: 'Start', nameFr: 'Démarrer' },
  { from: 'DEFINED', to: 'DRAFT', name: 'Back to draft', nameFr: 'Retour en brouillon' },
  { from: 'DEFINED', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'PARTIALLY_DONE', name: 'Partial completion', nameFr: 'Complétion partielle' },
  { from: 'IN_PROGRESS', to: 'DONE', name: 'Complete', nameFr: 'Terminer' },
  { from: 'IN_PROGRESS', to: 'CANCELLED', name: 'Cancel', nameFr: 'Annuler' },
  // From PARTIALLY_DONE
  { from: 'PARTIALLY_DONE', to: 'IN_PROGRESS', name: 'Continue', nameFr: 'Continuer' },
  { from: 'PARTIALLY_DONE', to: 'DONE', name: 'Complete', nameFr: 'Terminer' },
  // From DONE
  { from: 'DONE', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
];

// ============================================
// DEFECT WORKFLOW (Bug tracking)
// ============================================
const defectStatuses = [
  { code: 'NEW', name: 'New', categoryCode: 'BACKLOG', isInitial: true, posX: 100, posY: 200 },
  { code: 'TRIAGED', name: 'Triaged', categoryCode: 'BACKLOG', isInitial: false, posX: 250, posY: 200 },
  { code: 'IN_PROGRESS', name: 'In Progress', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 400, posY: 150 },
  { code: 'FIXED', name: 'Fixed', categoryCode: 'IN_PROGRESS', isInitial: false, posX: 550, posY: 100 },
  { code: 'VERIFIED', name: 'Verified', categoryCode: 'DONE', isInitial: false, posX: 700, posY: 150 },
  { code: 'CLOSED', name: 'Closed', categoryCode: 'DONE', isInitial: false, posX: 850, posY: 200 },
  { code: 'WONT_FIX', name: 'Won\'t Fix', categoryCode: 'DONE', isInitial: false, posX: 400, posY: 350 },
  { code: 'DUPLICATE', name: 'Duplicate', categoryCode: 'DONE', isInitial: false, posX: 250, posY: 350 },
];

const defectStatusTranslations = [
  // NEW
  { code: 'NEW', locale: 'fr', value: 'Nouveau' },
  { code: 'NEW', locale: 'en', value: 'New' },
  { code: 'NEW', locale: 'es', value: 'Nuevo' },
  { code: 'NEW', locale: 'pt', value: 'Novo' },
  { code: 'NEW', locale: 'de', value: 'Neu' },
  { code: 'NEW', locale: 'it', value: 'Nuovo' },
  // TRIAGED
  { code: 'TRIAGED', locale: 'fr', value: 'Trié' },
  { code: 'TRIAGED', locale: 'en', value: 'Triaged' },
  { code: 'TRIAGED', locale: 'es', value: 'Clasificado' },
  { code: 'TRIAGED', locale: 'pt', value: 'Triado' },
  { code: 'TRIAGED', locale: 'de', value: 'Sortiert' },
  { code: 'TRIAGED', locale: 'it', value: 'Classificato' },
  // IN_PROGRESS
  { code: 'IN_PROGRESS', locale: 'fr', value: 'En cours' },
  { code: 'IN_PROGRESS', locale: 'en', value: 'In Progress' },
  { code: 'IN_PROGRESS', locale: 'es', value: 'En progreso' },
  { code: 'IN_PROGRESS', locale: 'pt', value: 'Em andamento' },
  { code: 'IN_PROGRESS', locale: 'de', value: 'In Bearbeitung' },
  { code: 'IN_PROGRESS', locale: 'it', value: 'In corso' },
  // FIXED
  { code: 'FIXED', locale: 'fr', value: 'Corrigé' },
  { code: 'FIXED', locale: 'en', value: 'Fixed' },
  { code: 'FIXED', locale: 'es', value: 'Corregido' },
  { code: 'FIXED', locale: 'pt', value: 'Corrigido' },
  { code: 'FIXED', locale: 'de', value: 'Behoben' },
  { code: 'FIXED', locale: 'it', value: 'Corretto' },
  // VERIFIED
  { code: 'VERIFIED', locale: 'fr', value: 'Vérifié' },
  { code: 'VERIFIED', locale: 'en', value: 'Verified' },
  { code: 'VERIFIED', locale: 'es', value: 'Verificado' },
  { code: 'VERIFIED', locale: 'pt', value: 'Verificado' },
  { code: 'VERIFIED', locale: 'de', value: 'Verifiziert' },
  { code: 'VERIFIED', locale: 'it', value: 'Verificato' },
  // CLOSED
  { code: 'CLOSED', locale: 'fr', value: 'Clôturé' },
  { code: 'CLOSED', locale: 'en', value: 'Closed' },
  { code: 'CLOSED', locale: 'es', value: 'Cerrado' },
  { code: 'CLOSED', locale: 'pt', value: 'Fechado' },
  { code: 'CLOSED', locale: 'de', value: 'Geschlossen' },
  { code: 'CLOSED', locale: 'it', value: 'Chiuso' },
  // WONT_FIX
  { code: 'WONT_FIX', locale: 'fr', value: 'Ne sera pas corrigé' },
  { code: 'WONT_FIX', locale: 'en', value: 'Won\'t Fix' },
  { code: 'WONT_FIX', locale: 'es', value: 'No se corregirá' },
  { code: 'WONT_FIX', locale: 'pt', value: 'Não será corrigido' },
  { code: 'WONT_FIX', locale: 'de', value: 'Wird nicht behoben' },
  { code: 'WONT_FIX', locale: 'it', value: 'Non verrà corretto' },
  // DUPLICATE
  { code: 'DUPLICATE', locale: 'fr', value: 'Doublon' },
  { code: 'DUPLICATE', locale: 'en', value: 'Duplicate' },
  { code: 'DUPLICATE', locale: 'es', value: 'Duplicado' },
  { code: 'DUPLICATE', locale: 'pt', value: 'Duplicado' },
  { code: 'DUPLICATE', locale: 'de', value: 'Duplikat' },
  { code: 'DUPLICATE', locale: 'it', value: 'Duplicato' },
];

const defectTransitions = [
  // From NEW
  { from: 'NEW', to: 'TRIAGED', name: 'Triage', nameFr: 'Trier' },
  { from: 'NEW', to: 'DUPLICATE', name: 'Mark as duplicate', nameFr: 'Marquer comme doublon' },
  { from: 'NEW', to: 'WONT_FIX', name: 'Won\'t fix', nameFr: 'Ne sera pas corrigé' },
  // From TRIAGED
  { from: 'TRIAGED', to: 'IN_PROGRESS', name: 'Start work', nameFr: 'Démarrer' },
  { from: 'TRIAGED', to: 'WONT_FIX', name: 'Won\'t fix', nameFr: 'Ne sera pas corrigé' },
  { from: 'TRIAGED', to: 'DUPLICATE', name: 'Mark as duplicate', nameFr: 'Marquer comme doublon' },
  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'FIXED', name: 'Fix', nameFr: 'Corriger' },
  { from: 'IN_PROGRESS', to: 'WONT_FIX', name: 'Won\'t fix', nameFr: 'Ne sera pas corrigé' },
  // From FIXED
  { from: 'FIXED', to: 'VERIFIED', name: 'Verify', nameFr: 'Vérifier' },
  { from: 'FIXED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
  // From VERIFIED
  { from: 'VERIFIED', to: 'CLOSED', name: 'Close', nameFr: 'Clôturer' },
  { from: 'VERIFIED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
  // From CLOSED
  { from: 'CLOSED', to: 'IN_PROGRESS', name: 'Reopen', nameFr: 'Réouvrir' },
  // From WONT_FIX
  { from: 'WONT_FIX', to: 'TRIAGED', name: 'Reconsider', nameFr: 'Reconsidérer' },
  // From DUPLICATE
  { from: 'DUPLICATE', to: 'TRIAGED', name: 'Reconsider', nameFr: 'Reconsidérer' },
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
 * Seed all Agile workflows
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedAgileWorkflows(prisma) {
  console.log('='.repeat(50));
  console.log('Seeding Agile workflows...');
  console.log('='.repeat(50));

  // User Story workflow
  await createWorkflow(
    prisma,
    'USER_STORY',
    'User Story Workflow',
    'Kanban-style workflow for user stories',
    userStoryStatuses,
    userStoryStatusTranslations,
    userStoryTransitions
  );

  // Project workflow
  await createWorkflow(
    prisma,
    'PROJECT',
    'Project Workflow',
    'Project lifecycle management workflow',
    projectStatuses,
    projectStatusTranslations,
    projectTransitions
  );

  // Sprint workflow
  await createWorkflow(
    prisma,
    'SPRINT',
    'Sprint Workflow',
    'Scrum sprint lifecycle workflow',
    sprintStatuses,
    sprintStatusTranslations,
    sprintTransitions
  );

  // Epic workflow
  await createWorkflow(
    prisma,
    'EPIC',
    'Epic Workflow',
    'High-level feature tracking workflow',
    epicStatuses,
    epicStatusTranslations,
    epicTransitions
  );

  // Defect workflow
  await createWorkflow(
    prisma,
    'DEFECT',
    'Defect Workflow',
    'Bug tracking and resolution workflow',
    defectStatuses,
    defectStatusTranslations,
    defectTransitions
  );

  console.log('\n' + '='.repeat(50));
  console.log('Agile workflows seeding completed!');
  console.log('='.repeat(50));
}

module.exports = { seedAgileWorkflows };

// Allow running directly
if (require.main === module) {
  const { prisma } = require('../client');
  seedAgileWorkflows(prisma)
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
