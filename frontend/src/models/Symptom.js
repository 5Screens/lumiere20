import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Symptom {
  constructor(data = {}) {
    // Identifiant unique du symptôme
    this.uuid = data.uuid || null;
    this.symptom_code = data.symptom_code || '';
    this.libelle = data.libelle || '';
    this.langue = data.langue || '';
    this.date_creation = data.date_creation || null;
    this.date_modification = data.date_modification || null;
    
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
      { key: 'uuid', label: t('symptomsTable.headers.id'), type: 'uuid' },
      { key: 'date_creation', label: t('symptomsTable.headers.createdDate'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'date_modification', label: t('symptomsTable.headers.updateDate'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'symptom_code', label: t('symptomsTable.headers.symptomCode'), type: 'text' },
      { key: 'libelle', label: t('symptomsTable.headers.symptomLabel'), type: 'text' },
      { key: 'langue', label: t('symptomsTable.headers.symptomLanguage'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les symptômes
   * @returns {string} Endpoint API
   */
  static getApiEndpoint() {
    return 'symptoms';
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Symptom();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    return {
      symptom_code: {
        label: t('symptom.code'),
        type: 'sTextField',
        placeholder: t('symptom.code_placeholder'),
        required: isRequired('symptom_code')
      },
      libelle: {
        label: t('symptom.label'),
        type: 'sTextField',
        placeholder: t('symptom.label_placeholder'),
        required: isRequired('libelle')
      },
      langue: {
        label: t('symptom.language'),
        type: 'sSelectField',
        placeholder: t('symptom.language_placeholder'),
        required: isRequired('langue'),
        options: [
          { value: 'fr', label: t('common.french') },
          { value: 'en', label: t('common.english') }
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
