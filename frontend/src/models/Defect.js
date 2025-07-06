import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Defect {
  constructor(data = {}) {
    // Identifiant unique du défaut
    this.uuid = data.uuid || null;
    this.title = data.title || ''; // Titre du défaut
    this.description = data.description || ''; // Description détaillée du défaut
    this.ticket_status_code = data.ticket_status_code || null; // Statut du défaut
    this.ticket_type_code = 'DEFECT'; // Type de ticket (défaut)
    
    // Informations sur les personnes
    this.writer_uuid = data.writer_uuid || null; // Personne qui saisit le défaut dans le système
    this.writer_name = data.writer_name || null; // Nom de la personne qui saisit le défaut
    this.requested_by_uuid = data.requested_by_uuid || null; // Personne qui rapporte le défaut
    this.requested_by_name = data.requested_by_name || null; // Nom de la personne qui rapporte le défaut
    this.requested_for_uuid = data.requested_for_uuid || null; // Personne qui a détecté le défaut
    this.requested_for_name = data.requested_for_name || null; // Nom de la personne qui a détecté le défaut
    this.rel_assigned_to_person = data.rel_assigned_to_person || null; // Personne assignée
    this.assigned_person_name = data.assigned_person_name || null; // Nom de la personne assignée
    
    // Attributs étendus (core_extended_attributes)
    this.severity = data.severity || null; // Sévérité du défaut
    this.impact_area = data.impact_area || null; // Zone d'impact
    this.environment = data.environment || null; // Environnement où le défaut a été détecté
    this.project_id = data.project_id || null; // Projet associé
    this.project_name = data.project_name || null; // Nom du projet associé
    this.epic_id = data.epic_id || null; // Epic parent
    this.sprint_id = data.sprint_id || null; // Sprint associé
    this.steps_to_reproduce = data.steps_to_reproduce || ''; // Étapes pour reproduire
    this.expected_behavior = data.expected_behavior || ''; // Comportement attendu
    this.workaround = data.workaround || ''; // Solution de contournement
    this.tags = data.tags || []; // Tags associés au défaut
    this.attachments = data.attachments || []; // Pièces jointes
    
    // Champs non inclus dans getRenderableFields
    this.root_cause = data.root_cause || null; // Cause racine
    this.priority = data.priority || null; // Priorité du défaut
    this.created_at = data.created_at || null; // Date de création
    this.updated_at = data.updated_at || null; // Date de mise à jour
    this.closed_at = data.closed_at || null; // Date de clôture
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'title', label: i18n.global.t('defect.title') },
      { name: 'description', label: i18n.global.t('defect.description') },
      { name: 'severity', label: i18n.global.t('defect.severity') },
      { name: 'project_id', label: i18n.global.t('defect.project_id') },
      { name: 'ticket_status_code', label: i18n.global.t('defect.ticket_status_code') }
    ];
  }

  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Defect();
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
        label: t('defect.title'),
        type: 'sTextField',
        placeholder: t('defect.title_placeholder'),
        required: isRequired('title')
      },
      ticket_status_code: {
        label: t('defect.status'),
        type: 'sSelectField',
        placeholder: t('defect.status_placeholder'),
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=DEFECT`,
        patchEndpoint: 'defects',
        fieldName: 'ticket_status_code',
        displayField: 'label',
        valueField: 'value',
        mode: 'creation'
      },
      description: {
        label: t('defect.description'),
        type: 'sRichTextEditor',
        placeholder: t('defect.description_placeholder'),
        required: isRequired('description')
      },
      severity: {
        label: t('defect.severity'),
        type: 'sSelectField',
        placeholder: t('defect.severity_placeholder'),
        required: isRequired('severity'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=SEVERITY`,
        fieldName: 'severity',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      impact_area: {
        label: t('defect.impact_area'),
        type: 'sSelectField',
        placeholder: t('defect.impact_area_placeholder'),
        required: isRequired('impact_area'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=IMPACT`,
        fieldName: 'impact_area',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      environment: {
        label: t('defect.environment'),
        type: 'sSelectField',
        placeholder: t('defect.environment_placeholder'),
        required: isRequired('environment'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=ENVIRONMENT`,
        fieldName: 'environment',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: t('defect.detected_by'),
        type: 'sFilteredSearchField',
        placeholder: t('defect.detected_by_placeholder'),
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_for_name',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('requested_for_uuid')
      },
      requested_by_uuid: {
        label: t('defect.reported_by'),
        type: 'sFilteredSearchField',
        placeholder: t('defect.reported_by_placeholder'),
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_by_name',
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: isRequired('requested_by_uuid')
      },
      project_id: {
        label: t('defect.project_id'),
        type: 'sFilteredSearchField',
        placeholder: t('defect.project_id_placeholder'),
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'project_name',
        columnsConfig: [
          { key: 'title', label: t('project.name'), visible: true },
          { key: 'key', label: t('project.key'), visible: true }
        ],
        required: isRequired('project_id')
      },
      rel_assigned_to_person: {
        label: t('defect.assignee'),
        type: 'sSelectField',
        placeholder: t('defect.assignee_placeholder'),
        required: isRequired('assignee'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/team/members` : '',
        fieldName: 'rel_assigned_to_person',
        displayField: 'full_name',
        valueField: 'uuid',
        mode: 'creation'
      },
      steps_to_reproduce: {
        label: t('defect.steps_to_reproduce'),
        type: 'sRichTextEditor',
        placeholder: t('defect.steps_to_reproduce_placeholder'),
        required: isRequired('steps_to_reproduce')
      },
      expected_behavior: {
        label: t('defect.expected_behavior'),
        type: 'sRichTextEditor',
        placeholder: t('defect.expected_behavior_placeholder'),
        required: isRequired('expected_behavior')
      },
      workaround: {
        label: t('defect.workaround'),
        type: 'sRichTextEditor',
        placeholder: t('defect.workaround_placeholder'),
        required: isRequired('workaround')
      },
      tags: {
        label: t('defect.tags'),
        type: 'sTagsList',
        placeholder: t('defect.tags_placeholder'),
        required: isRequired('tags'),
        comboBox: false
      },
      attachments: {
        label: t('defect.attachments'),
        type: 'sFileUploader',
        placeholder: t('defect.attachments_placeholder'),
        helperText: t('defect.attachments_helper_text'),
        required: isRequired('attachments'),
        edition: false,
        fieldName: 'DEFECT'
      }
    };
  
    // Supprimer les champs système en mode création
    if (mode === 'for_creation') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at'];
      fieldsToRemove.forEach(field => {
        if (field in fields) {
          delete fields[field];
        }
      });
    }
    
    return fields;
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
        console.error(`[Defect.toAPI] Error: Unsupported HTTP method: ${method}`);
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Créer une copie de l'objet sans l'attribut requiredFields
    const apiData = { ...this };
    delete apiData.requiredFields;

    // Supprimer les attachments car ils sont gérés séparément par le composant sFileUploader
    delete apiData.attachments;
    
    // Pour POST, supprimer les champs spécifiés qui ne doivent pas être envoyés lors de la création
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'writer_name', 'updated_at', 'closed_at'];
      fieldsToRemove.forEach(field => {
        if (field in apiData) {
          delete apiData[field];
        }
      });
    }
    
    // Supprimer les valeurs null ou vides
    Object.keys(apiData).forEach(key => {
      const value = apiData[key];
      if (value === null || value === undefined || 
          (typeof value === 'string' && value.trim() === '')) {
        delete apiData[key];
      }
    });
    
    return apiData;
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des défauts
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid', format: 'text' },
      { key: 'title', label: t('defect.title'), type: 'text', format: 'text' },
      { key: 'description', label: t('defect.description'), type: 'text', format: 'html' },
      { key: 'ticket_status_label', label: t('defect.status'), type: 'text', format: 'text' },
      { key: 'severity_label', label: t('defect.severity'), type: 'text', format: 'text' },
      { key: 'impact_area_label', label: t('defect.impact_area'), type: 'text', format: 'text' },
      { key: 'environment_label', label: t('defect.environment'), type: 'text', format: 'text' },
      { key: 'requested_by_name', label: t('defect.reported_by'), type: 'text', format: 'text' },
      { key: 'requested_for_name', label: t('defect.detected_by'), type: 'text', format: 'text' },
      { key: 'project_title', label: t('defect.project_id'), type: 'text', format: 'text' },
      { key: 'assigned_person_name', label: t('defect.assignee'), type: 'text', format: 'text' },
      { key: 'assigned_group_name', label: t('defect.team_id'), type: 'text', format: 'text' },
      { key: 'steps_to_reproduce', label: t('defect.steps_to_reproduce'), type: 'text', format: 'html' },
      { key: 'expected_behavior', label: t('defect.expected_behavior'), type: 'text', format: 'html' },
      { key: 'workaround', label: t('defect.workaround'), type: 'text', format: 'html' },
      { key: 'tags', label: t('defect.tags'), type: 'text', format: 'tags' },
      { key: 'attachments_count', label: t('defect.attachments_count'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les défauts
   * @returns {string} URL de l'endpoint API
   */
  static getApiEndpoint() {
    const userProfileStore = useUserProfileStore();
    return `tickets?ticket_type=DEFECT&lang=${userProfileStore.language}`;
  }

  /**
   * Récupère un défaut par son ID
   * @param {string} id - ID du défaut à récupérer
   * @returns {Promise<Defect>} Instance du défaut récupéré
   */
  static async getById(id) {
    const userProfileStore = useUserProfileStore();
    const endpoint = `tickets/${id}?lang=${userProfileStore.language}`;
    const data = await import('@/services/apiService').then(module => module.default.get(endpoint));
    return new Defect(data);
  }
}
