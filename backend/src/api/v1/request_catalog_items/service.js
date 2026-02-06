const prisma = require('../../../config/prisma');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search request catalog items with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField = 'display_order', sortOrder = 1, page = 1, limit = 25, locale = 'en' } = params;
  
  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  
  // Extract global filter
  const globalFilter = filters?.global?.value;
  
  // Build base where clause
  let where = {};
  
  // Handle is_active filter
  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }

  // Handle rel_service_uuid filter
  if (filters?.rel_service_uuid?.value) {
    where.rel_service_uuid = filters.rel_service_uuid.value;
  }
  
  // If there's a global search
  if (globalFilter && globalFilter.trim()) {
    const searchTerm = globalFilter.trim().toLowerCase();
    
    where = {
      ...where,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };
  }

  const [data, total] = await Promise.all([
    prisma.request_catalog_items.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        service: {
          select: { uuid: true, name: true }
        }
      }
    }),
    prisma.request_catalog_items.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all request catalog items
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'display_order', sortOrder = 1, locale = 'en', is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };
  
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.request_catalog_items.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        service: {
          select: { uuid: true, name: true }
        }
      }
    }),
    prisma.request_catalog_items.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get request catalog item by UUID
 */
const getByUuid = async (uuid, locale = 'en') => {
  const item = await prisma.request_catalog_items.findUnique({
    where: { uuid },
    include: {
      service: {
        select: { uuid: true, name: true }
      }
    }
  });

  return item;
};

/**
 * Create new request catalog item
 */
const create = async (data) => {
  const { rel_service_uuid, _translations, ...itemData } = data;
  
  // Remove null values and set defaults
  const cleanedData = Object.fromEntries(
    Object.entries(itemData).filter(([_, v]) => v !== null && v !== undefined)
  );
  
  // Ensure display_order has a default value
  if (cleanedData.display_order === undefined) {
    cleanedData.display_order = 0;
  }
  
  // Build create data with proper Prisma relation syntax
  const createData = {
    ...cleanedData,
    ...(rel_service_uuid && {
      service: { connect: { uuid: rel_service_uuid } }
    })
  };

  const item = await prisma.request_catalog_items.create({
    data: createData,
  });

  return item;
};

/**
 * Update request catalog item
 */
const update = async (uuid, data) => {
  try {
    const { rel_service_uuid, _translations, ...itemData } = data;
    
    // Build update data with proper Prisma relation syntax
    const updateData = {
      ...itemData,
      ...(rel_service_uuid !== undefined && {
        service: rel_service_uuid 
          ? { connect: { uuid: rel_service_uuid } }
          : { disconnect: true }
      })
    };

    const item = await prisma.request_catalog_items.update({
      where: { uuid },
      data: updateData,
    });

    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete request catalog item
 */
const remove = async (uuid) => {
  try {
    await prisma.request_catalog_items.delete({
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
 * Delete multiple request catalog items
 */
const removeMany = async (uuids) => {
  const result = await prisma.request_catalog_items.deleteMany({
    where: {
      uuid: { in: uuids },
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
