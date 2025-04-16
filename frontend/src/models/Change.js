import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Change {
  constructor(data = {}) {
    // Informations générales
    this.uuid = data.uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.ticket_type_code = data.ticket_type_code || 'CHANGE';
    this.title = data.title || '';
    this.description = data.description || '';
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    
    // Extended attributes
    this.rel_services = data.rel_services || null;
    this.rel_service_offerings = data.rel_service_offerings || [];
    this.rel_change_type_code = data.rel_change_type_code || null;
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    
    // Evaluation du Risque (Extended attributes)
    this.r_q1 = data.r_q1 || null;
    this.r_q2 = data.r_q2 || null;
    this.r_q3 = data.r_q3 || null;
    this.r_q4 = data.r_q4 || null;
    this.r_q5 = data.r_q5 || null;
    
    // Evaluation de l'impact (Extended attributes)
    this.i_q1 = data.i_q1 || null;
    this.i_q2 = data.i_q2 || null;
    this.i_q3 = data.i_q3 || null;
    this.i_q4 = data.i_q4 || null;
    
    // Planification (Extended attributes)
    this.created_at = data.created_at || null;
    this.requested_start_date_at = data.requested_start_date_at || null;
    this.requested_end_date_at = data.requested_end_date_at || null;
    this.planned_start_date_at = data.planned_start_date_at || null;
    this.planned_end_date_at = data.planned_end_date_at || null;
    this.rel_change_justifications_code = data.rel_change_justifications_code || null;
    this.rel_change_objective = data.rel_change_objective || null;
    this.test_plan = data.test_plan || '';
    this.implementation_plan = data.implementation_plan || '';
    this.rollbcak_plan = data.rollbcak_plan || '';
    this.post_implementation_plan = data.post_implementation_plan || '';
    
    // Validation et autorisation (Extended attributes)
    this.cab_comments = data.cab_comments || '';
    this.rel_cab_validation_status = data.rel_cab_validation_status || null;
    this.required_validations = data.required_validations || [];
    this.validated_at = data.validated_at || null;
    
    // Exécution et suivi (Extended attributes)
    this.related_changes = data.related_changes || [];
    this.related_incidents_problems = data.related_incidents_problems || [];
    this.related_requests = data.related_requests || [];
    this.related_tasks = data.related_tasks || [];
    this.actual_start_date_at = data.actual_start_date_at || null;
    this.actual_end_date_at = data.actual_end_date_at || null;
    this.elapsed_time = data.elapsed_time || null;
    this.subscribers = data.subscribers || [];
    
    // Clôture et évaluation finale (Extended attributes)
    this.success_criteria = data.success_criteria || '';
    this.post_change_evaluation = data.post_change_evaluation || null;
    this.post_change_comment = data.post_change_comment || '';
    this.closed_at = data.closed_at || null;
    
    // Timestamps
    this.updated_at = data.updated_at || null;
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();

    return {
      // Informations générales
      ticket_status_code: {
        label: t('change.status'),
        type: 'sSelectField',
        placeholder: t('change.status_placeholder'),
        required: true,
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=CHANGE`,
        patchEndpoint: 'changes',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: t('change.requested_for'),
        type: 'sFilteredSearchField',
        placeholder: t('change.requested_for_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: true
      },
      title: {
        label: t('change.title'),
        type: 'sTextField',
        placeholder: t('change.title_placeholder'),
        required: true
      },
      description: {
        label: t('change.description'),
        type: 'sRichTextEditor',
        placeholder: t('change.description_placeholder'),
        required: true
      },
      configuration_item_uuid: {
        label: t('change.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('change.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'nom',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'nom', label: t('configuration_item.nom'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ]
      },
      rel_services: {
        label: t('change.service'),
        type: 'sFilteredSearchField',
        placeholder: t('change.service_placeholder'),
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service.name'), visible: true },
          { key: 'owning_entity_name', label: t('service.owning_entity_name'), visible: true }
        ],
        required: true
      },
      rel_service_offerings: {
        label: t('change.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('change.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service_offering.name'), visible: true },
          { key: 'service_name', label: t('service_offering.service_name'), visible: true }
        ],
        required: true
      },
      rel_change_type_code: {
        label: t('change.type'),
        type: 'sSelectField',
        placeholder: t('change.type_placeholder'),
        required: true,
        endpoint: `change_types?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'rel_change_type_code',
        mode: 'creation'
      },
      assigned_to_group: {
        label: t('change.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('change.assigned_group_placeholder'),
        endpoint: ({ assigned_to_person }) => 
          assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups',
        displayField: 'groupe_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'groupe_name', label: t('group.name'), visible: true }
        ],
        required: true
      },
      assigned_to_person: {
        label: t('change.assigned_to_person'),
        type: 'sFilteredSearchField',
        placeholder: t('change.assigned_to_person_placeholder'),
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
      
      // Evaluation du Risque
      r_q1: {
        label: t('change.risk_q1'),
        type: 'sSelectField',
        placeholder: t('change.risk_q1_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q1`,
        fieldName: 'r_q1',
        mode: 'creation'
      },
      r_q2: {
        label: t('change.risk_q2'),
        type: 'sSelectField',
        placeholder: t('change.risk_q2_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q2`,
        fieldName: 'r_q2',
        mode: 'creation'
      },
      r_q3: {
        label: t('change.risk_q3'),
        type: 'sSelectField',
        placeholder: t('change.risk_q3_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q3`,
        fieldName: 'r_q3',
        mode: 'creation'
      },
      r_q4: {
        label: t('change.risk_q4'),
        type: 'sSelectField',
        placeholder: t('change.risk_q4_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q4`,
        fieldName: 'r_q4',
        mode: 'creation'
      },
      r_q5: {
        label: t('change.risk_q5'),
        type: 'sSelectField',
        placeholder: t('change.risk_q5_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q5`,
        fieldName: 'r_q5',
        mode: 'creation'
      },
      
      // Evaluation de l'impact
      i_q1: {
        label: t('change.impact_q1'),
        type: 'sSelectField',
        placeholder: t('change.impact_q1_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q1`,
        fieldName: 'i_q1',
        mode: 'creation'
      },
      i_q2: {
        label: t('change.impact_q2'),
        type: 'sSelectField',
        placeholder: t('change.impact_q2_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q2`,
        fieldName: 'i_q2',
        mode: 'creation'
      },
      i_q3: {
        label: t('change.impact_q3'),
        type: 'sSelectField',
        placeholder: t('change.impact_q3_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q3`,
        fieldName: 'i_q3',
        mode: 'creation'
      },
      i_q4: {
        label: t('change.impact_q4'),
        type: 'sSelectField',
        placeholder: t('change.impact_q4_placeholder'),
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q4`,
        fieldName: 'i_q4',
        mode: 'creation'
      },
      
      // Planification
      requested_start_date_at: {
        label: t('change.requested_start_date'),
        type: 'sDatePicker',
        placeholder: t('change.requested_start_date_placeholder')
      },
      requested_end_date_at: {
        label: t('change.requested_end_date'),
        type: 'sDatePicker',
        placeholder: t('change.requested_end_date_placeholder')
      },
      planned_start_date_at: {
        label: t('change.planned_start_date'),
        type: 'sDatePicker',
        placeholder: t('change.planned_start_date_placeholder')
      },
      planned_end_date_at: {
        label: t('change.planned_end_date'),
        type: 'sDatePicker',
        placeholder: t('change.planned_end_date_placeholder')
      },
      rel_change_justifications_code: {
        label: t('change.justification'),
        type: 'sSelectField',
        placeholder: t('change.justification_placeholder'),
        endpoint: `change_justifications?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'rel_change_justifications_code',
        mode: 'creation'
      },
      rel_change_objective: {
        label: t('change.objective'),
        type: 'sTextField',
        placeholder: t('change.objective_placeholder')
      },
      test_plan: {
        label: t('change.test_plan'),
        type: 'sRichTextEditor',
        placeholder: t('change.test_plan_placeholder')
      },
      implementation_plan: {
        label: t('change.implementation_plan'),
        type: 'sRichTextEditor',
        placeholder: t('change.implementation_plan_placeholder')
      },
      rollbcak_plan: {
        label: t('change.rollback_plan'),
        type: 'sRichTextEditor',
        placeholder: t('change.rollback_plan_placeholder')
      },
      post_implementation_plan: {
        label: t('change.post_implementation_plan'),
        type: 'sRichTextEditor',
        placeholder: t('change.post_implementation_plan_placeholder')
      },
      
      // Validation et autorisation
      cab_comments: {
        label: t('change.cab_comments'),
        type: 'sRichTextEditor',
        placeholder: t('change.cab_comments_placeholder')
      },
      rel_cab_validation_status: {
        label: t('change.cab_validation_status'),
        type: 'sSelectField',
        placeholder: t('change.cab_validation_status_placeholder'),
        endpoint: `cab_validation_status?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'rel_cab_validation_status',
        mode: 'creation'
      },
      required_validations: {
        label: t('change.required_validations'),
        type: 'sPickList',
        placeholder: t('change.required_validations_placeholder'),
        sourceEndPoint: 'validation_levels',
        displayedLabel: 'name',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      validated_at: {
        label: t('change.validated_at'),
        type: 'sDatePicker',
        placeholder: t('change.validated_at_placeholder')
      },
      
      // Exécution et suivi
      related_changes: {
        label: t('change.related_changes'),
        type: 'sPickList',
        placeholder: t('change.related_changes_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=CHANGE',
        displayedLabel: 'title',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      related_incidents_problems: {
        label: t('change.related_incidents_problems'),
        type: 'sPickList',
        placeholder: t('change.related_incidents_problems_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=INCIDENT,PROBLEM',
        displayedLabel: 'title',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      related_requests: {
        label: t('change.related_requests'),
        type: 'sPickList',
        placeholder: t('change.related_requests_placeholder'),
        sourceEndPoint: 'tickets?ticket_type=REQUEST',
        displayedLabel: 'title',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      related_tasks: {
        label: t('change.related_tasks'),
        type: 'sPickList',
        placeholder: t('change.related_tasks_placeholder'),
        sourceEndPoint: 'tasks',
        displayedLabel: 'title',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      actual_start_date_at: {
        label: t('change.actual_start_date'),
        type: 'sDatePicker',
        placeholder: t('change.actual_start_date_placeholder')
      },
      actual_end_date_at: {
        label: t('change.actual_end_date'),
        type: 'sDatePicker',
        placeholder: t('change.actual_end_date_placeholder')
      },
      elapsed_time: {
        label: t('change.elapsed_time'),
        type: 'sTextField',
        placeholder: t('change.elapsed_time_placeholder'),
        inputType: 'number'
      },
      subscribers: {
        label: t('change.subscribers'),
        type: 'sPickList',
        placeholder: t('change.subscribers_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'first_name',
        targetEndPoint: 'changes',
        target_uuid: null,
        pickedItems: null
      },
      
      // Clôture et évaluation finale
      success_criteria: {
        label: t('change.success_criteria'),
        type: 'sRichTextEditor',
        placeholder: t('change.success_criteria_placeholder')
      },
      post_change_evaluation: {
        label: t('change.post_change_evaluation'),
        type: 'sSelectField',
        placeholder: t('change.post_change_evaluation_placeholder'),
        endpoint: `post_change_evaluations?lang=${userProfileStore.language}&toSelect=yes`,
        fieldName: 'post_change_evaluation',
        mode: 'creation'
      },
      post_change_comment: {
        label: t('change.post_change_comment'),
        type: 'sRichTextEditor',
        placeholder: t('change.post_change_comment_placeholder')
      },
      closed_at: {
        label: t('change.closed_at'),
        type: 'sDatePicker',
        placeholder: t('change.closed_at_placeholder')
      }
    };
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code
        this.writer_uuid = userProfileStore.id;
        this.ticket_type_code = 'CHANGE';
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Change.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Préparation des données pour l'API
    const apiData = {
      uuid: this.uuid,
      requested_for_uuid: this.requested_for_uuid,
      ticket_status_code: this.ticket_status_code,
      ticket_type_code: this.ticket_type_code,
      title: this.title,
      description: this.description,
      configuration_item_uuid: this.configuration_item_uuid,
      created_at: this.created_at,
      updated_at: this.updated_at,
      
      // Données pour rel_tickets_groups_persons
      assigned_to: {
        group: this.assigned_to_group,
        person: this.assigned_to_person
      },
      
      // Extended attributes
      extended_attributes: {
        rel_services: this.rel_services,
        rel_service_offerings: this.rel_service_offerings,
        rel_change_type_code: this.rel_change_type_code,
        r_q1: this.r_q1,
        r_q2: this.r_q2,
        r_q3: this.r_q3,
        r_q4: this.r_q4,
        r_q5: this.r_q5,
        i_q1: this.i_q1,
        i_q2: this.i_q2,
        i_q3: this.i_q3,
        i_q4: this.i_q4,
        requested_start_date_at: this.requested_start_date_at,
        requested_end_date_at: this.requested_end_date_at,
        planned_start_date_at: this.planned_start_date_at,
        planned_end_date_at: this.planned_end_date_at,
        rel_change_justifications_code: this.rel_change_justifications_code,
        rel_change_objective: this.rel_change_objective,
        test_plan: this.test_plan,
        implementation_plan: this.implementation_plan,
        rollbcak_plan: this.rollbcak_plan,
        post_implementation_plan: this.post_implementation_plan,
        cab_comments: this.cab_comments,
        rel_cab_validation_status: this.rel_cab_validation_status,
        required_validations: this.required_validations,
        validated_at: this.validated_at,
        related_changes: this.related_changes,
        related_incidents_problems: this.related_incidents_problems,
        related_requests: this.related_requests,
        related_tasks: this.related_tasks,
        actual_start_date_at: this.actual_start_date_at,
        actual_end_date_at: this.actual_end_date_at,
        elapsed_time: this.elapsed_time,
        subscribers: this.subscribers,
        success_criteria: this.success_criteria,
        post_change_evaluation: this.post_change_evaluation,
        post_change_comment: this.post_change_comment,
        closed_at: this.closed_at
      }
    };
    
    // Supprimer les propriétés null ou undefined
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === null || apiData[key] === undefined) {
        delete apiData[key];
      }
    });
    
    // Nettoyer les extended_attributes
    if (apiData.extended_attributes) {
      Object.keys(apiData.extended_attributes).forEach(key => {
        if (apiData.extended_attributes[key] === null || apiData.extended_attributes[key] === undefined) {
          delete apiData.extended_attributes[key];
        }
      });
      
      // Supprimer extended_attributes si vide
      if (Object.keys(apiData.extended_attributes).length === 0) {
        delete apiData.extended_attributes;
      }
    }
    
    return apiData;
  }
}
