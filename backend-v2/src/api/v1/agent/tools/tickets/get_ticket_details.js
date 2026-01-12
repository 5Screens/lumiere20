const logger = require('../../../../../config/logger');
const prisma = require('../../../../../config/prisma');
const { createToolResult } = require('../../schemas/common');

/**
 * Get Ticket Details Tool
 * Gets detailed information about a specific ticket
 */

const TOOL_NAME = 'get_ticket_details';

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 * @param {string} str - String to check
 * @returns {boolean} True if valid UUID
 */
const isValidUuid = (str) => {
  return str && UUID_REGEX.test(str);
};

// Common select fields for ticket queries
const TICKET_SELECT = {
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
};

/**
 * Find ticket by UUID
 * @param {string} uuid - Ticket UUID
 * @returns {Object|null} Ticket or null
 */
const findTicketByUuid = async (uuid) => {
  return prisma.tickets.findUnique({
    where: { uuid },
    select: TICKET_SELECT
  });
};

/**
 * Find ticket by title (partial match)
 * @param {string} title - Ticket title or partial title
 * @param {string} userId - User ID to filter by (optional)
 * @returns {Object|null} First matching ticket or null
 */
const findTicketByTitle = async (title, userId) => {
  const where = {
    title: { contains: title, mode: 'insensitive' }
  };

  // Optionally filter by user
  if (userId) {
    where.OR = [
      { requested_by_uuid: userId },
      { requested_for_uuid: userId }
    ];
  }

  const tickets = await prisma.tickets.findMany({
    where,
    select: TICKET_SELECT,
    orderBy: { updated_at: 'desc' },
    take: 1
  });

  return tickets[0] || null;
};

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
    // Get ticket identifier from intent (could be UUID or title)
    const ticketIdentifier = intent?.entities?.ticketId || intent?.entities?.uuid || intent?.entities?.ticketTitle;

    if (!ticketIdentifier) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No ticket ID or title provided',
        executionTimeMs: Date.now() - startTime,
        suggestedNextTools: ['list_user_tickets']
      });
    }

    logger.info(`-- ${TOOL_NAME} -- Getting details for ticket: ${ticketIdentifier}`);

    let ticket = null;

    // Check if it's a valid UUID
    if (isValidUuid(ticketIdentifier)) {
      // Search by UUID
      ticket = await findTicketByUuid(ticketIdentifier);
    } else {
      // Search by title (partial match)
      logger.info(`-- ${TOOL_NAME} -- Not a UUID, searching by title: ${ticketIdentifier}`);
      ticket = await findTicketByTitle(ticketIdentifier, userContext?.userId);
    }

    if (!ticket) {
      return createToolResult(TOOL_NAME, false, null, {
        error: `Ticket not found: ${ticketIdentifier}`,
        executionTimeMs: Date.now() - startTime,
        suggestedNextTools: ['list_user_tickets']
      });
    }

    const executionTime = Date.now() - startTime;
    logger.info(`-- ${TOOL_NAME} -- Retrieved ticket ${ticket.uuid} in ${executionTime}ms`);

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
      updatedAt: ticket.updated_at
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
