import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ContactType {
  constructor(data = {}) {
    // Identifiant unique du type de contact
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    //Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'contactType.code' },
      { name: 'labels', label: 'contactType.label' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des types de contact
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label:  t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('contactType.code'), type: 'text' },
      { key: 'label', label: t('contactType.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les types de contact
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'contact_types';
    } else {
      return `contact_types?lang=${userProfileStore.language}`;
    }
  }

  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'label';
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
    return 'objectCreationsAndUpdates.contactTypeCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.contactTypeUpdate';
  }

  /**
   * Récupère un type de contact par son UUID
   * @param {string} uuid - L'UUID du type de contact à récupérer
   * @returns {Promise<ContactType>} Une promesse résolue avec l'instance du type de contact
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`contact_types/${uuid}`);
      
      if (response) {
        return new ContactType(response);
      }
      
      throw new Error('Contact type not found');
    } catch (error) {
      console.error('Error fetching contact type:', error);
      throw error;
    }
  }

  static getRenderableFields(mode = 'for_creation') {
  
  // Fonction utilitaire pour déterminer si un champ est obligatoire
  const dynamicLabels = new ContactType();
  const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
  
  const fields = {
    uuid: {
      label: 'contactType.uuid',
      type: 'sTextField',
      placeholder: 'contactType.uuid_placeholder',
      disabled: true
    },
    created_at: {
      label: 'contactType.created_at',
      type: 'sTextField',
      placeholder: 'contactType.created_at_placeholder',
      disabled: true
    },
    updated_at: {
      label: 'contactType.updated_at',
      type: 'sTextField',
      placeholder: 'contactType.updated_at_placeholder',
      disabled: true
    },
    code: {
      label: 'contactType.code',
      type: 'sTextField',
      placeholder: 'contactType.code_placeholder',
      required: isRequired('code')
    },
    labels: {
      label: 'contactType.labels',
      type: 'sMLTextField',
      placeholder: 'contactType.label_placeholder',
      required: isRequired('labels'),
      patchEndpoint: 'contact_types_labels',
    }
  };
  
  // Supprimer les champs système en mode création
  if (mode === 'for_creation') {
    delete fields.uuid;
    delete fields.created_at;
    delete fields.updated_at;
  }
  
  return fields;
}

  toAPI(method) {
    console.log('[ContactType.toAPI] Starting conversion to API format', { method });
    
    // Base object with common fields
    const baseFields = {
      code: this.code,
      labels: this.labels,
    };
    
    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[ContactType.toAPI] Processing POST request - returning base fields without system fields');
        // Créer une copie des champs de base
        const postData = { ...baseFields };
        // Supprimer les champs système pour POST
        delete postData.uuid;
        delete postData.created_at;
        delete postData.updated_at;
        // Supprimer les uuid des labels
        postData.labels = postData.labels.map(label => {
          delete label.label_uuid;
          return label;
        });
        return postData;
        
      case 'PUT':
        console.log('[ContactType.toAPI] Processing PUT request - returning all fields with uuid');
        return {
          ...baseFields,
          uuid: this.uuid
        };
        
      case 'PATCH':
        console.log('[ContactType.toAPI] Processing PATCH request - filtering for modified fields');
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
        console.error('[ContactType.toAPI] Unsupported method:', method);
        return null;
    }
  }
}

export default ContactType;
