import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class ProjectSetup {
  constructor(data = {}) {
    // Identifiant unique du project setup
    this.uuid = data.uuid || null;
    this.code = data.code || '';
    this.metadata = data.metadata || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.labels = data.labels || [];
    
    // Debug logs pour vérifier les labels
    console.log('[ProjectSetup Constructor] data received:', data);
    console.log('[ProjectSetup Constructor] labels assigned:', this.labels);
    
    // Ajouter code dans un attribut parent_code pour chacun des item de labels
    this.labels.forEach(label => {
      label.parent_code = this.code;
    });
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'code', label: 'projectSetup.code' },
      { name: 'labels', label: 'projectSetup.label' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des project setup
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'code', label: t('projectSetup.code'), type: 'text' },
      { key: 'metadata', label: t('projectSetup.metadata'), type: 'text' },
      { key: 'label', label: t('projectSetup.label'), type: 'text' },
      { key: 'lang', label: t('language.title'), type: 'text' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les project setup
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    const userProfileStore = useUserProfileStore();
    const lang = userProfileStore.language;
    
    if (method.toUpperCase() === 'GET') {
      return `project_setup?lang=${lang}`;
    }
    
    return 'project_setup';
  }

  /**
   * Retourne le nom du champ à utiliser pour le label de l'onglet enfant
   * @returns {string} Nom du champ
   */
  static getChildTabLabel() {
    return 'code';
  }

  /**
   * Retourne l'identifiant unique pour ce type d'objet
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
    const { t } = i18n.global;
    return t('projectSetup.create');
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    const { t } = i18n.global;
    return t('projectSetup.update');
  }

  /**
   * Récupère un project setup par son ID
   * @param {string} uuid - UUID du project setup
   * @returns {Promise<ProjectSetup>} Instance de ProjectSetup
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`project_setup/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new ProjectSetup(response);
      }
      
      throw new Error('Project setup not found');
    } catch (error) {
      console.error('Error fetching project setup:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @returns {Array} Configuration des champs du formulaire
   */
  getRenderableFields() {
    const { t } = i18n.global;
    
    return [
      {
        name: 'code',
        label: t('projectSetup.code'),
        type: 'sTextField',
        required: true,
        placeholder: t('projectSetup.code_placeholder'),
        maxlength: 50
      },
      {
        name: 'metadata',
        label: t('projectSetup.metadata'),
        type: 'sTextField',
        required: false,
        placeholder: t('projectSetup.metadata_placeholder'),
        maxlength: 50
      },
      {
        name: 'labels',
        label: t('projectSetup.labels'),
        type: 'sPickList',
        required: false,
        sourceEndPoint: 'project_setup_label',
        targetEndPoint: 'project_setup_label',
        target_uuid: this.uuid,
        displayedLabel: 'label',
        patchEndpoint: 'project_setup_label'
      }
    ];
  }

  /**
   * Convertit l'objet en format API pour l'envoi
   * @param {string} method - Méthode HTTP (POST, PATCH, etc.)
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

    // Supprimer les champs système pour les requêtes API
    const fieldsToRemove = ['uuid', 'created_at', 'updated_at'];
    if (method.toUpperCase() !== 'POST') {
      fieldsToRemove.push('labels');
    }

    fieldsToRemove.forEach(field => {
      delete apiData[field];
    });

    return apiData;
  }
}

export default ProjectSetup;
