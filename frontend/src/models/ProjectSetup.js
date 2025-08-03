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
    return t('objectCreationsAndUpdates.projectSetupCreation');
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    const { t } = i18n.global;
    return t('objectCreationsAndUpdates.projectSetupUpdate');
  }

  /**
   * Récupère un project setup par son ID
   * @param {string} uuid - UUID du project setup
   * @returns {Promise<ProjectSetup>} Instance de ProjectSetup
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`project_setup/${uuid}`);
      
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
   * @param {string} mode - Mode d'affichage ('for_creation' ou 'for_edition')
   * @returns {Object} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    
    const fields = {
      uuid: {
        label: 'projectSetup.uuid',
        type: 'sTextField',
        placeholder: 'projectSetup.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'projectSetup.created_at',
        type: 'sTextField',
        placeholder: 'projectSetup.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'projectSetup.updated_at',
        type: 'sTextField',
        placeholder: 'projectSetup.updated_at_placeholder',
        disabled: true
      },
      code: {
        name: 'code',
        label: 'projectSetup.code',
        type: 'sTextField',
        required: true,
        placeholder: 'projectSetup.code_placeholder',
        maxlength: 50
      },
      metadata: {
        name: 'metadata',
        label: 'projectSetup.metadata',
        type: 'sTextField',
        required: false,
        placeholder: 'projectSetup.metadata_placeholder',
        maxlength: 50
      },
      labels: {
        label: 'projectSetup.labels',
        type: 'sMLTextField',
        placeholder: 'projectSetup.label_placeholder',
        required: false,
        patchEndpoint: 'project_setup_label',
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
