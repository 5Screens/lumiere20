const prisma = require('../../../config/prisma');

/**
 * Search service offerings with PrimeVue filters
 */
const search = async ({ filters, page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  // Build where clause from filters
  const where = {};
  if (filters) {
    if (filters.global?.value) {
      where.OR = [
        { name: { contains: filters.global.value, mode: 'insensitive' } },
        { description: { contains: filters.global.value, mode: 'insensitive' } },
        { environment: { contains: filters.global.value, mode: 'insensitive' } },
      ];
    }
    if (filters.service_uuid?.value) {
      where.service_uuid = filters.service_uuid.value;
    }
    // Filter by subscriber via service_offering_subscriptions
    const subscriberFilterMap = {
      rel_subscriber_entity_uuid: { type: 'entity', fk: 'rel_entity_uuid' },
      rel_subscriber_location_uuid: { type: 'location', fk: 'rel_location_uuid' },
      rel_subscriber_group_uuid: { type: 'group', fk: 'rel_group_uuid' },
      rel_subscriber_user_set_uuid: { type: 'user_set', fk: 'rel_user_set_uuid' },
    };
    for (const [filterKey, mapping] of Object.entries(subscriberFilterMap)) {
      if (filters[filterKey]?.value) {
        where.subscriptions = {
          some: {
            subscriber_type: mapping.type,
            [mapping.fk]: filters[filterKey].value,
          },
        };
        break;
      }
    }
  }

  const [data, total] = await Promise.all([
    prisma.service_offerings.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        service: true,
        operator_entity: true,
        status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.service_offerings.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all service offerings
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'updated_at', sortOrder = -1, serviceUuid = null }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };
  
  const where = serviceUuid ? { service_uuid: serviceUuid } : {};

  const [data, total] = await Promise.all([
    prisma.service_offerings.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        service: true,
        operator_entity: true,
        status: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.service_offerings.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get service offerings by service UUID
 */
const getByServiceUuid = async (serviceUuid) => {
  return prisma.service_offerings.findMany({
    where: { service_uuid: serviceUuid },
    orderBy: { updated_at: 'desc' },
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
          workflow: true,
        },
      },
    },
  });
};

/**
 * Get service offering by UUID
 */
const getById = async (uuid) => {
  return prisma.service_offerings.findUnique({
    where: { uuid },
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
          workflow: true,
        },
      },
      subscriptions: {
        include: {
          entity: true,
        },
      },
      commitments: true,
      ci_scope: {
        include: {
          configuration_item: true,
        },
      },
    },
  });
};

/**
 * Create new service offering
 */
const create = async (data) => {
  // Extract relation UUIDs and date fields, build connect syntax for Prisma
  const { service_uuid, operator_entity_uuid, rel_status_uuid, start_date, end_date, ...rest } = data;

  const processedData = {
    ...rest,
    end_date: end_date ? new Date(end_date) : null,
    service: { connect: { uuid: service_uuid } },
    operator_entity: { connect: { uuid: operator_entity_uuid } },
  };

  if (data.start_date) {
    processedData.start_date = new Date(data.start_date);
  }

  if (rel_status_uuid) {
    processedData.status = { connect: { uuid: rel_status_uuid } };
  }

  return prisma.service_offerings.create({
    data: processedData,
    include: {
      service: true,
      operator_entity: true,
      status: {
        include: {
          category: true,
        },
      },
    },
  });
};

/**
 * Update service offering
 */
