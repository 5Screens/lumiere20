const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

// Person fields that need special sorting by first_name + last_name
const PERSON_SORT_FIELDS = {
  writer_uuid: 'writer',
  requested_by_uuid: 'requested_by',
  requested_for_uuid: 'requested_for',
  assigned_person_uuid: 'assigned_person',
};

// Relation fields that need special sorting by name
const RELATION_SORT_FIELDS = {
  configuration_item_uuid: { relation: 'configuration_item', field: 'name' },
  assigned_group_uuid: { relation: 'assigned_group', field: 'group_name' },
};

/**
 * Build orderBy clause for person fields (sort by first_name, last_name)
 * @param {string} sortField - Field name (e.g., 'writer_uuid')
 * @param {number} sortOrder - 1 for asc, -1 for desc
 * @returns {Array} Prisma orderBy array for person relation
 */
const buildPersonOrderBy = (sortField, sortOrder) => {
  const relationName = PERSON_SORT_FIELDS[sortField];
  if (relationName) {
    const direction = sortOrder === 1 || sortOrder === 'asc' ? 'asc' : 'desc';
    return [
      { [relationName]: { first_name: direction } },
      { [relationName]: { last_name: direction } },
    ];
  }
  
  const relationConfig = RELATION_SORT_FIELDS[sortField];
  if (relationConfig) {
    const direction = sortOrder === 1 || sortOrder === 'asc' ? 'asc' : 'desc';
    return { [relationConfig.relation]: { [relationConfig.field]: direction } };
  }
  
  return null;
};

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
 * Standard include for ticket queries - includes assignment relations directly
 */
