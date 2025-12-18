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
    },
    {
      code: 'entities',
      label_key: 'entities.title',
      icon: 'pi-building',
      api_endpoint: '/api/v1/entities',
      default_sort_field: 'name',
      default_sort_order: 1,
    },
    {
      code: 'locations',
      label_key: 'locations.title',
      icon: 'pi-map-marker',
      api_endpoint: '/api/v1/locations',
      default_sort_field: 'name',
      default_sort_order: 1,
    },
    {
      code: 'groups',
      label_key: 'groups.title',
      icon: 'pi-users',
      api_endpoint: '/api/v1/groups',
      default_sort_field: 'group_name',
      default_sort_order: 1,
    },
    {
      code: 'persons',
      label_key: 'persons.title',
      icon: 'pi-user',
      api_endpoint: '/api/v1/persons',
      default_sort_field: 'last_name',
      default_sort_order: 1,
    },
    {
      code: 'ci_types',
      label_key: 'ciTypes.title',
      icon: 'pi-tags',
      api_endpoint: '/api/v1/ci_types',
      default_sort_field: 'display_order',
      default_sort_order: 1,
    },
    {
      code: 'ci_categories',
      label_key: 'ciCategories.title',
      icon: 'pi-folder',
      api_endpoint: '/api/v1/ci_categories',
      default_sort_field: 'display_order',
      default_sort_order: 1,
    },
    {
      code: 'tasks',
      label_key: 'tasks.title',
      icon: 'pi-check-square',
      api_endpoint: '/api/v1/tasks',
      default_sort_field: 'updated_at',
      default_sort_order: -1,
    },
  ];

  // Define fields for each object type
  const fieldsByObjectType = {
    configuration_items: [
      { field_name: 'name', label_key: 'configurationItems.name', field_type: 'text', is_required: true, is_translatable: true, min_width: '16rem', display_order: 1 },
      { field_name: 'ci_type', label_key: 'configurationItems.ciType', field_type: 'select', min_width: '10rem', display_order: 2, options_source: '/ci_types/options' },
      { field_name: 'rel_model_uuid', label_key: 'configurationItems.model', field_type: 'ci_model', min_width: '14rem', display_order: 3, show_in_table: false },
      { field_name: 'description', label_key: 'configurationItems.description', field_type: 'textarea', is_translatable: true, min_width: '20rem', display_order: 4 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
    ],
    entities: [
      { field_name: 'name', label_key: 'entities.name', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1 },
      { field_name: 'entity_id', label_key: 'entities.entityId', field_type: 'text', is_required: true, min_width: '10rem', display_order: 2 },
      { field_name: 'entity_type', label_key: 'entities.entityType', field_type: 'select', is_required: true, min_width: '10rem', display_order: 3, options_source: JSON.stringify([
        { label: 'Company', value: 'COMPANY' },
        { label: 'Branch', value: 'BRANCH' },
        { label: 'Department', value: 'DEPARTMENT' },
        { label: 'Supplier', value: 'SUPPLIER' },
        { label: 'Customer', value: 'CUSTOMER' }
      ])},
      { field_name: 'external_id', label_key: 'entities.externalId', field_type: 'text', min_width: '10rem', display_order: 4, default_visible: false },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 5 },
      { field_name: 'parent_uuid', label_key: 'common.parent', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 6 },
      { field_name: 'budget_approver_uuid', label_key: 'entities.budgetApprover', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 7 },
      { field_name: 'rel_headquarters_location', label_key: 'entities.headquarters', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 8 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
    ],
    locations: [
      { field_name: 'name', label_key: 'locations.name', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1 },
      { field_name: 'site_id', label_key: 'locations.siteId', field_type: 'text', min_width: '10rem', display_order: 2 },
      { field_name: 'type', label_key: 'locations.type', field_type: 'select', min_width: '10rem', display_order: 3, options_source: JSON.stringify([
        { label: 'Office', value: 'OFFICE' },
        { label: 'Warehouse', value: 'WAREHOUSE' },
        { label: 'Data Center', value: 'DATA_CENTER' },
        { label: 'Factory', value: 'FACTORY' },
        { label: 'Store', value: 'STORE' }
      ])},
      { field_name: 'city', label_key: 'locations.city', field_type: 'text', min_width: '10rem', display_order: 4 },
      { field_name: 'country', label_key: 'locations.country', field_type: 'text', min_width: '10rem', display_order: 5 },
      { field_name: 'street', label_key: 'locations.street', field_type: 'text', min_width: '16rem', display_order: 6, default_visible: false },
      { field_name: 'postal_code', label_key: 'locations.postalCode', field_type: 'text', min_width: '8rem', display_order: 7, default_visible: false },
      { field_name: 'state_province', label_key: 'locations.stateProvince', field_type: 'text', min_width: '10rem', display_order: 8, default_visible: false },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 9, default_visible: false },
      { field_name: 'time_zone', label_key: 'locations.timeZone', field_type: 'text', min_width: '10rem', display_order: 10, default_visible: false },
      { field_name: 'business_criticality', label_key: 'locations.businessCriticality', field_type: 'select', min_width: '10rem', display_order: 11, default_visible: false, options_source: JSON.stringify([
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' }
      ])},
      { field_name: 'opening_hours', label_key: 'locations.openingHours', field_type: 'text', min_width: '12rem', display_order: 12, default_visible: false },
      { field_name: 'comments', label_key: 'common.comments', field_type: 'textarea', show_in_table: false, display_order: 13 },
      { field_name: 'parent_uuid', label_key: 'common.parent', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 14 },
      { field_name: 'primary_entity_uuid', label_key: 'locations.primaryEntity', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 15 },
      { field_name: 'field_service_group_uuid', label_key: 'locations.fieldServiceGroup', field_type: 'relation', relation_object: 'groups', relation_display: 'group_name', show_in_table: false, display_order: 16 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 20 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 21 },
    ],
    groups: [
      { field_name: 'group_name', label_key: 'groups.groupName', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1 },
      { field_name: 'description', label_key: 'groups.description', field_type: 'textarea', min_width: '20rem', display_order: 2 },
      { field_name: 'support_level', label_key: 'groups.supportLevel', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 3, min_value: 0 },
      { field_name: 'email', label_key: 'common.email', field_type: 'text', min_width: '14rem', display_order: 4 },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 5 },
      { field_name: 'rel_supervisor', label_key: 'groups.supervisor', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 6 },
      { field_name: 'rel_manager', label_key: 'groups.manager', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 7 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
    ],
    persons: [
      { field_name: 'first_name', label_key: 'persons.firstName', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1 },
      { field_name: 'last_name', label_key: 'persons.lastName', field_type: 'text', is_required: true, min_width: '10rem', display_order: 2 },
      { field_name: 'email', label_key: 'common.email', field_type: 'text', is_required: true, min_width: '16rem', display_order: 3 },
      { field_name: 'job_role', label_key: 'persons.jobRole', field_type: 'text', min_width: '12rem', display_order: 4 },
      { field_name: 'role', label_key: 'persons.role', field_type: 'select', min_width: '8rem', display_order: 5, options_source: JSON.stringify([
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Technician', value: 'technician' }
      ])},
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 6 },
      { field_name: 'phone', label_key: 'common.phone', field_type: 'text', min_width: '10rem', display_order: 7, default_visible: false },
      { field_name: 'business_phone', label_key: 'persons.businessPhone', field_type: 'text', min_width: '10rem', display_order: 8, default_visible: false },
      { field_name: 'business_mobile_phone', label_key: 'persons.businessMobile', field_type: 'text', min_width: '10rem', display_order: 9, default_visible: false },
      { field_name: 'personal_mobile_phone', label_key: 'persons.personalMobile', field_type: 'text', min_width: '10rem', display_order: 10, default_visible: false },
      { field_name: 'language', label_key: 'persons.language', field_type: 'select', min_width: '8rem', display_order: 11, default_visible: false, options_source: JSON.stringify([
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' },
        { label: 'Português', value: 'pt' }
      ])},
      { field_name: 'time_zone', label_key: 'persons.timeZone', field_type: 'text', min_width: '10rem', display_order: 12, default_visible: false },
      { field_name: 'internal_id', label_key: 'persons.internalId', field_type: 'text', min_width: '10rem', display_order: 13, default_visible: false },
      { field_name: 'critical_user', label_key: 'persons.criticalUser', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 14, default_visible: false },
      { field_name: 'external_user', label_key: 'persons.externalUser', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 15, default_visible: false },
      { field_name: 'ref_entity_uuid', label_key: 'persons.entity', field_type: 'relation', relation_object: 'entities', relation_display: 'name', show_in_table: false, display_order: 16 },
      { field_name: 'ref_location_uuid', label_key: 'persons.location', field_type: 'relation', relation_object: 'locations', relation_display: 'name', show_in_table: false, display_order: 17 },
      { field_name: 'ref_approving_manager_uuid', label_key: 'persons.approvingManager', field_type: 'relation', relation_object: 'persons', relation_display: 'last_name', show_in_table: false, display_order: 18 },
      { field_name: 'floor', label_key: 'persons.floor', field_type: 'text', min_width: '6rem', display_order: 19, default_visible: false },
      { field_name: 'room', label_key: 'persons.room', field_type: 'text', min_width: '6rem', display_order: 20, default_visible: false },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 30 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 31 },
    ],
    ci_types: [
      { field_name: 'code', label_key: 'ciTypes.code', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1 },
      { field_name: 'label', label_key: 'ciTypes.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '14rem', display_order: 2 },
      { field_name: 'description', label_key: 'ciTypes.description', field_type: 'textarea', is_translatable: true, min_width: '20rem', display_order: 3 },
      { field_name: 'rel_category_uuid', label_key: 'ciTypes.category', field_type: 'ci_category', min_width: '10rem', display_order: 4 },
      { field_name: 'is_model_for_ci_type_uuid', label_key: 'ciTypes.isModelFor', field_type: 'ci_type_target', min_width: '14rem', display_order: 5, show_in_table: false },
      { field_name: 'icon', label_key: 'ciTypes.icon', field_type: 'icon_picker', min_width: '8rem', display_order: 6 },
      { field_name: 'color', label_key: 'ciTypes.tagStyle', field_type: 'tag_style', min_width: '8rem', display_order: 7 },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 8 },
      { field_name: 'display_order', label_key: 'ciTypes.displayOrder', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 9 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
    ],
    ci_categories: [
      { field_name: 'code', label_key: 'ciCategories.code', field_type: 'text', is_required: true, min_width: '10rem', display_order: 1 },
      { field_name: 'label', label_key: 'ciCategories.label', field_type: 'text', is_required: true, is_translatable: true, min_width: '14rem', display_order: 2 },
      { field_name: 'icon', label_key: 'ciCategories.icon', field_type: 'icon_picker', min_width: '8rem', display_order: 3 },
      { field_name: 'is_active', label_key: 'common.isActive', field_type: 'boolean', data_type: 'boolean', min_width: '6rem', display_order: 4 },
      { field_name: 'display_order', label_key: 'ciCategories.displayOrder', field_type: 'number', data_type: 'number', min_width: '8rem', display_order: 5 },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
    ],
    tasks: [
      { field_name: 'title', label_key: 'tasks.title', field_type: 'text', is_required: true, min_width: '16rem', display_order: 1 },
      { field_name: 'description', label_key: 'tasks.description', field_type: 'textarea', min_width: '20rem', display_order: 2 },
      { field_name: 'ticket_type_code', label_key: 'tasks.ticketType', field_type: 'text', is_editable: false, show_in_table: false, show_in_form: false, display_order: 3 },
      { field_name: 'writer_uuid', label_key: 'tasks.writer', field_type: 'person', is_required: true, min_width: '12rem', display_order: 4 },
      { field_name: 'requested_by_uuid', label_key: 'tasks.requestedBy', field_type: 'person', min_width: '12rem', display_order: 5, show_in_table: false },
      { field_name: 'requested_for_uuid', label_key: 'tasks.requestedFor', field_type: 'person', min_width: '12rem', display_order: 6, show_in_table: false },
      { field_name: 'configuration_item_uuid', label_key: 'tasks.configurationItem', field_type: 'configuration_item', min_width: '14rem', display_order: 7, show_in_table: false },
      { field_name: 'closed_at', label_key: 'tasks.closedAt', field_type: 'datetime', data_type: 'date', min_width: '12rem', display_order: 8, default_visible: false },
      { field_name: 'created_at', label_key: 'common.createdAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 10 },
      { field_name: 'updated_at', label_key: 'common.updatedAt', field_type: 'datetime', data_type: 'date', is_editable: false, show_in_form: false, min_width: '12rem', display_order: 11 },
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
