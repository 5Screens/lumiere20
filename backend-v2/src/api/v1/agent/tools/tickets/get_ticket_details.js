const logger = require('../../../../../config/logger');
const prisma = require('../../../../../config/prisma');
const { createToolResult } = require('../../schemas/common');

/**
 * Get Ticket Details Tool
 * Gets detailed information about a specific ticket
 */

const TOOL_NAME = 'get_ticket_details';

/**
 * Execute get ticket details
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @returns {Object} Tool result with ticket details
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, intent } = params;

  try {
    // Get ticket ID from intent
    const ticketId = intent?.entities?.ticketId || intent?.entities?.uuid;

    if (!ticketId) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No ticket ID provided',
        executionTimeMs: Date.now() - startTime,
        suggestedNextTools: ['list_user_tickets']
      });
    }

    logger.info(`-- ${TOOL_NAME} -- Getting details for ticket: ${ticketId}`);

    // Query ticket with relations
    const ticket = await prisma.tickets.findUnique({
      where: { uuid: ticketId },
      select: {
        uuid: true,
        title: true,
        description: true,
        extended_core_fields: true,
        created_at: true,
        updated_at: true,
        ticket_type: {
          select: {
            code: true,
            label: true
          }
        },
        status: {
          select: {
            uuid: true,
            name: true
          }
        },
        requested_by: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        requested_for: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        assigned_person: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (!ticket) {
      return createToolResult(TOOL_NAME, false, null, {
        error: `Ticket ${ticketId} not found`,
        executionTimeMs: Date.now() - startTime,
        suggestedNextTools: ['list_user_tickets']
      });
    }

    // Get ticket comments/history
    const comments = await prisma.ticket_comments?.findMany?.({
      where: { rel_ticket_uuid: ticketId },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        uuid: true,
        content: true,
        created_at: true,
        persons: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    }).catch(() => []);

    const executionTime = Date.now() - startTime;

    logger.info(`-- ${TOOL_NAME} -- Retrieved in ${executionTime}ms`);

    // Transform result
    const requestedBy = ticket.requested_by;
    const requestedFor = ticket.requested_for;
    const assignedTo = ticket.assigned_person;
    const extFields = ticket.extended_core_fields || {};

    return createToolResult(TOOL_NAME, true, {
      uuid: ticket.uuid,
      title: ticket.title,
      description: ticket.description,
      type: ticket.ticket_type?.code || 'UNKNOWN',
      typeLabel: ticket.ticket_type?.label || 'Unknown',
      status: ticket.status?.name || 'UNKNOWN',
      statusLabel: ticket.status?.name || 'Unknown',
      priority: mapPriorityToLabel(extFields.priority),
      category: extFields.category,
      requestedBy: requestedBy ? {
        name: `${requestedBy.first_name || ''} ${requestedBy.last_name || ''}`.trim(),
        email: requestedBy.email
      } : null,
      requestedFor: requestedFor ? {
        name: `${requestedFor.first_name || ''} ${requestedFor.last_name || ''}`.trim(),
        email: requestedFor.email
      } : null,
      assignedTo: assignedTo ? {
        name: `${assignedTo.first_name || ''} ${assignedTo.last_name || ''}`.trim(),
        email: assignedTo.email
      } : null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      comments: (comments || []).map(c => ({
        content: c.content,
        author: c.persons ? `${c.persons.first_name || ''} ${c.persons.last_name || ''}`.trim() : 'Unknown',
        createdAt: c.created_at
      }))
    }, {
      executionTimeMs: executionTime,
      suggestedNextTools: ['add_ticket_comment']
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
