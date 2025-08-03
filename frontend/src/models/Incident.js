import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '@/services/apiService'

export class Incident {
  /**
   * Retourne les colonnes pour l'affichage dans le tableau des incidents
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('incident.title'), type: 'text', format: 'text' },
      { key: 'description', label: t('incident.description'), type: 'text', format: 'html' },
      { key: 'ticket_type_label', label: t('configuration.ticketTypes'), type: 'text', format: 'text' },
      { key: 'ticket_status_label', label: t('incident.status'), type: 'text', format: 'text' },
      { key: 'configuration_item_name', label: t('incident.configuration_item'), type: 'text', format: 'text' },
      { key: 'symptoms_name', label: t('incident.symptoms'), type: 'text', format: 'text' },
      { key: 'impact_label', label: t('incident.impact'), type: 'text', format: 'text' },
      { key: 'urgency_label', label: t('incident.urgency'), type: 'text', format: 'text' },
      { key: 'priority', label: t('incident.priority'), type: 'text', format: 'text' },
      { key: 'requested_by_name', label: t('incident.requested_by'), type: 'text', format: 'text' },
      { key: 'contact_type_label', label: t('incident.contact_type'), type: 'text', format: 'text' },
      { key: 'requested_for_name', label: t('incident.requested_for'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('incident.assigned_group'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('incident.assigned_to'), type: 'text', format: 'text' },
      { key: 'cause_code_label', label: t('incident.cause_code'), type: 'text', format: 'text' },
      { key: 'rel_service_name', label: t('incident.service'), type: 'text', format: 'text' },
      { key: 'rel_service_offerings_name', label: t('incident.service_offerings'), type: 'text', format: 'text' },
      { key: 'resolution_code_label', label: t('incident.resolution_code'), type: 'text', format: 'text' },
      { key: 'resolution_notes', label: t('incident.resolution_notes'), type: 'text', format: 'html' },
      { key: 'rel_change_request_title', label: t('incident.change_request'), type: 'text', format: 'text' },
      { key: 'rel_problem_title', label: t('incident.problem_id'), type: 'text', format: 'text' },
      { key: 'reopen_count', label: t('incident.reopen_count'), type: 'text', format: 'text' },
      { key: 'standby_count', label: t('incident.standby_count'), type: 'text', format: 'text' },
      { key: 'assignment_count', label: t('incident.assignment_count'), type: 'text', format: 'text' },
      { key: 'assignment_to_count', label: t('incident.assignment_to_count'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les tickets de type INCIDENT
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'tickets';
    } else {
      return `tickets?ticket_type=INCIDENT&lang=${userProfileStore.language}`;
    }
  }

  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'title';
  }

  /**
   * Retourne le nom du champ à utiliser comme identifiant unique
   * @returns {string} Le nom du champ
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne la clé de traduction pour le titre de création
   * @returns {string} La clé de traduction
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.incidentCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.incidentUpdate';
  }
  
  constructor(data = {}) {
    this.uuid = data.uuid || null;
    this.ticket_type_code = data.ticket_type_code || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.requested_by_uuid = data.requested_by_uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.writer_uuid = data.writer_uuid || null;
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    
    // Names for display
    this.requested_by_name = data.requested_by_name || '';
    this.requested_for_name = data.requested_for_name || '';
    this.assigned_group_name = data.assigned_group_name || '';
    this.assigned_person_name = data.assigned_person_name || '';
    this.configuration_item_name = data.configuration_item_name || '';
    this.rel_service_name = data.rel_service_name || '';
    this.rel_service_offerings_name = data.rel_service_offerings_name || '';
    this.rel_problem_title = data.rel_problem_title || '';
    this.rel_change_request_title = data.rel_change_request_title || '';
    this.writer_name = data.writer_name || '';

    // Assignment and watching
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    this.watch_list = data.watch_list || [];

    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'ticket_status_code', label: i18n.global.t('incident.status') },
      { name: 'title', label: i18n.global.t('incident.title') },
      { name: 'description', label: i18n.global.t('incident.description') },
      { name: 'requested_by_uuid', label: i18n.global.t('incident.requested_by') },
      { name: 'requested_for_uuid', label: i18n.global.t('incident.requested_for') },
      { name: 'impact', label: i18n.global.t('incident.impact') },
      { name: 'urgency', label: i18n.global.t('incident.urgency') },
      { name: 'priority', label: i18n.global.t('incident.priority') },
      { name: 'assigned_to_group', label: i18n.global.t('incident.assigned_group') },
      { name: 'symptoms_uuid', label: i18n.global.t('incident.symptoms') }
    ];

    // Impact and priority
    this.impact = data.impact || null;
    this.urgency = data.urgency || null;
    this.priority = data.priority || null;
    this.rel_service = data.rel_service || null;
    this.rel_service_offerings = data.rel_service_offerings || [];
    this.contact_type = data.contact_type || null;

    // Resolution information
    this.resolution_notes = data.resolution_notes || '';
    this.resolution_code = data.resolution_code || null;
    this.cause_code = data.cause_code || null;
    this.rel_problem_id = data.rel_problem_id || null;
    this.rel_change_request = data.rel_change_request || null;

    // SLA and timing
    this.sla_pickup_due_at = data.sla_pickup_due_at || null;
    this.assigned_to_at = data.assigned_to_at || null;
    this.sla_resolution_due_at = data.sla_resolution_due_at || null;
    this.resolved_at = data.resolved_at || null;

    // Counters
    this.reopen_count = data.reopen_count || 0;
    this.assignment_count = data.assignment_count || 0;
    this.assignment_to_count = data.assignment_to_count || 0;
    this.standby_count = data.standby_count || 0;

    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.closed_at = data.closed_at || null;
  }

  static getRenderableFields(mode = 'for_creation') {
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Incident();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    const fields = {
      uuid: {
        label: 'common.uuid',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      updated_at: {
        label: 'common.modification_date',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      ticket_status_code: {
        label: 'incident.status',
        type: 'sSelectField',
        placeholder: 'incident.status_placeholder',
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=INCIDENT`,
        patchEndpoint: 'incidents',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        label: 'incident.title',
        type: 'sTextField',
        placeholder: 'incident.title_placeholder',
        required: isRequired('title')
      },
      description: {
        label: 'incident.description',
        type: 'sRichTextEditor',
        placeholder: 'incident.description_placeholder',
        required: isRequired('description')
      },
      created_at: {
        label: 'common.creation_date',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      writer_name: {
        label: 'common.writer_name',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      requested_by_uuid: {
        label: 'incident.requested_by',
        type: 'sFilteredSearchField',
        placeholder: 'incident.requested_by_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'email', label: 'person.email', visible: true }
        ],
        displayFieldAtInitInEditMode: 'requested_by_name',
        required: isRequired('requested_by_uuid')
      },
      requested_for_uuid: {
        label: 'incident.requested_for',
        type: 'sFilteredSearchField',
        placeholder: 'incident.requested_for_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'email', label: 'person.email', visible: true }
        ],
        displayFieldAtInitInEditMode: 'requested_for_name',
        required: isRequired('requested_for_uuid')
      },
      configuration_item_uuid: {
        label: 'incident.configuration_item',
        type: 'sFilteredSearchField',
        placeholder: 'incident.configuration_item_placeholder',
        endpoint: 'configuration_items',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: 'configuration_item.name', visible: true },
          { key: 'description', label: 'configuration_item.description', visible: true }
        ],
        displayFieldAtInitInEditMode: 'configuration_item_name',
        required: isRequired('configuration_item_uuid')
      },
      symptoms_uuid: {
        label: 'incident.symptoms',
        type: 'sSelectField',
        placeholder: 'incident.symptoms_placeholder',
        required: isRequired('symptoms_uuid'),
        endpoint: `symptoms?lang=${userProfileStore.language}&toSelect=yes`,
        displayField: 'libelle',
        valueField: 'uuid',
        visible: true,
      },
      assigned_to_group: {
        label: 'incident.assigned_group',
        type: 'sFilteredSearchField',
        placeholder: 'incident.assigned_group_placeholder',
        endpoint: ({ assigned_to_person }) => 
          assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'group_name', label: 'group.name', visible: true }
        ],
        displayFieldAtInitInEditMode: 'assigned_group_name',
        required: isRequired('assigned_to_group'),
        resetable: true
      },
      assigned_to_person: {
        label: 'incident.assigned_to',
        type: 'sFilteredSearchField',
        placeholder: 'incident.assigned_to_placeholder',
        endpoint: ({ assigned_to_group }) => 
          assigned_to_group 
          ? `groups/${assigned_to_group}/members` 
          : 'groups/members',
        displayField: 'person_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true }
        ],
        displayFieldAtInitInEditMode: 'assigned_person_name',
        required: isRequired('assigned_to_person'),
        resetable: true
      },
      watch_list: {
        label: 'incident.watch_list',
        type: "sPickList",
        helperText: 'incident.watch_list_helper_text',
        placeholder: 'incident.watch_list_placeholder',
        sourceEndPoint: "persons",
        displayedLabel: "person_name",
        targetEndPoint: "tickets",
        ressourceEndPoint: 'watchers',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('watch_list'),
      },
      impact: {
        label: 'incident.impact',
        type: 'sSelectField',
        placeholder: 'incident.impact_placeholder',
        required: isRequired('impact'),
        endpoint: `incident_impacts?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'impact',
        patchEndpoint: 'incidents',
        mode: 'creation'
      },
      urgency: {
        label: 'incident.urgency',
        type: 'sSelectField',
        placeholder: 'incident.urgency_placeholder',
        required: isRequired('urgency'),
        endpoint: `incident_urgencies?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'urgency',
        patchEndpoint: 'incidents',
        mode: 'creation'
      },
      priority: {
        label: 'incident.priority',
        type: 'sSelectField',
        placeholder: 'incident.priority_placeholder',
        endpoint: ({ impact, urgency }) => 
          impact && urgency 
            ? `incident_priorities?incident_impacts=${impact}&incident_urgencies=${urgency}` 
            : null  ,
        fieldName: 'priority',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('priority')
      },
      rel_service: {
        label: 'incident.service',
        type: 'sFilteredSearchField',
        placeholder: 'incident.service_placeholder',
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: 'service.name', visible: true },
          { key: 'description', label: 'service.description', visible: false },
          { key: 'business_criticality', label: 'service.business_criticality', visible: false },
          { key: 'lifecycle_status', label: 'service.lifecycle_status', visible: false },
          { key: 'version', label: 'service.version', visible: false },
          { key: 'operational', label: 'service.operational', visible: false },
          { key: 'legal_regulatory', label: 'service.legal_regulatory', visible: false },
          { key: 'reputational', label: 'service.reputational', visible: false },
          { key: 'financial', label: 'service.financial', visible: false }, 
          { key: 'comments', label: 'service.comments', visible: false },
          { key: 'created_at', label: 'service.created_at', visible: false },
          { key: 'updated_at', label: 'service.updated_at', visible: false },
          { key: 'owning_entity_name', label: 'service.owning_entity_name', visible: true },
          { key: 'owned_by_name', label: 'service.owned_by_name', visible: true },
          { key: 'managed_by_name', label: 'service.managed_by_name', visible: false },
          { key: 'cab_name', label: 'service.cab_name', visible: false },
          { key: 'parent_service_name', label: 'service.parent_service_name', visible: false }
        ],
        displayFieldAtInitInEditMode: 'rel_service_name',
        required: isRequired('rel_service')
      },
      rel_service_offerings: {
        label: 'incident.service_offerings',
        type: 'sFilteredSearchField',
        placeholder: 'incident.service_offerings_placeholder',
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: 'service_offering.name', visible: true },
          { key: 'description', label: 'service_offering.description', visible: false },
          { key: 'start_date', label: 'service_offering.start_date', visible: false },
          { key: 'end_date', label: 'service_offering.end_date', visible: false },
          { key: 'business_criticality', label: 'service_offering.business_criticality', visible: false },
          { key: 'environment', label: 'service_offering.environment', visible: false },
          { key: 'price_model', label: 'service_offering.price_model', visible: false },
          { key: 'currency', label: 'service_offering.currency', visible: false },
          { key: 'created_at', label: 'service_offering.created_at', visible: false },
          { key: 'updated_at', label: 'service_offering.updated_at', visible: false },
          { key: 'service_name', label: 'service_offering.service_name', visible: true },
          { key: 'operator_entity_name', label: 'service_offering.operator_entity_name', visible: false }
        ],
        displayFieldAtInitInEditMode: 'rel_service_offerings_name',
        required: isRequired('rel_service')
      },
      contact_type: {
        label: 'incident.contact_type',
        type: 'sSelectField',
        placeholder: 'incident.contact_type_placeholder',
        endpoint: `contact_types?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'contact_type',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('contact_type')
      },
      resolution_notes: {
        label: 'incident.resolution_notes',
        type: 'sRichTextEditor',
        placeholder: 'incident.resolution_notes_placeholder',
        required: isRequired('resolution_notes')
      },
      resolution_code: {
        label: 'incident.resolution_code',
        type: 'sSelectField',
        placeholder: 'incident.resolution_code_placeholder',
        endpoint: `incident_resolution_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'resolution_code',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('resolution_code')
      },
      cause_code: {
        label: 'incident.cause_code',
        type: 'sSelectField',
        placeholder: 'incident.cause_code_placeholder',
        endpoint: `incident_cause_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'cause_code',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('cause_code')  
      },
      rel_problem_id: {
        label: 'incident.problem_id',
        type: 'sFilteredSearchField',
        placeholder: 'incident.problem_id_placeholder',
        endpoint: 'tickets?ticket_type=PROBLEM',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: 'problem.title', visible: true },
          { key: 'ticket_status_code', label: 'problem.status', visible: true },
          { key: 'created_at', label: 'problem.created_at', visible: true },
          { key: 'writer_name', label: 'problem.writer_name', visible: false }
        ],
        displayFieldAtInitInEditMode: 'rel_problem_title',
        required: isRequired('rel_problem_id'),
        resetable: true
      },
      rel_change_request: { 
        label: 'incident.change_request',
        type: 'sFilteredSearchField',
        placeholder: 'incident.change_request_placeholder',
        endpoint: 'tickets?ticket_type=CHANGE',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: 'change.title', visible: true },
          { key: 'ticket_status_code', label: 'change.status', visible: true },
          { key: 'created_at', label: 'change.created_at', visible: true },
          { key: 'requested_for_name', label: 'change.requested_for', visible: true  },
          { key: 'writer_name', label: 'change.writer', visible: false }
        ],
        displayFieldAtInitInEditMode: 'rel_change_request_title',
        required: isRequired('rel_change_request'),
        resetable: true
      },
      closed_at: {
        label: 'common.closure_date',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      assignment_count: {
        label: 'incident.assignment_count',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      assignment_to_count: {
        label: 'incident.assignment_to_count',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      standby_count: {
        label: 'incident.standby_count',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      reopen_count: {
        label: 'incident.reopen_count',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      }
    };
    
    // Champs à supprimer en mode création
    if (mode === 'for_creation') {
      delete fields.writer_name;
      delete fields.closed_at;
      delete fields.uuid;
      delete fields.created_at;
      delete fields.updated_at;
      delete fields.assignment_count;
      delete fields.assignment_to_count;
      delete fields.reopen_count;
      delete fields.standby_count;
    }
    
    return fields;
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code
        this.writer_uuid = userProfileStore.id;
        this.ticket_type_code = 'INCIDENT';
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Incident.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Traiter la watch_list pour extraire uniquement les UUIDs si ce sont des objets complets
    if (apiData.watch_list && Array.isArray(apiData.watch_list) && apiData.watch_list.length > 0) {
      if (typeof apiData.watch_list[0] === 'object' && apiData.watch_list[0].uuid) {
        // Si les éléments de la watch_list sont des objets avec un UUID, extraire uniquement les UUIDs
        apiData.watch_list = apiData.watch_list.map(item => item.uuid);
      }
    }
    
    // Supprimer tous les attributs qui sont null, undefined, tableaux vides ou chaînes vides
    Object.keys(apiData).forEach(key => {
      const value = apiData[key];
      if (value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'string' && value.trim() === '')) {
        delete apiData[key];
      }
    });
    
    return apiData;
  }

  /**
   * Récupère un incident par son UUID
   * @param {string} uuid - L'UUID du ticket à récupérer
   * @returns {Promise<Incident>} Une promesse résolue avec l'instance de l'incident
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`tickets/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Incident(response);
      }
      
      throw new Error('Incident not found');
    } catch (error) {
      console.error('Error fetching incident:', error);
      throw error;
    }
  }
}
