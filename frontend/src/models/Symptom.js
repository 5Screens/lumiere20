import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Symptom {
  constructor(data = {}) {
    // Identifiant unique du symptôme
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: i18n.global.t('symptomsTable.headers.symptomCode') },
      { name: 'labels', label: i18n.global.t('symptomsTable.headers.symptomLabel') }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des symptômes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label:  t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('symptoms.code'), type: 'text' },
      { key: 'libelle', label: t('symptoms.name'), type: 'text' },
      { key: 'langue', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les symptômes
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'symptoms';
    } else {
      return `symptoms?lang=${userProfileStore.language}`;
    }
  }

  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'libelle';
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
    return 'objectCreationsAndUpdates.symptomCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.symptomUpdate';
  }

  /**
   * Récupère un symptôme par son UUID
   * @param {string} uuid - L'UUID du symptôme à récupérer
   * @returns {Promise<Symptom>} Une promesse résolue avec l'instance du symptôme
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`symptoms/${uuid}`);
      
      if (response) {
        return new Symptom(response);
      }
      
      throw new Error('Symptom not found');
    } catch (error) {
      console.error('Error fetching symptom:', error);
      throw error;
    }
  }

  static getRenderableFields() {
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Symptom();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      uuid: {
        label: 'symptom.uuid',
        type: 'sTextField',
        placeholder: 'symptom.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'symptom.created_at',
        type: 'sTextField',
        placeholder: 'symptom.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'symptom.updated_at',
        type: 'sTextField',
        placeholder: 'symptom.updated_at_placeholder',
        disabled: true
      },
      code: {
        label: 'symptom.code',
        type: 'sTextField',
        placeholder: 'symptom.code_placeholder',
        required: isRequired('code')
      },
      labels: {
        label: 'symptom.label',
        type: 'sMLTextField',
        placeholder: 'symptom.label_placeholder',
        required: isRequired('libelle'),
      }
    };
  }

  toAPI(method) {
    console.log('[Symptom.toAPI] Starting conversion to API format', { method });
    
    // Base object with common fields
    const baseFields = {
      code: this.code,
      labels: this.labels,
    };
    
    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[Symptom.toAPI] Processing POST request - returning all base fields');
        return baseFields;
        
      case 'PUT':
        console.log('[Symptom.toAPI] Processing PUT request - returning all fields with uuid');
        return {
          ...baseFields,
          uuid: this.uuid
        };
        
      case 'PATCH':
        console.log('[Symptom.toAPI] Processing PATCH request - filtering for modified fields');
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
        console.error('[Symptom.toAPI] Unsupported method:', method);
        return null;
    }
  }
}