const logger = require('../../../../../config/logger');
const prisma = require('../../../../../config/prisma');
const { createToolResult } = require('../../schemas/common');

/**
 * List User Tickets Tool
 * Lists tickets for the current user
 */

const TOOL_NAME = 'list_user_tickets';

/**
 * Execute list user tickets
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @returns {Object} Tool result with ticket list
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, intent } = params;

  try {
    const userId = userContext?.userId;

    // Build query filters
    const where = {};

    // Filter by user if authenticated
    if (userId) {
      where.OR = [
        { rel_requested_by_uuid: userId },
        { rel_requested_for_uuid: userId }
      ];
    }

    // Filter by status if specified in intent
    if (intent?.entities?.status) {
      const statusCode = intent.entities.status.toUpperCase();
      where.workflow_statuses = {
        code: statusCode
      };
    }

    // Filter by type if specified
    if (intent?.entities?.ticketType) {
      const typeCode = intent.entities.ticketType.toUpperCase();
      where.ticket_types = {
        code: typeCode
      };
    }

    logger.info(`-- ${TOOL_NAME} -- Listing tickets for user: ${userId || 'anonymous'}`);

    // Query tickets
    const tickets = await prisma.tickets.findMany({
      where,
      select: {
        uuid: true,
        title: true,
        description: true,
        priority: true,
        category: true,
        created_at: true,
        updated_at: true,
        ticket_types: {
          select: {
            code: true,
            label: true
          }
        },
        workflow_statuses: {
          select: {
            code: true,
            label: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 20
    });

    // Transform results
    const transformedTickets = tickets.map(t => ({
      uuid: t.uuid,
      title: t.title,
      description: t.description?.substring(0, 200),
      type: t.ticket_types?.code || 'UNKNOWN',
      typeLabel: t.ticket_types?.label || 'Unknown',
      status: t.workflow_statuses?.code || 'UNKNOWN',
      statusLabel: t.workflow_statuses?.label || 'Unknown',
      priority: mapPriorityToLabel(t.priority),
      category: t.category,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));

    const executionTime = Date.now() - startTime;

    logger.info(`-- ${TOOL_NAME} -- Found ${transformedTickets.length} tickets in ${executionTime}ms`);

    // Group by status for summary
    const statusSummary = {};
    for (const ticket of transformedTickets) {
      statusSummary[ticket.status] = (statusSummary[ticket.status] || 0) + 1;
    }

    return createToolResult(TOOL_NAME, true, {
      tickets: transformedTickets,
      totalCount: transformedTickets.length,
      statusSummary,
      filters: {
        userId: userId || null,
        status: intent?.entities?.status || null,
        type: intent?.entities?.ticketType || null
      }
    }, {
      executionTimeMs: executionTime,
      suggestedNextTools: transformedTickets.length > 0 ? [] : ['create_ticket_draft']
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
 * Map priority number to label
 * @param {number} priority - Priority number
 * @returns {string} Priority label
 */
const mapPriorityToLabel = (priority) => {
  const labels = {
    1: 'CRITICAL',
    2: 'HIGH',
    3: 'MEDIUM',
    4: 'LOW'
  };
  return labels[priority] || 'MEDIUM';
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
