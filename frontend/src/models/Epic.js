import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Epic {
  constructor(data = {}) {
    // Identifiant unique de l'epic
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Nom de l'epic
    this.description = data.description || ''; // Description détaillée de l'epic
    this.ticket_status_code = data.ticket_status_code || null; // Statut de l'epic
    this.ticket_type_code = 'EPIC'; // ticket de type epic
    
    // Attributs étendus (core_extended_attributes)
    this.project_id = data.project_id || null; // Projet parent
    this.start_date = data.start_date || null; // Date de début de l'epic
    this.end_date = data.end_date || null; // Date de fin prévue/effective
    this.progress_percent = data.progress_percent || 0; // Pourcentage d'avancement
    this.color = data.color || null; // Couleur associée à l'epic
    this.tags = data.tags || []; // Tags associés à l'epic
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.closed_at = data.closed_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('epic.name') },
      { name: 'ticket_status_code', label: i18n.global.t('epic.status') },
      { name: 'project_id', label: i18n.global.t('epic.project_id') }
    ];
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Epic();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    return {
      // Informations générales
      title: {
        label: t('epic.name'),
        type: 'sTextField',
        placeholder: t('epic.name_placeholder'),
        required: isRequired('title')
      },
      description: {
        label: t('epic.description'),
        type: 'sRichTextEditor',
        placeholder: t('epic.description_placeholder'),
        required: isRequired('description')
      },
      ticket_status_code: {
        label: t('epic.status'),
        type: 'sSelectField',
        placeholder: t('epic.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=EPIC`,
        patchEndpoint: 'tickets',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      
      // Attributs étendus
      project_id: {
        label: t('epic.project_id'),
        type: 'sFilteredSearchField',
        placeholder: t('epic.project_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        columnsConfig: [
          { key: 'title', label: t('project.name'), visible: true },
          { key: 'key', label: t('project.key'), visible: true }
        ],
        required: isRequired('project_id')
      },
      start_date: {
        label: t('epic.start_date'),
        type: 'sDatePicker',
        placeholder: t('epic.start_date_placeholder'),
        required: isRequired('start_date')
      },
      end_date: {
        label: t('epic.end_date'),
        type: 'sDatePicker',
        placeholder: t('epic.end_date_placeholder'),
        required: isRequired('end_date')
      },
      progress_percent: {
        label: t('epic.progress_percent'),
        type: 'sTextField',
        placeholder: t('epic.progress_percent_placeholder'),
        required: isRequired('progress_percent'),
        inputType: 'number'
      },
      color: {
        label: t('epic.color'),
        type: 'sTextField',
        placeholder: t('epic.color_placeholder'),
        required: isRequired('color')
      },
      tags: {
        label: t('epic.tags'),
        type: 'sTagsField',
        placeholder: t('epic.tags_placeholder'),
        required: isRequired('tags'),
        comboBox: false
      }
    };
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
        console.error(`[Epic.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;
    
    // Traiter les tags si nécessaire
    if (apiData.tags && Array.isArray(apiData.tags) && apiData.tags.length > 0) {
      if (typeof apiData.tags[0] === 'object' && apiData.tags[0].name) {
        // Si les éléments de la liste sont des objets avec un name, extraire uniquement les noms
        apiData.tags = apiData.tags.map(item => item.name);
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
