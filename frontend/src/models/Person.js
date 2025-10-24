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
      { name: 'first_name', label: 'person.first_name' },
      { name: 'last_name', label: 'person.last_name' },
      { name: 'email', label: 'person.email' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des personnes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('person.uuid'), type: 'uuid' },
      { key: 'person_name', label: t('person.person_name'), type: 'text', filterKey: 'first_name' },
      { key: 'internal_id', label: t('person.internal_id'), type: 'text' },
      { key: 'job_role', label: t('person.job_role'), type: 'text' },
      { key: 'ref_entity_name', label: t('person.entity'), type: 'text', filterKey: 'ref_entity_uuid' },
      { key: 'email', label: t('person.email'), type: 'text' },
      { key: 'business_phone', label: t('person.business_phone'), type: 'text' },
      { key: 'business_mobile_phone', label: t('person.business_mobile_phone'), type: 'text' },
      { key: 'personal_mobile_phone', label: t('person.personal_mobile_phone'), type: 'text' },
      { key: 'ref_location_name', label: t('person.location'), type: 'text', filterKey: 'ref_location_uuid' },
      { key: 'floor', label: t('person.floor'), type: 'text' },
      { key: 'room', label: t('person.room'), type: 'text' },
      { key: 'date_format', label: t('person.date_format'), type: 'text' },
      { key: 'ref_approving_manager_name', label: t('person.approving_manager'), type: 'text', filterKey: 'ref_approving_manager_uuid' },
      { key: 'photo', label: t('person.photo'), type: 'text' },
      { key: 'active', label: t('person.active'), type: 'boolean' },
      { key: 'critical_user', label: t('person.critical_user'), type: 'boolean' },
      { key: 'external_user', label: t('person.external_user'), type: 'boolean' },
      { key: 'locked_out', label: t('person.locked_out'), type: 'boolean' },
      { key: 'password_needs_reset', label: t('person.password_needs_reset'), type: 'boolean' },
      { key: 'notification', label: t('person.notification'), type: 'boolean' },
      { key: 'time_zone', label: t('person.time_zone'), type: 'text' },
      { key: 'language', label: t('person.language'), type: 'text' },
      { key: 'raised_tickets_count', label: t('person.raised_tickets_count'), type: 'number' },
      { key: 'member_of_group_count', label: t('person.member_of_group_count'), type: 'number' },
      { key: 'assigned_tickets_count', label: t('person.assigned_tickets_count'), type: 'number' },
      { key: 'watched_tickets_count', label: t('person.watched_tickets_count'), type: 'number' },
      { key: 'budget_approver_count', label: t('person.budget_approver_count'), type: 'number' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les personnes
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
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
        label: 'person.uuid',
        type: 'sTextField',
        placeholder: 'person.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'person.created_at',
        type: 'sTextField',
        placeholder: 'person.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'person.updated_at',
        type: 'sTextField',
        placeholder: 'person.updated_at_placeholder',
        disabled: true
      },
      first_name: {
        name: 'first_name',
        label: 'person.first_name',
        type: 'sTextField',
        required: true,
        placeholder: 'person.first_name_placeholder',
        maxlength: 100
      },
      last_name: {
        name: 'last_name',
        label: 'person.last_name',
        type: 'sTextField',
        required: true,
        placeholder: 'person.last_name_placeholder',
        maxlength: 100
      },
      job_role: {
        name: 'job_role',
        label: 'person.job_role',
        type: 'sTextField',
        required: false,
        placeholder: 'person.job_role_placeholder',
        maxlength: 255
      },
      ref_entity_uuid: {
        name: 'ref_entity_uuid',
        label: 'person.entity',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'person.entity_placeholder',
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
        label: 'person.email',
        type: 'sTextField',
        inputType: 'email',
        required: true,
        placeholder: 'person.email_placeholder',
        maxlength: 255
      },
      password: {
        name: 'password',
        label: 'person.password',
        type: 'sTextField',
        inputType: 'password',
        required: false,
        placeholder: 'person.password_placeholder',
        maxlength: 255
      },
      password_needs_reset: {
        name: 'password_needs_reset',
        label: 'person.password_needs_reset',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.password_needs_reset_placeholder'
      },
      locked_out: {
        name: 'locked_out',
        label: 'person.locked_out',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.locked_out_placeholder'
      },
      active: {
        name: 'active',
        label: 'person.active',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.active_placeholder'
      },
      critical_user: {
        name: 'critical_user',
        label: 'person.critical_user',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.critical_user_placeholder'
      },
      external_user: {
        name: 'external_user',
        label: 'person.external_user',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.external_user_placeholder'
      },
      date_format: {
        name: 'date_format',
        label: 'person.date_format',
        type: 'sTextField',
        required: false,
        placeholder: 'person.date_format_placeholder',
        maxlength: 50
      },
      internal_id: {
        name: 'internal_id',
        label: 'person.internal_id',
        type: 'sTextField',
        required: false,
        placeholder: 'person.internal_id_placeholder',
        maxlength: 100
      },
      notification: {
        name: 'notification',
        label: 'person.notification',
        type: 'sToggleField',
        required: false,
        placeholder: 'person.notification_placeholder'
      },
      time_zone: {
        name: 'time_zone',
        label: 'person.time_zone',
        type: 'sTextField',
        required: false,
        placeholder: 'person.time_zone_placeholder',
        maxlength: 100
      },
      ref_location_uuid: {
        name: 'ref_location_uuid',
        label: 'person.location',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'person.location_placeholder',
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
        label: 'person.floor',
        type: 'sTextField',
        required: false,
        placeholder: 'person.floor_placeholder',
        maxlength: 50
      },
      room: {
        name: 'room',
        label: 'person.room',
        type: 'sTextField',
        required: false,
        placeholder: 'person.room_placeholder',
        maxlength: 50
      },
      ref_approving_manager_uuid: {
        name: 'ref_approving_manager_uuid',
        label: 'person.approving_manager',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'person.approving_manager_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'approving_manager_name',
        columnsConfig: [
          { key: 'person_name', label: 'person.person_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'active', label: 'person.active', visible: true }
        ],
        lazySearch: true
      },
      business_phone: {
        name: 'business_phone',
        label: 'person.business_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'person.business_phone_placeholder',
        maxlength: 50
      },
      business_mobile_phone: {
        name: 'business_mobile_phone',
        label: 'person.business_mobile_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'person.business_mobile_phone_placeholder',
        maxlength: 50
      },
      personal_mobile_phone: {
        name: 'personal_mobile_phone',
        label: 'person.personal_mobile_phone',
        type: 'sTextField',
        required: false,
        placeholder: 'person.personal_mobile_phone_placeholder',
        maxlength: 50
      },
      language: {
        name: 'language',
        label: 'person.language',
        type: 'sTextField',
        required: false,
        placeholder: 'person.language_placeholder',
        maxlength: 10
      },
      photo: {
        name: 'photo',
        label: 'person.photo',
        type: 'sTextField',
        required: false,
        placeholder: 'person.photo_placeholder'
      },
      /*roles: {
        name: 'roles',
        label: 'person.roles',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'person.roles_placeholder',
        helperText: 'person.roles_helper_text'
      },*/
      // Listes d'objets liés avec sPickList
      member_of_group_list: {
        label: 'person.member_of_group_list',
        type: "sPickList",
        helperText: 'person.member_of_group_list_helper_text',
        placeholder: 'person.member_of_group_list_placeholder',
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
        label: 'person.budget_approver_list',
        type: "sPickList",
        helperText: 'person.budget_approver_list_helper_text',
        placeholder: 'person.budget_approver_list_placeholder',
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
        label: 'person.raised_tickets_list',
        type: "sTableField",
        helperText: 'person.raised_tickets_list_helper_text',
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
        noDataText: 'person.no_raised_tickets'
      },
      assigned_tickets_list: {
        label: 'person.assigned_tickets_list',
        type: "sTableField",
        helperText: 'person.assigned_tickets_list_helper_text',
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
        noDataText: 'person.no_assigned_tickets'
      },
      watched_tickets_list: {
        label: 'person.watched_tickets_list',
        type: "sTableField",
        helperText: 'person.watched_tickets_list_helper_text',
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
        noDataText: 'person.no_watched_tickets'
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
