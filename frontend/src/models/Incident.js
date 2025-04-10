import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '@/services/apiService' // Import apiService

export class Incident {
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
    this.assigned_to = data.assigned_to || null;
    this.watch_list = data.watch_list || [];

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

    return {
      ticket_status_code: {
        label: t('incident.status'),
        type: 'sSelectField',
        placeholder: t('incident.status_placeholder'),
        required: true,
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes`,
        patchEndpoint: 'incidents',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      title: {
        label: t('incident.title'),
        type: 'sTextField',
        placeholder: t('incident.title_placeholder'),
        required: true
      },
      description: {
        label: t('incident.description'),
        type: 'sRichTextEditor',
        placeholder: t('incident.description_placeholder'),
        required: true
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
        required: true
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
        required: true
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
        ]
      },
      assigned_to_group: {
        label: t('incident.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.assigned_group_placeholder'),
        endpoint: ({ assigned_to }) => 
          assigned_to 
            ? `persons/${assigned_to}/groups` 
            : 'groups',
        displayField: 'groupe_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'groupe_name', label: t('group.name'), visible: true }
        ]
      },
      assigned_to: {
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
        ]
      },
      watch_list: {
        label: t('incident.watch_list'),
        type: 'sPickList',
        placeholder: t('incident.watch_list_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'first_name',
        targetEndPoint: 'incidents',
        target_uuid: null,
        pickedItems: null
      },
      impact: {
        label: t('incident.impact'),
        type: 'sSelectField',
        placeholder: t('incident.impact_placeholder'),
        required: true,
        endpoint: `incident_impacts?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'impact',
        mode: 'creation'
      },
      urgency: {
        label: t('incident.urgency'),
        type: 'sSelectField',
        placeholder: t('incident.urgency_placeholder'),
        required: true,
        endpoint: `incident_urgencies?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'urgency',
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
        mode: 'creation'
      },
      rel_service: {
        label: t('incident.service'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.service_placeholder'),
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid'
      },
      rel_service_offerings: {
        label: t('incident.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid'
      },
      contact_type: {
        label: t('incident.contact_type'),
        type: 'sSelectField',
        placeholder: t('incident.contact_type_placeholder'),
        endpoint: `contact_types?lang=${userProfileStore.language}`,
        fieldName: 'contact_type',
        mode: 'creation'
      },
      resolution_notes: {
        label: t('incident.resolution_notes'),
        type: 'sRichTextEditor',
        placeholder: t('incident.resolution_notes_placeholder')
      },
      resolution_code: {
        label: t('incident.resolution_code'),
        type: 'sSelectField',
        placeholder: t('incident.resolution_code_placeholder'),
        endpoint: `incident_resolution_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'resolution_code',
        mode: 'creation'
      },
      cause_code: {
        label: t('incident.cause_code'),
        type: 'sSelectField',
        placeholder: t('incident.cause_code_placeholder'),
        endpoint: `incident_cause_codes?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'cause_code',
        mode: 'creation'
      },
      rel_problem_id: {
        label: t('incident.problem_id'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.problem_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROBLEM',
        displayField: 'title',
        valueField: 'uuid'
      },
      rel_change_request: {
        label: t('incident.change_request'),
        type: 'sFilteredSearchField',
        placeholder: t('incident.change_request_placeholder'),
        endpoint: 'tickets?ticket_type=CHANGE',
        displayField: 'title',
        valueField: 'uuid'
      }
    };
  }
}
