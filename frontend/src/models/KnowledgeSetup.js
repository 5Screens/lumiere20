import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class KnowledgeSetup {
  constructor(data = {}) {
    // Identifiant unique du knowledge setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[KnowledgeSetup Constructor] data received:', data);
    console.log('[KnowledgeSetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'knowledgeSetup.code' },
      { name: 'labels', label: 'knowledgeSetup.label' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des knowledge setup
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('knowledgeSetup.code'), type: 'text' },
      { key: 'metadata', label: t('knowledgeSetup.metadata'), type: 'text' },
      { key: 'label', label: t('knowledgeSetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les knowledge setup
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'knowledge_setup';
    } else {
      return `knowledge_setup?lang=${userProfileStore.language}`;
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
    return 'objectCreationsAndUpdates.knowledgeSetupCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.knowledgeSetupUpdate';
  }

  /**
   * Récupère un knowledge setup par son UUID
   * @param {string} uuid - L'UUID du knowledge setup à récupérer
   * @returns {Promise<KnowledgeSetup>} Une promesse résolue avec l'instance du knowledge setup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`knowledge_setup/${uuid}`);
      
      if (response) {
        return new KnowledgeSetup(response);
      }
      
      throw new Error('Knowledge setup not found');
    } catch (error) {
      console.error('Error fetching knowledge setup:', error);
      throw error;
    }
  }

  static getRenderableFields(mode = 'for_creation') {
  
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new KnowledgeSetup();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    const fields = {
      uuid: {
        label: 'knowledgeSetup.uuid',
        type: 'sTextField',
        placeholder: 'knowledgeSetup.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'knowledgeSetup.created_at',
        type: 'sTextField',
        placeholder: 'knowledgeSetup.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'knowledgeSetup.updated_at',
        type: 'sTextField',
        placeholder: 'knowledgeSetup.updated_at_placeholder',
        disabled: true
      },
      code: {
        label: 'knowledgeSetup.code',
        type: 'sTextField',
        placeholder: 'knowledgeSetup.code_placeholder',
        required: isRequired('code')
      },
      metadata: {
        label: 'knowledgeSetup.metadata',
        type: 'sTextField',
        placeholder: 'knowledgeSetup.metadata_placeholder',
        required: false
      },
      labels: {
        label: 'knowledgeSetup.labels',
        type: 'sMLTextField',
        placeholder: 'knowledgeSetup.label_placeholder',
        required: isRequired('labels'),
        patchEndpoint: 'knowledge_setup_label',
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
    console.log('[KnowledgeSetup.toAPI] Starting conversion to API format', { method });
    
    // Base object with common fields
    const baseFields = {
      code: this.code,
      metadata: this.metadata,
      labels: this.labels,
    };
    
    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[KnowledgeSetup.toAPI] Processing POST request - returning base fields without system fields');
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
        console.log('[KnowledgeSetup.toAPI] Processing PUT request - returning all fields with uuid');
        return {
          ...baseFields,
          uuid: this.uuid
        };
        
      case 'PATCH':
        console.log('[KnowledgeSetup.toAPI] Processing PATCH request - filtering for modified fields');
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
        console.error('[KnowledgeSetup.toAPI] Unsupported method:', method);
        return null;
    }
  }
}

export default KnowledgeSetup;
