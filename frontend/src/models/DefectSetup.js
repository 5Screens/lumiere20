import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class DefectSetup {
  constructor(data = {}) {
    // Identifiant unique du defect setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[DefectSetup Constructor] data received:', data);
    console.log('[DefectSetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'defectSetup.code' },
      { name: 'labels', label: 'defectSetup.label' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des defect setup
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.created_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('defectSetup.code'), type: 'text' },
      { key: 'metadata', label: t('defectSetup.metadata'), type: 'text' },
      { key: 'label', label: t('defectSetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les defect setup
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'defect_setup';
    } else {
      return `defect_setup?lang=${userProfileStore.language}`;
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
    return 'objectCreationsAndUpdates.defectSetupCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.defectSetupUpdate';
  }

  /**
   * Récupère un defect setup par son UUID
   * @param {string} uuid - L'UUID du defect setup à récupérer
   * @returns {Promise<DefectSetup>} Une promesse résolue avec l'instance du defect setup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`defect_setup/${uuid}`);
      
      if (response) {
        return new DefectSetup(response);
      }
      
      throw new Error('Defect setup not found');
    } catch (error) {
      console.error('Error fetching defect setup:', error);
      throw error;
    }
  }

  static getRenderableFields(mode = 'for_creation') {
  
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new DefectSetup();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    const fields = {
      uuid: {
        label: 'defectSetup.uuid',
        type: 'sTextField',
        placeholder: 'defectSetup.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'defectSetup.created_at',
        type: 'sTextField',
        placeholder: 'defectSetup.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'defectSetup.updated_at',
        type: 'sTextField',
        placeholder: 'defectSetup.updated_at_placeholder',
        disabled: true
      },
      code: {
        label: 'defectSetup.code',
        type: 'sTextField',
        placeholder: 'defectSetup.code_placeholder',
        required: isRequired('code')
      },
      metadata: {
        label: 'defectSetup.metadata',
        type: 'sTextField',
        placeholder: 'defectSetup.metadata_placeholder',
        required: false
      },
      labels: {
        label: 'defectSetup.labels',
        type: 'sMLTextField',
        placeholder: 'defectSetup.label_placeholder',
        required: isRequired('labels'),
        patchEndpoint: 'defect_setup_labels',
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
    console.log('[DefectSetup.toAPI] Starting conversion to API format', { method });
    
    // Base object with common fields
    const baseFields = {
      code: this.code,
      metadata: this.metadata,
      labels: this.labels,
    };
    
    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[DefectSetup.toAPI] Processing POST request - returning base fields without system fields');
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
        console.log('[DefectSetup.toAPI] Processing PUT request - returning all fields with uuid');
        return {
          ...baseFields,
          uuid: this.uuid
        };
        
      case 'PATCH':
        console.log('[DefectSetup.toAPI] Processing PATCH request - filtering for modified fields');
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
        console.error('[DefectSetup.toAPI] Unsupported method:', method);
        return null;
    }
  }
}

export default DefectSetup;
