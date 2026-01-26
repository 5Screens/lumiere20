const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search audit changes with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { 
    globalSearchFields: ['object_type', 'event_type', 'attribute_name'] 
  });
  const orderBy = buildPrismaOrderBy(sortField || 'event_date', sortOrder || -1);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.audit_changes.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    }),
    prisma.audit_changes.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all audit changes with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'event_date', sortOrder = -1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.audit_changes.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            uuid: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    }),
    prisma.audit_changes.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get audit changes for a specific object
 */
const getByObjectUuid = async (objectUuid) => {
  return prisma.audit_changes.findMany({
    where: { object_uuid: objectUuid },
    orderBy: { event_date: 'desc' },
    include: {
      user: {
        select: {
          uuid: true,
          first_name: true,
          last_name: true,
          email: true
        }
      }
    }
  });
};

module.exports = {
  search,
  getAll,
  getByObjectUuid,
};
