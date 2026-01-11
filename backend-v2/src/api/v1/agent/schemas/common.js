/**
 * Common schemas for the agent API
 */

/**
 * User context passed to all tools
 * @typedef {Object} UserContext
 * @property {string|null} userId - User UUID
 * @property {string|null} email - User email
 * @property {string|null} firstName - User first name
 * @property {string|null} lastName - User last name
 * @property {string} locale - User locale (fr, en, etc.)
 * @property {string|null} conversationId - Current conversation ID
 */

/**
 * Standard result metadata returned by all tools
 * @typedef {Object} ToolResultMeta
 * @property {boolean} success - Whether the tool executed successfully
 * @property {string} toolName - Name of the tool that was executed
 * @property {number} executionTimeMs - Execution time in milliseconds
 * @property {string} timestamp - ISO timestamp of execution
 * @property {string|null} error - Error message if failed
 * @property {string[]} suggestedNextTools - Tools to execute next
 */

/**
 * Intent analysis result
 * @typedef {Object} IntentResult
 * @property {string} intent - Detected intent code
 * @property {number} confidence - Confidence score (0-1)
 * @property {Object} entities - Extracted entities
 * @property {string[]} suggestedTools - Tools to execute for this intent
 * @property {boolean} needsClarification - Whether clarification is needed
 * @property {string|null} clarificationQuestion - Question to ask if clarification needed
 */

/**
 * Conversation message
 * @typedef {Object} ConversationMessage
 * @property {string} role - 'user' or 'assistant'
 * @property {string} content - Message content
 * @property {string} timestamp - ISO timestamp
 * @property {Object} metadata - Additional metadata
 */

/**
 * Conversation context
 * @typedef {Object} ConversationContext
 * @property {string} conversationId - Conversation UUID
 * @property {ConversationMessage[]} messages - Message history
 * @property {UserContext} userContext - User context
 * @property {Object} state - Conversation state (current intent, pending actions, etc.)
 */

/**
 * Create a standard tool result
 * @param {string} toolName - Name of the tool
 * @param {boolean} success - Whether successful
 * @param {Object} data - Result data
 * @param {Object} options - Additional options
 * @returns {Object} Standardized tool result
 */
const createToolResult = (toolName, success, data, options = {}) => {
  return {
    success,
    toolName,
    data: success ? data : null,
    error: success ? null : (options.error || 'Unknown error'),
    executionTimeMs: options.executionTimeMs || 0,
    timestamp: new Date().toISOString(),
    suggestedNextTools: options.suggestedNextTools || [],
    stopExecution: options.stopExecution || false
  };
};

/**
 * Create a user context object
 * @param {Object} params - Context parameters
 * @returns {UserContext} User context
 */
const createUserContext = (params = {}) => {
  return {
    userId: params.userId || null,
    email: params.email || null,
    firstName: params.firstName || null,
    lastName: params.lastName || null,
    locale: params.locale || 'fr',
    conversationId: params.conversationId || null
  };
};

/**
 * List of all available intents
 */
const INTENTS = {
  // Search domain
  SEARCH_SOLUTION: 'search_solution',
  SEARCH_ARTICLE: 'search_article',
  
  // Access domain
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_UNLOCK: 'account_unlock',
  REQUEST_ACCESS: 'request_access',
  CHECK_ACCESS: 'check_access',
  
  // Incident domain
  REPORT_INCIDENT: 'report_incident',
  CHECK_KNOWN_INCIDENT: 'check_known_incident',
  
  // Service domain
  REQUEST_SERVICE: 'request_service',
  BROWSE_CATALOG: 'browse_catalog',
  
  // Tickets domain
  TRACK_TICKET: 'track_ticket',
  LIST_TICKETS: 'list_tickets',
  UPDATE_TICKET: 'update_ticket',
  
  // Info domain
  GET_ANNOUNCEMENTS: 'get_announcements',
  GET_ACTIVE_INCIDENTS: 'get_active_incidents',
  
  // Profile domain
  VIEW_PROFILE: 'view_profile',
  UPDATE_PREFERENCES: 'update_preferences',
  
  // Manager domain
  VIEW_TEAM: 'view_team',
  VIEW_TEAM_RIGHTS: 'view_team_rights',
  PENDING_APPROVALS: 'pending_approvals',
  APPROVE_REQUEST: 'approve_request',
  REJECT_REQUEST: 'reject_request',
  
  // Conversation domain
  GREETING: 'greeting',
  THANKS: 'thanks',
  CLARIFY: 'clarify',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  
  // Fallback
  UNKNOWN: 'unknown',
  OUT_OF_SCOPE: 'out_of_scope'
};

/**
 * Mapping of intents to their suggested tools
 */
const INTENT_TOOL_MAPPING = {
  [INTENTS.SEARCH_SOLUTION]: ['semantic_search_kb', 'web_search_solution', 'generate_solution_steps'],
  [INTENTS.SEARCH_ARTICLE]: ['semantic_search_kb'],
  [INTENTS.PASSWORD_RESET]: ['identify_account_type', 'reset_password'],
  [INTENTS.ACCOUNT_UNLOCK]: ['identify_account_type', 'unlock_account'],
  [INTENTS.REQUEST_ACCESS]: ['list_user_accesses', 'list_available_roles', 'prepare_access_request'],
  [INTENTS.CHECK_ACCESS]: ['list_user_accesses'],
  [INTENTS.REPORT_INCIDENT]: ['check_known_incident', 'qualify_incident', 'create_incident'],
  [INTENTS.CHECK_KNOWN_INCIDENT]: ['check_known_incident', 'list_active_incidents'],
  [INTENTS.REQUEST_SERVICE]: ['list_service_catalog', 'prepare_service_request', 'submit_ticket'],
  [INTENTS.BROWSE_CATALOG]: ['list_service_catalog'],
  [INTENTS.TRACK_TICKET]: ['get_ticket_details'],
  [INTENTS.LIST_TICKETS]: ['list_user_tickets'],
  [INTENTS.UPDATE_TICKET]: ['add_ticket_comment'],
  [INTENTS.GET_ANNOUNCEMENTS]: ['list_announcements'],
  [INTENTS.GET_ACTIVE_INCIDENTS]: ['list_active_incidents'],
  [INTENTS.VIEW_PROFILE]: ['get_user_profile'],
  [INTENTS.UPDATE_PREFERENCES]: ['update_user_preferences'],
  [INTENTS.VIEW_TEAM]: ['list_team_members'],
  [INTENTS.VIEW_TEAM_RIGHTS]: ['get_user_rights'],
  [INTENTS.PENDING_APPROVALS]: ['list_pending_validations'],
  [INTENTS.APPROVE_REQUEST]: ['approve_request'],
  [INTENTS.REJECT_REQUEST]: ['reject_request'],
  [INTENTS.GREETING]: [],
  [INTENTS.THANKS]: [],
  [INTENTS.CLARIFY]: [],
  [INTENTS.CONFIRM]: [],
  [INTENTS.CANCEL]: [],
  [INTENTS.UNKNOWN]: [],
  [INTENTS.OUT_OF_SCOPE]: []
};

module.exports = {
  createToolResult,
  createUserContext,
  INTENTS,
  INTENT_TOOL_MAPPING
};
