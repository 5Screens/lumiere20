import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Task {
  /**
   * Retourne les colonnes pour l'affichage dans le tableau des tâches
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('task.title'), type: 'text', format: 'text' },
      { key: 'description', label: t('task.description'), type: 'text', format: 'html' },
      { key: 'ticket_status_label', label: t('task.status'), type: 'text', format: 'text' },
      { key: 'requested_by_name', label: t('task.requested_by'), type: 'text', format: 'text' },
      { key: 'requested_for_name', label: t('task.requested_for'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('task.assigned_team_label'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('task.assigned_to_label'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les tâches de type TASK
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'tickets';
    } else {
      return `tickets?ticket_type=TASK&lang=${userProfileStore.language}`;
    }
  }

  /**
   * Récupère une tâche par son UUID
   * @param {string} uuid - L'UUID du ticket à récupérer
   * @returns {Promise<Task>} Une promesse résolue avec l'instance de la tâche
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`tickets/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Task(response);
      }
      
      throw new Error('Task not found');
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }
  
  constructor(data = {}) {
    this.uuid = data.uuid || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.requested_by_uuid = data.requested_by_uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_type_code = 'TASK';
    this.ticket_status_code = data.ticket_status_code || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.watch_list = data.watch_list || [];

    this.requested_by_name = data.requested_by_name || '';
    this.requested_for_name = data.requested_for_name || '';
    this.assigned_group_name = data.assigned_group_name || '';
    this.assigned_person_name = data.assigned_person_name || '';
    
    
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'ticket_status_code', label: i18n.global.t('task.status') },
      { name: 'title', label: i18n.global.t('task.title') },
      { name: 'requested_for_uuid', label: i18n.global.t('task.requested_for') },
      { name: 'assigned_to_group', label: i18n.global.t('task.assigned_team_label') }
    ];
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Task();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      ticket_status_code: {
        label: t('task.status'),
        type: 'sSelectField',
        placeholder: t('task.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=TASK`,
        patchEndpoint: 'tickets',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        editmode: false,
        label: t('task.title'),
        type: 'sTextField',
        placeholder: 'Entrez le titre',
        required: isRequired('title')
      },
      description: {
        label: t('task.description'),
        type: 'sRichTextEditor',
        placeholder: t('task.description_placeholder'),
        required: isRequired('description')
      },
      requested_by_uuid: {
        label: t('task.requested_by'),
        type: 'sFilteredSearchField',
        placeholder: t('task.requested_by_placeholder'),
        endpoint: 'persons',
        displayField: 'person_name',
        displayFieldAtInitInEditMode: 'requested_by_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('requested_by_uuid')
      },
      requested_for_uuid: {
        label: t('task.requested_for'),
        type: 'sFilteredSearchField',
        placeholder: t('task.requested_for_placeholder'),
        endpoint: 'persons',
        displayField: 'person_name',
        displayFieldAtInitInEditMode: 'requested_for_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('requested_for_uuid')
      },
      assigned_to_group: {
        label: t('task.assigned_team_label'),
        type: 'sFilteredSearchField',
        placeholder: t('task.assigned_team_placeholder'),
        endpoint: ({ assigned_to_person }) => {
          return assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups';
        },
        displayField: 'group_name',
        displayFieldAtInitInEditMode: 'assigned_group_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'group_name', label: t('group.name'), visible: true },
          { key: 'phone', label: t('group.phone'), visible: true }
        ],
        required: isRequired('assigned_to_group'),
        resetable: true
      },
      assigned_to_person: {
        label: t('task.assigned_to_label'),
        type: 'sFilteredSearchField',
        placeholder: t('task.assigned_to_placeholder'),
        endpoint: ({ assigned_to_group }) => {
          return assigned_to_group 
            ? `groups/${assigned_to_group}/members` 
            : `groups/members` ; // Retourne null pour désactiver le champ si aucun groupe n'est sélectionné
        },
        displayField: 'first_name',
        displayFieldAtInitInEditMode: 'assigned_person_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('assigned_to_person'),
        resetable: true
      },
      watch_list: {
        label: t('task.watcher'),
        type: "sPickList",
        helperText: t('task.watcher_helper_text'),
        placeholder: t('task.watcher_placeholder'),
        required: isRequired('watch_list'),
        edition: false,
        sourceEndPoint: "persons",
        displayedLabel: "person_name",
        targetEndPoint: "tickets",
        ressourceEndPoint: 'watchers',
        target_uuid: null,
        pickedItems: null
      }
    }
  }

  toAPI(method) {
    console.log('[Task.toAPI] Starting conversion to API format', { method });
    const userProfileStore = useUserProfileStore();
    console.log('[Task.toAPI] Current user profile ID:', userProfileStore.id);
    
    // Traiter la watch_list pour extraire uniquement les UUIDs si ce sont des objets complets
    let watchList = this.watch_list;
    if (this.watch_list && Array.isArray(this.watch_list) && this.watch_list.length > 0) {
      if (typeof this.watch_list[0] === 'object' && this.watch_list[0].uuid) {
        // Si les éléments de la watch_list sont des objets avec un UUID, extraire uniquement les UUIDs
        watchList = this.watch_list.map(item => item.uuid);
        console.log('[Task.toAPI] Extracted UUIDs from watch_list objects', watchList);
      }
    }
    
    // Base object with common fields
    const baseFields = {
      title: this.title,
      description: this.description,
      requested_by_uuid: this.requested_by_uuid,
      requested_for_uuid: this.requested_for_uuid,
      assigned_to_group: this.assigned_to_group,
      assigned_to_person: this.assigned_to_person,
      writer_uuid: userProfileStore.id, // Always use current user's ID
      ticket_type_code: 'TASK', //We are creating a task
      ticket_status_code: this.ticket_status_code,
      watch_list: watchList
    };
    console.log('[Task.toAPI] Base fields prepared', baseFields);

    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[Task.toAPI] Processing POST request - returning all base fields');
        return baseFields;
        
      case 'PUT':
        console.log('[Task.toAPI] Processing PUT request - returning all fields with uuid');
        const putData = {
          ...baseFields,
          uuid: this.uuid
        };
        console.log('[Task.toAPI] PUT data prepared', putData);
        return putData;
        
      case 'PATCH':
        console.log('[Task.toAPI] Processing PATCH request - filtering for modified fields');
        const modifiedFields = {};
        for (const [key, value] of Object.entries(baseFields)) {
          if (value !== null && value !== '') {
            modifiedFields[key] = value;
          }
        }
        const patchData = {
          uuid: this.uuid,
          ...modifiedFields
        };
        console.log('[Task.toAPI] PATCH data prepared', patchData);
        return patchData;
        
      default:
        console.error('[Task.toAPI] Error: Unsupported HTTP method', { method });
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
