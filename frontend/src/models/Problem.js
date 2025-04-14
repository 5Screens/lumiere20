import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Problem {
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

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();

    return {
      ticket_status_code: {
        label: t('problem.status'),
        type: 'sSelectField',
        placeholder: t('problem.status_placeholder'),
        required: true,
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=PROBLEM`,
        patchEndpoint: 'problems',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        label: t('problem.title'),
        type: 'sTextField',
        placeholder: t('problem.title_placeholder'),
        required: true
      },
      rel_problem_categories_code: {
        label: t('problem.category'),
        type: 'sSelectField',
        placeholder: t('problem.category_placeholder'),
        required: true,
        endpoint: `problem_categories?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'rel_problem_categories_code',
        mode: 'creation'
      },
      description: {
        label: t('problem.description'),
        type: 'sRichTextEditor',
        placeholder: t('problem.description_placeholder'),
        required: true
      },
      configuration_item_uuid: {
        label: t('problem.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'nom',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'nom', label: t('configuration_item.nom'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ]
      },
      rel_service: {
        label: t('problem.service'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.service_placeholder'),
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid'
      },
      rel_service_offerings: {
        label: t('problem.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid'
      },
      watch_list: {
        label: t('problem.watch_list'),
        type: 'sPickList',
        placeholder: t('problem.watch_list_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'first_name',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null
      },
      impact: {
        label: t('problem.impact'),
        type: 'sSelectField',
        placeholder: t('problem.impact_placeholder'),
        required: true,
        endpoint: `incident_impacts?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'impact',
        mode: 'creation'
      },
      urgency: {
        label: t('problem.urgency'),
        type: 'sSelectField',
        placeholder: t('problem.urgency_placeholder'),
        required: true,
        endpoint: `incident_urgencies?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'urgency',
        mode: 'creation'
      },
      assigned_to_group: {
        label: t('problem.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.assigned_group_placeholder'),
        endpoint: ({ assigned_to }) => 
          assigned_to 
            ? `persons/${assigned_to}/groups` 
            : 'groups',
        displayField: 'groupe_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'groupe_name', label: t('group.name'), visible: true }
        ],
        required: true
      },
      assigned_to_person: {
        label: t('problem.assigned_to'),
        type: 'sFilteredSearchField',
        placeholder: t('problem.assigned_to_placeholder'),
        endpoint: ({ assigned_to_group }) => 
          assigned_to_group 
          ? `groups/${assigned_to_group}/members` 
          : 'groups/members',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ]
      },
      symptoms_description: {
        label: t('problem.symptoms_description'),
        type: 'sRichTextEditor',
        placeholder: t('problem.symptoms_description_placeholder')
      },
      workaround: {
        label: t('problem.workaround'),
        type: 'sRichTextEditor',
        placeholder: t('problem.workaround_placeholder')
      },
      pbm_closed_at: {
        label: t('problem.closed_at'),
        type: 'sDatePicker',
        placeholder: t('problem.closed_at_placeholder')
      },
      knownerrors_list: {
        label: t('problem.knownerrors_list'),
        type: 'sPickList',
        placeholder: t('problem.knownerrors_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=PROBLEM',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null
      },
      changes_list: {
        label: t('problem.changes_list'),
        type: 'sPickList',
        placeholder: t('problem.changes_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=CHANGE',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null
      },
      incidents_list: {
        label: t('problem.incidents_list'),
        type: 'sPickList',
        placeholder: t('problem.incidents_list_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=INCIDENT',
        displayedLabel: 'title',
        targetEndPoint: 'problems',
        target_uuid: null,
        pickedItems: null
      },
      root_cause: {
        label: t('problem.root_cause'),
        type: 'sRichTextEditor',
        placeholder: t('problem.root_cause_placeholder')
      },
      definitive_solution: {
        label: t('problem.definitive_solution'),
        type: 'sRichTextEditor',
        placeholder: t('problem.definitive_solution_placeholder')
      },
      target_resolution_date: {
        label: t('problem.target_resolution_date'),
        type: 'sDatePicker',
        placeholder: t('problem.target_resolution_date_placeholder')
      },
      actual_resolution_date: {
        label: t('problem.actual_resolution_date'),
        type: 'sDatePicker',
        placeholder: t('problem.actual_resolution_date_placeholder')
      },
      actual_resolution_workload: {
        label: t('problem.actual_resolution_workload'),
        type: 'sTextField',
        placeholder: t('problem.actual_resolution_workload_placeholder'),
        inputType: 'number'
      },
      closure_justification: {
        label: t('problem.closure_justification'),
        type: 'sTextField',
        placeholder: t('problem.closure_justification_placeholder')
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
    
    // Retourner l'objet actuel pour permettre le chaînage
    return this;
  }
}
