/**
 * Configuration for each object type
 * Defines columns, filters, options, and form fields
 */

export const objectTypeConfigs = {
  configuration_items: {
    translationPrefix: 'configurationItems',
    columns: [
      { field: 'name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'ci_type', sortable: true, filterable: true, filterType: 'select', optionsKey: 'ciTypeOptions' },
      { field: 'description', sortable: false, filterable: true, filterType: 'text' },
      { field: 'created_at', sortable: true, filterable: true, filterType: 'date' },
      { field: 'updated_at', sortable: true, filterable: true, filterType: 'date' }
    ],
    defaultSort: { field: 'updated_at', order: -1 },
    globalFilterFields: ['name', 'description'],
    options: {
      ciTypeOptions: [
        { label: 'UPS', value: 'UPS' },
        { label: 'Application', value: 'APPLICATION' },
        { label: 'Server', value: 'SERVER' },
        { label: 'Network Device', value: 'NETWORK_DEVICE' },
        { label: 'Generic', value: 'GENERIC' }
      ]
    },
    formFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'ci_type', type: 'select', optionsKey: 'ciTypeOptions', default: 'GENERIC' },
      { field: 'description', type: 'textarea' }
    ],
    defaultItem: { name: '', ci_type: 'GENERIC', description: '' }
  },

  entities: {
    translationPrefix: 'entities',
    columns: [
      { field: 'name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'code', sortable: true, filterable: true, filterType: 'text' },
      { field: 'description', sortable: false, filterable: true, filterType: 'text' },
      { field: 'created_at', sortable: true, filterable: true, filterType: 'date' },
      { field: 'updated_at', sortable: true, filterable: true, filterType: 'date' }
    ],
    defaultSort: { field: 'name', order: 1 },
    globalFilterFields: ['name', 'code', 'description'],
    options: {},
    formFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'code', type: 'text', required: true },
      { field: 'description', type: 'textarea' }
    ],
    defaultItem: { name: '', code: '', description: '' }
  },

  locations: {
    translationPrefix: 'locations',
    columns: [
      { field: 'name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'address', sortable: false, filterable: true, filterType: 'text' },
      { field: 'city', sortable: true, filterable: true, filterType: 'text' },
      { field: 'country', sortable: true, filterable: true, filterType: 'text' },
      { field: 'created_at', sortable: true, filterable: true, filterType: 'date' }
    ],
    defaultSort: { field: 'name', order: 1 },
    globalFilterFields: ['name', 'address', 'city', 'country'],
    options: {},
    formFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'address', type: 'text' },
      { field: 'city', type: 'text' },
      { field: 'country', type: 'text' }
    ],
    defaultItem: { name: '', address: '', city: '', country: '' }
  },

  groups: {
    translationPrefix: 'groups',
    columns: [
      { field: 'name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'description', sortable: false, filterable: true, filterType: 'text' },
      { field: 'created_at', sortable: true, filterable: true, filterType: 'date' },
      { field: 'updated_at', sortable: true, filterable: true, filterType: 'date' }
    ],
    defaultSort: { field: 'name', order: 1 },
    globalFilterFields: ['name', 'description'],
    options: {},
    formFields: [
      { field: 'name', type: 'text', required: true },
      { field: 'description', type: 'textarea' }
    ],
    defaultItem: { name: '', description: '' }
  },

  persons: {
    translationPrefix: 'persons',
    columns: [
      { field: 'first_name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'last_name', sortable: true, filterable: true, filterType: 'text' },
      { field: 'email', sortable: true, filterable: true, filterType: 'text' },
      { field: 'role', sortable: true, filterable: true, filterType: 'select', optionsKey: 'roleOptions' },
      { field: 'is_active', sortable: true, filterable: true, filterType: 'boolean' },
      { field: 'created_at', sortable: true, filterable: true, filterType: 'date' }
    ],
    defaultSort: { field: 'last_name', order: 1 },
    globalFilterFields: ['first_name', 'last_name', 'email'],
    options: {
      roleOptions: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'User', value: 'USER' }
      ]
    },
    formFields: [
      { field: 'first_name', type: 'text', required: true },
      { field: 'last_name', type: 'text', required: true },
      { field: 'email', type: 'text', required: true },
      { field: 'role', type: 'select', optionsKey: 'roleOptions', default: 'USER' }
    ],
    defaultItem: { first_name: '', last_name: '', email: '', role: 'USER' }
  }
}

/**
 * Get configuration for an object type
 * @param {string} objectType - The object type
 * @returns {Object|null}
 */
export const getObjectTypeConfig = (objectType) => {
  return objectTypeConfigs[objectType] || null
}

export default objectTypeConfigs
