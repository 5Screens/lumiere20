/**
 * Tickets Tools
 * Tools for listing, viewing, and creating tickets
 */

const prisma = require('../../../../config/prisma');
const logger = require('../../../../config/logger');

/**
 * List tickets for the current user
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} List of tickets
 */
const listMyTickets = async (args, context) => {
  const { status = 'open', limit = 10 } = args;
  const { userUuid } = context;

  logger.info(`-- tickets-tools -- listMyTickets: status=${status}, limit=${limit}, user=${userUuid}`);

  // Build where clause
  const where = {
    OR: [
      { requested_by_uuid: userUuid },
      { requested_for_uuid: userUuid },
      { writer_uuid: userUuid }
    ]
  };

  // Note: status filtering by open/closed would require joining with workflow_status_categories
  // For simplicity, we filter after fetching if needed

  const tickets = await prisma.tickets.findMany({
    where,
    take: limit,
    orderBy: { created_at: 'desc' },
    select: {
      uuid: true,
      title: true,
      ticket_type_code: true,
      created_at: true,
      updated_at: true,
      closed_at: true,
      status: {
        select: {
          uuid: true,
          name: true
        }
      },
      ticket_type: {
        select: {
          label: true
        }
      }
    }
  });

  // Filter by open/closed based on closed_at field
  let filteredTickets = tickets;
  if (status === 'open') {
    filteredTickets = tickets.filter(t => !t.closed_at);
  } else if (status === 'closed') {
    filteredTickets = tickets.filter(t => t.closed_at);
  }

  // Format for display - use real UUIDs
  const formattedTickets = filteredTickets.map((t) => ({
    uuid: t.uuid,
    title: t.title,
    type: t.ticket_type?.label || t.ticket_type_code,
    status: t.status?.name || 'Unknown',
    is_closed: !!t.closed_at,
    created_at: t.created_at.toISOString().split('T')[0],
    updated_at: t.updated_at.toISOString().split('T')[0]
  }));

  return {
    count: formattedTickets.length,
    tickets: formattedTickets
  };
};

/**
 * Get detailed information about a specific ticket
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Ticket details
 */
const getTicketDetails = async (args, context) => {
  const { ticket_id } = args;
  const { userUuid } = context;

  logger.info(`-- tickets-tools -- getTicketDetails: ticket_id=${ticket_id}`);

  // Try to find by UUID first
  let ticket = null;
  
  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(ticket_id)) {
    ticket = await prisma.tickets.findUnique({
      where: { uuid: ticket_id },
      include: {
        status: true,
        ticket_type: true,
        requested_by: {
          select: { first_name: true, last_name: true, email: true }
        },
        requested_for: {
          select: { first_name: true, last_name: true, email: true }
        },
        assigned_person: {
          select: { first_name: true, last_name: true }
        },
        assigned_group: {
          select: { group_name: true }
        }
      }
    });
  }

  // If not found by UUID, check if user has access to this ticket
  if (!ticket) {
    return {
      found: false,
      message: `Ticket "${ticket_id}" not found. Please provide a valid UUID.`
    };
  }

  // Verify user has access to this ticket
  const hasAccess = ticket.requested_by_uuid === userUuid ||
                    ticket.requested_for_uuid === userUuid ||
                    ticket.writer_uuid === userUuid;
  
  if (!hasAccess) {
    return {
      found: false,
      message: `You don't have access to ticket "${ticket_id}".`
    };
  }

  // Format for display
  return {
    found: true,
    ticket: {
      uuid: ticket.uuid,
      title: ticket.title,
      description: ticket.description,
      type: ticket.ticket_type?.label || ticket.ticket_type_code,
      status: ticket.status?.name || 'Unknown',
      is_closed: !!ticket.closed_at,
      requested_by: ticket.requested_by 
        ? `${ticket.requested_by.first_name} ${ticket.requested_by.last_name}`
        : null,
      requested_for: ticket.requested_for
        ? `${ticket.requested_for.first_name} ${ticket.requested_for.last_name}`
        : null,
      assigned_to: ticket.assigned_person
        ? `${ticket.assigned_person.first_name} ${ticket.assigned_person.last_name}`
        : ticket.assigned_group?.group_name || 'Not assigned',
      created_at: ticket.created_at.toISOString(),
      updated_at: ticket.updated_at.toISOString(),
      closed_at: ticket.closed_at?.toISOString() || null
    }
  };
};

/**
 * Get available ticket types
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} List of ticket types
 */
const getTicketTypes = async (args, context) => {
  logger.info(`-- tickets-tools -- getTicketTypes`);

  const types = await prisma.ticket_types.findMany({
    where: {
      code: {
        in: ['INCIDENT', 'SERVICE_REQUEST']
      }
    },
    select: {
      code: true,
      label: true,
      icon: true
    }
  });

  return {
    types: types.map(t => ({
      code: t.code,
      label: t.label,
      description: t.code === 'INCIDENT' 
        ? 'Report a problem or issue that needs to be fixed'
        : 'Request a service or new resource'
    }))
  };
};

/**
 * Create a new ticket
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Created ticket info
 */
const createTicket = async (args, context) => {
  const { ticket_type, title, description } = args;
  const { userUuid } = context;

  logger.info(`-- tickets-tools -- createTicket: type=${ticket_type}, title="${title.substring(0, 50)}..."`);

  // Validate ticket type
  const ticketType = await prisma.ticket_types.findUnique({
    where: { code: ticket_type }
  });

  if (!ticketType) {
    return {
      success: false,
      error: `Invalid ticket type: ${ticket_type}`
    };
  }

  // Get initial status for this ticket type
  const initialStatus = await prisma.workflow_statuses.findFirst({
    where: {
      workflow: {
        entity_type: 'tickets',
        subtype_code: ticket_type
      },
      is_initial: true
    }
  });

  // Create the ticket
  const ticket = await prisma.tickets.create({
    data: {
      title,
      description,
      ticket_type_code: ticket_type,
      requested_by_uuid: userUuid,
      requested_for_uuid: userUuid,
      writer_uuid: userUuid,
      rel_status_uuid: initialStatus?.uuid || null
    }
  });

  logger.info(`-- tickets-tools -- Created ticket: ${ticket.uuid}`);

  return {
    success: true,
    ticket: {
      uuid: ticket.uuid,
      title: ticket.title,
      type: ticketType.label,
      message: `Your ${ticketType.label.toLowerCase()} has been created successfully.`
    }
  };
};

module.exports = {
  listMyTickets,
  getTicketDetails,
  getTicketTypes,
  createTicket
};
