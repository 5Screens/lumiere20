const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const {
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
} = require('../../../utils/primeVueFilters');

const TICKET_TYPE_CODE = 'TASK';

const getTicketTypeUuid = async () => {
  const tt = await prisma.ticket_types.findUnique({
    where: { code: TICKET_TYPE_CODE },
    select: { uuid: true },
  });
  return tt?.uuid || null;
};

const getInitialStatusForTask = async () => {
  try {
    const ticketTypeUuid = await getTicketTypeUuid();

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
    logger.error('[TASKS] Error getting initial status:', error);
    return null;
  }
};

const normalizeAssignedFields = (data = {}) => {
  return {
    assigned_to_group: data.assigned_to_group ?? null,
    assigned_to_person: data.assigned_to_person ?? null,
  };
};

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

const search = async (searchParams = {}, locale = 'en') => {
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

    const filtersForDb = { ...filters };
    delete filtersForDb.assigned_to_group;
    delete filtersForDb.assigned_to_person;

    const where = buildPrismaWhereFromFilters(filtersForDb, {
      globalSearchFields: Array.isArray(globalSearchFields) && globalSearchFields.length
        ? globalSearchFields
        : ['title', 'description'],
      dateColumns: ['created_at', 'updated_at', 'closed_at'],
    });

    if (where.AND) {
      where.AND.push({ ticket_type_code: TICKET_TYPE_CODE });
    } else {
      where.AND = [{ ticket_type_code: TICKET_TYPE_CODE }];
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

    const assignedToPerson = extractEqualsValue(assignedToPersonFilter);
    if (assignedToPerson) {
      where.AND.push({
        rel_tickets_groups_persons: {
          some: {
            type: 'ASSIGNED',
            ended_at: null,
            rel_assigned_to_person: assignedToPerson,
          },
        },
      });
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

    const transformed = items.map(item => {
      const next = { ...item };
      if (next.status && statusTranslationsMap[next.status.uuid]) {
        next.status = {
          ...next.status,
          name: statusTranslationsMap[next.status.uuid]?.[locale] || next.status.name,
          _translations: { name: statusTranslationsMap[next.status.uuid] },
        };
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
    logger.error('[TASKS] Error searching:', error);
    throw error;
  }
};

const getAll = async ({ page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1 } = {}) => {
  const skip = (page - 1) * limit;

  const where = { ticket_type_code: TICKET_TYPE_CODE };

  const [items, total] = await Promise.all([
    prisma.tickets.findMany({
      where,
      orderBy: buildPrismaOrderBy(sortField, sortOrder),
      skip,
      take: limit,
      include: {
        status: { include: { category: true } },
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

const getByUuid = async (uuid, locale = 'en') => {
  const item = await prisma.tickets.findFirst({
    where: { uuid, ticket_type_code: TICKET_TYPE_CODE },
    include: {
      status: { include: { category: true } },
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

const create = async (data) => {
  const { _translations, ...rawData } = data;
  void _translations;

  const assignment = normalizeAssignedFields(rawData);

  let statusUuid = rawData.rel_status_uuid || null;
  if (!statusUuid) {
    statusUuid = await getInitialStatusForTask();
  }

  const created = await prisma.tickets.create({
    data: {
      title: rawData.title,
      description: rawData.description || null,
      configuration_item_uuid: rawData.configuration_item_uuid || null,
      requested_by_uuid: rawData.requested_by_uuid || null,
      requested_for_uuid: rawData.requested_for_uuid || null,
      writer_uuid: rawData.writer_uuid,
      ticket_type_code: TICKET_TYPE_CODE,
      rel_status_uuid: statusUuid,
      extended_core_fields: rawData.extended_core_fields || {},
      closed_at: rawData.closed_at || null,
      watchers: rawData.watchers || null,
    },
  });

  await upsertAssignment(created.uuid, assignment.assigned_to_group, assignment.assigned_to_person);

  logger.info(`[TASKS] Created task ticket: ${created.uuid}`);

  return created;
};

const update = async (uuid, data) => {
  try {
    const { _translations, ...rawData } = data;
    void _translations;

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

    if (item.ticket_type_code !== TICKET_TYPE_CODE) {
      return null;
    }

    await upsertAssignment(item.uuid, assignment.assigned_to_group, assignment.assigned_to_person);

    logger.info(`[TASKS] Updated task ticket: ${uuid}`);

    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

const remove = async (uuid) => {
  try {
    const item = await prisma.tickets.findFirst({
      where: { uuid, ticket_type_code: TICKET_TYPE_CODE },
      select: { uuid: true },
    });

    if (!item) return false;

    await prisma.tickets.delete({ where: { uuid } });
    logger.info(`[TASKS] Deleted task ticket: ${uuid}`);
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

const removeMany = async (uuids) => {
  const result = await prisma.tickets.deleteMany({
    where: {
      uuid: { in: uuids },
      ticket_type_code: TICKET_TYPE_CODE,
    },
  });

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
};
