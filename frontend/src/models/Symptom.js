import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Symptom {
  constructor(data = {}) {
    // Identifiant unique du symptôme
    this.uuid = data.uuid || null;
    this.symptom_code = data.symptom_code || '';
    this.libelle = data.libelle || '';
    this.langue = data.langue || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'symptom_code', label: i18n.global.t('symptomsTable.headers.symptomCode') },
      { name: 'libelle', label: i18n.global.t('symptomsTable.headers.symptomLabel') },
      { name: 'langue', label: i18n.global.t('symptomsTable.headers.symptomLanguage') }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des symptômes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'symptom_code', label: t('symptoms.code'), type: 'text' },
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
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'symptoms/:uuid';
    } else {
      return 'symptoms';
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

  static getRenderableFields() {
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Symptom();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      symptom_code: {
        label: 'symptom.code',
        type: 'sTextField',
        placeholder: 'symptom.code_placeholder',
        required: isRequired('symptom_code')
      },
      libelle: {
        label: 'symptom.label',
        type: 'sTextField',
        placeholder: 'symptom.label_placeholder',
        required: isRequired('libelle')
      },
      langue: {
        label: 'symptom.language',
        type: 'sSelectField',
        placeholder: 'symptom.language_placeholder',
        required: isRequired('langue'),
        options: [
          { value: 'fr', label: 'common.french' },
          { value: 'en', label: 'common.english' }
        ],
        fieldName: 'langue',
        mode: 'creation'
      }
    };
  }

  toAPI(method) {
    console.log('[Symptom.toAPI] Starting conversion to API format', { method });
    
    // Base object with common fields
    const baseFields = {
      symptom_code: this.symptom_code,
      libelle: this.libelle,
      langue: this.langue
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
