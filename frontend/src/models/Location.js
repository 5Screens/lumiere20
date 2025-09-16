import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import apiService from '../services/apiService'

export class Location {
  constructor(data = {}) {
    // Identifiant unique de la location
    this.uuid = data.uuid || null;
    this.name = data.name || '';
    this.site_id = data.site_id || '';
    this.type = data.type || '';
    this.rel_status_uuid = data.rel_status_uuid || null;
    this.status_code = data.status_code || '';
    this.status_label = data.status_label || '';
    this.business_criticality = data.business_criticality || '';
    this.opening_hours = data.opening_hours || '';
    this.time_zone = data.time_zone || '';
    this.street = data.street || '';
    this.city = data.city || '';
    this.state_province = data.state_province || '';
    this.country = data.country || '';
    this.postal_code = data.postal_code || '';
    this.phone = data.phone || '';
    this.comments = data.comments || '';
    this.site_created_on = data.site_created_on || null;
    this.alternative_site_reference = data.alternative_site_reference || '';
    this.wan_design = data.wan_design || '';
    this.network_telecom_service = data.network_telecom_service || '';
    this.parent_uuid = data.parent_uuid || null;
    this.parent_location_name = data.parent_location_name || '';
    this.primary_entity_uuid = data.primary_entity_uuid || null;
    this.primary_entity_name = data.primary_entity_name || '';
    this.field_service_group_uuid = data.field_service_group_uuid || null;
    this.field_service_group_name = data.field_service_group_name || '';
    this.occupants_count = data.occupants_count || 0;
    this.occupants_list = data.occupants_list || [];
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'name', label: 'locations.name' }
    ];
  }

  /**
   * Retourne les colonnes pour l'affichage dans le tableau des locations
   * @returns {Array} Tableau de configuration des colonnes
   */
  static getColumns() {
    const { t } = i18n.global;
    
    return [
      { key: 'uuid', label: t('common.id'), type: 'uuid' },
      { key: 'name', label: t('locations.name'), type: 'text' },
      { key: 'site_id', label: t('locations.site_id'), type: 'text' },
      { key: 'type', label: t('locations.type'), type: 'text' },
      { key: 'status_label', label: t('locations.status'), type: 'text' },
      { key: 'business_criticality', label: t('locations.business_criticality'), type: 'text' },
      { key: 'opening_hours', label: t('locations.opening_hours'), type: 'text' },
      { key: 'time_zone', label: t('locations.time_zone'), type: 'text' },
      { key: 'street', label: t('locations.street'), type: 'text' },
      { key: 'city', label: t('locations.city'), type: 'text' },
      { key: 'state_province', label: t('locations.state_province'), type: 'text' },
      { key: 'country', label: t('locations.country'), type: 'text' },
      { key: 'postal_code', label: t('locations.postal_code'), type: 'text' },
      { key: 'phone', label: t('locations.phone'), type: 'text' },
      { key: 'comments', label: t('locations.comments'), type: 'text' },
      { key: 'site_created_on', label: t('locations.site_created_on'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'alternative_site_reference', label: t('locations.alternative_site_reference'), type: 'text' },
      { key: 'wan_design', label: t('locations.wan_design'), type: 'text' },
      { key: 'network_telecom_service', label: t('locations.network_telecom_service'), type: 'text' },
      { key: 'parent_location_name', label: t('locations.parent_location'), type: 'text' },
      { key: 'primary_entity_name', label: t('locations.primary_entity'), type: 'text' },
      { key: 'field_service_group_name', label: t('locations.field_service_group'), type: 'text' },
      { key: 'occupants_count', label: t('locations.occupants_count'), type: 'number' },
      { key: 'created_at', label: t('common.creation_date'), type: 'date', format: 'YYYY-MM-DD' },
      { key: 'updated_at', label: t('common.modification_date'), type: 'date', format: 'YYYY-MM-DD' }
    ];
  }

  /**
   * Retourne l'endpoint API pour les locations
   * @param {string} method - Méthode HTTP (GET, POST, PATCH, DELETE)
   * @returns {string} URL de l'endpoint
   */
  static getApiEndpoint(method = 'GET') {
    if (method.toUpperCase() === 'GET') {
      const userProfileStore = useUserProfileStore();
      return `locations?lang=${userProfileStore.language}`;
    }
    return 'locations';
  }

  /**
   * Retourne le label pour l'onglet enfant
   * @returns {string} Label de l'onglet
   */
  static getChildTabLabel() {
    return 'name';
  }

  /**
   * Retourne l'identifiant unique pour les comparaisons
   * @returns {string} Identifiant unique
   */
  static getUniqueIdentifier() {
    return 'uuid';
  }

  /**
   * Retourne le titre pour la création
   * @returns {string} Titre de création
   */
  static getCreateTitle() {
    return 'objectCreationsAndUpdates.locationCreation';
  }

  /**
   * Retourne le titre pour la mise à jour
   * @returns {string} Titre de mise à jour
   */
  static getUpdateTitle() {
    return 'objectCreationsAndUpdates.locationUpdate';
  }

  /**
   * Récupère une location par UUID
   * @param {string} uuid - UUID de la location
   * @returns {Location} Instance de la location
   */
  static async getById(uuid) {
    try {
      const userProfileStore = useUserProfileStore();
      const response = await apiService.get(`locations/${uuid}?lang=${userProfileStore.language}`);
      
      if (response) {
        return new Location(response);
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }

  /**
   * Retourne les champs à afficher dans le formulaire
   * @param {string} mode - Mode du formulaire ('create' ou 'update')
   * @returns {Array} Configuration des champs du formulaire
   */
  static getRenderableFields(mode = 'for_creation') {
    const { t } = i18n.global;
    
    const fields = {
      uuid: {
        label: 'locations.uuid',
        type: 'sTextField',
        placeholder: 'locations.uuid_placeholder',
        disabled: true
      },
      created_at: {
        label: 'locations.created_at',
        type: 'sTextField',
        placeholder: 'locations.created_at_placeholder',
        disabled: true
      },
      updated_at: {
        label: 'locations.updated_at',
        type: 'sTextField',
        placeholder: 'locations.updated_at_placeholder',
        disabled: true
      },
      name: {
        name: 'name',
        label: 'locations.name',
        type: 'sTextField',
        required: true,
        placeholder: 'locations.name_placeholder',
        maxlength: 255
      },
      site_id: {
        name: 'site_id',
        label: 'locations.site_id',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.site_id_placeholder',
        maxlength: 100
      },
      type: {
        name: 'type',
        label: 'locations.type',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.type_placeholder',
        maxlength: 100
      },
      rel_status_uuid: {
        name: 'rel_status_uuid',
        label: 'locations.status',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'locations.status_placeholder',
        endpoint: () => {
          const userProfileStore = useUserProfileStore();
          return `ticket_status?ticket_type=LOCATION&lang=${userProfileStore.language}`;
        },
        displayField: 'label',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'status_label',
        columnsConfig: [
          { key: 'label', label: 'status.label', visible: true }
        ]
      },
      business_criticality: {
        name: 'business_criticality',
        label: 'locations.business_criticality',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.business_criticality_placeholder',
        maxlength: 50
      },
      opening_hours: {
        name: 'opening_hours',
        label: 'locations.opening_hours',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.opening_hours_placeholder',
        maxlength: 255
      },
      time_zone: {
        name: 'time_zone',
        label: 'locations.time_zone',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.time_zone_placeholder',
        maxlength: 100
      },
      street: {
        name: 'street',
        label: 'locations.street',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.street_placeholder',
        maxlength: 255
      },
      city: {
        name: 'city',
        label: 'locations.city',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.city_placeholder',
        maxlength: 255
      },
      state_province: {
        name: 'state_province',
        label: 'locations.state_province',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.state_province_placeholder',
        maxlength: 255
      },
      country: {
        name: 'country',
        label: 'locations.country',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.country_placeholder',
        maxlength: 100
      },
      postal_code: {
        name: 'postal_code',
        label: 'locations.postal_code',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.postal_code_placeholder',
        maxlength: 20
      },
      phone: {
        name: 'phone',
        label: 'locations.phone',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.phone_placeholder',
        maxlength: 50
      },
      comments: {
        name: 'comments',
        label: 'locations.comments',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'locations.comments_placeholder'
      },
      site_created_on: {
        name: 'site_created_on',
        label: 'locations.site_created_on',
        type: 'sDatePicker',
        required: false,
        placeholder: 'locations.site_created_on_placeholder'
      },
      alternative_site_reference: {
        name: 'alternative_site_reference',
        label: 'locations.alternative_site_reference',
        type: 'sTextField',
        required: false,
        placeholder: 'locations.alternative_site_reference_placeholder',
        maxlength: 255
      },
      wan_design: {
        name: 'wan_design',
        label: 'locations.wan_design',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'locations.wan_design_placeholder'
      },
      network_telecom_service: {
        name: 'network_telecom_service',
        label: 'locations.network_telecom_service',
        type: 'sRichTextEditor',
        required: false,
        placeholder: 'locations.network_telecom_service_placeholder'
      },
      parent_uuid: {
        name: 'parent_uuid',
        label: 'locations.parent_location',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'locations.parent_location_placeholder',
        endpoint: 'locations',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'parent_location_name',
        columnsConfig: [
          { key: 'name', label: 'locations.name', visible: true },
          { key: 'city', label: 'locations.city', visible: true },
          { key: 'country', label: 'locations.country', visible: true }
        ]
      },
      primary_entity_uuid: {
        name: 'primary_entity_uuid',
        label: 'locations.primary_entity',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'locations.primary_entity_placeholder',
        endpoint: 'entities',
        displayField: 'name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'primary_entity_name',
        columnsConfig: [
          { key: 'name', label: 'entities.name', visible: true },
          { key: 'type', label: 'entities.type', visible: true }
        ]
      },
      field_service_group_uuid: {
        name: 'field_service_group_uuid',
        label: 'locations.field_service_group',
        type: 'sFilteredSearchField',
        required: false,
        placeholder: 'locations.field_service_group_placeholder',
        endpoint: 'groups',
        displayField: 'group_name',
        valueField: 'uuid',
        displayFieldAtInitInEditMode: 'field_service_group_name',
        columnsConfig: [
          { key: 'group_name', label: 'groups.group_name', visible: true },
          { key: 'support_level', label: 'groups.support_level', visible: true }
        ]
      },
      occupants_list: {
        label: 'locations.occupants_list',
        type: "sPickList",
        helperText: 'locations.occupants_list_helper_text',
        placeholder: 'locations.occupants_list_placeholder',
        sourceEndPoint: "persons",
        displayedLabel: "person_name",
        targetEndPoint: "locations",
        ressourceEndPoint: 'occupants',
        fieldName: 'occupants',
        target_uuid: null,
        pickedItems: null,
        required: false,
      }
    };

    // Supprimer les champs système en mode création
    if (mode === 'for_creation') {
      delete fields.uuid;
      delete fields.created_at;
      delete fields.updated_at;
    }

    return fields;
  }

  /**
   * Convertit l'objet en format API
   * @param {string} method - Méthode HTTP
   * @returns {Object} Données formatées pour l'API
   */
  toAPI(method = 'POST') {
    const apiData = {
      name: this.name,
      site_id: this.site_id,
      type: this.type,
      rel_status_uuid: this.rel_status_uuid,
      business_criticality: this.business_criticality,
      opening_hours: this.opening_hours,
      time_zone: this.time_zone,
      street: this.street,
      city: this.city,
      state_province: this.state_province,
      country: this.country,
      postal_code: this.postal_code,
      phone: this.phone,
      comments: this.comments,
      site_created_on: this.site_created_on,
      alternative_site_reference: this.alternative_site_reference,
      wan_design: this.wan_design,
      network_telecom_service: this.network_telecom_service,
      parent_uuid: this.parent_uuid,
      primary_entity_uuid: this.primary_entity_uuid,
      field_service_group_uuid: this.field_service_group_uuid
    };

    // Ajouter occupants_list comme "occupants" pour l'API
    if (this.occupants_list && Array.isArray(this.occupants_list)) {
      // Extraire seulement les UUIDs des personnes si c'est un tableau d'objets
      apiData.occupants_list = this.occupants_list.map(person => 
        typeof person === 'string' ? person : person.person_uuid || person.uuid
      );
    }

    // Supprimer les champs système pour POST
    if (method.toUpperCase() === 'POST') {
      const fieldsToRemove = ['uuid', 'created_at', 'updated_at', 'status_code', 'status_label', 'parent_location_name', 'primary_entity_name', 'field_service_group_name', 'occupants_count'];
      fieldsToRemove.forEach(field => {
        delete apiData[field];
      });
    }

    return apiData;
  }
}

export default Location;
