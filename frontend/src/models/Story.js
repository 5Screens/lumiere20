import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Story {
  constructor(data = {}) {
    // Identifiant unique de la story
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Titre de la story
    this.description = data.description || ''; // Description détaillée de la story
    this.ticket_status_code = data.ticket_status_code || null; // Statut de la story
    this.ticket_type_code = 'USER_STORY'; // ticket de type user story
    
    // Informations sur les personnes
    this.writer_uuid = data.writer_uuid || null; // Personne qui saisit la story dans le système
    this.writer_name = data.writer_name || null; // Nom de la personne qui saisit la story
    this.requested_for_uuid = data.requested_for_uuid || null; // Source du besoin, responsable de l'expression de la valeur
    this.requested_for_name = data.requested_for_name || null; // Nom de la personne pour qui la story est demandée
    
    // Attributs étendus (core_extended_attributes)
    this.project_id = data.project_id || null; // Projet parent
    this.project_name = data.project_name || null; // Nom du projet parent
    this.epic_id = data.epic_id || null; // Epic parent
    this.sprint_id = data.sprint_id || null; // Sprint associé
    this.story_points = data.story_points || null; // Points de story
    this.priority = data.priority || null; // Priorité de la story
    this.acceptance_criteria = data.acceptance_criteria || ''; // Critères d'acceptation
    this.tags = data.tags || []; // Tags associés à la story
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.rel_assigned_to_group = data.rel_assigned_to_group || null; // Équipe assignée au projet
    this.rel_assigned_to_person = data.rel_assigned_to_person || null; // Personne chargée de réaliser techniquement la story
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.closed_at = data.closed_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('story.title') },
      { name: 'ticket_status_code', label: i18n.global.t('story.status') },
      { name: 'project_id', label: i18n.global.t('story.project_id') }
    ];
  }

  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Story();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    // Définition de tous les champs
    const fields = {
      // Informations générales
      project_id: {
        label: t('story.project_id'),
        type: 'sFilteredSearchField',
        placeholder: t('story.project_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'project_name',
        columnsConfig: [
          { key: 'title', label: t('project.name'), visible: true },
          { key: 'key', label: t('project.key'), visible: true }
        ],
        required: isRequired('project_id')
      },
      title: {
        label: t('story.title'),
        type: 'sTextField',
        placeholder: t('story.title_placeholder'),
        required: isRequired('title')
      },
      epic_id: {
        label: t('story.epic_id'),
        type: 'sSelectField',
        placeholder: t('story.epic_id_placeholder'),
        required: isRequired('epic_id'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/epics` : '',
        fieldName: 'epic_id',
        displayField: 'title',
        valueField: 'uuid',
        mode: 'creation'
      },
      sprint_id: {
        label: t('story.sprint_id'),
        type: 'sSelectField',
        placeholder: t('story.sprint_id_placeholder'),
        required: isRequired('sprint_id'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/sprints` : '',
        fieldName: 'sprint_id',
        displayField: 'title',
        valueField: 'uuid',
        mode: 'creation'
      },
      rel_assigned_to_person: {
        label: t('story.assigned_to_person'),
        type: 'sSelectField',
        placeholder: ({ project_id }) => project_id ? t('story.assigned_to_person_placeholder') : t('story.assigned_to_person_placeholder_if_empty_team'),
        required: isRequired('assigned_to_person'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/team/members` : '',
        fieldName: 'assigned_to_person',
        displayField: 'full_name',
        valueField: 'uuid',
        mode: 'creation'
      },
      description: {
        label: t('story.description'),
        type: 'sRichTextEditor',
        placeholder: t('story.description_placeholder'),
        required: isRequired('description')
      },
      ticket_status_code: {
        label: t('story.status'),
        type: 'sSelectField',
        placeholder: t('story.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=USER_STORY`,
        patchEndpoint: 'tickets',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: t('story.reporter'),
        type: 'sFilteredSearchField',
        placeholder: t('story.reporter_placeholder'),
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_for_name',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('requested_for_uuid')
      },
      story_points: {
        label: t('story.story_points'),
        type: 'sTextField',
        placeholder: t('story.story_points_placeholder'),
        required: isRequired('story_points'),
        inputType: 'number'
      },
      priority: {
        label: t('story.priority'),
        type: 'sTextField',
        placeholder: t('story.priority_placeholder'),
        required: isRequired('priority')
      },
      acceptance_criteria: {
        label: t('story.acceptance_criteria'),
        type: 'sRichTextEditor',
        placeholder: t('story.acceptance_criteria_placeholder'),
        required: isRequired('acceptance_criteria')
      },
      tags: {
        label: t('story.tags'),
        type: 'sTagsList',
        placeholder: t('story.tags_placeholder'),
        required: isRequired('tags'),
        comboBox: false
      },
      // Champs système en lecture seule
      uuid: {
        label: t('common.id'),
        type: 'sTextField',
        placeholder: t('common.id'),
        disabled: true
      },
      created_at: {
        label: t('story.created_at'),
        type: 'sTextField',
        disabled: true
      },
      writer_name: {
        label: t('story.writer'),
        type: 'sTextField',
        disabled: true
      },
      updated_at: {
        label: t('story.updated_at'),
        type: 'sTextField',
        disabled: true
      },
      closed_at: {
        label: t('story.closed_at'),
        type: 'sTextField',
        disabled: true
      }
    };
    
    // Supprimer les champs système en mode création
    if (mode === 'for_creation') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at'];
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
        // Pour POST, définir writer_uuid si nécessaire
        this.writer_uuid = userProfileStore.id;
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Story.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Pour POST, supprimer les champs spécifiés qui ne doivent pas être envoyés lors de la création
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at'];
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
   * Retourne les colonnes pour l'affichage dans le tableau des user stories
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('story.title'), type: 'text', format: 'text' },
      { key: 'description', label: t('story.description'), type: 'text', format: 'html' },
      { key: 'ticket_status_label', label: t('story.status'), type: 'text', format: 'text' },
      { key: 'project_title', label: t('story.project_id'), type: 'text', format: 'text' },
      { key: 'epic_title', label: t('story.epic_id'), type: 'text', format: 'text' },
      { key: 'sprint_title', label: t('story.sprint_id'), type: 'text', format: 'text' },
      { key: 'story_points', label: t('story.story_points'), type: 'text', format: 'text' },
      { key: 'tags', label: t('story.tags'), type: 'text', format: 'tags' },
      { key: 'acceptance_criteria', label: t('story.acceptance_criteria'), type: 'text', format: 'html' },
      { key: 'priority', label: t('story.priority'), type: 'text', format: 'text' },
      { key: 'requested_for_name', label: t('story.reporter'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('story.assigned_to_person'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Récupère une story par son ID
   * @param {string} id - ID de la story à récupérer
   * @returns {Promise<Story>} Instance de la story récupérée
   */
  static async getById(id) {
    const userProfileStore = useUserProfileStore();
    const endpoint = `tickets/${id}?lang=${userProfileStore.language}`;
    const data = await import('@/services/apiService').then(module => module.default.get(endpoint));
    return new Story(data);
  }

  /**
   * Retourne l'endpoint API pour récupérer les tickets de type story
   * @returns {string} URL de l'endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'tickets';
    } else {
      return `tickets?ticket_type=USER_STORY&lang=${userProfileStore.language}`;
    }
  }
}
