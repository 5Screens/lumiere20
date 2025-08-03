import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ChangeOptions {
  constructor(data = {}) {
    // Identifiant unique du change option
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.question_id = data.question_id || '';
    this.weight = data.weight || 0;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[ChangeOptions Constructor] data received:', data);
    console.log('[ChangeOptions Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'changeOptions.code' },
      { name: 'labels', label: 'changeOptions.label' },
      { name: 'metadata', label: 'changeOptions.metadata' },
      { name: 'question_id', label: 'changeOptions.question_id' },
      { name: 'weight', label: 'changeOptions.weight' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des change options
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('changeOptions.code'), type: 'text' },
      { key: 'metadata', label: t('changeOptions.metadata'), type: 'text' },
      { key: 'question_id', label: t('changeOptions.question_id'), type: 'text' },
      { key: 'weight', label: t('changeOptions.weight'), type: 'number' },
      { key: 'label', label: t('changeOptions.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les change options
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    
    if (method.toUpperCase() === 'GET') {
      return `change_options?lang=${userProfileStore.language}`;
    }
    
    return 'change_options';
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
    return 'objectCreationsAndUpdates.changeOptionsCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.changeOptionsUpdate';
  }

  /**
   * Récupère un change option par UUID
   * @param {string} uuid - UUID du change option
   * @returns {ChangeOptions} Instance du change option
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`change_options/${uuid}`);
      
      if (response) {
        return new ChangeOptions(response);
      }
      
      throw new Error('Change option not found');
    } catch (error) {
      console.error('Error fetching change option:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode du formulaire ('create' ou 'update')
   * @returns {Array} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    
    const fields = {
      uuid: {
        label: 'changeOptions.uuid',
        type: 'sTextField',
        placeholder: 'changeOptions.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'changeOptions.created_at',
        type: 'sTextField',
        placeholder: 'changeOptions.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'changeOptions.updated_at',
        type: 'sTextField',
        placeholder: 'changeOptions.updated_at_placeholder',
        disabled: true
      },
      code: {
        name: 'code',
        label: 'changeOptions.code',
        type: 'sTextField',
        required: true,
        placeholder: 'changeOptions.code_placeholder',
        maxlength: 50,
        disabled: true
      },
      metadata: {
        name: 'metadata',
        label: 'changeOptions.metadata',
        type: 'sTextField',
        required: false,
        placeholder: 'changeOptions.metadata_placeholder',
        maxlength: 50
      },
      question_id: {
        name: 'question_id',
        label: 'changeOptions.question_id',
        type: 'sTextField',
        required: false,
        placeholder: 'changeOptions.question_id_placeholder',
        maxlength: 100
      },
      weight: {
        name: 'weight',
        label: 'changeOptions.weight',
        type: 'sTextField',
        inputType: 'number',
        required: false,
        placeholder: 'changeOptions.weight_placeholder',
        min: 0
      },
      labels: {
        label: 'changeOptions.labels',
        type: 'sMLTextField',
        placeholder: 'changeOptions.label_placeholder',
        required: false,
        patchEndpoint: 'change_options_labels',
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
      question_id: this.question_id,
      weight: this.weight
    };

    // Pour POST, inclure les labels
    if (method.toUpperCase() === 'POST' && this.labels && this.labels.length > 0) {
      apiData.labels = this.labels.map(label => ({
        label_lang_code: label.label_lang_code,
        label: label.label
      }));
    }

    // Supprimer les champs système pour POST
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'updated_at'];
      fieldsToRemove.forEach(field => {
        delete apiData[field];
      });
    }

    return apiData;
  }

  /**
   * Retourne le composant Vue à utiliser dans la grille
   * @returns {string} Nom du composant
   */
  static get vueComponentToUseInGrid() {
    return 'ObjectsTab';
  }

  /**
   * Retourne le composant Vue à utiliser dans le formulaire
   * @returns {string} Nom du composant
   */
  static get vueComponentToUseInForm() {
    return 'ObjectCreationsAndUpdates';
  }
}

export default ChangeOptions;
