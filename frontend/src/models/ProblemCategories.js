import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ProblemCategories {
  constructor(data = {}) {
    // Identifiant unique de la problem category
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[ProblemCategories Constructor] data received:', data);
    console.log('[ProblemCategories Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'problemCategories.code' },
      { name: 'labels', label: 'problemCategories.label' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des problem categories
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'code', label: t('problemCategories.code'), type: 'text' },
      { key: 'label', label: t('problemCategories.label'), type: 'text' },
      { key: 'lang', label: t('problemCategories.lang'), type: 'text' },
      { key: 'created_at', label: t('common.created_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les problem categories
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    
    if (method.toUpperCase() === 'GET') {
      return `problem_categories?lang=${userProfileStore.language}`;
    }
    
    return 'problem_categories';
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
    return 'objectCreationsAndUpdates.problemCategoriesCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.problemCategoriesUpdate';
  }

  /**
   * Récupère une problem category par UUID
   * @param {string} uuid - UUID de la problem category
   * @returns {ProblemCategories} Instance de la problem category
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`problem_categories/${uuid}`);
      
      if (response) {
        return new ProblemCategories(response);
      }
      
      throw new Error('Problem category not found');
    } catch (error) {
      console.error('Error fetching problem category:', error);
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
        label: 'problemCategories.uuid',
        type: 'sTextField',
        placeholder: 'problemCategories.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'problemCategories.created_at',
        type: 'sTextField',
        placeholder: 'problemCategories.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'problemCategories.updated_at',
        type: 'sTextField',
        placeholder: 'problemCategories.updated_at_placeholder',
        disabled: true
      },
      code: {
        name: 'code',
        label: 'problemCategories.code',
        type: 'sTextField',
        required: true,
        placeholder: 'problemCategories.code_placeholder',
        maxlength: 50,
        disabled: false
      },
      labels: {
        label: 'problemCategories.labels',
        type: 'sMLTextField',
        placeholder: 'problemCategories.label_placeholder',
        required: false,
        patchEndpoint: 'problem_categories_labels',
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
      code: this.code
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
}

export default ProblemCategories;
