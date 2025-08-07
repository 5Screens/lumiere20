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
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'entity_setup';
    } else {
      return `entity_setup?lang=${userProfileStore.language}`;
    }
  }

  /**
   * Retourne le nom de la propriété à utiliser comme label pour l'onglet enfant
   * @returns {string} Nom de la propriété pour le label
   */
  static getChildTabLabel() {
    return 'label'; // Utilise la propriété 'label' des données
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
    return 'objectCreationsAndUpdates.entitySetupCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.entitySetupUpdate';
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
   * @param {string} mode - Mode d'affichage ('for_creation' ou 'for_update')
   * @returns {Object} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new EntitySetup();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);
    
    const fields = {
      uuid: {
        label: 'entitySetup.uuid',
        type: 'sTextField',
        placeholder: 'entitySetup.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'entitySetup.created_at',
        type: 'sTextField',
        placeholder: 'entitySetup.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'entitySetup.updated_at',
        type: 'sTextField',
        placeholder: 'entitySetup.updated_at_placeholder',
        disabled: true
      },
      code: {
        label: 'entitySetup.code',
        type: 'sTextField',
        placeholder: 'entitySetup.code_placeholder',
        required: isRequired('code')
      },
      metadata: {
        label: 'entitySetup.metadata',
        type: 'sTextField',
        placeholder: 'entitySetup.metadata_placeholder',
        required: false,
        //disabled = true si mode edition sinon enabled
        disabled: mode === 'for_edition'
      },
      labels: {
        label: 'entitySetup.labels',
        type: 'sMLTextField',
        placeholder: 'entitySetup.label_placeholder',
        required: isRequired('labels'),
        patchEndpoint: 'entity_setup_labels'
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
