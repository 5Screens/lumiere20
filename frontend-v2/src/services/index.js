/**
 * Service registry for dynamic service loading based on objectType
 */
import configurationItemsService from './configurationItemsService'

// Service registry mapping objectType to service
const services = {
  configuration_items: configurationItemsService,
  // Add more services as they are created:
  // entities: entitiesService,
  // locations: locationsService,
  // groups: groupsService,
  // persons: personsService,
}

/**
 * Get service by objectType
 * @param {string} objectType - The object type (e.g., 'configuration_items')
 * @returns {Object|null} - The service or null if not found
 */
export const getService = (objectType) => {
  return services[objectType] || null
}

/**
 * Check if a service exists for the given objectType
 * @param {string} objectType - The object type
 * @returns {boolean}
 */
export const hasService = (objectType) => {
  return !!services[objectType]
}

export default {
  getService,
  hasService,
  ...services
}
