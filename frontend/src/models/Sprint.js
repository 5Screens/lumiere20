import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Sprint {
  constructor(data = {}) {
    // Identifiant unique du sprint
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Nom du sprint
    this.description = data.description || ''; // Objectif du sprint
    this.ticket_status_code = data.ticket_status_code || null; // État du sprint
    this.ticket_type_code = 'SPRINT'; // Ticket de type sprint
    
    // Attributs étendus (core_ext)
    this.project_id = data.project_id || null; // ID du projet associé
    this.project_name = data.project_name || null; // Nom du projet associé
    this.start_date = data.start_date || null; // Date de début du sprint
    this.end_date = data.end_date || null; // Date de fin du sprint
    this.actual_velocity = data.actual_velocity || null; // Vélocité réelle
    this.estimated_velocity = data.estimated_velocity || null; // Vélocité estimée
    
    // Informations sur l'auteur
    this.writer_name = data.writer_name || null; // Nom de l'auteur du sprint
    
    // Compteurs
    this.attachments_count = data.attachments_count || 0; // Nombre de pièces jointes
    this.tieds_tickets_count = data.tieds_tickets_count || 0; // Nombre de tickets liés
    this.stories_count = data.stories_count || 0; // Nombre d'histoires utilisateur
    this.tasks_count = data.tasks_count || 0; // Nombre de tâches
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.closed_at = data.closed_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('sprint.name') },
      { name: 'ticket_status_code', label: i18n.global.t('sprint.state') },
      { name: 'project_id', label: i18n.global.t('sprint.project_id') },
    ];
  }

  static getRenderableFields(mode = 'for_creation') {
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Sprint();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    // Définition de tous les champs
    const fields = {
      // Informations système et métadonnées
      uuid: {
        label: 'common.id',
        type: 'sTextField',
        disabled: true
      },
      writer_name: {
        label: 'common.writer_name',
        type: 'sTextField',
        disabled: true
      },
      created_at: {
        label: 'common.created_at',
        type: 'sTextField',
        disabled: true
      },
      updated_at: {
        label: 'common.updated_at',
        type: 'sTextField',
        disabled: true
      },
      closed_at: {
        label: 'common.closed_at',
        type: 'sTextField',
        disabled: true
      },
      attachments_count: {
        label: 'sprint.attachments_count',
        type: 'sTextField',
        disabled: true
      },
      tieds_tickets_count: {
        label: 'sprint.tieds_tickets_count',
        type: 'sTextField',
        disabled: true
      },
      stories_count: {
        label: 'sprint.stories_count',
        type: 'sTextField',
        disabled: true
      },
      tasks_count: {
        label: 'sprint.tasks_count',
        type: 'sTextField',
        disabled: true
      },
      
      // Informations générales
      title: {
        label: 'sprint.name',
        type: 'sTextField',
        placeholder: 'sprint.name_placeholder',
        required: isRequired('title')
      },
      description: {
        label: 'sprint.goal',
        type: 'sRichTextEditor',
        placeholder: 'sprint.goal_placeholder',
        required: isRequired('description')
      },
      ticket_status_code: {
        label: 'sprint.state',
        type: 'sSelectField',
        placeholder: 'sprint.state_placeholder',
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=SPRINT`,
        patchEndpoint: 'sprints',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      
      // Attributs étendus
      project_id: {
        label: 'sprint.project_id',
        type: 'sFilteredSearchField',
        placeholder: 'sprint.project_id_placeholder',
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: 'project.name', visible: true },
          { key: 'key', label: 'project.key', visible: true }
        ],
        required: isRequired('project_id'),
        displayFieldAtInitInEditMode: 'project_name'
      },
      start_date: {
        label: 'sprint.start_date',
        type: 'sDatePicker',
        placeholder: 'sprint.start_date_placeholder',
        required: isRequired('start_date'),
        patchendpoint: 'tickets'
      },
      end_date: {
        label: 'sprint.end_date',
        type: 'sDatePicker',
        placeholder: 'sprint.end_date_placeholder',
        required: isRequired('end_date'),
        patchendpoint: 'tickets'
      },
      actual_velocity: {
        label: 'sprint.actual_velocity',
        type: 'sTextField',
        placeholder: 'sprint.actual_velocity_placeholder',
        required: isRequired('actual_velocity'),
        inputType: 'number'
      },
      estimated_velocity: {
        label: 'sprint.estimated_velocity',
        type: 'sTextField',
        placeholder: 'sprint.estimated_velocity_placeholder',
        required: isRequired('estimated_velocity'),
        inputType: 'number'
      }
    };
    
    // Supprimer les champs système et métadonnées en mode création
    if (mode === 'for_creation') {
      const fieldsToRemove = ['uuid', 'writer_name', 'created_at', 'updated_at', 'closed_at', 'attachments_count', 'tieds_tickets_count', 'stories_count', 'tasks_count'];
      fieldsToRemove.forEach(field => {
        if (field in fields) {
          delete fields[field];
        }
      });
    }
    
    return fields;
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code si nécessaire
        this.writer_uuid = userProfileStore.id;
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Sprint.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Pour POST, supprimer les champs spécifiés qui ne doivent pas être envoyés lors de la création
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'writer_name', 'created_at', 'updated_at', 'closed_at', 'attachments_count', 'tieds_tickets_count', 'stories_count', 'tasks_count'];
      fieldsToRemove.forEach(field => {
        if (field in apiData) {
          delete apiData[field];
        }
      });
    }
    
    // Supprimer tous les attributs qui sont null, undefined, tableaux vides ou chaînes vides
    Object.keys(apiData).forEach(key => {
      const value = apiData[key];
      if (value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'string' && value.trim() === '')) {
        delete apiData[key];
      }
    });
    
    return apiData;
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des sprints
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('sprint.name'), type: 'text', format: 'text' },
      { key: 'description', label: t('sprint.goal'), type: 'text', format: 'html' },
      { key: 'ticket_status_label', label: t('sprint.state'), type: 'text', format: 'text', filterKey: 'ticket_status_code' },
      { key: 'project_title', label: t('sprint.project_id'), type: 'text', format: 'text', filterKey: 'project_id' },
      { key: 'start_date', label: t('sprint.start_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'end_date', label: t('sprint.end_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'stories_count', label: t('sprint.stories_count'), type: 'number', format: 'text' },
      { key: 'tasks_count', label: t('sprint.tasks_count'), type: 'number', format: 'text' },
      { key: 'actual_velocity', label: t('sprint.actual_velocity'), type: 'number', format: 'text' },
      { key: 'estimated_velocity', label: t('sprint.estimated_velocity'), type: 'number', format: 'text' },
      { key: 'requested_by_name', label: t('sprint.reported_by'), type: 'text', format: 'text', filterKey: 'requested_by_uuid' },
      { key: 'created_at', label: t('common.created_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'closed_at', label: t('common.closed_at'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les tickets de type sprint
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE, FILTER)
   * @returns {string} URL de l'endpoint API
   */
  static getApiEndpoint(method) {
    // Pour les filtres, retourner l'endpoint spécifique aux sprints
    if (method === 'FILTER') {
      return 'tickets/sprints';
    }
    
    // Pour l'infinite scroll, retourner l'endpoint de recherche
    // Le composant reusableTableTab utilisera POST /tickets/search/sprints
    if (method === 'GET') {
      return 'tickets/search/sprints';
    }
    
    // Pour les autres méthodes (PATCH, PUT, DELETE)
    return 'tickets';
  }

  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'title';
  }

  /**
   * Retourne l'identifiant unique pour ce type d'objet
   * @returns {string} Le nom du champ identifiant
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne le titre pour la création d'un nouvel objet
   * @returns {string} Le titre de création
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.sprintCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.sprintUpdate';
  }

  /**
   * Récupère un sprint par son UUID
   * @param {string} uuid - L'UUID du sprint à récupérer
   * @returns {Promise<Sprint>} Une promesse résolue avec l'instance du sprint
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`tickets/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Sprint(response);
      }
      
      throw new Error('Sprint not found');
    } catch (error) {
      console.error('Error fetching sprint:', error);
      throw error;
    }
  }
}
