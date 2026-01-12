const logger = require('../../../../config/logger');
const { createToolResult } = require('../schemas/common');

/**
 * Tool Executor - Executes tools based on intent
 * Loads and runs tool modules dynamically
 */

// Tool registry - maps tool names to their modules
const toolRegistry = new Map();

/**
 * Register a tool in the registry
 * @param {string} name - Tool name
 * @param {Function} handler - Tool handler function
 */
const registerTool = (name, handler) => {
  toolRegistry.set(name, handler);
  logger.debug(`-- tool-executor -- Registered tool: ${name}`);
};

/**
 * Load all tools from the tools directory
 */
const loadTools = () => {
  // Tools will be loaded dynamically as they are implemented
  // For now, register placeholder tools
  
  const placeholderTools = [
    'semantic_search_kb',
    'web_search_solution',
    'generate_solution_steps',
    'check_known_incident',
    'qualify_incident',
    'create_incident',
    'list_user_tickets',
    'get_ticket_details',
    'add_ticket_comment',
    'create_ticket_draft',
    'submit_ticket',
    'identify_account_type',
    'reset_password',
    'unlock_account',
    'list_user_accesses',
    'list_available_roles',
    'prepare_access_request',
    'list_service_catalog',
    'prepare_service_request',
    'list_active_incidents',
    'list_announcements',
    'get_user_profile',
    'update_user_preferences',
    'list_team_members',
    'get_user_rights',
    'list_pending_validations',
    'approve_request',
    'reject_request',
    'get_validation_history',
    'evaluate_confidence',
    'decide_next_step',
    'ask_clarifying_question'
  ];

  for (const toolName of placeholderTools) {
    if (!toolRegistry.has(toolName)) {
      registerTool(toolName, createPlaceholderHandler(toolName));
    }
  }

  logger.info(`-- tool-executor -- Loaded ${toolRegistry.size} tools`);
};

/**
 * Create a placeholder handler for unimplemented tools
 * @param {string} toolName - Tool name
 * @returns {Function} Placeholder handler
 */
const createPlaceholderHandler = (toolName) => {
  return async (params) => {
    logger.warn(`-- tool-executor -- Tool ${toolName} is not yet implemented`);
    return createToolResult(toolName, false, null, {
      error: `Tool ${toolName} is not yet implemented`,
      suggestedNextTools: []
    });
  };
};

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Parameters for the tool
 * @returns {Object} Tool execution result
 */
const execute = async (toolName, params) => {
  const startTime = Date.now();

  logger.info(`-- tool-executor -- execute: ${toolName}`);
  logger.info(`  INPUT: intent=${params.intent?.intent}, entities=${JSON.stringify(params.intent?.entities)}, previousResultsCount=${params.previousResults?.length || 0}`);

  // Ensure tools are loaded
  if (toolRegistry.size === 0) {
    loadTools();
  }

  const handler = toolRegistry.get(toolName);

  if (!handler) {
    logger.error(`-- tool-executor -- Tool not found: ${toolName}`);
    logger.info(`  OUTPUT: success=false, error=Tool ${toolName} not found`);
    return createToolResult(toolName, false, null, {
      error: `Tool ${toolName} not found`,
      executionTimeMs: Date.now() - startTime
    });
  }

  try {
    const result = await handler(params);
    
    const executionTime = Date.now() - startTime;
    logger.info(`  OUTPUT: success=${result.success}, dataKeys=${result.data ? Object.keys(result.data).join(', ') : 'null'}, executionTimeMs=${executionTime}`);

    return {
      ...result,
      executionTimeMs: executionTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(`-- tool-executor -- ${toolName} failed: ${error.message}`, { stack: error.stack });

    return createToolResult(toolName, false, null, {
      error: error.message,
      executionTimeMs: executionTime
    });
  }
};

/**
 * Execute multiple tools in sequence
 * @param {string[]} toolNames - Names of tools to execute
 * @param {Object} params - Base parameters
 * @returns {Object[]} Array of tool results
 */
const executeSequence = async (toolNames, params) => {
  const results = [];
  let currentParams = { ...params };

  for (const toolName of toolNames) {
    const result = await execute(toolName, {
      ...currentParams,
      previousResults: results
    });

    results.push(result);

    // Update params with result for next tool
    currentParams = {
      ...currentParams,
      lastToolResult: result
    };

    // Stop if tool indicates we should stop
    if (result.stopExecution) {
      logger.info(`-- tool-executor -- Stopping sequence at ${toolName}`);
      break;
    }

    // Stop if tool failed and is critical
    if (!result.success && result.critical) {
      logger.warn(`-- tool-executor -- Critical tool ${toolName} failed, stopping sequence`);
      break;
    }
  }

  return results;
};

/**
 * Get list of available tools
 * @returns {string[]} Tool names
 */
const getAvailableTools = () => {
  if (toolRegistry.size === 0) {
    loadTools();
  }
  return Array.from(toolRegistry.keys());
};

/**
 * Check if a tool is implemented (not a placeholder)
 * @param {string} toolName - Tool name
 * @returns {boolean} True if implemented
 */
const isToolImplemented = (toolName) => {
  const handler = toolRegistry.get(toolName);
  if (!handler) return false;
  
  // Check if it's a placeholder by looking at the function name or a marker
  return handler._implemented === true;
};

// Initialize tools on module load
loadTools();

module.exports = {
  execute,
  executeSequence,
  registerTool,
  getAvailableTools,
  isToolImplemented,
  loadTools
};
