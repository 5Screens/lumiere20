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
  const { ticket_type, title, description, attachment_uuids = [] } = args;
  const { userUuid } = context;

  logger.info(`-- tickets-tools -- createTicket: type=${ticket_type}, title="${title.substring(0, 50)}...", attachments=${attachment_uuids.length}`);

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
  // First try to find a workflow specific to this ticket type
  let workflow = await prisma.workflows.findFirst({
    where: {
      entity_type: 'tickets',
      rel_entity_type_uuid: ticketType.uuid,
      is_active: true
    },
    include: {
      statuses: {
        where: { is_initial: true },
        take: 1
      }
    }
  });

  // If no specific workflow, try to find a generic tickets workflow
  if (!workflow) {
    workflow = await prisma.workflows.findFirst({
      where: {
        entity_type: 'tickets',
        rel_entity_type_uuid: null,
        is_active: true
      },
      include: {
        statuses: {
          where: { is_initial: true },
          take: 1
        }
      }
    });
  }

  const initialStatus = workflow?.statuses?.[0] || null;

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

  // Link attachments to the ticket if any were provided
  let attachmentCount = 0;
  if (attachment_uuids && attachment_uuids.length > 0) {
    // Update attachments to link them to this ticket
    const updateResult = await prisma.attachments.updateMany({
      where: {
        uuid: { in: attachment_uuids },
        uploaded_by_uuid: userUuid // Security: only link user's own attachments
      },
      data: {
        entity_type: 'tickets',
        entity_uuid: ticket.uuid
      }
    });
    attachmentCount = updateResult.count;
    logger.info(`-- tickets-tools -- Linked ${attachmentCount} attachments to ticket ${ticket.uuid}`);
  }

  return {
    success: true,
    ticket: {
      uuid: ticket.uuid,
      title: ticket.title,
      type: ticketType.label,
      attachments_count: attachmentCount,
      message: `Your ${ticketType.label.toLowerCase()} has been created successfully.`
    }
  };
};

/**
 * Get pending attachments for the current user
 * These are attachments uploaded but not yet linked to a ticket
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} List of pending attachments
 */
const getPendingAttachments = async (args, context) => {
  const { userUuid, conversationId } = context;

  logger.info(`-- tickets-tools -- getPendingAttachments: user=${userUuid}, conversation=${conversationId}`);

  // Find attachments uploaded by this user that are not yet linked to a ticket
  // We look for attachments with entity_type='pending' or entity_type='agent_conversation'
  const pendingAttachments = await prisma.attachments.findMany({
    where: {
      uploaded_by_uuid: userUuid,
      OR: [
        { entity_type: 'pending' },
        { entity_type: 'agent_conversation' },
        { 
          entity_type: 'agent_conversation',
          entity_uuid: conversationId 
        }
      ]
    },
    orderBy: { created_at: 'desc' },
    take: 20
  });

  if (pendingAttachments.length === 0) {
    return {
      has_attachments: false,
      count: 0,
      attachments: [],
      message: 'No pending attachments found.'
    };
  }

  return {
    has_attachments: true,
    count: pendingAttachments.length,
    attachments: pendingAttachments.map(a => ({
      uuid: a.uuid,
      original_name: a.original_name,
      mime_type: a.mime_type,
      file_size: a.file_size,
      uploaded_at: a.created_at.toISOString()
    })),
    message: `Found ${pendingAttachments.length} pending attachment(s).`
  };
};

module.exports = {
  listMyTickets,
  getTicketDetails,
  getTicketTypes,
  createTicket,
  getPendingAttachments
};
