/**
 * Service registry for dynamic service loading based on objectType
 */
import configurationItemsService from './configurationItemsService'
import entitiesService from './entitiesService'
import locationsService from './locationsService'
import groupsService from './groupsService'
import personsService from './personsService'
import ciTypesService from './ciTypesService'
import ciCategoriesService from './ciCategoriesService'
import tasksService from './tasksService'
import ticketsService from './ticketsService'
import ticketTypesService from './ticketTypesService'
import objectSetupService from './objectSetupService'
import symptomsService from './symptomsService'
import servicesService from './servicesService'
import serviceOfferingsService from './serviceOfferingsService'
import causesService from './causesService'
import requestCatalogItemsService from './requestCatalogItemsService'

// Service registry mapping objectType to service
const services = {
  configuration_items: configurationItemsService,
  entities: entitiesService,
  locations: locationsService,
  groups: groupsService,
  persons: personsService,
  ci_types: ciTypesService,
  ci_categories: ciCategoriesService,
  tasks: tasksService,
  tickets: ticketsService,
  ticket_types: ticketTypesService,
  object_setup: objectSetupService,
  symptoms: symptomsService,
  services: servicesService,
  service_offerings: serviceOfferingsService,
  causes: causesService,
  request_catalog_items: requestCatalogItemsService,
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
