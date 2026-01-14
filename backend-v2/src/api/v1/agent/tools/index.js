/**
 * Tool Registry - Central registry for all agent tools
 * Tools are loaded and registered here
 */

const logger = require('../../../../config/logger');
const toolExecutor = require('../orchestrator/tool-executor');

// Import implemented tools
const semanticSearchKb = require('./search/semantic_search_kb');
const webSearchSolution = require('./search/web_search_solution');
const directLlmQuery = require('./search/direct_llm_query');
const generateSolutionSteps = require('./synthesis/generate_solution_steps');
const qualifyIncident = require('./incidents/qualify_incident');
const createIncident = require('./incidents/create_incident');
const listUserTickets = require('./tickets/list_user_tickets');
const getTicketDetails = require('./tickets/get_ticket_details');

/**
 * Initialize all tools
 * This function loads and registers all implemented tools
 */
const initializeTools = () => {
  logger.info('Initializing agent tools...');

  // Register implemented tools
  toolExecutor.registerTool('semantic_search_kb', semanticSearchKb.execute);
  toolExecutor.registerTool('web_search_solution', webSearchSolution.execute);
  toolExecutor.registerTool('direct_llm_query', directLlmQuery.execute);
  toolExecutor.registerTool('generate_solution_steps', generateSolutionSteps.execute);
  toolExecutor.registerTool('qualify_incident', qualifyIncident.execute);
  toolExecutor.registerTool('create_incident', createIncident.execute);
  toolExecutor.registerTool('list_user_tickets', listUserTickets.execute);
  toolExecutor.registerTool('get_ticket_details', getTicketDetails.execute);

  logger.info('Agent tools initialized (8 tools registered)');
};

/**
 * Get tool metadata
 * @param {string} toolName - Tool name
 * @returns {Object} Tool metadata
 */
