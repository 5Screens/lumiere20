import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '@/services/apiService'

export class Problem {
  /**
   * Retourne les colonnes pour l'affichage dans le tableau des problèmes
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('problem.title'), type: 'text', format: 'text' },
      { key: 'description', label: t('problem.description'), type: 'text', format: 'html' },
      { key: 'rel_service_name', label: t('problem.service'), type: 'text', format: 'text' },
      { key: 'rel_service_offerings_name', label: t('problem.service_offering'), type: 'text', format: 'text' },
      { key: 'configuration_item_name', label: t('problem.configuration_item'), type: 'text', format: 'text' },
      { key: 'ticket_status_label', label: t('problem.status'), type: 'text', format: 'text' },
      { key: 'problem_category_label', label: t('problem.category'), type: 'text', format: 'text' },
      { key: 'impact_label', label: t('problem.impact'), type: 'text', format: 'text' },
      { key: 'urgency_label', label: t('problem.urgency'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('problem.assigned_group'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('problem.assigned_to_person'), type: 'text', format: 'text' },
      { key: 'target_resolution_date', label: t('problem.target_resolution_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'actual_resolution_date', label: t('problem.actual_resolution_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'actual_resolution_workload', label: t('problem.actual_resolution_workload'), type: 'text', format: 'text' },
      { key: 'symptoms_description', label: t('problem.symptoms'), type: 'text', format: 'html' },
      { key: 'workaround', label: t('problem.workaround'), type: 'text', format: 'html' },
      { key: 'root_cause', label: t('problem.root_cause'), type: 'text', format: 'html' },
      { key: 'definitive_solution', label: t('problem.definitive_solution'), type: 'text', format: 'html' },
      { key: 'closure_justification', label: t('problem.closure_justification'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'closed_at', label: t('common.closure_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les tickets de type PROBLEM
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE)
   * @returns {string} Endpoint API
   */
  static getApiEndpoint(method) {
    const userProfileStore = useUserProfileStore();
    
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      return 'tickets';
    } else {
      return `tickets?ticket_type=PROBLEM&lang=${userProfileStore.language}`;
    }
  }
  
  constructor(data = {}) {
    // Identifiant unique du problème
    this.uuid = data.uuid || null;
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.ticket_type_code = data.ticket_type_code || 'PROBLEM';

    // Informations de détection
    this.title = data.title || '';
    this.rel_problem_categories_code = data.rel_problem_categories_code || null;
    this.description = data.description || '';
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    this.rel_service = data.rel_service || null;
    this.rel_service_offerings = data.rel_service_offerings || [];
    this.watch_list = data.watch_list || [];

    // Informations d'enregistrement
    this.impact = data.impact || null;
    this.urgency = data.urgency || null;
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    this.symptoms_description = data.symptoms_description || '';
    this.workaround = data.workaround || '';
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'ticket_status_code', label: i18n.global.t('problem.status') },
      { name: 'title', label: i18n.global.t('problem.title') },
      { name: 'description', label: i18n.global.t('problem.description') },
      { name: 'rel_problem_categories_code', label: i18n.global.t('problem.category') },
      { name: 'impact', label: i18n.global.t('problem.impact') },
      { name: 'urgency', label: i18n.global.t('problem.urgency') },
      { name: 'assigned_to_group', label: i18n.global.t('problem.assigned_to_group') }
    ];
    
    // Identification des causes
    this.knownerrors_list = data.knownerrors_list || [];
    this.changes_list = data.changes_list || [];
    this.incidents_list = data.incidents_list || [];
    this.root_cause = data.root_cause || '';
    this.definitive_solution = data.definitive_solution || '';
    this.target_resolution_date = data.target_resolution_date || null;
    this.actual_resolution_date = data.actual_resolution_date || null;
    this.actual_resolution_workload = data.actual_resolution_workload || null;

    // Clôture du problème
    this.closure_justification = data.closure_justification || '';
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.closed_at = data.closed_at || null;
  }
  
  /**
   * Récupère un problème par son UUID
   * @param {string} uuid - L'UUID du ticket à récupérer
   * @returns {Promise<Problem>} Une promesse résolue avec l'instance du problème
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`tickets/${uuid}?ticket_type=PROBLEM&lang=${userProfileStore.language}`);
      
      if (response) {
        return new Problem(response);
      }
      
      throw new Error('Problem not found');
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw error;
    }
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Problem();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      ticket_status_code: {
        label: t('problem.status'),
        type: 'sSelectField',
        placeholder: t('problem.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=PROBLEM`,
        patchEndpoint: 'problems',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        label: t('problem.title'),
        type: 'sTextField',
        placeholder: t('problem.title_placeholder'),
        required: isRequired('title')
      },
      rel_problem_categories_code: {
        label: t('problem.category'),
        type: 'sSelectField',
        placeholder: t('problem.category_placeholder'),
        required: isRequired('rel_problem_categories_code'),
        endpoint: `problem_categories?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'rel_problem_categories_code',
        mode: 'creation'
      },
      description: {
        label: t('problem.description'),
        type: 'sRichTextEditor',
        placeholder: t('problem.description_placeholder'),
        required: isRequired('description')
      },
      configuration_item_uuid: {
        label: t('problem.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('configuration_item.name'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ],
        required: isRequired('configuration_item_uuid')
      },
      rel_service: {
        label: t('problem.service'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.service_placeholder'),
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
        label: t('problem.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service_offering.name'), visible: true },
          { key: 'description', label: t('service_offering.description'), visible: false },
          { key: 'start_date', label: t('service_offering.start_date'), visible: false },
          { key: 'end_date', label: t('service_offering.end_date'), visible: false },
          { key: 'business_criticality', label: t('service_offering.business_criticality'), visible: false },
          { key: 'environment', label: t('service_offering.environment'), visible: false },
          { key: 'price_model', label: t('service_offering.price_model'), visible: false },
          { key: 'currency', label: t('service_offering.currency'), visible: false },
          { key: 'created_at', label: t('service_offering.created_at'), visible: false },
          { key: 'updated_at', label: t('service_offering.updated_at'), visible: false },
          { key: 'service_name', label: t('service_offering.service_name'), visible: true },
          { key: 'operator_entity_name', label: t('service_offering.operator_entity_name'), visible: false }
        ],
        required: isRequired('rel_service_offerings')
      },
      watch_list: {
        label: t('problem.watch_list'),
        type: 'sPickList',
        placeholder: t('problem.watch_list_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'first_name',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('watch_list')
      },
      impact: {
        label: t('problem.impact'),
        type: 'sSelectField',
        placeholder: t('problem.impact_placeholder'),
        required: isRequired('impact'),
        endpoint: `incident_impacts?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'impact',
        mode: 'creation'
      },
      urgency: {
        label: t('problem.urgency'),
        type: 'sSelectField',
        placeholder: t('problem.urgency_placeholder'),
        required: isRequired('urgency'),
        endpoint: `incident_urgencies?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'urgency',
        mode: 'creation'
      },
      assigned_to_group: {
        label: t('problem.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.assigned_group_placeholder'),
        endpoint: ({ assigned_to_person }) => 
          assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'group_name', label: t('group.name'), visible: true }
        ],
        required: isRequired('assigned_to_group')
      },
      assigned_to_person: {
        label: t('problem.assigned_to_person'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.assigned_to_person_placeholder'),
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
      symptoms_description: {
        label: t('problem.symptoms_description'),
        type: 'sRichTextEditor',
        placeholder: t('problem.symptoms_description_placeholder'),
        required: isRequired('symptoms_description')
      },
      workaround: {
        label: t('problem.workaround'),
        type: 'sRichTextEditor',
        placeholder: t('problem.workaround_placeholder'),
        required: isRequired('workaround')
      },
      closed_at: {
        label: t('problem.closed_at'),
        type: 'sDatePicker',
        placeholder: t('problem.closed_at_placeholder'),
        required: isRequired('closed_at')
      },
      target_resolution_date: {
        label: t('problem.target_resolution_date'),
        type: 'sDatePicker',
        placeholder: t('problem.target_resolution_date_placeholder'),
        required: isRequired('target_resolution_date')
      },
      actual_resolution_date: {
        label: t('problem.actual_resolution_date'),
        type: 'sDatePicker',
        placeholder: t('problem.actual_resolution_date_placeholder'),
        required: isRequired('actual_resolution_date')
      },
      knownerrors_list: {
        label: t('problem.knownerrors_list'),
        type: 'sPickList',
        placeholder: t('problem.knownerrors_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=PROBLEM',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('knownerrors_list')
      },
      changes_list: {
        label: t('problem.changes_list'),
        type: 'sPickList',
        placeholder: t('problem.changes_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=CHANGE',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('changes_list')
      },
      incidents_list: {
        label: t('problem.incidents_list'),
        type: 'sPickList',
        placeholder: t('problem.incidents_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=INCIDENT',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('incidents_list')
      },
      root_cause: {
        label: t('problem.root_cause'),
        type: 'sRichTextEditor',
        placeholder: t('problem.root_cause_placeholder'),
        required: isRequired('root_cause')
      },
      definitive_solution: {
        label: t('problem.definitive_solution'),
        type: 'sRichTextEditor',
        placeholder: t('problem.definitive_solution_placeholder'),
        required: isRequired('definitive_solution')
      },
      actual_resolution_workload: {
        label: t('problem.actual_resolution_workload'),
        type: 'sTextField',
        placeholder: t('problem.actual_resolution_workload_placeholder'),
        inputType: 'number',
        required: isRequired('actual_resolution_workload')
      },
      closure_justification: {
        label: t('problem.closure_justification'),
        type: 'sTextField',
        placeholder: t('problem.closure_justification_placeholder') ,
        required: isRequired('closure_justification')
      }
    };
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code
        this.writer_uuid = userProfileStore.id;
        this.ticket_type_code = 'PROBLEM';
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Problem.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Traiter les listes pour extraire uniquement les UUIDs si ce sont des objets complets
    const listFields = ['watch_list', 'knownerrors_list', 'changes_list', 'incidents_list'];
    
    listFields.forEach(field => {
      if (apiData[field] && Array.isArray(apiData[field]) && apiData[field].length > 0) {
        if (typeof apiData[field][0] === 'object' && apiData[field][0].uuid) {
          // Si les éléments de la liste sont des objets avec un UUID, extraire uniquement les UUIDs
          apiData[field] = apiData[field].map(item => item.uuid);
        }
      }
    });
    
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
}
