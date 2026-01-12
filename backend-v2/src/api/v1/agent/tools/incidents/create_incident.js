const logger = require('../../../../../config/logger');
const ticketsService = require('../../../tickets/service');
const { createToolResult } = require('../../schemas/common');

/**
 * Create Incident Tool
 * Creates an incident ticket using the existing tickets service
 */

const TOOL_NAME = 'create_incident';

/**
 * Execute incident creation
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.previousResults - Results from previous tools (qualification)
 * @param {Object} params.conversationContext - Conversation context
 * @returns {Object} Tool result with created incident
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, previousResults, conversationContext } = params;

  try {
    // Get qualification from previous tool
    const qualification = extractQualification(previousResults);
    
    // Get original description from conversation
    const description = conversationContext?.messages?.find(m => m.role === 'user')?.content || '';

    // Use existing tickets service to create the incident
    const incident = await ticketsService.create({
      title: qualification?.suggestedTitle || 'New incident',
      description: buildDescription(description, qualification),
      requested_by_uuid: userContext?.userId || null,
      requested_for_uuid: userContext?.userId || null,
      writer_uuid: userContext?.userId || null,
      extended_core_fields: {
        category: qualification?.category || null,
        affected_system: qualification?.affectedSystem || null
      }
    }, 'INCIDENT');

    const executionTime = Date.now() - startTime;

    logger.info(`-- ${TOOL_NAME} -- Created incident ${incident.uuid} in ${executionTime}ms`);

    return createToolResult(TOOL_NAME, true, {
      ticketId: incident.uuid,
      title: incident.title,
      type: 'INCIDENT',
      message: `Incident created successfully with ID: ${incident.uuid}`
    }, {
      executionTimeMs: executionTime,
      suggestedNextTools: []
    });

  } catch (error) {
    logger.error(`-- ${TOOL_NAME} -- Failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
};

/**
 * Extract qualification from previous tool results
 * @param {Object[]} previousResults - Previous tool results
 * @returns {Object|null} Qualification data
 */
const extractQualification = (previousResults) => {
  if (!previousResults || !Array.isArray(previousResults)) {
    return null;
  }

  const qualifyResult = previousResults.find(r => r.tool === 'qualify_incident' && r.success);
  return qualifyResult?.data || null;
};

/**
 * Build incident description with qualification details
 * @param {string} originalDescription - Original user description
 * @param {Object} qualification - Qualification data
 * @returns {string} Full description
 */
const buildDescription = (originalDescription, qualification) => {
  const parts = [originalDescription];

  if (qualification) {
    parts.push('\n\n--- Qualification Details ---');
    if (qualification.summary) parts.push(`Summary: ${qualification.summary}`);
    if (qualification.affectedSystem) parts.push(`Affected System: ${qualification.affectedSystem}`);
    if (qualification.symptoms?.length > 0) {
      parts.push(`Symptoms: ${qualification.symptoms.join(', ')}`);
    }
  }

  return parts.join('\n');
};

/**
 * Map priority string to database value
 * @param {string} priority - Priority string
 * @returns {number} Priority value
 */
const mapPriority = (priority) => {
  const priorityMap = {
    'CRITICAL': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
  };
  return priorityMap[priority] || 3;
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