const update = async (uuid, data) => {
  // Extract relation UUIDs and build connect syntax for Prisma
  const { service_uuid, operator_entity_uuid, rel_status_uuid, ...rest } = data;
  const processedData = { ...rest };

  if (data.start_date !== undefined) {
    processedData.start_date = data.start_date ? new Date(data.start_date) : null;
  }
  if (data.end_date !== undefined) {
    processedData.end_date = data.end_date ? new Date(data.end_date) : null;
  }
  if (service_uuid !== undefined) {
    processedData.service = { connect: { uuid: service_uuid } };
  }
  if (operator_entity_uuid !== undefined) {
    processedData.operator_entity = { connect: { uuid: operator_entity_uuid } };
  }
  if (rel_status_uuid !== undefined) {
    processedData.status = rel_status_uuid ? { connect: { uuid: rel_status_uuid } } : { disconnect: true };
  }

  try {
    return await prisma.service_offerings.update({
      where: { uuid },
      data: processedData,
      include: {
        service: true,
        operator_entity: true,
        status: {
          include: {
            category: true,
          },
        },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete service offering
 */
const remove = async (uuid) => {
  try {
    await prisma.service_offerings.delete({
      where: { uuid },
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

/**
 * Delete multiple service offerings
 */
const removeMany = async (uuids) => {
  const result = await prisma.service_offerings.deleteMany({
    where: { uuid: { in: uuids } },
  });
  return result.count;
};

/**
 * Get subscriptions for a service offering, optionally filtered by subscriber_type
 */
const getSubscriptions = async (serviceOfferingUuid, subscriberType = null) => {
  const where = { rel_service_offering_uuid: serviceOfferingUuid };
  if (subscriberType) {
    where.subscriber_type = subscriberType;
  }

  return prisma.service_offering_subscriptions.findMany({
    where,
    include: {
      user_set: true,
      location: true,
      entity: true,
      group: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Sync subscriptions for a service offering
 * Body: { subscriber_type, add: [uuid...], remove: [uuid...], update: [{ uuid, start_date, end_date, is_active }] }
 */
const syncSubscriptions = async (serviceOfferingUuid, { subscriber_type, add = [], remove: toRemove = [], update: toUpdate = [] }) => {
  // Map subscriber_type to the correct FK field
  const fkFieldMap = {
    entity: 'rel_entity_uuid',
    location: 'rel_location_uuid',
    group: 'rel_group_uuid',
    user_set: 'rel_user_set_uuid',
  };

  const fkField = fkFieldMap[subscriber_type];
  if (!fkField) {
    throw new Error(`Invalid subscriber_type: ${subscriber_type}`);
  }

  // Remove subscriptions
  if (toRemove.length > 0) {
    await prisma.service_offering_subscriptions.deleteMany({
      where: {
        rel_service_offering_uuid: serviceOfferingUuid,
        subscriber_type,
        [fkField]: { in: toRemove },
      },
    });
  }

  // Add subscriptions (avoid duplicates)
  if (add.length > 0) {
    const existing = await prisma.service_offering_subscriptions.findMany({
      where: {
        rel_service_offering_uuid: serviceOfferingUuid,
        subscriber_type,
        [fkField]: { in: add },
      },
      select: { [fkField]: true },
    });
    const existingSet = new Set(existing.map(e => e[fkField]));
    const toCreate = add.filter(id => !existingSet.has(id));

    if (toCreate.length > 0) {
      await prisma.service_offering_subscriptions.createMany({
        data: toCreate.map(subscriberUuid => ({
          rel_service_offering_uuid: serviceOfferingUuid,
          subscriber_type,
          [fkField]: subscriberUuid,
        })),
      });
    }
  }

  // Update existing subscriptions (start_date, end_date, is_active)
  if (toUpdate.length > 0) {
    for (const upd of toUpdate) {
      const updateData = {};
      if (upd.start_date !== undefined) {
        updateData.start_date = upd.start_date ? new Date(upd.start_date) : new Date();
      }
      if (upd.end_date !== undefined) {
        updateData.end_date = upd.end_date ? new Date(upd.end_date) : null;
      }
      if (upd.is_active !== undefined) {
        updateData.is_active = upd.is_active;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.service_offering_subscriptions.updateMany({
          where: {
            rel_service_offering_uuid: serviceOfferingUuid,
            subscriber_type,
            [fkField]: upd.uuid,
          },
          data: updateData,
        });
      }
    }
  }

  return { success: true };
};

module.exports = {
  search,
  getAll,
  getByServiceUuid,
  getById,
  create,
  update,
  remove,
  removeMany,
  getSubscriptions,
  syncSubscriptions,
};
