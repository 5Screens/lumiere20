import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Person {
  constructor(data = {}) {
    // Identifiant unique de la personne
    this.uuid = data.uuid || null;
    this.first_name = data.first_name || '';
    this.last_name = data.last_name || '';
    this.person_name = data.person_name || '';
    this.job_role = data.job_role || '';
    this.ref_entity_uuid = data.ref_entity_uuid || null;
    this.ref_entity_name = data.ref_entity_name || '';
    this.password = data.password || '';
    this.password_needs_reset = data.password_needs_reset || false;
    this.locked_out = data.locked_out || false;
    this.active = data.active !== undefined ? data.active : true;
    this.critical_user = data.critical_user || false;
    this.external_user = data.external_user || false;
    this.date_format = data.date_format || '';
    this.internal_id = data.internal_id || '';
    this.email = data.email || '';
    this.notification = data.notification !== undefined ? data.notification : true;
    this.time_zone = data.time_zone || '';
    this.ref_location_uuid = data.ref_location_uuid || null;
    this.ref_location_name = data.ref_location_name || '';
    this.ref_location_city = data.ref_location_city || '';
    this.ref_location_country = data.ref_location_country || '';
    this.floor = data.floor || '';
    this.room = data.room || '';
    this.ref_approving_manager_uuid = data.ref_approving_manager_uuid || null;
    this.approving_manager_name = data.approving_manager_name || '';
    this.business_phone = data.business_phone || '';
    this.business_mobile_phone = data.business_mobile_phone || '';
    this.personal_mobile_phone = data.personal_mobile_phone || '';
    this.language = data.language || '';
    this.roles = data.roles || null;
    this.photo = data.photo || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Compteurs
    this.raised_tickets_count = data.raised_tickets_count || 0;
    this.member_of_group_count = data.member_of_group_count || 0;
    this.assigned_tickets_count = data.assigned_tickets_count || 0;
    this.watched_tickets_count = data.watched_tickets_count || 0;
    this.budget_approver_count = data.budget_approver_count || 0;
    
    // Listes d'objets liés
    this.raised_tickets_list = data.raised_tickets_list || [];
    this.member_of_group_list = data.member_of_group_list || [];
    this.assigned_tickets_list = data.assigned_tickets_list || [];
    this.watched_tickets_list = data.watched_tickets_list || [];
    this.budget_approver_list = data.budget_approver_list || [];
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'first_name', label: 'persons.first_name' },
      { name: 'last_name', label: 'persons.last_name' },
      { name: 'email', label: 'persons.email' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des personnes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'person_name', label: t('persons.person_name'), type: 'text' },
      { key: 'internal_id', label: t('persons.internal_id'), type: 'text' },
      { key: 'job_role', label: t('persons.job_role'), type: 'text' },
      { key: 'ref_entity_name', label: t('persons.entity'), type: 'text' },
      { key: 'email', label: t('persons.email'), type: 'text' },
      { key: 'business_phone', label: t('persons.business_phone'), type: 'text' },
      { key: 'business_mobile_phone', label: t('persons.business_mobile_phone'), type: 'text' },
      { key: 'personal_mobile_phone', label: t('persons.personal_mobile_phone'), type: 'text' },
      { key: 'ref_location_name', label: t('persons.location'), type: 'text' },
      { key: 'floor', label: t('persons.floor'), type: 'text' },
      { key: 'room', label: t('persons.room'), type: 'text' },
      { key: 'date_format', label: t('persons.date_format'), type: 'text' },
      { key: 'ref_approving_manager_name', label: t('persons.approving_manager'), type: 'text' },
      { key: 'photo', label: t('persons.photo'), type: 'text' },
      { key: 'active', label: t('persons.active'), type: 'boolean' },
      { key: 'critical_user', label: t('persons.critical_user'), type: 'boolean' },
      { key: 'external_user', label: t('persons.external_user'), type: 'boolean' },
      { key: 'locked_out', label: t('persons.locked_out'), type: 'boolean' },
      { key: 'password_needs_reset', label: t('persons.password_needs_reset'), type: 'boolean' },
      { key: 'notification', label: t('persons.notification'), type: 'boolean' },
      { key: 'time_zone', label: t('persons.time_zone'), type: 'text' },
      { key: 'language', label: t('persons.language'), type: 'text' },
      { key: 'raised_tickets_count', label: t('persons.raised_tickets_count'), type: 'number' },
      { key: 'member_of_group_count', label: t('persons.member_of_group_count'), type: 'number' },
      { key: 'assigned_tickets_count', label: t('persons.assigned_tickets_count'), type: 'number' },
      { key: 'watched_tickets_count', label: t('persons.watched_tickets_count'), type: 'number' },
      { key: 'budget_approver_count', label: t('persons.budget_approver_count'), type: 'number' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les personnes
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @param {Object} options - Options supplémentaires
   * @param {boolean} options.paginated - Si true, retourne l'endpoint paginé
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET', options = {}) {
    if (options.paginated) {
      return 'persons/paginated';
    }
    return 'persons';
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet
   */
  static getChildTabLabel() {
    return 'person_name';
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
    return 'objectCreationsAndUpdates.personCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.personUpdate';
  }

  /**
   * Récupère une personne par UUID
   * @param {string} uuid - UUID de la personne
   * @returns {Person} Instance de la personne
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`persons/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Person(response);
      }
      
      throw new Error('Person not found');
    } catch (error) {
      console.error('Error fetching person:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode du formulaire ('for_creation' ou 'for_update')
   * @returns {Array} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    
    const fields = {
      uuid: {
        label: 'persons.uuid',
        type: 'sTextField',
        placeholder: 'persons.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'persons.created_at',
        type: 'sTextField',
        placeholder: 'persons.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'persons.updated_at',
        type: 'sTextField',
        placeholder: 'persons.updated_at_placeholder',
        disabled: true
      },
      first_name: {
        name: 'first_name',
        label: 'persons.first_name',
        type: 'sTextField',
        required: true,
        placeholder: 'persons.first_name_placeholder',
        maxlength: 100
      },
      last_name: {
        name: 'last_name',
        label: 'persons.last_name',
        type: 'sTextField',
        required: true,
        placeholder: 'persons.last_name_placeholder',
        maxlength: 100
      },
      job_role: {
        name: 'job_role',
        label: 'persons.job_role',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.job_role_placeholder',
        maxlength: 255
      },
      ref_entity_uuid: {
        name: 'ref_entity_uuid',
        label: 'persons.entity',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'persons.entity_placeholder',
        endpoint: 'entities',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'ref_entity_name',
        columnsConfig: [
          { key: 'name', label: 'entities.name', visible: true },
          { key: 'entity_type', label: 'entities.entity_type', visible: true },
          { key: 'is_active', label: 'entities.is_active', visible: true }
        ]
      },
      email: {
        name: 'email',
        label: 'persons.email',
        type: 'sTextField',
        inputType: 'email',
        required: true,
        placeholder: 'persons.email_placeholder',
        maxlength: 255
      },
      password: {
        name: 'password',
        label: 'persons.password',
        type: 'sTextField',
        inputType: 'password',
        required: false,
        placeholder: 'persons.password_placeholder',
        maxlength: 255
      },
      password_needs_reset: {
        name: 'password_needs_reset',
        label: 'persons.password_needs_reset',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.password_needs_reset_placeholder'
      },
      locked_out: {
        name: 'locked_out',
        label: 'persons.locked_out',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.locked_out_placeholder'
      },
      active: {
        name: 'active',
        label: 'persons.active',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.active_placeholder'
      },
      critical_user: {
        name: 'critical_user',
        label: 'persons.critical_user',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.critical_user_placeholder'
      },
      external_user: {
        name: 'external_user',
        label: 'persons.external_user',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.external_user_placeholder'
      },
      date_format: {
        name: 'date_format',
        label: 'persons.date_format',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.date_format_placeholder',
        maxlength: 50
      },
      internal_id: {
        name: 'internal_id',
        label: 'persons.internal_id',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.internal_id_placeholder',
        maxlength: 100
      },
      notification: {
        name: 'notification',
        label: 'persons.notification',
        type: 'sToggleField',
        required: false,
        placeholder: 'persons.notification_placeholder'
      },
      time_zone: {
        name: 'time_zone',
        label: 'persons.time_zone',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.time_zone_placeholder',
        maxlength: 100
      },
      ref_location_uuid: {
        name: 'ref_location_uuid',
        label: 'persons.location',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'persons.location_placeholder',
        endpoint: () => {
          const userProfileStore = useUserProfileStore();
          return `locations?lang=${userProfileStore.language}`;
        },
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'ref_location_name',
        columnsConfig: [
          { key: 'name', label: 'locations.name', visible: true },
          { key: 'city', label: 'locations.city', visible: true },
          { key: 'country', label: 'locations.country', visible: true }
        ],
        // Affichage enrichi avec ville et pays
        displayTemplate: '{name} - {city}, {country}'
      },
      floor: {
        name: 'floor',
        label: 'persons.floor',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.floor_placeholder',
        maxlength: 50
      },
      room: {
        name: 'room',
        label: 'persons.room',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.room_placeholder',
        maxlength: 50
      },
      ref_approving_manager_uuid: {
        name: 'ref_approving_manager_uuid',
        label: 'persons.approving_manager',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'persons.approving_manager_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'approving_manager_name',
        columnsConfig: [
          { key: 'person_name', label: 'persons.person_name', visible: true },
          { key: 'job_role', label: 'persons.job_role', visible: true },
          { key: 'active', label: 'persons.active', visible: true }
        ]
      },
      business_phone: {
        name: 'business_phone',
        label: 'persons.business_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.business_phone_placeholder',
        maxlength: 50
      },
      business_mobile_phone: {
        name: 'business_mobile_phone',
        label: 'persons.business_mobile_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.business_mobile_phone_placeholder',
        maxlength: 50
      },
      personal_mobile_phone: {
        name: 'personal_mobile_phone',
        label: 'persons.personal_mobile_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.personal_mobile_phone_placeholder',
        maxlength: 50
      },
      language: {
        name: 'language',
        label: 'persons.language',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.language_placeholder',
        maxlength: 10
      },
      photo: {
        name: 'photo',
        label: 'persons.photo',
        type: 'sTextField',
        required: false,
        placeholder: 'persons.photo_placeholder'
      },
      /*roles: {
        name: 'roles',
        label: 'persons.roles',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'persons.roles_placeholder',
        helperText: 'persons.roles_helper_text'
      },*/
      // Listes d'objets liés avec sPickList
      member_of_group_list: {
        label: 'persons.member_of_group_list',
        type: "sPickList",
        helperText: 'persons.member_of_group_list_helper_text',
        placeholder: 'persons.member_of_group_list_placeholder',
        sourceEndPoint: "groups",
        displayedLabel: "group_name",
        targetEndPoint: "persons",
        ressourceEndPoint: 'groups',
        fieldName: 'groups',
        target_uuid: null,
        pickedItems: null,
        required: false,
      },
      budget_approver_list: {
        label: 'persons.budget_approver_list',
        type: "sPickList",
        helperText: 'persons.budget_approver_list_helper_text',
        placeholder: 'persons.budget_approver_list_placeholder',
        sourceEndPoint: "entities",
        displayedLabel: "name",
        targetEndPoint: "persons",
        ressourceEndPoint: 'approver-entities',
        fieldName: 'entities_list',
        target_uuid: null,
        pickedItems: null,
        required: false,
      },
      raised_tickets_list: {
        label: 'persons.raised_tickets_list',
        type: "sTableField",
        helperText: 'persons.raised_tickets_list_helper_text',
        required: false,
        columns: [
          { key: 'title', label: 'tickets.title', visible: true },
          { key: 'ticket_type_code', label: 'tickets.type', visible: true, format: 'badge' },
          { key: 'ticket_status_code', label: 'tickets.status', visible: true, format: 'badge' },
          { key: 'created_at', label: 'common.created_at', visible: true, format: 'date' },
          { key: 'writer_name', label: 'tickets.writer', visible: true }
        ],
        itemsPerPage: 5,
        showPagination: true,
        noDataText: 'persons.no_raised_tickets'
      },
      assigned_tickets_list: {
        label: 'persons.assigned_tickets_list',
        type: "sTableField",
        helperText: 'persons.assigned_tickets_list_helper_text',
        required: false,
        columns: [
          { key: 'title', label: 'tickets.title', visible: true },
          { key: 'ticket_type_code', label: 'tickets.type', visible: true, format: 'badge' },
          { key: 'ticket_status_code', label: 'tickets.status', visible: true, format: 'badge' },
          { key: 'assigned_at', label: 'common.assigned_at', visible: true, format: 'date' },
          { key: 'group_name', label: 'groups.name', visible: true }
        ],
        itemsPerPage: 5,
        showPagination: true,
        noDataText: 'persons.no_assigned_tickets'
      },
      watched_tickets_list: {
        label: 'persons.watched_tickets_list',
        type: "sTableField",
        helperText: 'persons.watched_tickets_list_helper_text',
        required: false,
        columns: [
          { key: 'title', label: 'tickets.title', visible: true },
          { key: 'ticket_type_code', label: 'tickets.type', visible: true, format: 'badge' },
          { key: 'ticket_status_code', label: 'tickets.status', visible: true, format: 'badge' },
          { key: 'created_at', label: 'common.created_at', visible: true, format: 'date' },
          { key: 'writer_name', label: 'tickets.writer', visible: true }
        ],
        itemsPerPage: 5,
        showPagination: true,
        noDataText: 'persons.no_watched_tickets'
      }
    }

    // Supprimer les champs système en mode création
    if (mode === 'for_creation') {
      delete fields.uuid;
      delete fields.created_at;
      delete fields.updated_at;
      delete fields.raised_tickets_list;
      delete fields.assigned_tickets_list;
      delete fields.watched_tickets_list;
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
      first_name: this.first_name,
      last_name: this.last_name,
      job_role: this.job_role,
      ref_entity_uuid: this.ref_entity_uuid,
      password: this.password,
      password_needs_reset: this.password_needs_reset,
      locked_out: this.locked_out,
      active: this.active,
      critical_user: this.critical_user,
      external_user: this.external_user,
      date_format: this.date_format,
      internal_id: this.internal_id,
      email: this.email,
      notification: this.notification,
      time_zone: this.time_zone,
      ref_location_uuid: this.ref_location_uuid,
      floor: this.floor,
      room: this.room,
      ref_approving_manager_uuid: this.ref_approving_manager_uuid,
      business_phone: this.business_phone,
      business_mobile_phone: this.business_mobile_phone,
      personal_mobile_phone: this.personal_mobile_phone,
      language: this.language,
      roles: this.roles,
      photo: this.photo
    };

    // Ajouter member_of_group_list comme "groups" pour l'API
    if (this.member_of_group_list && Array.isArray(this.member_of_group_list)) {
      apiData.groups = this.member_of_group_list.map(group => 
        typeof group === 'string' ? group : group.uuid
      );
    }

    // Supprimer les champs système pour POST
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = [
        'uuid', 'created_at', 'updated_at', 'person_name',
        'ref_entity_name', 'ref_location_name', 'ref_location_city', 'ref_location_country',
        'approving_manager_name', 'raised_tickets_count', 'member_of_group_count',
        'assigned_tickets_count', 'watched_tickets_count', 'budget_approver_count',
        'raised_tickets_list', 'member_of_group_list', 'assigned_tickets_list',
        'watched_tickets_list', 'budget_approver_list'
      ];
      fieldsToRemove.forEach(field => {
        delete apiData[field];
      });
    }

    return apiData;
  }
}

export default Person;
