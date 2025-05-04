import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Story {
  constructor(data = {}) {
    // Identifiant unique de la story
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Titre de la story
    this.description = data.description || ''; // Description détaillée de la story
    this.ticket_status_code = data.ticket_status_code || null; // Statut de la story
    this.ticket_type_code = 'USER_STORY'; // ticket de type user story
    
    // Informations sur les personnes
    this.writer_uuid = data.writer_uuid || null; // Personne qui saisit la story dans le système
    this.requested_for_uuid = data.requested_for_uuid || null; // Source du besoin, responsable de l'expression de la valeur
    
    // Attributs étendus (core_extended_attributes)
    this.project_id = data.project_id || null; // Projet parent
    this.epic_id = data.epic_id || null; // Epic parent
    this.sprint_id = data.sprint_id || null; // Sprint associé
    this.story_points = data.story_points || null; // Points de story
    this.priority = data.priority || null; // Priorité de la story
    this.acceptance_criteria = data.acceptance_criteria || ''; // Critères d'acceptation
    this.tags = data.tags || []; // Tags associés à la story
    this.settings = data.settings || {}; // Paramètres additionnels
    
    // Assignation (stockée dans rel_tickets_groups_persons)
    this.rel_assigned_to_group = data.rel_assigned_to_group || null; // Équipe assignée au projet
    this.rel_assigned_to_person = data.rel_assigned_to_person || null; // Personne chargée de réaliser techniquement la story
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('story.title') },
      { name: 'ticket_status_code', label: i18n.global.t('story.status') },
      { name: 'project_id', label: i18n.global.t('story.project_id') }
    ];
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Story();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      // Informations générales
      project_id: {
        label: t('story.project_id'),
        type: 'sFilteredSearchField',
        placeholder: t('story.project_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: t('project.name'), visible: true },
          { key: 'key', label: t('project.key'), visible: true }
        ],
        required: isRequired('project_id')
      },
      title: {
        label: t('story.title'),
        type: 'sTextField',
        placeholder: t('story.title_placeholder'),
        required: isRequired('title')
      },
      epic_id: {
        label: t('story.epic_id'),
        type: 'sSelectField',
        placeholder: t('story.epic_id_placeholder'),
        required: isRequired('epic_id'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/epics` : '',
        fieldName: 'epic_id',
        displayField: 'title',
        valueField: 'uuid',
        mode: 'creation'
      },
      sprint_id: {
        label: t('story.sprint_id'),
        type: 'sSelectField',
        placeholder: t('story.sprint_id_placeholder'),
        required: isRequired('sprint_id'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/sprints` : '',
        fieldName: 'sprint_id',
        displayField: 'title',
        valueField: 'uuid',
        mode: 'creation'
      },
      rel_assigned_to_person: {
        label: t('story.assignee'),
        type: 'sSelectField',
        placeholder: ({ project_id }) => project_id ? t('story.assignee_placeholder') : t('story.assignee_placeholder_if_empty_team'),
        required: isRequired('assignee'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/team/members` : '',
        fieldName: 'assignee',
        displayField: 'full_name',
        valueField: 'uuid',
        mode: 'creation'
      },
      description: {
        label: t('story.description'),
        type: 'sRichTextEditor',
        placeholder: t('story.description_placeholder'),
        required: isRequired('description')
      },
      ticket_status_code: {
        label: t('story.status'),
        type: 'sSelectField',
        placeholder: t('story.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=USER_STORY`,
        patchEndpoint: 'tickets',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: t('story.reporter'),
        type: 'sFilteredSearchField',
        placeholder: t('story.reporter_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: isRequired('requested_for_uuid')
      },
      story_points: {
        label: t('story.story_points'),
        type: 'sTextField',
        placeholder: t('story.story_points_placeholder'),
        required: isRequired('story_points'),
        inputType: 'number'
      },
      priority: {
        label: t('story.priority'),
        type: 'sTextField',
        placeholder: t('story.priority_placeholder'),
        required: isRequired('priority')
      },
      acceptance_criteria: {
        label: t('story.acceptance_criteria'),
        type: 'sRichTextEditor',
        placeholder: t('story.acceptance_criteria_placeholder'),
        required: isRequired('acceptance_criteria')
      },
      tags: {
        label: t('story.tags'),
        type: 'sTagsList',
        placeholder: t('story.tags_placeholder'),
        required: isRequired('tags'),
        comboBox: false
      }
    };
  }

  toAPI(method) {
    const userProfileStore = useUserProfileStore();
    
    switch (method.toUpperCase()) {
      case 'POST':
        // Pour POST, définir writer_uuid si nécessaire
        this.writer_uuid = userProfileStore.id;
        break;
      case 'PUT':
      case 'PATCH':
        // Ne rien faire pour PUT et PATCH
        break;
      default:
        console.error(`[Story.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
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
