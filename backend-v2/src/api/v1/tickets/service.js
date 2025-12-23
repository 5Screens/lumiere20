const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

/**
 * Get ticket type UUID from code
 */
const getTicketTypeUuid = async (ticketTypeCode) => {
  if (!ticketTypeCode) return null;
  const tt = await prisma.ticket_types.findUnique({
    where: { code: ticketTypeCode },
    select: { uuid: true },
  });
  return tt?.uuid || null;
};

/**
 * Get initial workflow status for a ticket type
 */
const getInitialStatusForTicketType = async (ticketTypeCode) => {
  try {
    const ticketTypeUuid = await getTicketTypeUuid(ticketTypeCode);

    let workflow = null;
    if (ticketTypeUuid) {
      workflow = await prisma.workflows.findFirst({
        where: {
          entity_type: 'tickets',
          rel_entity_type_uuid: ticketTypeUuid,
          is_active: true,
        },
        include: {
          statuses: {
            where: { is_initial: true },
            take: 1,
          },
        },
      });
    }

    if (!workflow) {
      workflow = await prisma.workflows.findFirst({
        where: {
          entity_type: 'tickets',
          rel_entity_type_uuid: null,
          is_active: true,
        },
        include: {
          statuses: {
            where: { is_initial: true },
            take: 1,
          },
        },
      });
    }

    if (workflow?.statuses?.length) {
      return workflow.statuses[0].uuid;
    }

    return null;
  } catch (error) {
    logger.error(`[TICKETS] Error getting initial status for ${ticketTypeCode}:`, error);
    return null;
  }
};

/**
 * Normalize assignment fields from request data
 */
const normalizeAssignedFields = (data = {}) => {
  return {
    assigned_to_group: data.assigned_to_group ?? null,
    assigned_to_person: data.assigned_to_person ?? null,
  };
};

/**
 * Attach assignment fields to tickets from rel_tickets_groups_persons
 */
const attachAssignmentFields = async (tickets) => {
  const list = Array.isArray(tickets) ? tickets : [tickets];
  const uuids = list.map(t => t.uuid).filter(Boolean);
  if (!uuids.length) return tickets;

  const relations = await prisma.rel_tickets_groups_persons.findMany({
    where: {
      rel_ticket: { in: uuids },
      type: 'ASSIGNED',
      ended_at: null,
    },
    select: {
      rel_ticket: true,
      rel_assigned_to_group: true,
      rel_assigned_to_person: true,
    },
  });

  const map = new Map();
  for (const r of relations) {
    map.set(r.rel_ticket, {
      assigned_to_group: r.rel_assigned_to_group || null,
      assigned_to_person: r.rel_assigned_to_person || null,
    });
  }

  const mergeOne = (t) => {
    const extra = map.get(t.uuid) || { assigned_to_group: null, assigned_to_person: null };
    return { ...t, ...extra };
  };

  if (Array.isArray(tickets)) return tickets.map(mergeOne);
  return mergeOne(tickets);
};

/**
 * Upsert assignment relation for a ticket
 */
const upsertAssignment = async (ticketUuid, assignedToGroup, assignedToPerson) => {
  const hasAny = !!(assignedToGroup || assignedToPerson);

  const existing = await prisma.rel_tickets_groups_persons.findFirst({
    where: {
      rel_ticket: ticketUuid,
      type: 'ASSIGNED',
      ended_at: null,
    },
    select: { uuid: true },
  });

  if (!hasAny) {
    if (existing) {
      await prisma.rel_tickets_groups_persons.update({
        where: { uuid: existing.uuid },
        data: { ended_at: new Date() },
      });
    }
    return;
  }

  if (existing) {
    await prisma.rel_tickets_groups_persons.update({
      where: { uuid: existing.uuid },
      data: {
        rel_assigned_to_group: assignedToGroup,
        rel_assigned_to_person: assignedToPerson,
        ended_at: null,
      },
    });
    return;
  }

  await prisma.rel_tickets_groups_persons.create({
    data: {
      rel_ticket: ticketUuid,
      rel_assigned_to_group: assignedToGroup,
      rel_assigned_to_person: assignedToPerson,
      type: 'ASSIGNED',
      ended_at: null,
    },
  });
};

/**
 * Get extended fields definition for a ticket type
 */
