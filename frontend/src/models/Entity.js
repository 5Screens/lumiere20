import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

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
    this.date_creation = data.date_creation || null;
    this.date_modification = data.date_modification || null;
    
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
      { key: 'date_creation', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'date_modification', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les entités
   * @returns {string} Endpoint API
   */
  static getApiEndpoint() {
    return 'entities';
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Entity();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      name: {
        label: t('entity.name'),
        type: 'sTextField',
        placeholder: t('entity.name_placeholder'),
        required: isRequired('name')
      },
      entity_id: {
        label: t('entity.entity_id'),
        type: 'sTextField',
        placeholder: t('entity.entity_id_placeholder'),
        required: isRequired('entity_id')
      },
      entity_type: {
        label: t('entity.entity_type'),
        type: 'sSelectField',
        placeholder: t('entity.entity_type_placeholder'),
        required: isRequired('entity_type'),
        endpoint: `entity_types?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'entity_type',
        mode: 'creation'
      },
      parent_entity_uuid: {
        label: t('entity.parent_entity'),
        type: 'sFilteredSearchField',
        placeholder: t('entity.parent_entity_placeholder'),
        endpoint: 'entities',
        displayField: 'name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'name', label: t('entity.name'), visible: true },
          { key: 'entity_id', label: t('entity.entity_id'), visible: true },
          { key: 'entity_type', label: t('entity.entity_type'), visible: true }
        ],
        required: isRequired('parent_entity_uuid')
      },
      external_id: {
        label: t('entity.external_id'),
        type: 'sTextField',
        placeholder: t('entity.external_id_placeholder'),
        required: isRequired('external_id')
      },
      headquarters_location_uuid: {
        label: t('entity.headquarters_location'),
        type: 'sFilteredSearchField',
        placeholder: t('entity.headquarters_location_placeholder'),
        endpoint: 'locations',
        displayField: 'name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'name', label: t('location.name'), visible: true },
          { key: 'address', label: t('location.address'), visible: true },
          { key: 'city', label: t('location.city'), visible: true },
          { key: 'country', label: t('location.country'), visible: true }
        ],
        required: isRequired('headquarters_location_uuid')
      },
      is_active: {
        label: t('entity.is_active'),
        type: 'sSelectField',
        placeholder: t('entity.is_active_placeholder'),
        required: isRequired('is_active'),
        options: [
          { value: 'Yes', label: t('common.yes') },
          { value: 'No', label: t('common.no') }
        ],
        fieldName: 'is_active',
        mode: 'creation'
      },
      budget_approver_uuid: {
        label: t('entity.budget_approver'),
        type: 'sFilteredSearchField',
        placeholder: t('entity.budget_approver_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('budget_approver_uuid')
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
