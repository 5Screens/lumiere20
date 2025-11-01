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
    const userProfileStore = useUserProfileStore();
    
    // Fonction utilitaire pour déterminer si un champ est obligatoire
    const dynamicLabels = new Defect();
    const isRequired = (fieldName) => dynamicLabels.requiredFields.some(field => field.name === fieldName);

    // Définition de tous les champs
    const fields = {
      // Informations générales
      uuid: {
        label: 'common.id',
        type: 'sTextField',
        placeholder: 'common.id',
        disabled: true
      },
      created_at: {
        label: 'common.creation_date',
        type: 'sTextField',
        disabled: true
      },
      writer_name: {
        label: 'common.writer_name',
        type: 'sTextField',
        disabled: true
      },
      updated_at: {
        label: 'common.modification_date',
        type: 'sTextField',
        disabled: true
      },
      closed_at: {
        label: 'common.closure_date',
        type: 'sTextField',
        disabled: true
      },
      title: {
        label: 'defect.title',
        type: 'sTextField',
        placeholder: 'defect.title_placeholder',
        required: isRequired('title')
      },
      ticket_status_code: {
        label: 'defect.status',
        type: 'sSelectField',
        placeholder: 'defect.status_placeholder',
        required: isRequired('ticket_status_code'),
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes&ticket_type=DEFECT`,
        patchEndpoint: 'defects',
        fieldName: 'ticket_status_code',
        displayField: 'label',
        valueField: 'value',
        mode: 'creation'
      },
      description: {
        label: 'defect.description',
        type: 'sRichTextEditor',
        placeholder: 'defect.description_placeholder',
        required: isRequired('description')
      },
      severity: {
        label: 'defect.severity',
        type: 'sSelectField',
        placeholder: 'defect.severity_placeholder',
        required: isRequired('severity'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=SEVERITY`,
        fieldName: 'severity',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      impact_area: {
        label: 'defect.impact_area',
        type: 'sSelectField',
        placeholder: 'defect.impact_area_placeholder',
        required: isRequired('impact_area'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=IMPACT`,
        fieldName: 'impact_area',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      environment: {
        label: 'defect.environment',
        type: 'sSelectField',
        placeholder: 'defect.environment_placeholder',
        required: isRequired('environment'),
        endpoint: `defect_setup?lang=${userProfileStore.language}&metadata=ENVIRONMENT`,
        fieldName: 'environment',
        displayField: 'label',
        valueField: 'code',
        mode: 'creation'
      },
      requested_for_uuid: {
        label: 'defect.detected_by',
        type: 'sFilteredSearchField',
        placeholder: 'defect.detected_by_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_for_name',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'email', label: 'person.email', visible: true }
        ],
        required: isRequired('requested_for_uuid'),
        lazySearch: true
      },
      requested_by_uuid: {
        label: 'defect.reported_by',
        type: 'sFilteredSearchField',
        placeholder: 'defect.reported_by_placeholder',
        endpoint: 'persons',
        displayField: 'person_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'requested_by_name',
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true },
          { key: 'job_role', label: 'person.job_role', visible: true },
          { key: 'email', label: 'person.email', visible: true }
        ],
        required: isRequired('requested_by_uuid'),
        lazySearch: true
      },
      project_id: {
        label: 'defect.project_id',
        type: 'sFilteredSearchField',
        placeholder: 'defect.project_id_placeholder',
        endpoint: 'tickets?ticket_type=PROJECT',
        displayField: 'title',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'project_name',
        columnsConfig: [
          { key: 'title', label: 'project.name', visible: true },
          { key: 'key', label: 'project.key', visible: true }
        ],
        required: isRequired('project_id'),
        resetable: true
      },
      assigned_to_person: {
        label: 'defect.assigned_to_person',
        type: 'sFilteredSearchField',
        placeholder: 'defect.assigned_to_person_placeholder',
        required: isRequired('assigned_to_person'),
        endpoint: ({ project_id }) => project_id ? `tickets/${project_id}/team/members` : '',
        displayField: 'full_name',
        displayFieldAtInitInEditMode: 'assigned_person_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: 'person.first_name', visible: true },
          { key: 'last_name', label: 'person.last_name', visible: true }
        ],
        required: isRequired('assigned_to_person'),
        resetable: true
      },
      steps_to_reproduce: {
        label: 'defect.steps_to_reproduce',
        type: 'sRichTextEditor',
        placeholder: 'defect.steps_to_reproduce_placeholder',
        required: isRequired('steps_to_reproduce')
      },
      expected_behavior: {
        label: 'defect.expected_behavior',
        type: 'sRichTextEditor',
        placeholder: 'defect.expected_behavior_placeholder',
        required: isRequired('expected_behavior')
      },
      workaround: {
        label: 'defect.workaround',
        type: 'sRichTextEditor',
        placeholder: 'defect.workaround_placeholder',
        required: isRequired('workaround')
      },
      tags: {
        label: 'defect.tags',
        type: 'sTagsList',
        placeholder: 'defect.tags_placeholder',
        required: isRequired('tags'),
        comboBox: false
      },
      attachments: {
        label: 'defect.attachments',
        type: 'sFileUploader',
        placeholder: 'defect.attachments_placeholder',
        helperText: 'defect.attachments_helper_text',
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
  
  /* Traiter les tags si nécessaire
  if (apiData.tags && Array.isArray(apiData.tags) && apiData.tags.length > 0) {
    if (typeof apiData.tags[0] === 'object' && apiData.tags[0].name) {
      // Si les éléments de la liste sont des objets avec un name, extraire uniquement les noms
      apiData.tags = apiData.tags.map(item => item.name);
    }
  }*/
  
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
      { key: 'ticket_status_label', label: t('defect.status'), type: 'text', format: 'text', filterKey: 'ticket_status_code' },
      { key: 'severity_label', label: t('defect.severity'), type: 'text', format: 'text', filterKey: 'severity' },
      { key: 'impact_area_label', label: t('defect.impact_area'), type: 'text', format: 'text', filterKey: 'impact_area' },
      { key: 'environment_label', label: t('defect.environment'), type: 'text', format: 'text', filterKey: 'environment' },
      { key: 'requested_by_name', label: t('defect.reported_by'), type: 'text', format: 'text', filterKey: 'requested_by_uuid' },
      { key: 'requested_for_name', label: t('defect.detected_by'), type: 'text', format: 'text', filterKey: 'requested_for_uuid' },
      { key: 'project_title', label: t('defect.project_id'), type: 'text', format: 'text', filterKey: 'project_id' },
      { key: 'assigned_person_name', label: t('defect.assigned_to_person'), type: 'text', format: 'text', filterKey: 'assigned_to_person' },
      { key: 'assigned_group_name', label: t('defect.team_id'), type: 'text', format: 'text', filterKey: 'assigned_to_group' },
      { key: 'steps_to_reproduce', label: t('defect.steps_to_reproduce'), type: 'text', format: 'html' },
      { key: 'expected_behavior', label: t('defect.expected_behavior'), type: 'text', format: 'html' },
      { key: 'workaround', label: t('defect.workaround'), type: 'text', format: 'html' },
      { key: 'tags', label: t('defect.tags'), type: 'text', format: 'tags' },
      { key: 'attachments_count', label: t('defect.attachments_count'), type: 'text', format: 'text' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'closed_at', label: t('common.closure_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'writer_name', label: t('common.writer_name'), type: 'text', format: 'text', filterKey: 'writer_uuid' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les défauts
   * @param {string} method - Méthode HTTP (GET, POST, PUT, PATCH, DELETE, FILTER)
   * @returns {string} URL de l'endpoint API
   */
  static getApiEndpoint(method) {
    // Pour les filtres, retourner l'endpoint spécifique aux defects
    if (method === 'FILTER') {
      return 'tickets/defects';
    }
    
    // Pour l'infinite scroll, retourner l'endpoint de recherche
    // Le composant reusableTableTab utilisera POST /tickets/search/defects
    if (method === 'GET') {
      return 'tickets/search/defects';
    }
    
    // Pour les autres méthodes (PATCH, PUT, DELETE)
    return 'tickets';
  }

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
    return 'objectCreationsAndUpdates.defectCreation';
  }

  /**
   * Retourne le titre pour la mise à jour d'un objet
   * @returns {string} Le titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.defectUpdate';
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
