import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Knowledge_article {
  constructor(data = {}) {
    // Métadonnées d'identification et de classification
    this.uuid = data.uuid || null;
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
    this.rel_ticket_type = data.rel_ticket_type || null;
    this.tickets_list = data.tickets_list || [];
    this.business_scope = data.business_scope || [];

    // Gouvernance et cycle de vie
    this.writer_uuid = data.writer_uuid || null;
    this.rel_publication_status = data.rel_publication_status || null;
    this.version = data.version || '';
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.last_review_at = data.last_review_at || null;
    this.next_review_at = data.next_review_at || null;
    this.license_type = data.license_type || '';

    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('knowledge_article.title') },
      { name: 'description', label: i18n.global.t('knowledge_article.description') },
      { name: 'rel_category', label: i18n.global.t('knowledge_article.category') },
      { name: 'rel_lang', label: i18n.global.t('knowledge_article.lang') },
      { name: 'rel_confidentiality_level', label: i18n.global.t('knowledge_article.confidentiality_level') }
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
        displayField: 'nom',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'nom', label: t('configuration_item.nom'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true }
        ],
        required: isRequired('configuration_item_uuid')
      },
      rel_ticket_type: {
        label: t('knowledge_article.ticket_type'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.ticket_type_placeholder'),
        required: isRequired('rel_ticket_type'),
        endpoint: `ticket_types?lang=${userProfileStore.language}`,
        fieldName: 'rel_ticket_type',
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
      rel_publication_status: {
        label: t('knowledge_article.publication_status'),
        type: 'sSelectField',
        placeholder: t('knowledge_article.publication_status_placeholder'),
        required: isRequired('rel_publication_status'),
        endpoint: `knowledge_setup?lang=${userProfileStore.language}&metadata=publication_status`,
        fieldName: 'rel_publication_status',
        mode: 'creation',
        valueField: 'code'
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
    
    // Traiter les listes pour extraire uniquement les UUIDs si ce sont des objets complets
    const listFields = ['keywords', 'rel_target_audience', 'rel_service_offerings', 'attachments', 'tickets_list', 'business_scope'];
    
    listFields.forEach(field => {
      if (apiData[field] && Array.isArray(apiData[field]) && apiData[field].length > 0) {
        if (typeof apiData[field][0] === 'object' && apiData[field][0].uuid) {
          // Si les éléments de la liste sont des objets avec un UUID, extraire uniquement les UUIDs
          apiData[field] = apiData[field].map(item => item.uuid);
        }
      }
    });
    
    // Créer un objet pour les attributs étendus
    const extendedAttributes = {};
    const extendedFields = [
      'rel_category', 'keywords', 'rel_service', 'rel_service_offerings', 
      'rel_target_audience', 'rel_lang', 'rel_confidentiality_level',
      'summary', 'prerequisites', 'limitations', 'security_notes', 'attachments',
      'rel_ticket_type', 'tickets_list', 'business_scope',
      'rel_publication_status', 'version', 'last_review_at', 'next_review_at'
    ];
    
    // Ajouter les attributs étendus à l'objet extendedAttributes
    extendedFields.forEach(field => {
      if (apiData[field] !== null && apiData[field] !== undefined) {
        extendedAttributes[field] = apiData[field];
        // Supprimer le champ de l'objet principal
        delete apiData[field];
      }
    });
    
    // Ajouter l'objet extendedAttributes à apiData
    if (Object.keys(extendedAttributes).length > 0) {
      apiData.extended_attributes = extendedAttributes;
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
