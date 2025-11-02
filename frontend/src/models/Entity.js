import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '@/services/apiService'

export class Entity {
  constructor(data = {}) {
    // Identifiant unique de l'entité
    this.uuid = data.uuid || null;
    this.entity_id = data.entity_id || '';
    this.name = data.name || '';
    this.parent_entity_uuid = data.parent_entity_uuid || null;
    this.parent_entity_name = data.parent_entity_name || '';
    this.external_id = data.external_id || '';
    this.entity_type = data.entity_type || '';
    this.headquarters_location_uuid = data.headquarters_location_uuid || null;
    this.headquarters_location_name = data.headquarters_location_name || '';
    this.is_active = data.is_active || 'Yes';
    this.budget_approver_uuid = data.budget_approver_uuid || null;
    this.budget_approver_name = data.budget_approver_name || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'name', label: i18n.global.t('entities.name') },
      { name: 'entity_type', label: i18n.global.t('entities.entity_type') }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des entités
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'entity_id', label: t('entities.entity_id'), type: 'text', format: 'text' },
      { key: 'name', label: t('entities.name'), type: 'text', format: 'text' },
      { key: 'parent_entity_name', label: t('entities.parent'), type: 'text', format: 'text' },
      { key: 'external_id', label: t('entities.external_id'), type: 'text', format: 'text' },
      { key: 'entity_type', label: t('entities.entity_type'), type: 'text', format: 'text' },
      { key: 'headquarters_location_name', label: t('entities.location'), type: 'text', format: 'text' },
      { key: 'is_active', label: t('entities.is_active'), type: 'select', options: ['Yes', 'No'], format: 'text' },
      { key: 'budget_approver_name', label: t('entities.budget_approver_name'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.created_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les entités
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    // Si method est undefined, on considère que c'est GET
    if (!method) {
      return 'entities';
    }
    
    switch (method.toUpperCase()) {
      case 'PATCH':
      case 'PUT':
      case 'DELETE':
        return 'entities/:uuid';
      case 'GET':
        return 'entities';
      case 'POST':
        return 'entities';
      default:
        console.error('[Entity.getApiEndpoint] Unsupported method:', method);
        return 'entities';
    }
  }

  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'name';
  }

  /**
   * Retourne le nom du champ à utiliser comme identifiant unique
   * @returns {string} Le nom du champ
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne la clé de traduction pour le titre de création
   * @returns {string} La clé de traduction
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.entityCreation';
  }

  /**
   * Retourne la clé de traduction pour le titre de mise à jour
   * @returns {string} La clé de traduction
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.entityUpdate';
  }

  /**
   * Récupère une entité par son UUID
   * @param {string} uuid - L'UUID de l'entité à récupérer
   * @returns {Promise<Entity>} Une promesse résolue avec l'instance de l'entité
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`entities/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Entity(response);
      }
      
      throw new Error('Entity not found');
    } catch (error) {
      console.error('Error fetching entity:', error);
      throw error;
    }
  }

  static getRenderableFields() {
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Entity();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      name: {
        label: 'entities.name',
        type: 'sTextField',
        placeholder: 'entities.name_placeholder',
        required: isRequired('name')
      },
      entity_id: {
        label: 'entities.entity_id',
        type: 'sTextField',
        placeholder: 'entities.entity_id_placeholder',
        required: isRequired('entity_id')
      },
      entity_type: {
        label: 'entities.entity_type',
        type: 'sSelectField',
        placeholder: 'entities.entity_type_placeholder',
        required: isRequired('entity_type'),
        endpoint: `entity_setup?lang=${userProfileStore.language}&metadata=CATEGORY`,
        fieldName: 'entity_type',
        valueField: 'code',
        displayField: 'label',
        mode: 'creation'
      },
      parent_entity_uuid: {
        label: 'entities.parent',
        type: 'sFilteredSearchField',
        placeholder: 'entities.parent_placeholder',
        endpoint: 'entities',
        displayField: 'name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'name', label: 'entities.name', visible: true },
          { key: 'entity_id', label: 'entities.entity_id', visible: true },
          { key: 'entity_type', label: 'entities.entity_type', visible: true }
        ],
        required: isRequired('parent_entity_uuid')
      },
      external_id: {
        label: 'entities.external_id',
        type: 'sTextField',
        placeholder: 'entities.external_id_placeholder',
        required: isRequired('external_id')
      },
      headquarters_location_uuid: {
        label: 'entities.headquarters_location',
        type: 'sFilteredSearchField',
        placeholder: 'entities.headquarters_location_placeholder',
        endpoint: () => {
          const userProfileStore = useUserProfileStore();
          return `locations?lang=${userProfileStore.language}`;
        },
        displayField: 'name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'name', label: 'location.name', visible: true },
          { key: 'address', label: 'location.address', visible: true },
          { key: 'city', label: 'location.city', visible: true },
          { key: 'country', label: 'location.country', visible: true },
          { key: 'status_label', label: 'location.status', visible: true }
        ],
        required: isRequired('headquarters_location_uuid')
      },
      is_active: {
        label: 'entities.is_active',
        type: 'sSelectField',
        placeholder: 'entities.is_active_placeholder',
        required: isRequired('is_active'),
        options: [
          { value: 'Yes', label: 'common.yes' },
          { value: 'No', label: 'common.no' }
        ],
        fieldName: 'is_active',
        mode: 'creation'
      },
      budget_approver_uuid: {
        label: 'entities.budget_approver',
        type: 'sFilteredSearchField',
        placeholder: 'entities.budget_approver_placeholder',
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'email', label: 'person.email', visible: true }
        ],
        required: isRequired('budget_approver_uuid'),
        lazySearch: true
      }
    };
  }

  toAPI(method) {
    console.log('[Entity.toAPI] Starting conversion to API format', { method });
    const userProfileStore = useUserProfileStore();
    
    // Base object with common fields
    const baseFields = {
      entity_id: this.entity_id,
      name: this.name,
      parent_entity_uuid: this.parent_entity_uuid,
      external_id: this.external_id,
      entity_type: this.entity_type,
      headquarters_location_uuid: this.headquarters_location_uuid,
      is_active: this.is_active,
      budget_approver_uuid: this.budget_approver_uuid
    };
    
    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[Entity.toAPI] Processing POST request - returning all base fields');
        return baseFields;
        
      case 'PUT':
        console.log('[Entity.toAPI] Processing PUT request - returning all fields with uuid');
        return {
          ...baseFields,
          uuid: this.uuid
        };
        
      case 'PATCH':
        console.log('[Entity.toAPI] Processing PATCH request - filtering for modified fields');
        const modifiedFields = {};
        for (const [key, value] of Object.entries(baseFields)) {
          if (value !== null && value !== '') {
            modifiedFields[key] = value;
          }
        }
        return {
          uuid: this.uuid,
          ...modifiedFields
        };
        
      default:
        console.error('[Entity.toAPI] Unsupported method:', method);
        return null;
    }
  }
}
