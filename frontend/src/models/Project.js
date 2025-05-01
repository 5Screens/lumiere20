import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useObjectStore } from '../stores/objectStore'

export class Project {
  constructor(data = {}) {
    // Identifiant unique du projet
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Nom complet du projet
    this.description = data.description || ''; // Description longue du projet
    this.rel_status_code = data.rel_status_code || null; // Statut du projet
    
    // Attributs étendus (core_ext)
    this.key = data.key || ''; // Code unique du projet
    this.start_date = data.start_date || null; // Date de début du projet
    this.end_date = data.end_date || null; // Date de fin prévue/effective
    this.issue_type_scheme_id = data.issue_type_scheme_id || null; // Schéma des types de tickets
    this.visibility = data.visibility || null; // Niveau de visibilité
    this.project_type = data.project_type || null; // Type de projet
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.team_id = data.team_id || null; // Référence à une équipe affectée
    this.lead_user_id = data.lead_user_id || null; // Référence à l'utilisateur responsable
    this.access_to_groups = data.access_to_groups || []; // Groupes ayant accès
    this.access_to_users = data.access_to_users || []; // Utilisateurs ayant accès
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('project.name') },
      { name: 'rel_status_code', label: i18n.global.t('project.status') },
      { name: 'key', label: i18n.global.t('project.key') },
      { name: 'team_id', label: i18n.global.t('project.team_id') },
      { name: 'lead_user_id', label: i18n.global.t('project.lead_user_id') }
    ];
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Project();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      // Informations générales
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
      rel_status_code: {
        label: t('project.status'),
        type: 'sSelectField',
        placeholder: t('project.status_placeholder'),
        required: isRequired('rel_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=PROJECT`,
        patchEndpoint: 'projects',
        fieldName: 'rel_status_code',
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
        displayedLabel: 'symptom_label',
        targetEndPoint: 'projects',
        target_uuid: null,
        pickedItems: null,
        required: isRequired('issue_type_scheme_id')
      },
      visibility: {
        label: t('project.visibility'),
        type: 'sSelectField',
        placeholder: t('project.visibility_placeholder'),
        required: isRequired('visibility'),
        endpoint: `project_setup?lang=${userProfileStore.language}&metadata=visibility`,
        fieldName: 'visibility',
        valueField: 'code',
        mode: 'creation'
      },
      access_to_groups: {
        label: t('project.access_to_groups'),
        type: 'sPickList',
        placeholder: t('project.access_to_groups_placeholder'),
        sourceEndPoint: 'groups',
        displayedLabel: 'groupe_name',
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
        displayedLabel: 'first_name',
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
      team_id: {
        label: t('project.team_id'),
        type: 'sFilteredSearchField',
        placeholder: t('project.team_id_placeholder'),
        endpoint: ({ lead_user_id }) => 
          lead_user_id 
            ? `persons/${lead_user_id}/groups` 
            : 'groups',
        displayField: 'groupe_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'groupe_name', label: t('group.name'), visible: true }
        ],
        required: isRequired('team_id')
      },
      lead_user_id: {
        label: t('project.lead_user_id'),
        type: 'sFilteredSearchField',
        placeholder: t('project.lead_user_id_placeholder'),
        endpoint: ({ team_id }) => 
          team_id 
            ? `groups/${team_id}/members` 
            : 'groups/members',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('lead_user_id')
      }
    };
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid et ticket_type_code si nécessaire
        this.writer_uuid = userProfileStore.id;
        this.ticket_type_code = 'PROJECT';
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
    
    // Traiter les listes pour extraire uniquement les UUIDs si ce sont des objets complets
    const listFields = ['access_to_groups', 'access_to_users'];
    
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
