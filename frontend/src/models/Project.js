import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Project {
  constructor(data = {}) {
    // Identifiant unique du projet
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Nom complet du projet
    this.description = data.description || ''; // Description longue du projet
    this.ticket_status_code = data.ticket_status_code || null; // Statut du projet
    this.ticket_type_code = 'PROJECT'; // ticket de type projet 
    
    // Attributs étendus (core_ext)
    this.key = data.key || ''; // Code unique du projet
    this.start_date = data.start_date || null; // Date de début du projet
    this.end_date = data.end_date || null; // Date de fin prévue/effective
    this.issue_type_scheme_id = data.issue_type_scheme_id || null; // Schéma des types de tickets
    this.visibility = data.visibility || null; // Niveau de visibilité
    this.project_type = data.project_type || null; // Type de projet
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.rel_assigned_to_group = data.rel_assigned_to_group || null; // Référence à une équipe affectée
    this.rel_assigned_to_person = data.rel_assigned_to_person || null; // Référence à l'utilisateur responsable
    this.assigned_group_name = data.assigned_group_name || ''; // Nom de l'équipe assignée
    this.assigned_person_name = data.assigned_person_name || ''; // Nom de la personne assignée
    this.access_to_groups = data.access_to_groups || []; // Groupes ayant accès
    this.access_to_users = data.access_to_users || []; // Utilisateurs ayant accès
    
    // Compteurs de tickets associés
    this.defect_count = data.defect_count || 0; // Nombre de défauts
    this.us_count = data.us_count || 0; // Nombre de user stories
    this.epic_count = data.epic_count || 0; // Nombre d'épics
    this.sprint_count = data.sprint_count || 0; // Nombre de sprints
    
    // Informations sur l'auteur et les dates
    this.writer_name = data.writer_name || ''; // Nom de l'auteur
    this.closed_at = data.closed_at || null; // Date de clôture
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('project.name') },
      { name: 'ticket_status_code', label: i18n.global.t('project.status') },
      { name: 'key', label: i18n.global.t('project.key') },
      { name: 'rel_assigned_to_group', label: i18n.global.t('project.team_id') },
      { name: 'rel_assigned_to_person', label: i18n.global.t('project.lead_user_id') }
    ];
  }

  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Project();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    // Définition de tous les champs
    const fields = {
      // Informations générales
      uuid: {
        label: t('common.id'),
        type: 'sTextField',
        placeholder: t('common.id'),
        disabled: true
      },
      created_at: {
        label: t('common.created_at'),
        type: 'sTextField',
        disabled: true
      },
      writer_name: {
        label: t('common.writer'),
        type: 'sTextField',
        disabled: true
      },
      updated_at: {
        label: t('common.updated_at'),
        type: 'sTextField',
        disabled: true
      },
      closed_at: {
        label: t('common.closed_at'),
        type: 'sTextField',
        disabled: true
      },
      title: {
        label: t('project.name'),
        type: 'sTextField',
        placeholder: t('project.name_placeholder'),
        required: isRequired('title')
      },
      description: {
        label: t('project.description'),
        type: 'sRichTextEditor',
        placeholder: t('project.description_placeholder'),
        required: isRequired('description')
      },
      ticket_status_code: {
        label: t('project.status'),
        type: 'sSelectField',
        placeholder: t('project.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=PROJECT`,
        patchEndpoint: 'projects',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      
      // Attributs étendus
      key: {
        label: t('project.key'),
        type: 'sTextField',
        placeholder: t('project.key_placeholder'),
        required: isRequired('key')
      },
      start_date: {
        label: t('project.start_date'),
        type: 'sDatePicker',
        placeholder: t('project.start_date_placeholder'),
        required: isRequired('start_date')
      },
      end_date: {
        label: t('project.end_date'),
        type: 'sDatePicker',
        placeholder: t('project.end_date_placeholder'),
        required: isRequired('end_date')
      },
      issue_type_scheme_id: {
        label: t('project.issue_type_scheme_id'),
        type: 'sPickList',
        placeholder: t('project.issue_type_scheme_id_placeholder'),
        sourceEndPoint: `symptoms?lang=${userProfileStore.language}`,
        displayedLabel: 'libelle',
        targetEndPoint: 'projects',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('issue_type_scheme_id'), 
        visible: true,
      },
      visibility: {
        label: t('project.visibility'),
        type: 'sSelectField',
        placeholder: t('project.visibility_placeholder'),
        required: isRequired('visibility'),
        endpoint: `project_setup?lang=${userProfileStore.language}&metadata=visibility`,
        fieldName: 'visibility',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      access_to_groups: {
        label: t('project.access_to_groups'),
        type: 'sPickList',
        placeholder: t('project.access_to_groups_placeholder'),
        sourceEndPoint: 'groups',
        displayedLabel: 'group_name',
        targetEndPoint: 'projects',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('access_to_groups'),
        visible: function(obj) {
          return obj && obj.visibility === 'PRIVATE';
        }
      },
      access_to_users: {
        label: t('project.access_to_users'),
        type: 'sPickList',
        placeholder: t('project.access_to_users_placeholder'),
        sourceEndPoint: 'persons',
        displayedLabel: 'person_name',
        targetEndPoint: 'projects',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('access_to_users'),
        visible: function(obj) {
          return obj && obj.visibility === 'RESTRICTED';
        }
      },
      project_type: {
        label: t('project.project_type'),
        type: 'sSelectField',
        placeholder: t('project.project_type_placeholder'),
        required: isRequired('project_type'),
        endpoint: `project_setup?lang=${userProfileStore.language}&metadata=category`,
        fieldName: 'project_type',
        valueField: 'code',
        mode: 'creation'
      },
      
      // Assignation
      rel_assigned_to_group: {
        label: t('project.team_id'),
        type: 'sFilteredSearchField',
        placeholder: t('project.team_id_placeholder'),
        endpoint: ({ rel_assigned_to_person }) => 
          rel_assigned_to_person 
            ? `persons/${rel_assigned_to_person}/groups` 
            : 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'assigned_group_name',
        columnsConfig: [
          { key: 'group_name', label: t('group.name'), visible: true }
        ],
        required: isRequired('rel_assigned_to_group'),
        resetable: true
      },
      rel_assigned_to_person: {
        label: t('project.lead_user_id'),
        type: 'sFilteredSearchField',
        placeholder: t('project.lead_user_id_placeholder'),
        endpoint: ({ rel_assigned_to_group }) => 
          rel_assigned_to_group 
            ? `groups/${rel_assigned_to_group}/members` 
            : 'groups/members',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'assigned_person_name',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('rel_assigned_to_person'),
        resetable: true
      },
      
      // Informations sur l'auteur et les dates
      writer_name: {
        label: t('common.writer_name'),
        type: 'sTextField',
        disabled: true
      },
      closed_at: {
        label: t('common.closure_date'),
        type: 'sTextField',
        disabled: true
      },
      created_at: {
        label: t('common.creation_date'),
        type: 'sTextField',
        disabled: true,
      },
      updated_at: {
        label: t('common.modification_date'),
        type: 'sTextField',
        disabled: true,
      },
      
      // Compteurs de tickets associés
      defect_count: {
        label: t('project.defect_count'),
        type: 'sTextField',
        disabled: true
      },
      us_count: {
        label: t('project.us_count'),
        type: 'sTextField',
        disabled: true,
      },
      epic_count: {
        label: t('project.epic_count'),
        type: 'sTextField',
        disabled: true,
      },
      sprint_count: {
        label: t('project.sprint_count'),
        type: 'sTextField',
        disabled: true,
      }
    };
    
    // Si mode est 'for_creation', supprimer les champs spécifiés
    if (mode === 'for_creation') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at'];
      fieldsToRemove.forEach(field => {
        if (fields[field]) {
          delete fields[field];
        }
      });
    }
    
    return fields;
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des projets
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('project.name'), type: 'text', format: 'text' },
      { key: 'key', label: t('project.key'), type: 'text', format: 'text' },
      { key: 'ticket_status_label', label: t('project.status'), type: 'text', format: 'text' },
      { key: 'description', label: t('project.description'), type: 'text', format: 'html' },
      { key: 'start_date', label: t('project.start_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'end_date', label: t('project.end_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'defect_count', label: t('project.defect_count'), type: 'text', format: 'text' },
      { key: 'us_count', label: t('project.us_count'), type: 'text', format: 'text' },
      { key: 'epic_count', label: t('project.epic_count'), type: 'text', format: 'text' },
      { key: 'sprint_count', label: t('project.sprint_count'), type: 'text', format: 'text' },
      { key: 'visibility_label', label: t('project.visibility'), type: 'text', format: 'text' },
      { key: 'project_type_label', label: t('project.project_type'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('project.team_id'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('project.lead_user_id'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les projets
   * @returns {string} URL de l'endpoint API
   */
  static getApiEndpoint() {
    const userProfileStore = useUserProfileStore();
    return `tickets?ticket_type=PROJECT&lang=${userProfileStore.language}`;
  }

  /**
   * Récupère un projet par son ID
   * @param {string} id - ID du projet à récupérer
   * @returns {Promise<Project>} Instance du projet récupéré
   */
  static async getById(id) {
    const userProfileStore = useUserProfileStore();
    const endpoint = `tickets/${id}?lang=${userProfileStore.language}`;
    const data = await import('@/services/apiService').then(module => module.default.get(endpoint));
    return new Project(data);
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code si nécessaire
        this.writer_uuid = userProfileStore.id;
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Project.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Pour POST, supprimer les champs spécifiés qui ne doivent pas être envoyés lors de la création
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at', 'defect_count', 'us_count', 'epic_count', 'sprint_count'];
      fieldsToRemove.forEach(field => {
        if (field in apiData) {
          delete apiData[field];
        }
      });
    }
    
    // Traiter les listes pour extraire uniquement les UUIDs ou codes selon le champ
    const uuidListFields = ['access_to_groups', 'access_to_users'];
    
    // Traiter les champs qui utilisent uuid
    uuidListFields.forEach(field => {
      if (apiData[field] && Array.isArray(apiData[field]) && apiData[field].length > 0) {
        if (typeof apiData[field][0] === 'object' && apiData[field][0].uuid) {
          // Si les éléments de la liste sont des objets avec un UUID, extraire uniquement les UUIDs
          apiData[field] = apiData[field].map(item => item.uuid);
        }
      }
    });
    
    // Traiter spécifiquement issue_type_scheme_id qui utilise le champ code
    if (apiData.issue_type_scheme_id && Array.isArray(apiData.issue_type_scheme_id) && apiData.issue_type_scheme_id.length > 0) {
      if (typeof apiData.issue_type_scheme_id[0] === 'object' && apiData.issue_type_scheme_id[0].code) {
        // Extraire uniquement les codes
        apiData.issue_type_scheme_id = apiData.issue_type_scheme_id.map(item => item.code);
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