const getToolMetadata = (toolName) => {
  const metadata = {
    // Search tools
    semantic_search_kb: {
      name: 'semantic_search_kb',
      description: 'Search knowledge base for solutions',
      domain: 'search',
      requiresLLM: false
    },
    web_search_solution: {
      name: 'web_search_solution',
      description: 'Search web for solutions when KB is empty',
      domain: 'search',
      requiresLLM: false
    },
    direct_llm_query: {
      name: 'direct_llm_query',
      description: 'Direct LLM query without system prompt - fallback when KB has no results',
      domain: 'search',
      requiresLLM: true
    },
    generate_solution_steps: {
      name: 'generate_solution_steps',
      description: 'Generate step-by-step solution from search results',
      domain: 'synthesis',
      requiresLLM: true
    },
    
    // Incident tools
    qualify_incident: {
      name: 'qualify_incident',
      description: 'Qualify and categorize an incident',
      domain: 'incidents',
      requiresLLM: true
    },
    create_incident: {
      name: 'create_incident',
      description: 'Create a new incident ticket',
      domain: 'incidents',
      requiresLLM: false
    },
    check_known_incident: {
      name: 'check_known_incident',
      description: 'Check if there is a known incident',
      domain: 'incidents',
      requiresLLM: false
    },
    
    // Ticket tools
    list_user_tickets: {
      name: 'list_user_tickets',
      description: 'List tickets for the current user',
      domain: 'tickets',
      requiresLLM: false
    },
    get_ticket_details: {
      name: 'get_ticket_details',
      description: 'Get details of a specific ticket',
      domain: 'tickets',
      requiresLLM: false
    },
    create_ticket_draft: {
      name: 'create_ticket_draft',
      description: 'Create a draft ticket',
      domain: 'tickets',
      requiresLLM: false
    },
    submit_ticket: {
      name: 'submit_ticket',
      description: 'Submit a ticket',
      domain: 'tickets',
      requiresLLM: false
    },
    add_ticket_comment: {
      name: 'add_ticket_comment',
      description: 'Add a comment to a ticket',
      domain: 'tickets',
      requiresLLM: false
    },
    
    // Access tools
    identify_account_type: {
      name: 'identify_account_type',
      description: 'Identify the type of account',
      domain: 'access',
      requiresLLM: false
    },
    reset_password: {
      name: 'reset_password',
      description: 'Reset user password',
      domain: 'access',
      requiresLLM: false
    },
    unlock_account: {
      name: 'unlock_account',
      description: 'Unlock user account',
      domain: 'access',
      requiresLLM: false
    },
    list_user_accesses: {
      name: 'list_user_accesses',
      description: 'List user access rights',
      domain: 'access',
      requiresLLM: false
    },
    list_available_roles: {
      name: 'list_available_roles',
      description: 'List available roles for access request',
      domain: 'access',
      requiresLLM: false
    },
    prepare_access_request: {
      name: 'prepare_access_request',
      description: 'Prepare an access request',
      domain: 'access',
      requiresLLM: false
    },
    
    // Catalog tools
    list_service_catalog: {
      name: 'list_service_catalog',
      description: 'List available services',
      domain: 'catalog',
      requiresLLM: false
    },
    prepare_service_request: {
      name: 'prepare_service_request',
      description: 'Prepare a service request',
      domain: 'catalog',
      requiresLLM: false
    },
    
    // Info tools
    list_active_incidents: {
      name: 'list_active_incidents',
      description: 'List active incidents',
      domain: 'info',
      requiresLLM: false
    },
    list_announcements: {
      name: 'list_announcements',
      description: 'List announcements',
      domain: 'info',
      requiresLLM: false
    },
    
    // Profile tools
    get_user_profile: {
      name: 'get_user_profile',
      description: 'Get user profile',
      domain: 'profile',
      requiresLLM: false
    },
    update_user_preferences: {
      name: 'update_user_preferences',
      description: 'Update user preferences',
      domain: 'profile',
      requiresLLM: false
    },
    
    // Organization tools
    list_team_members: {
      name: 'list_team_members',
      description: 'List team members',
      domain: 'organization',
      requiresLLM: false
    },
    get_user_rights: {
      name: 'get_user_rights',
      description: 'Get user rights',
      domain: 'organization',
      requiresLLM: false
    },
    
    // Validation tools
    list_pending_validations: {
      name: 'list_pending_validations',
      description: 'List pending validations',
      domain: 'validation',
      requiresLLM: false
    },
    approve_request: {
      name: 'approve_request',
      description: 'Approve a request',
      domain: 'validation',
      requiresLLM: false
    },
    reject_request: {
      name: 'reject_request',
      description: 'Reject a request',
      domain: 'validation',
      requiresLLM: false
    },
    get_validation_history: {
      name: 'get_validation_history',
      description: 'Get validation history',
      domain: 'validation',
      requiresLLM: false
    }
  };

  return metadata[toolName] || null;
};

/**
 * Get all tools by domain
 * @param {string} domain - Domain name
 * @returns {Object[]} Tools in the domain
 */
const getToolsByDomain = (domain) => {
  const allMetadata = [
    'semantic_search_kb', 'web_search_solution', 'generate_solution_steps',
    'qualify_incident', 'create_incident', 'check_known_incident',
    'list_user_tickets', 'get_ticket_details', 'create_ticket_draft', 'submit_ticket', 'add_ticket_comment',
    'identify_account_type', 'reset_password', 'unlock_account', 'list_user_accesses', 'list_available_roles', 'prepare_access_request',
    'list_service_catalog', 'prepare_service_request',
    'list_active_incidents', 'list_announcements',
    'get_user_profile', 'update_user_preferences',
    'list_team_members', 'get_user_rights',
    'list_pending_validations', 'approve_request', 'reject_request', 'get_validation_history'
  ];

  return allMetadata
    .map(name => getToolMetadata(name))
    .filter(meta => meta && meta.domain === domain);
};

module.exports = {
  initializeTools,
  getToolMetadata,
  getToolsByDomain
};
