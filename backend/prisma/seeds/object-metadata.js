const { prisma } = require('../client');

/**
 * Seed object types and fields metadata
 */
async function seedObjectMetadata() {
  console.log('Seeding object metadata...');

  // Define object types
  const objectTypes = [
    {
      code: 'configuration_items',
      label_key: 'configurationItems.title',
      icon: 'pi-cog',
      api_endpoint: '/api/v1/configuration_items',
      default_sort_field: 'updated_at',
      default_sort_order: -1,
      display_field: 'name',
      secondary_field: 'ci_type',
    },
    {
      code: 'entities',
      label_key: 'entities.title',
      icon: 'pi-building',
      api_endpoint: '/api/v1/entities',
      default_sort_field: 'name',
      default_sort_order: 1,
      display_field: 'name',
      secondary_field: 'entity_id',
    },
    {
      code: 'locations',
      label_key: 'locations.title',
      icon: 'pi-map-marker',
      api_endpoint: '/api/v1/locations',
      default_sort_field: 'name',
      default_sort_order: 1,
      display_field: 'name',
      secondary_field: 'city',
    },
    {
      code: 'groups',
      label_key: 'groups.title',
      icon: 'pi-users',
      api_endpoint: '/api/v1/groups',
      default_sort_field: 'group_name',
      default_sort_order: 1,
      display_field: 'group_name',
      secondary_field: 'email',
    },
    {
      code: 'persons',
      label_key: 'persons.title',
      icon: 'pi-user',
      api_endpoint: '/api/v1/persons',
      default_sort_field: 'last_name',
      default_sort_order: 1,
      display_field: 'last_name',
      secondary_field: 'email',
    },
    {
      code: 'ci_types',
      label_key: 'ciTypes.title',
      icon: 'pi-tags',
      api_endpoint: '/api/v1/ci_types',
      default_sort_field: 'display_order',
      default_sort_order: 1,
      display_field: 'label',
      secondary_field: 'code',
    },
    {
      code: 'ci_categories',
      label_key: 'ciCategories.title',
      icon: 'pi-folder',
      api_endpoint: '/api/v1/ci_categories',
      default_sort_field: 'display_order',
      default_sort_order: 1,
      display_field: 'label',
      secondary_field: 'code',
    },
    {
      code: 'tickets',
      label_key: 'tickets.title',
      icon: 'pi-ticket',
      api_endpoint: '/api/v1/tickets',
      default_sort_field: 'updated_at',
      default_sort_order: -1,
      display_field: 'title',
      secondary_field: 'ticket_type_code',
    },
    {
      code: 'ticket_types',
      label_key: 'ticketTypes.title',
      icon: 'pi-ticket',
      api_endpoint: '/api/v1/ticket-types',
      default_sort_field: 'code',
      default_sort_order: 1,
      display_field: 'label',
      secondary_field: 'code',
    },
    {
      code: 'object_setup',
      label_key: 'objectSetup.title',
      icon: 'pi-sliders-h',
      api_endpoint: '/api/v1/object-setup',
      default_sort_field: 'display_order',
      default_sort_order: 1,
      display_field: 'label',
      secondary_field: 'code',
    },
    {
      code: 'symptoms',
      label_key: 'symptoms.title',
      icon: 'pi-exclamation-circle',
      api_endpoint: '/api/v1/symptoms',
      default_sort_field: 'code',
      default_sort_order: 1,
      display_field: 'label',
      secondary_field: 'code',
    },
    {
      code: 'services',
      label_key: 'services.title',
      icon: 'pi-sitemap',
      api_endpoint: '/api/v1/services',
      default_sort_field: 'updated_at',
      default_sort_order: -1,
      display_field: 'name',
      secondary_field: 'version',
    },
  ];

  // Define fields for each object type
  const fieldsByObjectType = {
    configuration_items: [
      { field_name: 'name', label_key: 'configurationItems.name', field_type: 'text', is_required: true, is_translatable: true, min_width: '16rem', display_order: 1, default_visible: true },
      { field_name: 'ci_type', label_key: 'configurationItems.ciType', field_type: 'select', min_width: '10rem', display_order: 2, options_source: '/ci_types/options', default_visible: true },
      { field_name: 'rel_model_uuid', label_key: 'configurationItems.model', field_type: 'relation', relation_object: 'configuration_items', relation_display: 'name', relation_filter: '{"is_model_for_ci_type_code":"$ci_type"}', min_width: '14rem', display_order: 3, show_in_table: true, default_visible: true },
      { field_name: 'rel_status_uuid', label_key: 'workflow.status', field_type: 'workflow_status', show_in_table: true, default_visible: true, min_width: '10rem', display_order: 4 },
      { field_name: 'description', label_key: 'configurationItems.description', field_type: 'textarea', is_translatable: true, min_width: '20rem', display_order: 5, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    entities: [
      { field_name: 'name', label_key: 'entities.name', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1, default_visible: true },
      { field_name: 'entity_id', label_key: 'entities.entityId', field_type: 'text', is_required: true, min_width: '10rem', display_order: 2, default_visible: true },
      { field_name: 'entity_type', label_key: 'entities.entityType', field_type: 'select', is_required: true, min_width: '10rem', display_order: 3, options_source: '/object-setup/options?object_type=entity&metadata=TYPE', default_visible: true },
      { field_name: 'external_id', label_key: 'entities.externalId', field_type: 'text', min_width: '10rem', display_order: 4, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 5, default_visible: true },
      { field_name: 'parent_uuid', label_key: 'common.parent', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 6, default_visible: true },
      { field_name: 'budget_approver_uuid', label_key: 'entities.budgetApprover', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 7, default_visible: true },
      { field_name: 'rel_headquarters_location', label_key: 'entities.headquarters', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 8, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    locations: [
      { field_name: 'name', label_key: 'locations.name', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1, default_visible: true },
      { field_name: 'site_id', label_key: 'locations.siteId', field_type: 'text', min_width: '10rem', display_order: 2, default_visible: true },
      { field_name: 'type', label_key: 'locations.type', field_type: 'select', min_width: '10rem', display_order: 3, options_source: '/object-setup/options?object_type=location&metadata=TYPE', default_visible: true },
      { field_name: 'city', label_key: 'locations.city', field_type: 'text', min_width: '10rem', display_order: 4, default_visible: true },
      { field_name: 'country', label_key: 'locations.country', field_type: 'text', min_width: '10rem', display_order: 5, default_visible: true },
      { field_name: 'street', label_key: 'locations.street', field_type: 'text', min_width: '16rem', display_order: 6, default_visible: true },
      { field_name: 'postal_code', label_key: 'locations.postalCode', field_type: 'text', min_width: '8rem', display_order: 7, default_visible: true },
      { field_name: 'state_province', label_key: 'locations.stateProvince', field_type: 'text', min_width: '10rem', display_order: 8, default_visible: true },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 9, default_visible: true },
      { field_name: 'time_zone', label_key: 'locations.timeZone', field_type: 'text', min_width: '10rem', display_order: 10, default_visible: true },
      { field_name: 'business_criticality', label_key: 'locations.businessCriticality', field_type: 'select', min_width: '10rem', display_order: 11, default_visible: true, options_source: '/object-setup/options?object_type=location&metadata=BUSINESS_CRITICALITY' },
      { field_name: 'opening_hours', label_key: 'locations.openingHours', field_type: 'text', min_width: '12rem', display_order: 12, default_visible: true },
      { field_name: 'comments', label_key: 'common.comments', field_type: 'textarea', show_in_table: false, display_order: 13, default_visible: true },
      { field_name: 'parent_uuid', label_key: 'common.parent', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 14, default_visible: true },
      { field_name: 'primary_entity_uuid', label_key: 'locations.primaryEntity', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 15, default_visible: true },
      { field_name: 'field_service_group_uuid', label_key: 'locations.fieldServiceGroup', field_type: 'relation', relation_object: 'groups', relation_display: 'group_name', show_in_table: false, display_order: 16, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 20, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 21, default_visible: true },
    ],
    groups: [
      { field_name: 'group_name', label_key: 'groups.groupName', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1, default_visible: true },
      { field_name: 'description', label_key: 'groups.description', field_type: 'textarea', min_width: '20rem', display_order: 2, default_visible: true },
      { field_name: 'support_level', label_key: 'groups.supportLevel', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 3, min_value: 0, default_visible: true },
      { field_name: 'email', label_key: 'common.email', field_type: 'text', min_width: '14rem', display_order: 4, default_visible: true },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 5, default_visible: true },
      { field_name: 'rel_supervisor', label_key: 'groups.supervisor', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 6, default_visible: true },
      { field_name: 'rel_manager', label_key: 'groups.manager', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 7, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    persons: [
      { field_name: 'first_name', label_key: 'persons.firstName', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1, default_visible: true },
      { field_name: 'last_name', label_key: 'persons.lastName', field_type: 'text', is_required: true, min_width: '10rem', display_order: 2, default_visible: true },
      { field_name: 'email', label_key: 'common.email', field_type: 'text', is_required: true, min_width: '16rem', display_order: 3, default_visible: true },
      { field_name: 'job_role', label_key: 'persons.jobRole', field_type: 'text', min_width: '12rem', display_order: 4, default_visible: true },
      { field_name: 'role', label_key: 'persons.role', field_type: 'select', min_width: '8rem', display_order: 5, default_visible: true, options_source: JSON.stringify([
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Technician', value: 'technician' }
      ])},
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 6, default_visible: true },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 7, default_visible: true },
      { field_name: 'business_phone', label_key: 'persons.businessPhone', field_type: 'text', min_width: '10rem', display_order: 8, default_visible: true },
      { field_name: 'business_mobile_phone', label_key: 'persons.businessMobile', field_type: 'text', min_width: '10rem', display_order: 9, default_visible: true },
      { field_name: 'personal_mobile_phone', label_key: 'persons.personalMobile', field_type: 'text', min_width: '10rem', display_order: 10, default_visible: true },
      { field_name: 'language', label_key: 'persons.language', field_type: 'select', min_width: '8rem', display_order: 11, default_visible: true, options_source: JSON.stringify([
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
        { label: 'Português', value: 'pt' }
      ])},
      { field_name: 'time_zone', label_key: 'persons.timeZone', field_type: 'text', min_width: '10rem', display_order: 12, default_visible: true },
      { field_name: 'internal_id', label_key: 'persons.internalId', field_type: 'text', min_width: '10rem', display_order: 13, default_visible: true },
      { field_name: 'critical_user', label_key: 'persons.criticalUser', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 14, default_visible: true },
      { field_name: 'external_user', label_key: 'persons.externalUser', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 15, default_visible: true },
      { field_name: 'ref_entity_uuid', label_key: 'persons.entity', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 16, default_visible: true },
      { field_name: 'ref_location_uuid', label_key: 'persons.location', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 17, default_visible: true },
      { field_name: 'ref_approving_manager_uuid', label_key: 'persons.approvingManager', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 18, default_visible: true },
      { field_name: 'floor', label_key: 'persons.floor', field_type: 'text', min_width: '6rem', display_order: 19, default_visible: true },
      { field_name: 'room', label_key: 'persons.room', field_type: 'text', min_width: '6rem', display_order: 20, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 30, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 31, default_visible: true },
    ],
    ci_types: [
      { field_name: 'code', label_key: 'ciTypes.code', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1, default_visible: true },
      { field_name: 'label', label_key: 'ciTypes.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '14rem', display_order: 2, default_visible: true },
      { field_name: 'description', label_key: 'ciTypes.description', field_type: 'textarea', is_translatable: true, min_width: '20rem', display_order: 3, default_visible: true },
      { field_name: 'rel_category_uuid', label_key: 'ciTypes.category', field_type: 'relation', relation_object: 'ci_categories', relation_display: 'label', relation_filter: '{"is_active":true}', min_width: '10rem', display_order: 4, default_visible: true },
      { field_name: 'is_model_for_ci_type_code', label_key: 'ciTypes.isModelFor', field_type: 'select', min_width: '14rem', display_order: 5, show_in_table: true, options_source: '/ci_types/options', default_visible: true },
      { field_name: 'icon', label_key: 'ciTypes.icon', field_type: 'icon_picker', min_width: '8rem', display_order: 6, default_visible: true },
      { field_name: 'color', label_key: 'ciTypes.tagStyle', field_type: 'tag_style', min_width: '8rem', display_order: 7, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 8, default_visible: true },
      { field_name: 'display_order', label_key: 'ciTypes.displayOrder', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 9, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    ci_categories: [
      { field_name: 'code', label_key: 'ciCategories.code', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1, default_visible: true },
      { field_name: 'label', label_key: 'ciCategories.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '14rem', display_order: 2, default_visible: true },
      { field_name: 'icon', label_key: 'ciCategories.icon', field_type: 'icon_picker', min_width: '8rem', display_order: 3, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 4, default_visible: true },
      { field_name: 'display_order', label_key: 'ciCategories.displayOrder', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 5, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    tickets: [
      { field_name: 'title', label_key: 'tickets.title', field_type: 'text', is_required: true, show_in_table: true, default_visible: true, min_width: '16rem', display_order: 1 },
      { field_name: 'description', label_key: 'tickets.description', field_type: 'textarea', min_width: '20rem', display_order: 2, show_in_table: true, default_visible: true },
      { field_name: 'ticket_type_code', label_key: 'tickets.ticketType', field_type: 'select', is_editable: false, show_in_table: true, show_in_form: false, default_visible: true, min_width: '10rem', display_order: 3, options_source: '/ticket-types/options' },
      { field_name: 'rel_status_uuid', label_key: 'workflow.status', field_type: 'workflow_status', show_in_table: true, default_visible: true, min_width: '10rem', display_order: 4 },
      { field_name: 'writer_uuid', label_key: 'tickets.writer', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', is_required: true, is_editable: false, show_in_table: true, default_visible: true, min_width: '20rem', display_order: 5 },
      { field_name: 'requested_by_uuid', label_key: 'tickets.requestedBy', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: true, default_visible: true, min_width: '20rem', display_order: 6 },
      { field_name: 'requested_for_uuid', label_key: 'tickets.requestedFor', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: true, default_visible: true, min_width: '20rem', display_order: 7 },
      { field_name: 'configuration_item_uuid', label_key: 'tickets.configurationItem', field_type: 'relation', relation_object: 'configuration_items', relation_display: 'name', show_in_table: true, default_visible: true, min_width: '20rem', display_order: 8 },
      { field_name: 'assigned_group_uuid', label_key: 'tickets.assignedGroup', field_type: 'relation', relation_object: 'groups', relation_display: 'group_name', show_in_table: true, default_visible: true, min_width: '20rem', display_order: 9 },
      { field_name: 'assigned_person_uuid', label_key: 'tickets.assignedPerson', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: true, default_visible: true, min_width: '20rem', display_order: 10 },
      { field_name: 'watchers', label_key: 'tickets.watchers', field_type: 'person_multiple', min_width: '14rem', display_order: 11, show_in_table: false, default_visible: true },
      { field_name: 'attachments', label_key: 'tickets.attachments', field_type: 'attachments', min_width: '14rem', display_order: 12, show_in_table: false, default_visible: true },
      { field_name: 'closed_at', label_key: 'tickets.closedAt', field_type: 'datetime', data_type: 'date', is_editable: false, min_width: '12rem', display_order: 13, show_in_table: true, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, show_in_table: true, default_visible: true, min_width: '12rem', display_order: 20 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, show_in_table: true, default_visible: true, min_width: '12rem', display_order: 21 },
    ],
    ticket_types: [
      { field_name: 'code', label_key: 'ticketTypes.code', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1, default_visible: true },
      { field_name: 'label', label_key: 'ticketTypes.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '14rem', display_order: 2, default_visible: true },
      { field_name: 'icon', label_key: 'ticketTypes.icon', field_type: 'icon_picker', min_width: '8rem', display_order: 3, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 4, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    object_setup: [
      { field_name: 'object_type', label_key: 'objectSetup.objectType', field_type: 'select', is_required: true, min_width: '20rem', display_order: 1, is_filterable: true, options_source: '/object-setup/object-types-options', default_visible: true },
      { field_name: 'metadata', label_key: 'objectSetup.metadata', field_type: 'text', is_required: true, min_width: '20rem', display_order: 2, default_visible: true },
      { field_name: 'code', label_key: 'objectSetup.code', field_type: 'text', is_required: true, min_width: '20rem', display_order: 3, default_visible: true },
      { field_name: 'label', label_key: 'objectSetup.label', field_type: 'text', is_translatable: true, min_width: '28rem', display_order: 4, default_visible: true },
      { field_name: 'value', label_key: 'objectSetup.value', field_type: 'number', data_type: 'number', min_width: '12rem', display_order: 5, default_visible: true },
      { field_name: 'icon', label_key: 'objectSetup.icon', field_type: 'icon_picker', min_width: '12rem', display_order: 6, default_visible: true },
      { field_name: 'color', label_key: 'objectSetup.color', field_type: 'tag_style', min_width: '16rem', display_order: 7, default_visible: true },
      { field_name: 'font_weight', label_key: 'objectSetup.fontWeight', field_type: 'select', min_width: '16rem', display_order: 8, default_visible: true, options_source: JSON.stringify([
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
        { label: 'Semibold', value: 'semibold' }
      ])},
      { field_name: 'font_style', label_key: 'objectSetup.fontStyle', field_type: 'select', min_width: '16rem', display_order: 9, default_visible: true, options_source: JSON.stringify([
        { label: 'Normal', value: 'normal' },
        { label: 'Italic', value: 'italic' }
      ])},
      { field_name: 'display_order', label_key: 'objectSetup.displayOrder', field_type: 'number', data_type: 'number', min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '12rem', display_order: 11, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '24rem', display_order: 20, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '24rem', display_order: 21, default_visible: true },
    ],
    symptoms: [
      { field_name: 'code', label_key: 'symptoms.code', field_type: 'text', is_required: true, min_width: '12rem', display_order: 1, default_visible: true },
      { field_name: 'label', label_key: 'symptoms.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '20rem', display_order: 2, default_visible: true },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '8rem', display_order: 3, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11, default_visible: true },
    ],
    services: [
      { field_name: 'name', label_key: 'services.name', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1, default_visible: true },
      { field_name: 'description', label_key: 'services.description', field_type: 'textarea', min_width: '20rem', display_order: 2, default_visible: true },
      { field_name: 'rel_lifecycle_status_uuid', label_key: 'workflow.status', field_type: 'workflow_status', show_in_table: true, default_visible: true, min_width: '10rem', display_order: 3 },
      { field_name: 'business_criticality', label_key: 'services.businessCriticality', field_type: 'select', min_width: '10rem', display_order: 4, default_visible: true, options_source: '/object-setup/options?object_type=service&metadata=BUSINESS_CRITICALITY' },
      { field_name: 'version', label_key: 'services.version', field_type: 'text', min_width: '8rem', display_order: 5, default_visible: true },
      { field_name: 'owning_entity_uuid', label_key: 'services.owningEntity', field_type: 'relation', relation_object: 'entities', relation_display: 'name', min_width: '14rem', display_order: 6, default_visible: true },
      { field_name: 'owned_by_uuid', label_key: 'services.ownedBy', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', min_width: '14rem', display_order: 7, default_visible: true },
      { field_name: 'managed_by_uuid', label_key: 'services.managedBy', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', min_width: '14rem', display_order: 8, default_visible: true },
      { field_name: 'cab_uuid', label_key: 'services.cab', field_type: 'relation', relation_object: 'groups', relation_display: 'group_name', min_width: '14rem', display_order: 9, show_in_table: false, default_visible: true },
      { field_name: 'parent_uuid', label_key: 'common.parent', field_type: 'relation', relation_object: 'services', relation_display: 'name', min_width: '14rem', display_order: 10, show_in_table: false, default_visible: true },
      { field_name: 'operational', label_key: 'services.operational', field_type: 'select', min_width: '10rem', display_order: 11, show_in_table: false, default_visible: true, options_source: '/object-setup/options?object_type=service&metadata=IMPACT_LEVEL' },
      { field_name: 'legal_regulatory', label_key: 'services.legalRegulatory', field_type: 'select', min_width: '10rem', display_order: 12, show_in_table: false, default_visible: true, options_source: '/object-setup/options?object_type=service&metadata=IMPACT_LEVEL' },
      { field_name: 'reputational', label_key: 'services.reputational', field_type: 'select', min_width: '10rem', display_order: 13, show_in_table: false, default_visible: true, options_source: '/object-setup/options?object_type=service&metadata=IMPACT_LEVEL' },
      { field_name: 'financial', label_key: 'services.financial', field_type: 'select', min_width: '10rem', display_order: 14, show_in_table: false, default_visible: true, options_source: '/object-setup/options?object_type=service&metadata=IMPACT_LEVEL' },
      { field_name: 'comments', label_key: 'common.comments', field_type: 'textarea', min_width: '20rem', display_order: 15, show_in_table: false, default_visible: true },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 20, default_visible: true },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 21, default_visible: true },
    ],
  };

  // Upsert object types and their fields
  for (const objectType of objectTypes) {
    console.log(`  Creating/updating object type: ${objectType.code}`);
    
    const createdType = await prisma.object_types.upsert({
      where: { code: objectType.code },
      update: objectType,
      create: objectType,
    });

    // Create fields for this object type
    const fields = fieldsByObjectType[objectType.code] || [];
    for (const field of fields) {
      await prisma.object_fields.upsert({
        where: {
          object_type_uuid_field_name: {
            object_type_uuid: createdType.uuid,
            field_name: field.field_name,
          },
        },
        update: { ...field, object_type_uuid: createdType.uuid },
        create: { ...field, object_type_uuid: createdType.uuid },
      });
    }
    
    console.log(`    Created ${fields.length} fields`);
  }

  console.log('Object metadata seeding completed!');
}

module.exports = { seedObjectMetadata };
