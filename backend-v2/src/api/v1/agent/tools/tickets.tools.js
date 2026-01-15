/**
 * Tickets Tools
 * Tools for listing, viewing, and creating tickets
 */

const prisma = require('../../../../config/prisma');
const logger = require('../../../../config/logger');
const ticketsService = require('../../tickets/service');

/**
 * List tickets for the current user
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} List of tickets
 */
const listMyTickets = async (args, context) => {
  const { status = 'all', limit = 10 } = args;
  const { userUuid } = context;

  logger.info(`-- tickets-tools -- listMyTickets: status=${status}, limit=${limit}, user=${userUuid}`);

  // Base where clause for user's tickets
  const baseWhere = {
    OR: [
      { requested_by_uuid: userUuid },
      { requested_for_uuid: userUuid },
      { writer_uuid: userUuid }
    ]
  };

  // Count total tickets by status
  const [totalAll, totalOpen, totalClosed] = await Promise.all([
    prisma.tickets.count({ where: baseWhere }),
    prisma.tickets.count({ where: { ...baseWhere, closed_at: null } }),
    prisma.tickets.count({ where: { ...baseWhere, closed_at: { not: null } } })
  ]);

  // Build where clause with status filter
  let where = { ...baseWhere };
  if (status === 'open') {
    where.closed_at = null;
  } else if (status === 'closed') {
    where.closed_at = { not: null };
  }

  // Get the most recent tickets (limited)
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

  // Format for display - use real UUIDs
  const formattedTickets = tickets.map((t) => ({
    uuid: t.uuid,
    title: t.title,
    type: t.ticket_type?.label || t.ticket_type_code,
    status: t.status?.name || 'Unknown',
    is_closed: !!t.closed_at,
    created_at: t.created_at.toISOString().split('T')[0],
    updated_at: t.updated_at.toISOString().split('T')[0]
  }));

  const result = {
    total_counts: {
      all: totalAll,
      open: totalOpen,
      closed: totalClosed
    },
    filter_applied: status,
    showing: formattedTickets.length,
    tickets: formattedTickets
  };

  return result;
};

/**
 * Get detailed information about a specific ticket
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Ticket details
 */
const getTicketDetails = async (args, context) => {
  const { ticket_id } = args;
  const { userUuid, locale = 'en' } = context;

  logger.info(`-- tickets-tools -- getTicketDetails: ticket_id=${ticket_id}`);

  // Check if it's a UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(ticket_id)) {
    return {
      found: false,
      message: `Invalid ticket ID "${ticket_id}". Please provide a valid UUID.`
    };
  }

  // Use tickets service getByUuid for full data with translations and extended relations
  const ticket = await ticketsService.getByUuid(ticket_id, locale);

  if (!ticket) {
    return {
      found: false,
      message: `Ticket "${ticket_id}" not found.`
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
  const result = {
    found: true,
    ticket: {
      uuid: ticket.uuid,
      title: ticket.title,
      description: ticket.description,
      type: ticket.ticket_type?.label || ticket.ticket_type_code,
      status: ticket.status?.name || 'Unknown',
      is_closed: !!ticket.closed_at,
      requested_by: ticket.requested_by 
        ? {
            uuid: ticket.requested_by.uuid,
            name: `${ticket.requested_by.first_name} ${ticket.requested_by.last_name}`,
            email: ticket.requested_by.email
          }
        : null,
      requested_for: ticket.requested_for
        ? {
            uuid: ticket.requested_for.uuid,
            name: `${ticket.requested_for.first_name} ${ticket.requested_for.last_name}`,
            email: ticket.requested_for.email
          }
        : null,
      assigned_person: ticket.assigned_person
        ? {
            uuid: ticket.assigned_person.uuid,
            name: `${ticket.assigned_person.first_name} ${ticket.assigned_person.last_name}`,
            email: ticket.assigned_person.email
          }
        : null,
      assigned_group: ticket.assigned_group
        ? {
            uuid: ticket.assigned_group.uuid,
            name: ticket.assigned_group.group_name,
            description: ticket.assigned_group.description
          }
        : null,
      extended_fields: ticket.extended_core_fields || {},
      extended_relations: ticket._extendedRelations || {},
      created_at: ticket.created_at.toISOString(),
      updated_at: ticket.updated_at.toISOString(),
      closed_at: ticket.closed_at?.toISOString() || null
    }
  };

  logger.info(`-- tickets-tools -- getTicketDetails RESULT: ${JSON.stringify(result, null, 2)}`);

  return result;
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
