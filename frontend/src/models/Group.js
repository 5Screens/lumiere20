import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Group {
  constructor(data = {}) {
    // Identifiant unique du groupe
    this.uuid = data.uuid || null;
    this.group_name = data.group_name || '';
    this.support_level = data.support_level || null;
    this.description = data.description || '';
    this.rel_supervisor = data.rel_supervisor || null;
    this.supervisor_name = data.supervisor_name || '';
    this.rel_manager = data.rel_manager || null;
    this.manager_name = data.manager_name || '';
    this.rel_schedule = data.rel_schedule || null;
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.persons_list = data.persons_list || [];
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'group_name', label: 'groups.group_name' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des groupes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'group_name', label: t('groups.group_name'), type: 'text' },
      { key: 'support_level', label: t('groups.support_level'), type: 'number' },
      { key: 'description', label: t('groups.description'), type: 'text' },
      { key: 'supervisor_name', label: t('groups.supervisor'), type: 'text' },
      { key: 'manager_name', label: t('groups.manager'), type: 'text' },
      { key: 'persons_count', label: t('groups.persons_count'), type: 'number' },
      { key: 'email', label: t('groups.email'), type: 'text' },
      { key: 'phone', label: t('groups.phone'), type: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les groupes
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    return 'groups';
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet
   */
  static getChildTabLabel() {
    return 'group_name';
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
    return 'objectCreationsAndUpdates.groupCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.groupUpdate';
  }

  /**
   * Récupère un groupe par UUID
   * @param {string} uuid - UUID du groupe
   * @returns {Group} Instance du groupe
   */
  static async getById(uuid) {
    try {
      const response = await apiService.get(`groups/${uuid}`);
      
      if (response) {
        return new Group(response);
      }
      
      throw new Error('Group not found');
    } catch (error) {
      console.error('Error fetching group:', error);
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
        label: 'groups.uuid',
        type: 'sTextField',
        placeholder: 'groups.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'groups.created_at',
        type: 'sTextField',
        placeholder: 'groups.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'groups.updated_at',
        type: 'sTextField',
        placeholder: 'groups.updated_at_placeholder',
        disabled: true
      },
      group_name: {
        name: 'group_name',
        label: 'groups.group_name',
        type: 'sTextField',
        required: true,
        placeholder: 'groups.group_name_placeholder',
        maxlength: 255
      },
      support_level: {
        name: 'support_level',
        label: 'groups.support_level',
        type: 'sTextField',
        inputType: 'number',
        required: false,
        placeholder: 'groups.support_level_placeholder',
        min: 0
      },
      description: {
        name: 'description',
        label: 'groups.description',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'groups.description_placeholder'
      },
      rel_supervisor: {
        name: 'rel_supervisor',
        label: 'groups.supervisor',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'groups.supervisor_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'supervisor_name',
        columnsConfig: [
          { key: 'person_name', label: 'person_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'active', label: 'person.active', visible: true }
        ]
      },
      rel_manager: {
        name: 'rel_manager',
        label: 'groups.manager',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'groups.manager_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'manager_name',
        columnsConfig: [
          { key: 'person_name', label: 'person_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'active', label: 'person.active', visible: true }
        ]
      },
      /*rel_schedule: {
        name: 'rel_schedule',
        label: 'groups.schedule',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'groups.schedule_placeholder',
        sourceEndPoint: 'schedules',
        displayedLabel: 'schedule_name',
        valueField: 'uuid'
      },*/
      email: {
        name: 'email',
        label: 'groups.email',
        type: 'sTextField',
        inputType: 'email',
        required: false,
        placeholder: 'groups.email_placeholder',
        maxlength: 255
      },
      phone: {
        name: 'phone',
        label: 'groups.phone',
        type: 'sTextField',
        required: false,
        placeholder: 'groups.phone_placeholder',
        maxlength: 50
      },
      persons_list: {
        label: 'groups.persons_list',
        type: "sPickList",
        helperText: 'groups.persons_list_helper_text',
        placeholder: 'groups.persons_list_placeholder',
        sourceEndPoint: "persons",
        displayedLabel: "person_name",
        targetEndPoint: "groups",
        ressourceEndPoint: 'members',
        fieldName: 'members',
        target_uuid: null,
        pickedItems: null,
        required: false,
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
      group_name: this.group_name,
      support_level: this.support_level,
      description: this.description,
      rel_supervisor: this.rel_supervisor,
      rel_manager: this.rel_manager,
      rel_schedule: this.rel_schedule,
      email: this.email,
      phone: this.phone
    };

    // Ajouter persons_list comme "members" pour l'API (comme dans watch_list -> watchers)
    if (this.persons_list && Array.isArray(this.persons_list)) {
      // Extraire seulement les UUIDs des personnes si c'est un tableau d'objets
      apiData.members = this.persons_list.map(person => 
        typeof person === 'string' ? person : person.person_uuid || person.uuid
      );
    }

    // Supprimer les champs système pour POST
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'updated_at', 'supervisor_name', 'manager_name', 'persons_list'];
      fieldsToRemove.forEach(field => {
        delete apiData[field];
      });
    }

    return apiData;
  }
}

export default Group;
