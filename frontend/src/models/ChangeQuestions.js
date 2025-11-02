import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ChangeQuestions {
  constructor(data = {}) {
    // Identifiant unique du change question
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.question_id = data.question_id || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[ChangeQuestions Constructor] data received:', data);
    console.log('[ChangeQuestions Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'changeQuestions.code' },
      { name: 'labels', label: 'changeQuestions.label' },
      { name: 'metadata', label: 'changeQuestions.metadata' },
      { name: 'question_id', label: 'changeQuestions.question_id' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des change questions
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'metadata', label: t('changeQuestions.metadata'), type: 'text' },
      { key: 'label', label: t('changeQuestions.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' },
      { key: 'created_at', label: t('common.created_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), type: 'date', format: 'YYYY-MM-DD' },

    ];
  }

  /**
   * Retourne l'endpoint API pour les change questions
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    
    if (method.toUpperCase() === 'GET') {
      return `change_questions?lang=${userProfileStore.language}`;
    }
    
    return 'change_questions';
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
    return 'objectCreationsAndUpdates.changeQuestionsCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.changeQuestionsUpdate';
  }

  /**
   * Récupère un change question par UUID
   * @param {string} uuid - UUID du change question
   * @returns {ChangeQuestions} Instance du change question
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`change_questions/${uuid}`);
      
      if (response) {
        return new ChangeQuestions(response);
      }
      
      throw new Error('Change question not found');
    } catch (error) {
      console.error('Error fetching change question:', error);
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
        label: 'changeQuestions.uuid',
        type: 'sTextField',
        placeholder: 'changeQuestions.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'changeQuestions.created_at',
        type: 'sTextField',
        placeholder: 'changeQuestions.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'changeQuestions.updated_at',
        type: 'sTextField',
        placeholder: 'changeQuestions.updated_at_placeholder',
        disabled: true
      },
      code: {
        name: 'code',
        label: 'changeQuestions.code',
        type: 'sTextField',
        required: true,
        placeholder: 'changeQuestions.code_placeholder',
        maxlength: 50,
        disabled: true
      },
      metadata: {
        name: 'metadata',
        label: 'changeQuestions.metadata',
        type: 'sTextField',
        required: false,
        placeholder: 'changeQuestions.metadata_placeholder',
        maxlength: 50,
        disabled: true
      },
      question_id: {
        name: 'question_id',
        label: 'changeQuestions.question_id',
        type: 'sTextField',
        required: false,
        placeholder: 'changeQuestions.question_id_placeholder',
        maxlength: 100,
        disabled: true
      },
      labels: {
        label: 'changeQuestions.labels',
        type: 'sMLTextField',
        placeholder: 'changeQuestions.label_placeholder',
        required: false,
        patchEndpoint: 'change_questions_labels',
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
      question_id: this.question_id
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

export default ChangeQuestions;
