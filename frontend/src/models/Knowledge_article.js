import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Knowledge_article {
  /**
   * Retourne les colonnes pour l'affichage dans le tableau des articles de connaissance
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('knowledge_article.title'), type: 'text', format: 'text' },
      { key: 'summary', label: t('knowledge_article.summary'), type: 'text', format: 'html' },
      { key: 'keywords', label: t('knowledge_article.keywords'), type: 'text', format: 'tags' },
      { key: 'description', label: t('knowledge_article.description'), type: 'text', format: 'html' },
      { key: 'prerequisites', label: t('knowledge_article.prerequisites'), type: 'text', format: 'html' },
      { key: 'limitations', label: t('knowledge_article.limitations'), type: 'text', format: 'html' },
      { key: 'security_notes', label: t('knowledge_article.security_notes'), type: 'text', format: 'html' },
      { key: 'ticket_status_label', label: t('knowledge_article.publication_status'), type: 'text', format: 'text' },
      { key: 'rel_category_label', label: t('knowledge_article.category'), type: 'text', format: 'text' },
      { key: 'rel_involved_process_label', label: t('knowledge_article.involved_process'), type: 'text', format: 'text' },
      { key: 'rel_target_audience_label', label: t('knowledge_article.target_audience'), type: 'text', format: 'tags' },
      { key: 'business_scope_label', label: t('knowledge_article.business_scope'), type: 'text', format: 'tags' },
      { key: 'rel_service_name', label: t('knowledge_article.service'), type: 'text', format: 'text' },
      { key: 'rel_service_offerings_name', label: t('knowledge_article.service_offerings'), type: 'text', format: 'text' },
      { key: 'configuration_item_name', label: t('knowledge_article.configuration_item'), type: 'text', format: 'text' },
      { key: 'rel_lang_name', label: t('knowledge_article.lang'), type: 'text', format: 'text' },
      { key: 'rel_confidentiality_level_label', label: t('knowledge_article.confidentiality_level'), type: 'text', format: 'text' },
      { key: 'version', label: t('knowledge_article.version'), type: 'text', format: 'text' },
      { key: 'writer_name', label: t('knowledge_article.writer'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('knowledge_article.assigned_group'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('knowledge_article.assigned_to_person'), type: 'text', format: 'text' },
      { key: 'license_type', label: t('knowledge_article.license_type'), type: 'text', format: 'text' },
      { key: 'attachments_count', label: t('knowledge_article.attachments_count'), type: 'text', format: 'text' },
      { key: 'tieds_tickets_count', label: t('knowledge_article.tieds_tickets_count'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'last_review_at', label: t('knowledge_article.last_review_at'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'next_review_at', label: t('knowledge_article.next_review_at'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  // Méthode statique pour obtenir l'endpoint API
  static getApiEndpoint() {
    const userProfileStore = useUserProfileStore();
    return `tickets?ticket_type=KNOWLEDGE&lang=${userProfileStore.language}`;
  }
  constructor(data = {}) {
    // Métadonnées d'identification et de classification
    this.uuid = data.uuid || null;
    this.ticket_type_code = data.ticket_type_code || null;
    this.rel_category = data.rel_category || null;
    this.keywords = data.keywords || [];
    this.rel_service = data.rel_service || null;
    this.rel_service_offerings = data.rel_service_offerings || [];
    this.rel_target_audience = data.rel_target_audience || [];
    this.rel_lang = data.rel_lang || null;
    this.rel_confidentiality_level = data.rel_confidentiality_level || null;

    // Contenu et structure de l'article
    this.title = data.title || '';
    this.summary = data.summary || '';
    this.description = data.description || '';
    this.prerequisites = data.prerequisites || '';
    this.limitations = data.limitations || '';
    this.security_notes = data.security_notes || '';
    this.attachments = data.attachments || [];

    // Contexte opérationnel et liens
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    this.rel_involved_process = data.rel_involved_process || null;
    this.tickets_list = data.tickets_list || [];
    this.business_scope = data.business_scope || [];

    // Gouvernance et cycle de vie
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.version = data.version || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.last_review_at = data.last_review_at || null;
    this.next_review_at = data.next_review_at || null;
    this.license_type = data.license_type || '';

    // Assignation (stockée dans rel_tickets_groups_persons)
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;

    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('knowledge_article.title') },
      { name: 'ticket_status_code', label: i18n.global.t('knowledge_article.publication_status') },
      { name: 'description', label: i18n.global.t('knowledge_article.description') },
      { name: 'rel_category', label: i18n.global.t('knowledge_article.category') },
      { name: 'rel_lang', label: i18n.global.t('knowledge_article.lang') },
      { name: 'rel_confidentiality_level', label: i18n.global.t('knowledge_article.confidentiality_level'), },
      { name: 'assigned_to_group', label: i18n.global.t('knowledge_article.assigned_group') },
      { name: 'version', label: i18n.global.t('knowledge_article.version') },
      /*{ name: 'attachments', label: i18n.global.t('knowledge_article.attachments') }*/
    ];
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Knowledge_article();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      // Catégorie
      rel_category: {
        label: t('knowledge_article.category'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.category_placeholder'),
        required: isRequired('rel_category'),
        endpoint: `knowledge_setup?lang=${userProfileStore.language}&metadata=category`,
        fieldName: 'rel_category',
        mode: 'creation',
        valueField: 'code',
      },
      // Contenu et structure de l'article
      title: {
        label: t('knowledge_article.title'),
        type: 'sTextField',
        placeholder: t('knowledge_article.title_placeholder'),
        required: isRequired('title')
      },
      summary: {
        label: t('knowledge_article.summary'),
        type: 'sRichTextEditor',
        placeholder: t('knowledge_article.summary_placeholder'),
        required: isRequired('summary')
      },
      description: {
        label: t('knowledge_article.description'),
        type: 'sRichTextEditor',
        placeholder: t('knowledge_article.description_placeholder'),
        required: isRequired('description')
      },
      prerequisites: {
        label: t('knowledge_article.prerequisites'),
        type: 'sRichTextEditor',
        placeholder: t('knowledge_article.prerequisites_placeholder'),
        required: isRequired('prerequisites')
      },
      limitations: {
        label: t('knowledge_article.limitations'),
        type: 'sRichTextEditor',
        placeholder: t('knowledge_article.limitations_placeholder'),
        required: isRequired('limitations')
      },
      security_notes: {
        label: t('knowledge_article.security_notes'),
        type: 'sRichTextEditor',
        placeholder: t('knowledge_article.security_notes_placeholder'),
        required: isRequired('security_notes')
      },
      attachments: {
        label: t('knowledge_article.attachments'),
        type: 'sFileUploader',
        placeholder: t('knowledge_article.attachments_placeholder'),
        helperText: t('fileUploader.limits_info'),
        required: isRequired('attachments')
      },

// Métadonnées d'identification et de classification
      keywords: {
        label: t('knowledge_article.keywords'),
        type: 'sTagsList',
        placeholder: t('knowledge_article.keywords_placeholder'),
        required: isRequired('keywords'),
        comboBox: false
      },
      rel_service: {
        label: t('knowledge_article.service'),
        type: 'sFilteredSearchField',
        placeholder: t('knowledge_article.service_placeholder'),
        endpoint: 'services',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service.name'), visible: true },
          { key: 'description', label: t('service.description'), visible: false },
          { key: 'owning_entity_name', label: t('service.owning_entity_name'), visible: true }
        ],
        required: isRequired('rel_service')
      },
      rel_service_offerings: {
        label: t('knowledge_article.service_offerings'),
        type: 'sFilteredSearchField',
        placeholder: t('knowledge_article.service_offerings_placeholder'),
        endpoint: 'service_offerings',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('service_offering.name'), visible: true },
          { key: 'service_name', label: t('service_offering.service_name'), visible: true }
        ],
        required: isRequired('rel_service_offerings')
      },
      assigned_to_group: {
        label: t('knowledge_article.assigned_group'),
        type: 'sFilteredSearchField',
        placeholder: t('knowledge_article.assigned_group_placeholder'),
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
        label: t('knowledge_article.assigned_to_person'),
        type: 'sFilteredSearchField',
        placeholder: t('knowledge_article.assigned_to_person_placeholder'),
        endpoint: ({ assigned_to_group }) => 
          assigned_to_group 
          ? `groups/${assigned_to_group}/members` 
          : 'groups/members',
        displayField: 'person_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('assigned_to_person')
      },
      rel_target_audience: {
        type: 'sTagsList',
        comboBox: true,
        edition: false,
        required: isRequired('rel_target_audience'),
        label: t('knowledge_article.target_audience'),
        placeholder: t('knowledge_article.target_audience_placeholder'),
        sourceEndPoint: `knowledge_setup?lang=${userProfileStore.language}&metadata=target_audience`,
        displayedLabel: 'label',
        fieldName: 'rel_target_audience',
        mode: 'creation'
      },
      rel_lang: {
        label: t('knowledge_article.lang'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.lang_placeholder'),
        required: isRequired('rel_lang'),
        endpoint: 'languages?is_active=yes',
        fieldName: 'rel_lang',
        mode: 'creation'
      },
      rel_confidentiality_level: {
        label: t('knowledge_article.confidentiality_level'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.confidentiality_level_placeholder'),
        required: isRequired('rel_confidentiality_level'),
        endpoint: `knowledge_setup?lang=${userProfileStore.language}&metadata=confidentiality_level`,
        fieldName: 'rel_confidentiality_level',
        mode: 'creation',
        valueField: 'code'
      },

      

      // Contexte opérationnel et liens
      configuration_item_uuid: {
        label: t('knowledge_article.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('knowledge_article.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'name', label: t('configuration_item.name'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ],
        required: isRequired('configuration_item_uuid')
      },
      rel_involved_process: {
        label: t('knowledge_article.involved_process'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.involved_process_placeholder'),
        required: isRequired('rel_involved_process'),
        endpoint: `ticket_types?lang=${userProfileStore.language}`,
        fieldName: 'rel_involved_process',
        mode: 'creation',
        valueField: 'code'
      },
      tickets_list: {
        label: t('knowledge_article.tickets_list'),
        type: 'sPickList',
        placeholder: t('knowledge_article.tickets_list_placeholder'),
        sourceEndPoint: 'tickets',
        displayedLabel: 'title',
        targetEndPoint: 'knowledge_articles',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('tickets_list')
      },
      business_scope: {
        type: 'sTagsList',
        comboBox: true,
        edition: false,
        required: isRequired('business_scope'),
        label: t('knowledge_article.business_scope'),
        placeholder: t('knowledge_article.business_scope_placeholder'),
        sourceEndPoint: `knowledge_setup?lang=${userProfileStore.language}&metadata=business_scope`,
        displayedLabel: 'label',
        fieldName: 'business_scope'
      },

      // Gouvernance et cycle de vie
      ticket_status_code: {
        label: t('knowledge_article.publication_status'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.publication_status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=KNOWLEDGE`,
        fieldName: 'ticket_status_code',
        mode: 'creation',
        valueField: 'value'
      },
      version: {
        label: t('knowledge_article.version'),
        type: 'sTextField',
        placeholder: t('knowledge_article.version_placeholder'),
        required: isRequired('version')
      },
      last_review_at: {
        label: t('knowledge_article.last_review_at'),
        type: 'sDatePicker',
        placeholder: t('knowledge_article.last_review_at_placeholder'),
        required: isRequired('last_review_at')
      },
      next_review_at: {
        label: t('knowledge_article.next_review_at'),
        type: 'sDatePicker',
        placeholder: t('knowledge_article.next_review_at_placeholder'),
        required: isRequired('next_review_at')
      },
      license_type: {
        label: t('knowledge_article.license_type'),
        type: 'sTextField',
        placeholder: t('knowledge_article.license_type_placeholder'),
        required: isRequired('license_type')
      }
    };
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid
        this.writer_uuid = userProfileStore.id;
        this.ticket_type_code = 'KNOWLEDGE';
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Knowledge_article.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    delete apiData.attachments;
    
    // Traiter les listes selon leur type spécifique
    // 1. Pour rel_target_audience et business_scope, utiliser le code au lieu de l'uuid (sTagsList.vue)
    // 2. Pour keywords et rel_service_offerings, conserver les valeurs telles quelles
    // 3. Pour attachments, utiliser le formData (sFileUploader.vue)
    // 4. Pour tickets_list, extraire uniquement les UUIDs
  
    // Traitement pour tickets_list (extraction des UUIDs)
    if (apiData.tickets_list && Array.isArray(apiData.tickets_list) && apiData.tickets_list.length > 0) {
      if (typeof apiData.tickets_list[0] === 'object' && apiData.tickets_list[0].uuid) {
        apiData.tickets_list = apiData.tickets_list.map(item => item.uuid);
      }
    }
  
    // Traitement pour rel_target_audience et business_scope (utiliser le code)
    ['rel_target_audience', 'business_scope'].forEach(field => {
      if (apiData[field] && Array.isArray(apiData[field]) && apiData[field].length > 0) {
        if (typeof apiData[field][0] === 'object') {
          // Utiliser le code au lieu de l'uuid pour ces champs
          apiData[field] = apiData[field].map(item => item.code || item);
        }
      }
    });
  
    // Pour keywords et rel_service_offerings, aucun traitement spécial nécessaire
    // Ils sont déjà dans le format attendu
  
    // Pour attachments, on conserve le formData tel quel
    // Le composant sFileUploader.vue s'occupe déjà de la préparation des données
  
    // Ne pas créer d'objet extended_attributes - laisser tous les champs à plat
    // Simplement nettoyer les champs vides
    
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
