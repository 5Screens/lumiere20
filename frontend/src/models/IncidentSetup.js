import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class IncidentSetup {
  constructor(data = {}) {
    // Identifiant unique du incident setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.value = data.value || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[IncidentSetup Constructor] data received:', data);
    console.log('[IncidentSetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'incidentSetup.code' },
      { name: 'labels', label: 'incidentSetup.label' },
      { name: 'metadata', label: 'incidentSetup.metadata' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des incident setups
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'metadata', label: t('incidentSetup.metadata'), type: 'text' },
      { key: 'label', label: t('incidentSetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' },
      { key: 'value', label: t('incidentSetup.value'), type: 'number' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les incident setups
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    const baseEndpoint = 'incident_setup';
    
    if (method.toUpperCase() === 'GET') {
      return `${baseEndpoint}?lang=${userProfileStore.language}`;
    }
    
    return baseEndpoint;
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet
   */
  static getChildTabLabel() {
    const { t } = i18n.global;
    return t('incidentSetup.labels');
  }

  /**
   * Retourne l'identifiant unique pour les incident setups
   * @returns {string} Nom du champ identifiant
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne le titre pour la création
   * @returns {string} Titre de création
   */
  static getCreateTitle() {
    const { t } = i18n.global;
    return t('incidentSetup.create_title');
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    const { t } = i18n.global;
    return t('incidentSetup.update_title');
  }

  /**
   * Récupère un incident setup par son UUID
   * @param {string} uuid - UUID de l'incident setup
   * @returns {Promise<IncidentSetup>} Instance de IncidentSetup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`incident_setup/${uuid}`);
      
      if (response) {
        return new IncidentSetup(response);
      }
      
      throw new Error('Incident setup not found');
    } catch (error) {
      console.error('Error fetching incident setup:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode d'affichage ('for_creation' ou 'for_update')
   * @returns {Object} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new IncidentSetup();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    const fields = {
      uuid: {
        label: 'incidentSetup.uuid',
        type: 'sTextField',
        placeholder: 'incidentSetup.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'incidentSetup.created_at',
        type: 'sTextField',
        placeholder: 'incidentSetup.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'incidentSetup.updated_at',
        type: 'sTextField',
        placeholder: 'incidentSetup.updated_at_placeholder',
        disabled: true
      },
      code: {
        label: 'incidentSetup.code',
        type: 'sTextField',
        placeholder: 'incidentSetup.code_placeholder',
        required: isRequired('code')
      },
      metadata: {
        label: 'incidentSetup.metadata',
        type: 'sTextField',
        placeholder: 'incidentSetup.metadata_placeholder',
        required: isRequired('metadata'),
        //disabled = true si mode edition sinon enabled
        disabled: mode === 'for_edition'
      },
      value: {
        label: 'incidentSetup.value',
        type: 'sTextField',
        placeholder: 'incidentSetup.value_placeholder',
        required: false,
        inputType: 'number'
      },
      labels: {
        label: 'incidentSetup.labels',
        type: 'sMLTextField',
        placeholder: 'incidentSetup.label_placeholder',
        required: isRequired('labels'),
        patchEndpoint: 'incident_setup_labels'
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

  /**
   * Convertit l'objet en format API
   * @param {string} method - Méthode HTTP
   * @returns {Object} Données formatées pour l'API
   */
  toAPI(method = 'POST') {
    const apiData = {
      code: this.code,
      metadata: this.metadata,
      value: this.value
    };

    // Pour POST, inclure les labels
    if (method.toUpperCase() === 'POST' && this.labels && this.labels.length > 0) {
      apiData.labels = this.labels.map(label => ({
        label_lang_code: label.lang_code || label.label_lang_code,
        label: label.label
      }));
    }

    // Pour les méthodes autres que POST, supprimer les champs système
    if (method.toUpperCase() !== 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'updated_at', 'labels'];
      fieldsToRemove.forEach(field => {
        if (apiData.hasOwnProperty(field)) {
          delete apiData[field];
        }
      });
    }

    return apiData;
  }
}

export default IncidentSetup;
