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
      { key: 'ticket_type_label', label: t('configuration.ticketTypes'), type: 'text', format: 'text' },
      { key: 'ticket_status_label', label: t('incident.status'), type: 'text', format: 'text' },
      { key: 'configuration_item_uuid', label: t('incident.configuration_item'), type: 'uuid', format: 'text' },
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

    // Assignment and watching
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    this.watch_list = data.watch_list || [];

    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'ticket_status_code', label: i18n.global.t('incident.status') },
      { name: 'title', label: i18n.global.t('incident.title') },
      { name: 'description', label: i18n.global.t('incident.description') },
      { name: 'requested_for_uuid', label: i18n.global.t('incident.requested_for') },
      { name: 'impact', label: i18n.global.t('incident.impact') },
      { name: 'urgency', label: i18n.global.t('incident.urgency') },
      { name: 'assigned_to_group', label: i18n.global.t('incident.assigned_to_group') }
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

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Incident();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      ticket_status_code: {
        label: t('incident.status'),
        type: 'sSelectField',
        placeholder: t('incident.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=INCIDENT`,
        patchEndpoint: 'incidents',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        label: t('incident.title'),
        type: 'sTextField',
        placeholder: t('incident.title_placeholder'),
        required: isRequired('title')
      },
      description: {
        label: t('incident.description'),
        type: 'sRichTextEditor',
        placeholder: t('incident.description_placeholder'),
        required: isRequired('description')
      },
      requested_by_uuid: {
        label: t('incident.requested_by'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.requested_by_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('requested_by_uuid')
      },
      requested_for_uuid: {
        label: t('incident.requested_for'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.requested_for_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
          required: isRequired('requested_for_uuid')
      },
      configuration_item_uuid: {
        label: t('incident.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'nom',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'nom', label: t('configuration_item.nom'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ],
        required: isRequired('configuration_item_uuid')
      },
      assigned_to_group: {
        label: t('incident.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.assigned_group_placeholder'),
        endpoint: ({ assigned_to_person }) => 
          assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'group _name', label: t('group.name'), visible: true }
        ],
        required: isRequired('assigned_to_group')
      },
      assigned_to_person: {
        label: t('incident.assigned_to'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.assigned_to_placeholder'),
        endpoint: ({ assigned_to_group }) => 
          assigned_to_group 
          ? `groups/${assigned_to_group}/members` 
          : 'groups/members',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('assigned_to_person')
      },
      watch_list: {
        label: t('incident.watch_list'),
        type: 'sPickList',
        placeholder: t('incident.watch_list_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'first_name',
        targetEndPoint: 'incidents',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('watch_list')
      },
      impact: {
        label: t('incident.impact'),
        type: 'sSelectField',
        placeholder: t('incident.impact_placeholder'),
        required: isRequired('impact'),
        endpoint: `incident_impacts?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'impact',
        patchEndpoint: 'incidents',
        mode: 'creation'
      },
      urgency: {
        label: t('incident.urgency'),
        type: 'sSelectField',
        placeholder: t('incident.urgency_placeholder'),
        required: isRequired('urgency'),
        endpoint: `incident_urgencies?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'urgency',
        patchEndpoint: 'incidents',
        mode: 'creation'
      },
      priority: {
        label: t('incident.priority'),
        type: 'sSelectField',
        placeholder: t('incident.priority_placeholder'),
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
        label: t('incident.service'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.service_placeholder'),
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service.name'), visible: true },
          { key: 'description', label: t('service.description'), visible: false },
          { key: 'business_criticality', label: t('service.business_criticality'), visible: false },
          { key: 'lifecycle_status', label: t('service.lifecycle_status'), visible: false },
          { key: 'version', label: t('service.version'), visible: false },
          { key: 'operational', label: t('service.operational'), visible: false },
          { key: 'legal_regulatory', label: t('service.legal_regulatory'), visible: false },
          { key: 'reputational', label: t('service.reputational'), visible: false },
          { key: 'financial', label: t('service.financial'), visible: false }, 
          { key: 'comments', label: t('service.comments'), visible: false },
          { key: 'created_at', label: t('service.created_at'), visible: false },
          { key: 'updated_at', label: t('service.updated_at'), visible: false },
          { key: 'owning_entity_name', label: t('service.owning_entity_name'), visible: true },
          { key: 'owned_by_name', label: t('service.owned_by_name'), visible: true },
          { key: 'managed_by_name', label: t('service.managed_by_name'), visible: false },
          { key: 'cab_name', label: t('service.cab_name'), visible: false },
          { key: 'parent_service_name', label: t('service.parent_service_name'), visible: false }
        ],
        required: isRequired('rel_service')
      },
      rel_service_offerings: {
        label: t('incident.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service.name'), visible: true },
          { key: 'description', label: t('service.description'), visible: false },
          { key: 'start_date', label: t('service.start_date'), visible: false },
          { key: 'end_date', label: t('service.end_date'), visible: false },
          { key: 'business_criticality', label: t('service.business_criticality'), visible: false },
          { key: 'environment', label: t('service.environment'), visible: false },
          { key: 'price_model', label: t('service.price_model'), visible: false },
          { key: 'currency', label: t('service.currency'), visible: false },
          { key: 'created_at', label: t('service.created_at'), visible: false },
          { key: 'updated_at', label: t('service.updated_at'), visible: false },
          { key: 'service_name', label: t('service.service_name'), visible: true },
          { key: 'operator_entity_name', label: t('service.operator_entity_name'), visible: false }
        ],
        required: isRequired('rel_service')
      },
      contact_type: {
        label: t('incident.contact_type'),
        type: 'sSelectField',
        placeholder: t('incident.contact_type_placeholder'),
        endpoint: `contact_types?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'contact_type',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('contact_type')
      },
      resolution_notes: {
        label: t('incident.resolution_notes'),
        type: 'sRichTextEditor',
        placeholder: t('incident.resolution_notes_placeholder'),
        required: isRequired('resolution_notes')
      },
      resolution_code: {
        label: t('incident.resolution_code'),
        type: 'sSelectField',
        placeholder: t('incident.resolution_code_placeholder'),
        endpoint: `incident_resolution_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'resolution_code',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('resolution_code')
      },
      cause_code: {
        label: t('incident.cause_code'),
        type: 'sSelectField',
        placeholder: t('incident.cause_code_placeholder'),
        endpoint: `incident_cause_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'cause_code',
        patchEndpoint: 'incidents',
        mode: 'creation',
        required: isRequired('cause_code')  
      },
      rel_problem_id: {
        label: t('incident.problem_id'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.problem_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROBLEM',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: t('ticket.title'), visible: true },
          { key: 'ticket_status_code', label: t('ticket.status'), visible: true },
          { key: 'created_at', label: t('ticket.created_at'), visible: true },
          { key: 'requested_by_name', label: t('ticket.requested_by_name'), visible: true },
          { key: 'requested_for_name', label: t('ticket.requested_for_name'), visible: true  },
          { key: 'writer_name', label: t('ticket.writer_name'), visible: false }
        ],
        required: isRequired('rel_problem_id')
      },
      rel_change_request: { 
        label: t('incident.change_request'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.change_request_placeholder'),
        endpoint: 'tickets?ticket_type=CHANGE',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: t('ticket.title'), visible: true },
          { key: 'ticket_status_code', label: t('ticket.status'), visible: true },
          { key: 'created_at', label: t('ticket.created_at'), visible: true },
          { key: 'requested_by_name', label: t('ticket.requested_by_name'), visible: true },
          { key: 'requested_for_name', label: t('ticket.requested_for_name'), visible: true  },
          { key: 'writer_name', label: t('ticket.writer_name'), visible: false }
        ],
        required: isRequired('rel_change_request')
      }
    };
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