const getTicketInclude = () => ({
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
  assigned_group: {
    select: { uuid: true, group_name: true, description: true }
  },
  assigned_person: {
    select: { uuid: true, first_name: true, last_name: true, email: true }
  },
});

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

    // Handle assigned_to_group filter with smart text search
    const assignedToGroupValue = assignedToGroupFilter?.constraints?.[0]?.value;
    if (assignedToGroupValue && typeof assignedToGroupValue === 'string' && assignedToGroupValue.trim()) {
      const trimmed = assignedToGroupValue.trim();
      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      let matchingGroups;
      if (searchTerms.length > 1) {
        matchingGroups = await prisma.groups.findMany({
          where: {
            AND: searchTerms.map(term => ({
              group_name: { contains: term, mode: 'insensitive' },
            })),
          },
          select: { uuid: true },
        });
      } else {
        matchingGroups = await prisma.groups.findMany({
          where: {
            group_name: { contains: searchTerms[0], mode: 'insensitive' },
          },
          select: { uuid: true },
        });
      }

      const groupUuids = matchingGroups.map(g => g.uuid);
      if (groupUuids.length > 0) {
        where.AND.push({ assigned_group_uuid: { in: groupUuids } });
      } else {
        where.AND.push({ uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle assigned_to_person filter with smart text search
    const assignedToPersonValue = assignedToPersonFilter?.constraints?.[0]?.value;
    if (assignedToPersonValue && typeof assignedToPersonValue === 'string' && assignedToPersonValue.trim()) {
      const trimmed = assignedToPersonValue.trim();
      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      let matchingPersons;
      if (searchTerms.length > 1) {
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
        where.AND.push({ assigned_person_uuid: { in: personUuids } });
      } else {
        where.AND.push({ uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle workflow status filter
    const statusSearchValue = statusFilter?.constraints?.[0]?.value;
    const statusMatchMode = statusFilter?.constraints?.[0]?.matchMode || 'equals';
    
    if (statusSearchValue) {
      // If value is an array of UUIDs (from MultiSelect), use IN/NOT IN
      if (Array.isArray(statusSearchValue) && statusSearchValue.length > 0) {
        const isNot = statusMatchMode === 'notEquals' || statusMatchMode === 'notIn';
        if (isNot) {
          // NOT IN: exclude these statuses, include null (unassigned)
          where.AND.push({
            OR: [
              { rel_status_uuid: { notIn: statusSearchValue } },
              { rel_status_uuid: null }
            ]
          });
        } else {
          // IN: include only these statuses
          where.AND.push({ rel_status_uuid: { in: statusSearchValue } });
        }
      }
      // If value is a string, search by status name (legacy text search)
      else if (typeof statusSearchValue === 'string' && statusSearchValue.trim()) {
        const matchingByName = await prisma.workflow_statuses.findMany({
          where: { name: { contains: statusSearchValue, mode: 'insensitive' } },
          select: { uuid: true },
        });

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
          where.AND.push({ rel_status_uuid: '00000000-0000-0000-0000-000000000000' });
        }
      }
    }

    // Helper function to search persons with smart space handling
    const searchPersonsByText = async (searchValue) => {
      const trimmed = searchValue.trim();
      if (!trimmed) return [];

      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length > 1) {
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

    // Handle requested_by filter
    const requestedByValue = requestedByFilter?.constraints?.[0]?.value;
    if (requestedByValue && typeof requestedByValue === 'string') {
      const personUuids = await searchPersonsByText(requestedByValue);
      if (personUuids.length > 0) {
        where.AND.push({ requested_by_uuid: { in: personUuids } });
      } else {
        where.AND.push({ requested_by_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle requested_for filter
    const requestedForValue = requestedForFilter?.constraints?.[0]?.value;
    if (requestedForValue && typeof requestedForValue === 'string') {
      const personUuids = await searchPersonsByText(requestedForValue);
      if (personUuids.length > 0) {
        where.AND.push({ requested_for_uuid: { in: personUuids } });
      } else {
        where.AND.push({ requested_for_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle writer filter
    const writerValue = writerFilter?.constraints?.[0]?.value;
    if (writerValue && typeof writerValue === 'string') {
      const personUuids = await searchPersonsByText(writerValue);
      if (personUuids.length > 0) {
        where.AND.push({ writer_uuid: { in: personUuids } });
      } else {
        where.AND.push({ writer_uuid: '00000000-0000-0000-0000-000000000000' });
      }
    }

    // Handle configuration_item filter
    const ciValue = configurationItemFilter?.constraints?.[0]?.value;
    if (ciValue && typeof ciValue === 'string' && ciValue.trim()) {
      const trimmed = ciValue.trim();
      const searchTerms = trimmed.split(/\s+/).filter(term => term.length > 0);

      let matchingCIs;
      if (searchTerms.length > 1) {
        matchingCIs = await prisma.configuration_items.findMany({
          where: {
            AND: searchTerms.map(term => ({
              name: { contains: term, mode: 'insensitive' },
            })),
          },
          select: { uuid: true },
        });
      } else {
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

    // Build orderBy - use special sorting for person fields
    const personOrderBy = buildPersonOrderBy(sortField, sortOrder);
    const orderBy = personOrderBy || buildPrismaOrderBy(sortField, sortOrder);

    const items = await prisma.tickets.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: getTicketInclude(),
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

    if (ticketTypeUuids.length > 0) {
      const ticketTypeTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'ticket_types',
          entity_uuid: { in: ticketTypeUuids },
          field_name: 'label',
        },
      });

      for (const t of ticketTypeTranslations) {
        if (!ticketTypeTranslationsMap[t.entity_uuid]) ticketTypeTranslationsMap[t.entity_uuid] = {};
        ticketTypeTranslationsMap[t.entity_uuid][t.locale] = t.value;
      }
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
        if (ttTranslations) {
          next.ticket_type = {
            ...next.ticket_type,
            label: ttTranslations[locale] || next.ticket_type.label,
            _translations: { label: ttTranslations },
          };
        }
      }
      return next;
    });

    return {
      data: transformed,
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
      include: getTicketInclude(),
    }),
    prisma.tickets.count({ where }),
  ]);

  return {
    data: items,
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
    include: getTicketInclude(),
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

  return item;
};

/**
 * Create a new ticket
 */
const create = async (data, ticketTypeCode = null) => {
  const { _translations, ...rawData } = data;
  void _translations;

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
      assigned_group_uuid: rawData.assigned_group_uuid || null,
      assigned_person_uuid: rawData.assigned_person_uuid || null,
      extended_core_fields: rawData.extended_core_fields || {},
      closed_at: rawData.closed_at || null,
      watchers: rawData.watchers || null,
    },
  });

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
    
    // Handle assignment fields
    if (rawData.assigned_group_uuid !== undefined) updateData.assigned_group_uuid = rawData.assigned_group_uuid;
    if (rawData.assigned_person_uuid !== undefined) updateData.assigned_person_uuid = rawData.assigned_person_uuid;

    const item = await prisma.tickets.update({
      where: { uuid },
      data: updateData,
      include: getTicketInclude(),
    });

    // Validate ticket type if specified
    if (ticketTypeCode && item.ticket_type_code !== ticketTypeCode) {
      return null;
    }

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
