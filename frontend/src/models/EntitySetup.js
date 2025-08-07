import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class EntitySetup {
  constructor(data = {}) {
    // Identifiant unique du entity setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[EntitySetup Constructor] data received:', data);
    console.log('[EntitySetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'entitySetup.code' },
      { name: 'labels', label: 'entitySetup.label' },
      { name: 'metadata', label: 'entitySetup.metadata' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des entity setups
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'metadata', label: t('entitySetup.metadata'), type: 'text' },
      { key: 'label', label: t('entitySetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les entity setups
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const baseUrl = 'entity_setup';
    
    switch (method.toUpperCase()) {
      case 'GET':
      case 'POST':
        return baseUrl;
      case 'PATCH':
      case 'DELETE':
        return baseUrl; // L'UUID sera ajouté dynamiquement
      default:
        return baseUrl;
    }
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet enfant
   */
  static getChildTabLabel() {
    const { t } = i18n.global;
    return t('entitySetup.labels');
  }

  /**
   * Retourne l'identifiant unique pour les entity setups
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
    return t('entitySetup.create');
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    const { t } = i18n.global;
    return t('entitySetup.update');
  }

  /**
   * Récupère un entity setup par UUID
   * @param {string} uuid - UUID du entity setup
   * @returns {EntitySetup} Instance du entity setup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`entity_setup/${uuid}`);
      
      if (response) {
        return new EntitySetup(response);
      }
      
      throw new Error('Entity setup not found');
    } catch (error) {
      console.error('Error fetching entity setup:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode d'affichage ('create' ou 'update')
   * @returns {Array} Configuration des champs du formulaire
   */
  getRenderableFields(mode = 'create') {
    const { t } = i18n.global;
    
    const fields = [
      {
        name: 'code',
        label: t('entitySetup.code'),
        type: 'text',
        required: true,
        placeholder: t('entitySetup.codePlaceholder'),
        maxlength: 50
      },
      {
        name: 'metadata',
        label: t('entitySetup.metadata'),
        type: 'text',
        required: false,
        placeholder: t('entitySetup.metadataPlaceholder'),
        maxlength: 50
      }
    ];

    // En mode création, ajouter les champs de traduction
    if (mode === 'create') {
      fields.push({
        name: 'labels',
        label: t('entitySetup.labels'),
        type: 'multiLangText',
        required: true,
        patchEndpoint: 'entity_setup_labels',
        languages: ['fr', 'en', 'es', 'pt']
      });
    }

    return fields;
  }

  /**
   * Convertit l'instance en format API
   * @param {string} method - Méthode HTTP
   * @returns {Object} Données formatées pour l'API
   */
  toAPI(method = 'POST') {
    const apiData = {
      code: this.code,
      metadata: this.metadata
    };

    // Pour POST, inclure les labels
    if (method.toUpperCase() === 'POST' && this.labels && this.labels.length > 0) {
      apiData.labels = this.labels.map(label => ({
        label_lang_code: label.label_lang_code || label.lang,
        label: label.label
      }));
    }

    // Supprimer les champs système pour POST
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'updated_at'];
      fieldsToRemove.forEach(field => delete apiData[field]);
    }

    return apiData;
  }
}

export default EntitySetup;
