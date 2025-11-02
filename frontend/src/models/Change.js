import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '@/services/apiService'

export class Change {



  /**
   * Retourne le nom du champ à utiliser pour le label des onglets enfants
   * @returns {string} Le nom du champ
   */
  static getChildTabLabel() {
    return 'title';
  }

  /**
   * Retourne l'identifiant unique pour ce type d'objet
   * @returns {string} Le nom du champ identifiant
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne le titre pour la création d'un nouvel objet
   * @returns {string} Le titre de création
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.changeCreation';
  }

  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.changeUpdate';
  }

  constructor(data = {}) {
    // Informations générales
    this.uuid = data.uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.ticket_type_code = data.ticket_type_code || 'CHANGE';
    this.title = data.title || '';
    this.description = data.description || '';
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    this.writer_name = data.writer_name || null;
    this.requested_for_name = data.requested_for_name || null;
    this.assigned_group_name = data.assigned_group_name || null;
    this.assigned_person_name = data.assigned_person_name || null;
    this.configuration_item_name = data.configuration_item_name || null;
    this.rel_service_name = data.rel_service_name || null;
    this.rel_service_offerings_name = data.rel_service_offerings_name || null;
    
    // Extended attributes
    this.rel_services = data.rel_services || null;
    this.rel_service_offerings = data.rel_service_offerings || [];
    this.rel_change_type_code = data.rel_change_type_code || null;
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'ticket_status_code', label: i18n.global.t('change.status') },
      { name: 'requested_for_uuid', label: i18n.global.t('change.requested_for') },
      { name: 'title', label: i18n.global.t('change.title') },
      { name: 'description', label: i18n.global.t('change.description') },
      { name: 'rel_services', label: i18n.global.t('change.service') },
      { name: 'rel_service_offerings', label: i18n.global.t('change.service_offerings') },
      { name: 'assigned_to_group', label: i18n.global.t('change.assigned_group') },
      { name: 'assigned_to_person', label: i18n.global.t('change.assigned_to_person') }
    ];
    
    // Evaluation du Risque (Extended attributes)
    this.r_q1 = data.r_q1 || null;
    this.r_q2 = data.r_q2 || null;
    this.r_q3 = data.r_q3 || null;
    this.r_q4 = data.r_q4 || null;
    this.r_q5 = data.r_q5 || null;
    
    // Labels dynamiques pour les questions d'évaluation de risque
    this.r_q1_label = data.r_q1_label || null;
    this.r_q2_label = data.r_q2_label || null;
    this.r_q3_label = data.r_q3_label || null;
    this.r_q4_label = data.r_q4_label || null;
    this.r_q5_label = data.r_q5_label || null;
    
    // Evaluation de l'impact (Extended attributes)
    this.i_q1 = data.i_q1 || null;
    this.i_q2 = data.i_q2 || null;
    this.i_q3 = data.i_q3 || null;
    this.i_q4 = data.i_q4 || null;
    
    // Labels dynamiques pour les questions d'évaluation d'impact
    this.i_q1_label = data.i_q1_label || null;
    this.i_q2_label = data.i_q2_label || null;
    this.i_q3_label = data.i_q3_label || null;
    this.i_q4_label = data.i_q4_label || null;
    
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
    this.related_tickets = data.related_tickets || [];
    this.actual_start_date_at = data.actual_start_date_at || null;
    this.actual_end_date_at = data.actual_end_date_at || null;
    this.elapsed_time = data.elapsed_time || null;
    this.watch_list = data.watch_list || [];
    
    // Clôture et évaluation finale (Extended attributes)
    this.success_criteria = data.success_criteria || '';
    this.post_change_evaluation = data.post_change_evaluation || null;
    this.post_change_comment = data.post_change_comment || '';
    this.closed_at = data.closed_at || null;
    
    // Timestamps
    this.updated_at = data.updated_at || null;
  }

  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), visible: false },
      { key: 'title', label: t('change.title'), visible: true },
      { key: 'ticket_type_label', label: t('configuration.ticketTypes'), visible: true },
      { key: 'change_type_label', label: t('change.type'), visible: true, filterKey: 'rel_change_type_code' },
      { key: 'ticket_status_label', label: t('change.status'), visible: true, filterKey: 'ticket_status_code' },
      { key: 'rel_service_name', label: t('change.service'), visible: true, filterKey: 'rel_services' },
      { key: 'rel_service_offerings_name', label: t('change.service_offerings'), visible: true, filterKey: 'rel_service_offerings' },
      { key: 'description', label: t('change.description'), visible: true, type: 'text', format: 'html' },
      { key: 'configuration_item_name', label: t('change.configuration_item'), visible: true, filterKey: 'configuration_item_uuid' },
      { key: 'writer_name', label: t('change.writer'), visible: true, filterKey: 'writer_uuid' },
      { key: 'requested_for_name', label: t('change.requested_for'), visible: true, filterKey: 'requested_for_uuid' },
      { key: 'assigned_group_name', label: t('change.assigned_group'), visible: true, filterKey: 'assigned_to_group' },
      { key: 'assigned_person_name', label: t('change.assigned_to_person'), visible: true, filterKey: 'assigned_to_person' },
      { key: 'created_at', label: t('common.created_at'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.updated_at'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'requested_start_date_at', label: t('change.requested_start_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'planned_start_date_at', label: t('change.planned_start_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'requested_end_date_at', label: t('change.requested_end_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'planned_end_date_at', label: t('change.planned_end_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'validated_at', label: t('change.validated_at'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'actual_start_date_at', label: t('change.actual_start_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'actual_end_date_at', label: t('change.actual_end_date'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'closed_at', label: t('change.closed_at'), visible: true , type: 'date', format: 'YYYY-MM-DD' },
      { key: 'change_justifications_label', label: t('change.justification'), visible: true, filterKey: 'rel_change_justifications_code' },
      { key: 'change_objective_label', label: t('change.objective'), visible: true, filterKey: 'rel_change_objective' },
      { key: 'test_plan', label: t('change.test_plan'), visible: true, type: 'text', format: 'html' },
      { key: 'implementation_plan', label: t('change.implementation_plan'), visible: true, type: 'text', format: 'html' },
      { key: 'rollbcak_plan', label: t('change.rollback_plan'), visible: true, type: 'text', format: 'html' },
      { key: 'post_implementation_plan', label: t('change.post_implementation_plan'), visible: true, type: 'text', format: 'html' },
      { key: 'cab_comments', label: t('change.cab_comments'), visible: true, type: 'text', format: 'html' },
      { key: 'cab_validation_status_label', label: t('change.cab_validation_status'), visible: true, filterKey: 'rel_cab_validation_status' },
      { key: 'required_validations_labels', label: t('change.required_validations'), visible: true, type: 'text', format: 'tags' },
      { key: 'elapsed_time', label: t('change.elapsed_time'), visible: true },
      { key: 'success_criteria', label: t('change.success_criteria'), visible: true, type: 'text', format: 'html' },
      { key: 'post_change_evaluation_label', label: t('change.post_change_evaluation'), visible: true, filterKey: 'post_change_evaluation' },
      { key: 'post_change_comment', label: t('change.post_change_comment'), visible: true, type: 'text', format: 'html' }
    ];
  }

  static getApiEndpoint(method = 'GET') {
    // Pour l'infinite scroll, retourner l'endpoint de recherche
    // Le composant reusableTableTab utilisera POST /tickets/search/changes
    if (method === 'GET') {
      return 'tickets/search/changes';
    }
    
    // Pour les autres méthodes (PATCH, PUT, DELETE)
    return 'tickets';
  }

  /**
   * Récupère un changement par son UUID
   * @param {string} uuid - L'UUID du ticket à récupérer
   * @returns {Promise<Change>} Une promesse résolue avec l'instance du changement
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`tickets/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Change(response);
      }
      
      throw new Error('Change not found');
    } catch (error) {
      console.error('Error fetching change:', error);
      throw error;
    }
  }

  static async getDynamicLabel() {
    const userProfileStore = useUserProfileStore();
    const instance = new Change();
    
    // Liste des questions pour lesquelles récupérer les labels
    const questionIds = ['r_q1', 'r_q2', 'r_q3', 'r_q4', 'r_q5', 'i_q1', 'i_q2', 'i_q3', 'i_q4'];
    
    try {
      // Récupérer les labels pour chaque question
      const promises = questionIds.map(async (questionId) => {
        try {
          // Utiliser apiService.get au lieu de fetch directement
          const params = {
            lang: userProfileStore.language,
            question_id: questionId
          };
          
          const data = await apiService.get('change_questions', params);
          
          if (data && data.length > 0) {
            // Stocker le label dans l'instance
            instance[`${questionId}_label`] = data[0].label;
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du label pour ${questionId}:`, error);
        }
      });
      
      // Attendre que toutes les requêtes soient terminées
      await Promise.all(promises);
      
      return instance;
    } catch (error) {
      console.error('Erreur lors de la récupération des labels dynamiques:', error);
      return instance;
    }
  }
  
  static async getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Récupérer les labels dynamiques
    const dynamicLabels = await this.getDynamicLabel();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    const fields = {
      // Informations système
      uuid: {
        label: 'common.uuid',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      updated_at: {
        label: 'common.updated_at',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      created_at: {
        label: 'common.created_at',
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
      closed_at: {
        label: 'change.closed_at',
        type: 'sTextField',
        placeholder: null,
        required: false,
        readOnly: true,
        disabled: true
      },
      // Informations générales
      ticket_status_code: {
        label: 'change.status',
        type: 'sSelectField',
        placeholder: 'change.status_placeholder',
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=CHANGE`,
        patchEndpoint: 'changes',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: 'change.requested_for',
        type: 'sFilteredSearchField',
        placeholder: 'change.requested_for_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_for_name',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true }
        ],
        required: isRequired('requested_for_uuid'),
        lazySearch: true
      },
      title: {
        label: 'change.title',
        type: 'sTextField',
        placeholder: 'change.title_placeholder',
        required: isRequired('title')
      },
      description: {
        label: 'change.description',
        type: 'sRichTextEditor',
        placeholder: 'change.description_placeholder',
        required: isRequired('description')
      },
      configuration_item_uuid: {
        label: 'change.configuration_item',
        type: 'sFilteredSearchField',
        placeholder: 'change.configuration_item_placeholder',
        endpoint: 'configuration_items',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'configuration_item_name',
        columnsConfig: [
          { key: 'name', label: 'configuration_item.name', visible: true },
          { key: 'description', label: 'configuration_item.description', visible: true }
        ],
        required: isRequired('configuration_item_uuid')
      },
      rel_services: {
        label: 'change.service',
        type: 'sFilteredSearchField',
        placeholder: 'change.service_placeholder',
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'rel_service_name',
        columnsConfig: [
          { key: 'name', label: 'service.name', visible: true },
          { key: 'owning_entity_name', label: 'service.owning_entity_name', visible: true }
        ],
        required: isRequired('rel_services')
      },
      rel_service_offerings: {
        label: 'change.service_offerings',
        type: 'sFilteredSearchField',
        placeholder: 'change.service_offerings_placeholder',
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'rel_service_offerings_name',
        columnsConfig: [
          { key: 'name', label: 'service_offering.name', visible: true },
          { key: 'service_name', label: 'service_offering.service_name', visible: true }
        ],
        required: isRequired('rel_service_offerings')
      },
      rel_change_type_code: {
        label: 'change.type',
        type: 'sSelectField',
        placeholder: 'change.type_placeholder',
        required: isRequired('rel_change_type_code'),
        endpoint: `change_setup?lang=${userProfileStore.language}&toSelect=yes&metadata=type`,
        fieldName: 'rel_change_type_code',
        mode: 'creation'
      },
      assigned_to_group: {
        label: 'change.assigned_group',
        type: 'sFilteredSearchField',
        placeholder: 'change.assigned_group_placeholder',
        endpoint: ({ assigned_to_person }) => 
          assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'assigned_group_name',
        columnsConfig: [
          { key: 'group_name', label: 'group.name', visible: true }
        ],
        required: isRequired('assigned_to_group'),
        resetable: true
      },
      assigned_to_person: {
        label: 'change.assigned_to_person',
        type: 'sFilteredSearchField',
        placeholder: 'change.assigned_to_person_placeholder',
        endpoint: ({ assigned_to_group }) => 
          assigned_to_group 
          ? `groups/${assigned_to_group}/members` 
          : 'groups/members',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'assigned_person_name',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true }
        ],
        required: isRequired('assigned_to_person'),
        resetable: true
      },
      
      // Evaluation du Risque
      r_q1: {
        label: dynamicLabels.r_q1_label,
        type: 'sSelectField',
        placeholder: 'change.risk_q1_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q1`,
        fieldName: 'r_q1',
        mode: 'creation',
        required: isRequired('r_q1')
      },
      r_q2: {
        label: dynamicLabels.r_q2_label,
        type: 'sSelectField',
        placeholder: 'change.risk_q2_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q2`,
        fieldName: 'r_q2',
        mode: 'creation',
        required: isRequired('r_q2')
      },
      r_q3: {
        label: dynamicLabels.r_q3_label,
        type: 'sSelectField',
        placeholder: 'change.risk_q3_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q3`,
        fieldName: 'r_q3',
        mode: 'creation',
        required: isRequired('r_q3') 
      },
      r_q4: {
        label: dynamicLabels.r_q4_label,
        type: 'sSelectField',
        placeholder: 'change.risk_q4_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q4`,
        fieldName: 'r_q4',
        mode: 'creation',
        required: isRequired('r_q4')
      },
      r_q5: {
        label: dynamicLabels.r_q5_label,
        type: 'sSelectField',
        placeholder: 'change.risk_q5_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=r_q5`,
        fieldName: 'r_q5',
        mode: 'creation',
        required: isRequired('r_q5')
      },
      
      // Evaluation de l'impact
      i_q1: {
        label: dynamicLabels.i_q1_label,
        type: 'sSelectField',
        placeholder: 'change.impact_q1_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q1`,
        fieldName: 'i_q1',
        mode: 'creation',
        required: isRequired('i_q1')
      },
      i_q2: {
        label: dynamicLabels.i_q2_label,
        type: 'sSelectField',
        placeholder: 'change.impact_q2_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q2`,
        fieldName: 'i_q2',
        mode: 'creation',
        required: isRequired('i_q2')
      },
      i_q3: {
        label: dynamicLabels.i_q3_label,
        type: 'sSelectField',
        placeholder: 'change.impact_q3_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q3`,
        fieldName: 'i_q3',
        mode: 'creation',
        required: isRequired('i_q3')
      },
      i_q4: {
        label: dynamicLabels.i_q4_label,
        type: 'sSelectField',
        placeholder: 'change.impact_q4_placeholder',
        endpoint: `change_options?lang=${userProfileStore.language}&question_id=i_q4`,
        fieldName: 'i_q4',
        mode: 'creation',
        required: isRequired('i_q4')
      },
      
      // Planification
      requested_start_date_at: {
        label: 'change.requested_start_date',
        type: 'sDatePicker',
        placeholder: 'change.requested_start_date_placeholder',
        required: isRequired('requested_start_date_at'),
        patchendpoint: 'tickets'
      },
      requested_end_date_at: {
        label: 'change.requested_end_date',
        type: 'sDatePicker',
        placeholder: 'change.requested_end_date_placeholder',
        required: isRequired('requested_end_date_at'),
        patchendpoint: 'tickets'
      },
      planned_start_date_at: {
        label: 'change.planned_start_date',
        type: 'sDatePicker',
        placeholder: 'change.planned_start_date_placeholder',
        required: isRequired('planned_start_date_at'),
        patchendpoint: 'tickets'
      },
      planned_end_date_at: {
        label: 'change.planned_end_date',
        type: 'sDatePicker',
        placeholder: 'change.planned_end_date_placeholder',
        required: isRequired('planned_end_date_at'),
        patchendpoint: 'tickets'
      },
      rel_change_justifications_code: {
        label: 'change.justification',
        type: 'sSelectField',
        placeholder: 'change.justification_placeholder',
        endpoint: `change_setup?lang=${userProfileStore.language}&toSelect=yes&metadata=justification`,
        fieldName: 'rel_change_justifications_code',
        mode: 'creation',
        required: isRequired('rel_change_justifications_code')
      },
      rel_change_objective: {
        label: 'change.objective',
        type: 'sSelectField',
        placeholder: 'change.objective_placeholder',
        endpoint: `change_setup?lang=${userProfileStore.language}&toSelect=yes&metadata=objective`,
        fieldName: 'rel_change_objective',
        mode: 'creation',
        required: isRequired('rel_change_objective')
      },
      test_plan: {
        label: 'change.test_plan',
        type: 'sRichTextEditor',
        placeholder: 'change.test_plan_placeholder',
        required: isRequired('test_plan')
      },
      implementation_plan: {
        label: 'change.implementation_plan',
        type: 'sRichTextEditor',
        placeholder: 'change.implementation_plan_placeholder',
        required: isRequired('implementation_plan')
      },
      rollbcak_plan: {
        label: 'change.rollback_plan',
        type: 'sRichTextEditor',
        placeholder: 'change.rollback_plan_placeholder',
        required: isRequired('rollbcak_plan')
      },
      post_implementation_plan: {
        label: 'change.post_implementation_plan',
        type: 'sRichTextEditor',
        placeholder: 'change.post_implementation_plan_placeholder',
        required: isRequired('post_implementation_plan')
      },
      
      // Validation et autorisation
      cab_comments: {
        label: 'change.cab_comments',
        type: 'sRichTextEditor',
        placeholder: 'change.cab_comments_placeholder',
        required: isRequired('cab_comments')
      },
      rel_cab_validation_status: {
        label: 'change.cab_validation_status',
        type: 'sSelectField',
        placeholder: 'change.cab_validation_status_placeholder',
        endpoint: `change_setup?lang=${userProfileStore.language}&toSelect=yes&metadata=cab_validation_status`,
        fieldName: 'rel_cab_validation_status',
        mode: 'creation',
        required: isRequired('rel_cab_validation_status')
      },
      required_validations: {
        label: 'change.required_validations',
        type: 'sPickList',
        placeholder: 'change.required_validations_placeholder',
        sourceEndPoint: `change_setup?lang=${userProfileStore.language}&metadata=validation_level`,
        displayedLabel: 'label',
        targetEndPoint: 'tickets',
        ressourceEndPoint: null,
        fieldName: 'required_validations',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('required_validations')
      },
      validated_at: {
        label: 'change.validated_at',
        type: 'sDatePicker',
        placeholder: 'change.validated_at_placeholder',
        required: isRequired('validated_at'),
        patchendpoint: 'tickets'
      },
      
      // Exécution et suivi
      related_tickets: {
        label: 'change.related_tickets',
        type: 'sPickList',
        placeholder: 'change.related_tickets_placeholder',
        sourceEndPoint: 'tickets',
        displayedLabel: 'title',
        targetEndPoint: 'tickets',
        ressourceEndPoint: 'children',
        fieldName: 'EMBEDDED_TICKETS',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('related_tickets')
      },
      actual_start_date_at: {
        label: 'change.actual_start_date',
        type: 'sDatePicker',
        placeholder: 'change.actual_start_date_placeholder',
        required: isRequired('actual_start_date_at'),
        patchendpoint: 'tickets'
      },
      actual_end_date_at: {
        label: 'change.actual_end_date',
        type: 'sDatePicker',
        placeholder: 'change.actual_end_date_placeholder',
        required: isRequired('actual_end_date_at'),
        patchendpoint: 'tickets'
      },
      elapsed_time: {
        label: 'change.elapsed_time',
        type: 'sTextField',
        placeholder: 'change.elapsed_time_placeholder',
        inputType: 'number',
        required: isRequired('elapsed_time')
      },
      watch_list: {
        label: 'change.watch_list',
        type: 'sPickList',
        placeholder: 'change.watch_list_placeholder',
        sourceEndPoint: 'persons',
        displayedLabel: 'person_name',
        targetEndPoint: 'tickets',
        ressourceEndPoint: 'watchers',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('watch_list'),
        lazySearch: true
      },
      
      // Clôture et évaluation finale
      success_criteria: {
        label: 'change.success_criteria',
        type: 'sRichTextEditor',
        placeholder: 'change.success_criteria_placeholder',
        required: isRequired('success_criteria')
      },
      post_change_evaluation: {
        label: 'change.post_change_evaluation',
        type: 'sSelectField',
        placeholder: 'change.post_change_evaluation_placeholder',
        endpoint: `change_setup?lang=${userProfileStore.language}&toSelect=yes&metadata=post_implementation_evaluation`,
        fieldName: 'post_change_evaluation',
        mode: 'creation',
        required: isRequired('post_change_evaluation')
      },
      post_change_comment: {
        label: 'change.post_change_comment',
        type: 'sRichTextEditor',
        placeholder: 'change.post_change_comment_placeholder',
        required: isRequired('post_change_comment')
      }
    };
    
    // Supprimer les champs système en mode création
    if (mode === 'for_creation') {
      delete fields.writer_name;
      delete fields.closed_at;
      delete fields.uuid;
      delete fields.created_at;
      delete fields.updated_at;
    }
    
    return fields;
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code
        this.writer_uuid = userProfileStore.id;
        this.requested_by_uuid = userProfileStore.id;
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
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Traiter les listes pour extraire les bonnes valeurs selon le type de liste
    
    // 1. Pour watch_list et related_tickets, extraire les UUIDs
    const uuidLists = ['watch_list', 'related_tickets'];
    uuidLists.forEach(field => {
      if (apiData[field] && Array.isArray(apiData[field]) && apiData[field].length > 0) {
        if (typeof apiData[field][0] === 'object' && apiData[field][0].uuid) {
          // Si les éléments sont des objets avec un UUID, extraire uniquement les UUIDs
          apiData[field] = apiData[field].map(item => item.uuid);
        }
      }
    });
    
    // 2. Pour required_validations, extraire les codes
    if (apiData.required_validations && Array.isArray(apiData.required_validations) && apiData.required_validations.length > 0) {
      if (typeof apiData.required_validations[0] === 'object') {
        // Si les éléments sont des objets, extraire le code au lieu de l'UUID
        apiData.required_validations = apiData.required_validations.map(item => item.code);
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
}