const getTicketTypeFields = async (ticketTypeCode) => {
  if (!ticketTypeCode) return [];
  
  const ticketType = await prisma.ticket_types.findUnique({
    where: { code: ticketTypeCode },
    include: {
      fields: {
        orderBy: { display_order: 'asc' },
      },
    },
  });
  
  return ticketType?.fields || [];
};

/**
 * Search tickets with optional ticket_type_code filter
 */
const search = async (searchParams = {}, locale = 'en', ticketTypeCode = null) => {
  try {
    const {
      filters = {},
      sortField = 'updated_at',
      sortOrder = -1,
      page = 1,
      limit = 25,
      globalSearchFields = null,
    } = searchParams;

    const skip = (page - 1) * limit;

    const assignedToGroupFilter = filters.assigned_to_group;
    const assignedToPersonFilter = filters.assigned_to_person;
    const statusFilter = filters.rel_status_uuid;
    const requestedByFilter = filters.requested_by_uuid;
    const requestedForFilter = filters.requested_for_uuid;
    const writerFilter = filters.writer_uuid;
    const configurationItemFilter = filters.configuration_item_uuid;

    const filtersForDb = { ...filters };
    delete filtersForDb.assigned_to_group;
    delete filtersForDb.assigned_to_person;
    delete filtersForDb.rel_status_uuid;
    delete filtersForDb.requested_by_uuid;
    delete filtersForDb.requested_for_uuid;
    delete filtersForDb.writer_uuid;
    delete filtersForDb.configuration_item_uuid;

    const where = buildPrismaWhereFromFilters(filtersForDb, {
      globalSearchFields: Array.isArray(globalSearchFields) && globalSearchFields.length
        ? globalSearchFields
        : ['title', 'description'],
      dateColumns: ['created_at', 'updated_at', 'closed_at'],
    });

    if (!where.AND) {
      where.AND = [];
    }

    // Filter by ticket type if specified
    if (ticketTypeCode) {
      where.AND.push({ ticket_type_code: ticketTypeCode });
    }

    const extractEqualsValue = (filterObj) => {
      const constraint = filterObj?.constraints?.[0];
      const value = constraint?.value;
      if (value === null || value === undefined || value === '') return null;
      return value;
    };

    const assignedToGroup = extractEqualsValue(assignedToGroupFilter);
    if (assignedToGroup) {
      where.AND.push({
        rel_tickets_groups_persons: {
          some: {
            type: 'ASSIGNED',
            ended_at: null,
            rel_assigned_to_group: assignedToGroup,
          },
        },
      });
    }

    // Handle assigned_to_person filter with smart text search
    const assignedToPersonValue = assignedToPersonFilter?.constraints?.[0]?.value;
    if (assignedToPersonValue && typeof assignedToPersonValue === 'string' && assignedToPersonValue.trim()) {
      const trimmed = assignedToPersonValue.trim();
      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      let matchingPersons;
      if (searchTerms.length > 1) {
        // Multiple words: each word must match at least one field
        matchingPersons = await prisma.persons.findMany({
          where: {
            AND: searchTerms.map(term => ({
              OR: [
                { first_name: { contains: term, mode: 'insensitive' } },
                { last_name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            })),
          },
          select: { uuid: true },
        });
      } else {
        // Single word: match any field
        matchingPersons = await prisma.persons.findMany({
          where: {
            OR: [
              { first_name: { contains: searchTerms[0], mode: 'insensitive' } },
              { last_name: { contains: searchTerms[0], mode: 'insensitive' } },
              { email: { contains: searchTerms[0], mode: 'insensitive' } },
            ],
          },
          select: { uuid: true },
        });
      }

      const personUuids = matchingPersons.map(p => p.uuid);
      if (personUuids.length > 0) {
        where.AND.push({
          rel_tickets_groups_persons: {
            some: {
              type: 'ASSIGNED',
              ended_at: null,
              rel_assigned_to_person: { in: personUuids },
            },
          },
        });
      } else {
        where.AND.push({ uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle workflow status filter (search by status name, not UUID)
    const statusSearchValue = statusFilter?.constraints?.[0]?.value;
    if (statusSearchValue && typeof statusSearchValue === 'string' && statusSearchValue.trim()) {
      // Find workflow_statuses matching the search text in name
      const matchingByName = await prisma.workflow_statuses.findMany({
        where: { name: { contains: statusSearchValue, mode: 'insensitive' } },
        select: { uuid: true },
      });

      // Find workflow_statuses matching the search text in translations
      const matchingTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'workflow_statuses',
          field_name: 'name',
          value: { contains: statusSearchValue, mode: 'insensitive' },
        },
        select: { entity_uuid: true },
      });

      const statusUuids = [
        ...new Set([
          ...matchingByName.map(s => s.uuid),
          ...matchingTranslations.map(t => t.entity_uuid),
        ]),
      ];

      if (statusUuids.length > 0) {
        where.AND.push({ rel_status_uuid: { in: statusUuids } });
      } else {
        // No matching status found, return empty results
        where.AND.push({ rel_status_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Helper function to search persons with smart space handling (AND between words)
    const searchPersonsByText = async (searchValue) => {
      const trimmed = searchValue.trim();
      if (!trimmed) return [];

      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length > 1) {
        // Multiple words: each word must match at least one field (first_name, last_name, email)
        const matchingPersons = await prisma.persons.findMany({
          where: {
            AND: searchTerms.map(term => ({
              OR: [
                { first_name: { contains: term, mode: 'insensitive' } },
                { last_name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            })),
          },
          select: { uuid: true },
        });
        return matchingPersons.map(p => p.uuid);
      } else {
        // Single word: match any field
        const matchingPersons = await prisma.persons.findMany({
          where: {
            OR: [
              { first_name: { contains: searchTerms[0], mode: 'insensitive' } },
              { last_name: { contains: searchTerms[0], mode: 'insensitive' } },
              { email: { contains: searchTerms[0], mode: 'insensitive' } },
            ],
          },
          select: { uuid: true },
        });
        return matchingPersons.map(p => p.uuid);
      }
    };

    // Handle requested_by filter (search by person name)
    const requestedByValue = requestedByFilter?.constraints?.[0]?.value;
    if (requestedByValue && typeof requestedByValue === 'string') {
      const personUuids = await searchPersonsByText(requestedByValue);
      if (personUuids.length > 0) {
        where.AND.push({ requested_by_uuid: { in: personUuids } });
      } else {
        where.AND.push({ requested_by_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle requested_for filter (search by person name)
    const requestedForValue = requestedForFilter?.constraints?.[0]?.value;
    if (requestedForValue && typeof requestedForValue === 'string') {
      const personUuids = await searchPersonsByText(requestedForValue);
      if (personUuids.length > 0) {
        where.AND.push({ requested_for_uuid: { in: personUuids } });
      } else {
        where.AND.push({ requested_for_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle writer filter (search by person name)
    const writerValue = writerFilter?.constraints?.[0]?.value;
    if (writerValue && typeof writerValue === 'string') {
      const personUuids = await searchPersonsByText(writerValue);
      if (personUuids.length > 0) {
        where.AND.push({ writer_uuid: { in: personUuids } });
      } else {
        where.AND.push({ writer_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle configuration_item filter (search by CI name)
    const ciValue = configurationItemFilter?.constraints?.[0]?.value;
    if (ciValue && typeof ciValue === 'string' && ciValue.trim()) {
      const trimmed = ciValue.trim();
      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      let matchingCIs;
      if (searchTerms.length > 1) {
        // Multiple words: each word must match the name
        matchingCIs = await prisma.configuration_items.findMany({
          where: {
            AND: searchTerms.map(term => ({
              name: { contains: term, mode: 'insensitive' },
            })),
          },
          select: { uuid: true },
        });
      } else {
        // Single word: match name
        matchingCIs = await prisma.configuration_items.findMany({
          where: {
            name: { contains: searchTerms[0], mode: 'insensitive' },
          },
          select: { uuid: true },
        });
      }

      const ciUuids = matchingCIs.map(ci => ci.uuid);
      if (ciUuids.length > 0) {
        where.AND.push({ configuration_item_uuid: { in: ciUuids } });
      } else {
        where.AND.push({ configuration_item_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Clean up empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const total = await prisma.tickets.count({ where });

    const items = await prisma.tickets.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
      include: {
        status: {
          include: { category: true },
        },
        ticket_type: true,
        writer: {
          select: { uuid: true, first_name: true, last_name: true, email: true }
        },
        requested_by: {
          select: { uuid: true, first_name: true, last_name: true, email: true }
        },
        requested_for: {
          select: { uuid: true, first_name: true, last_name: true, email: true }
        },
        configuration_item: {
          select: { uuid: true, name: true }
        },
      },
    });

    const statusUuids = items.filter(i => i.status).map(i => i.status.uuid);
    const statusTranslationsMap = {};

    if (statusUuids.length > 0) {
      const statusTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'workflow_statuses',
          entity_uuid: { in: statusUuids },
          field_name: 'name',
        },
      });

      for (const t of statusTranslations) {
        if (!statusTranslationsMap[t.entity_uuid]) statusTranslationsMap[t.entity_uuid] = {};
        statusTranslationsMap[t.entity_uuid][t.locale] = t.value;
      }
    }

    // Get ticket type translations
    const ticketTypeUuids = items.filter(i => i.ticket_type).map(i => i.ticket_type.uuid);
    const ticketTypeTranslationsMap = {};

    logger.info(`[TICKETS] ticketTypeUuids: ${JSON.stringify(ticketTypeUuids)}`);
    logger.info(`[TICKETS] locale for translation: ${locale}`);

    if (ticketTypeUuids.length > 0) {
      const ticketTypeTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'ticket_types',
          entity_uuid: { in: ticketTypeUuids },
          field_name: 'label',
        },
      });

      logger.info(`[TICKETS] ticketTypeTranslations found: ${JSON.stringify(ticketTypeTranslations)}`);

      for (const t of ticketTypeTranslations) {
        if (!ticketTypeTranslationsMap[t.entity_uuid]) ticketTypeTranslationsMap[t.entity_uuid] = {};
        ticketTypeTranslationsMap[t.entity_uuid][t.locale] = t.value;
      }

      logger.info(`[TICKETS] ticketTypeTranslationsMap: ${JSON.stringify(ticketTypeTranslationsMap)}`);
    }

    const transformed = items.map(item => {
      const next = { ...item };
      if (next.status && statusTranslationsMap[next.status.uuid]) {
        next.status = {
          ...next.status,
          name: statusTranslationsMap[next.status.uuid]?.[locale] || next.status.name,
          _translations: { name: statusTranslationsMap[next.status.uuid] },
        };
      }
      if (next.ticket_type) {
        const ttUuid = next.ticket_type.uuid;
        const ttTranslations = ticketTypeTranslationsMap[ttUuid];
        logger.info(`[TICKETS] Transforming ticket_type: uuid=${ttUuid}, translations=${JSON.stringify(ttTranslations)}, locale=${locale}`);
        if (ttTranslations) {
          const translatedLabel = ttTranslations[locale] || next.ticket_type.label;
          logger.info(`[TICKETS] Setting ticket_type.label to: ${translatedLabel}`);
          next.ticket_type = {
            ...next.ticket_type,
            label: translatedLabel,
            _translations: { label: ttTranslations },
          };
        }
      }
      return next;
    });

    const withAssignment = await attachAssignmentFields(transformed);

    return {
      data: withAssignment,
      total,
      pagination: buildPaginationResponse(page, limit, total),
    };
  } catch (error) {
    logger.error(`[TICKETS] Error searching (type=${ticketTypeCode}):`, error);
    throw error;
  }
};

/**
 * Get all tickets with optional ticket_type_code filter
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1, ticketTypeCode = null } = {}) => {
  const skip = (page - 1) * limit;

  const where = ticketTypeCode ? { ticket_type_code: ticketTypeCode } : {};

  const [items, total] = await Promise.all([
    prisma.tickets.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
      include: {
        status: { include: { category: true } },
        ticket_type: true,
      },
    }),
    prisma.tickets.count({ where }),
  ]);

  const withAssignment = await attachAssignmentFields(items);

  return {
    data: withAssignment,
    total,
    pagination: buildPaginationResponse(page, limit, total),
  };
};

/**
 * Get a ticket by UUID with optional ticket_type_code validation
 */
const getByUuid = async (uuid, locale = 'en', ticketTypeCode = null) => {
  const where = { uuid };
  if (ticketTypeCode) {
    where.ticket_type_code = ticketTypeCode;
  }

  const item = await prisma.tickets.findFirst({
    where,
    include: {
      status: { include: { category: true } },
      ticket_type: true,
    },
  });

  if (!item) return null;

  if (item.status) {
    const statusTranslations = await prisma.translated_fields.findMany({
      where: {
        entity_type: 'workflow_statuses',
        entity_uuid: item.status.uuid,
        field_name: 'name',
        locale,
      },
    });

    item.status = {
      ...item.status,
      name: statusTranslations[0]?.value || item.status.name,
    };
  }

  return attachAssignmentFields(item);
};

/**
 * Create a new ticket
 */
const create = async (data, ticketTypeCode = null) => {
  const { _translations, ...rawData } = data;
  void _translations;

  const assignment = normalizeAssignedFields(rawData);
  const typeCode = ticketTypeCode || rawData.ticket_type_code;

  if (!typeCode) {
    throw new Error('ticket_type_code is required');
  }

  let statusUuid = rawData.rel_status_uuid || null;
  if (!statusUuid) {
    statusUuid = await getInitialStatusForTicketType(typeCode);
  }

  const created = await prisma.tickets.create({
    data: {
      title: rawData.title,
      description: rawData.description || null,
      configuration_item_uuid: rawData.configuration_item_uuid || null,
      requested_by_uuid: rawData.requested_by_uuid || null,
      requested_for_uuid: rawData.requested_for_uuid || null,
      writer_uuid: rawData.writer_uuid,
      ticket_type_code: typeCode,
      rel_status_uuid: statusUuid,
      extended_core_fields: rawData.extended_core_fields || {},
      closed_at: rawData.closed_at || null,
      watchers: rawData.watchers || null,
    },
  });

  await upsertAssignment(created.uuid, assignment.assigned_to_group, assignment.assigned_to_person);

  logger.info(`[TICKETS] Created ticket (type=${typeCode}): ${created.uuid}`);

  return created;
};

/**
 * Update a ticket
 */
const update = async (uuid, data, ticketTypeCode = null) => {
  try {
    const { _translations, ...rawData } = data;
    void _translations;

    logger.info(`[TICKETS] Update called for ${uuid} with data: ${JSON.stringify(rawData)}`);

    const assignment = normalizeAssignedFields(rawData);

    const updateData = {};

    if (rawData.title !== undefined) updateData.title = rawData.title;
    if (rawData.description !== undefined) updateData.description = rawData.description;
    if (rawData.configuration_item_uuid !== undefined)
      updateData.configuration_item_uuid = rawData.configuration_item_uuid;
    if (rawData.requested_by_uuid !== undefined) updateData.requested_by_uuid = rawData.requested_by_uuid;
    if (rawData.requested_for_uuid !== undefined) updateData.requested_for_uuid = rawData.requested_for_uuid;
    if (rawData.writer_uuid !== undefined) updateData.writer_uuid = rawData.writer_uuid;
    if (rawData.rel_status_uuid !== undefined) updateData.rel_status_uuid = rawData.rel_status_uuid;
    if (rawData.extended_core_fields !== undefined) updateData.extended_core_fields = rawData.extended_core_fields;
    if (rawData.closed_at !== undefined) updateData.closed_at = rawData.closed_at;
    if (rawData.watchers !== undefined) updateData.watchers = rawData.watchers;

    const item = await prisma.tickets.update({
      where: { uuid },
      data: updateData,
    });

    // Validate ticket type if specified
    if (ticketTypeCode && item.ticket_type_code !== ticketTypeCode) {
      return null;
    }

    await upsertAssignment(item.uuid, assignment.assigned_to_group, assignment.assigned_to_person);

    logger.info(`[TICKETS] Updated ticket: ${uuid}`);

    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete a ticket
 */
const remove = async (uuid, ticketTypeCode = null) => {
  try {
    const where = { uuid };
    if (ticketTypeCode) {
      where.ticket_type_code = ticketTypeCode;
    }

    const item = await prisma.tickets.findFirst({
      where,
      select: { uuid: true },
    });

    if (!item) return false;

    await prisma.tickets.delete({ where: { uuid } });
    logger.info(`[TICKETS] Deleted ticket: ${uuid}`);
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

/**
 * Delete multiple tickets
 */
const removeMany = async (uuids, ticketTypeCode = null) => {
  const where = { uuid: { in: uuids } };
  if (ticketTypeCode) {
    where.ticket_type_code = ticketTypeCode;
  }

  const result = await prisma.tickets.deleteMany({ where });

  return result.count;
};

module.exports = {
  search,
  getAll,
  getByUuid,
  create,
  update,
  remove,
  removeMany,
  getTicketTypeFields,
  getTicketTypeUuid,
  getInitialStatusForTicketType,
};
