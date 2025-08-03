import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ChangeSetup {
  constructor(data = {}) {
    // Identifiant unique du change setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[ChangeSetup Constructor] data received:', data);
    console.log('[ChangeSetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'changeSetup.code' },
      { name: 'labels', label: 'changeSetup.label' },
      { name: 'metadata', label: 'changeSetup.metadata' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des change setup
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'metadata', label: t('changeSetup.metadata'), type: 'text' },
      { key: 'label', label: t('changeSetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },

    ];
  }

  /**
   * Retourne l'endpoint API pour les change setup
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    
    if (method.toUpperCase() === 'GET') {
      return `change_setup?lang=${userProfileStore.language}`;
    }
    
    return 'change_setup';
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet
   */
  static getChildTabLabel() {
    return 'label';
  }

  /**
   * Retourne l'identifiant unique pour les comparaisons
   * @returns {string} Identifiant unique
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne le titre pour la création
   * @returns {string} Titre de création
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.changeSetupCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.changeSetupUpdate';
  }

  /**
   * Récupère un change setup par UUID
   * @param {string} uuid - UUID du change setup
   * @returns {ChangeSetup} Instance du change setup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`change_setup/${uuid}`);
      
      if (response) {
        return new ChangeSetup(response);
      }
      
      throw new Error('Change setup not found');
    } catch (error) {
      console.error('Error fetching change setup:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode du formulaire (create ou update)
   * @returns {Array} Tableau des champs du formulaire
   */
  static getRenderableFields(mode = 'create') {
    const { t } = i18n.global;
    
    const fields = {
      uuid: {
        label: 'common.uuid',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      created_at: {
        label: 'common.creation_date',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      updated_at: {
        label: 'common.modification_date',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      code: {
        name: 'code',
        label: t('changeSetup.code'),
        type: 'sTextField',
        required: true,
        placeholder: t('changeSetup.codePlaceholder'),
        maxLength: 50
      },
      metadata: {
        name: 'metadata',
        label: t('changeSetup.metadata'),
        type: 'sTextField',
        required: false,
        placeholder: t('changeSetup.metadataPlaceholder'),
        maxLength: 50
      },
      labels: {
        name: 'labels',
        label: t('changeSetup.labels'),
        type: 'sMLTextField',
        required: true,
        patchEndpoint: 'change_setup_label'
      }
    };

    return fields;
  }

  /**
   * Convertit l'objet en format API
   * @param {string} method - Méthode HTTP (POST, PATCH, etc.)
   * @returns {Object} Objet formaté pour l'API
   */
  toAPI(method = 'POST') {
    const apiData = {
      code: this.code,
      metadata: this.metadata
    };

    // Pour POST, inclure les labels
    if (method.toUpperCase() === 'POST' && this.labels && this.labels.length > 0) {
      apiData.labels = this.labels.map(label => ({
        label_lang_code: label.label_lang_code,
        label: label.label
      }));
    }

    // Supprimer les champs système selon la méthode
    const fieldsToRemove = ['uuid', 'created_at', 'updated_at'];
    if (method.toUpperCase() === 'POST') {
      fieldsToRemove.push('labels'); // Les labels sont gérés séparément dans apiData.labels
    }

    fieldsToRemove.forEach(field => {
      if (field !== 'labels' || method.toUpperCase() !== 'POST') {
        delete apiData[field];
      }
    });

    return apiData;
  }
}

export default ChangeSetup;
