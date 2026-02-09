const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search commitments with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = buildPrismaWhereFromFilters(filters, {
    globalSearchFields: [],
    dateColumns: ['start_date', 'end_date', 'created_at', 'updated_at'],
    uuidColumns: ['rel_service_offering_uuid', 'rel_sla_definition_uuid'],
  });

  const [data, total] = await Promise.all([
    prisma.commitments.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        sla_definition: {
          select: { uuid: true, name: true, metric_type: true, target_value: true, target_unit: true },
        },
        service_offering: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.commitments.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all commitments
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'created_at', sortOrder = -1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.commitments.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        sla_definition: {
          select: { uuid: true, name: true, metric_type: true, target_value: true, target_unit: true },
        },
        service_offering: {
          select: { uuid: true, name: true },
        },
      },
    }),
    prisma.commitments.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get commitment by UUID
 */
const getByUuid = async (uuid) => {
  return prisma.commitments.findUnique({
    where: { uuid },
    include: {
      sla_definition: true,
      service_offering: {
        include: {
          service: {
            select: { uuid: true, name: true },
          },
        },
      },
    },
  });
};

/**
 * Create new commitment
 */
const create = async (data) => {
  const { rel_service_offering_uuid, rel_sla_definition_uuid, start_date, end_date, ...rest } = data;

  const createData = {
    ...rest,
    service_offering: { connect: { uuid: rel_service_offering_uuid } },
    sla_definition: { connect: { uuid: rel_sla_definition_uuid } },
  };

  if (start_date) {
    createData.start_date = new Date(start_date);
  }
  if (end_date) {
    createData.end_date = new Date(end_date);
  }

  return prisma.commitments.create({
    data: createData,
    include: {
      sla_definition: {
        select: { uuid: true, name: true, metric_type: true, target_value: true, target_unit: true },
      },
      service_offering: {
        select: { uuid: true, name: true },
      },
    },
  });
};

/**
 * Update commitment
 */
const update = async (uuid, data) => {
  const { rel_service_offering_uuid, rel_sla_definition_uuid, ...rest } = data;
  const updateData = { ...rest };

  if (data.start_date !== undefined) {
    updateData.start_date = data.start_date ? new Date(data.start_date) : null;
  }
  if (data.end_date !== undefined) {
    updateData.end_date = data.end_date ? new Date(data.end_date) : null;
  }
  if (rel_service_offering_uuid !== undefined) {
    updateData.service_offering = { connect: { uuid: rel_service_offering_uuid } };
  }
  if (rel_sla_definition_uuid !== undefined) {
    updateData.sla_definition = { connect: { uuid: rel_sla_definition_uuid } };
  }

  try {
    return await prisma.commitments.update({
      where: { uuid },
      data: updateData,
      include: {
        sla_definition: {
          select: { uuid: true, name: true, metric_type: true, target_value: true, target_unit: true },
        },
        service_offering: {
          select: { uuid: true, name: true },
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
 * Delete commitment
 */
const remove = async (uuid) => {
  try {
    await prisma.commitments.delete({
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
 * Delete multiple commitments
 */
const removeMany = async (uuids) => {
  const result = await prisma.commitments.deleteMany({
    where: { uuid: { in: uuids } },
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
