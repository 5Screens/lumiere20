const prisma = require('../../../config/prisma');
const { buildPrismaOrderBy } = require('../../../utils/primeVueFilters');
const logger = require('../../../config/logger');

// Filter field definitions: maps flat field names to criteria keys
// Each entry: { toggle: 'is_filter_by_X', value: 'filter_X', criteriaKey: 'person_field_name' }
const FILTER_FIELDS = [
  { toggle: 'is_filter_by_role', value: 'filter_role_uuid', criteriaKey: 'role_uuid' },
  { toggle: 'is_filter_by_language', value: 'filter_language_uuid', criteriaKey: 'language_uuid' },
  { toggle: 'is_filter_by_entity', value: 'filter_ref_entity_uuid', criteriaKey: 'ref_entity_uuid' },
  { toggle: 'is_filter_by_location', value: 'filter_ref_location_uuid', criteriaKey: 'ref_location_uuid' },
  { toggle: 'is_filter_by_approving_manager', value: 'filter_ref_approving_manager_uuid', criteriaKey: 'ref_approving_manager_uuid' },
  { toggle: 'is_filter_by_is_active', value: 'filter_is_active', criteriaKey: 'is_active' },
  { toggle: 'is_filter_by_critical_user', value: 'filter_critical_user', criteriaKey: 'critical_user' },
  { toggle: 'is_filter_by_external_user', value: 'filter_external_user', criteriaKey: 'external_user' },
  { toggle: 'is_filter_by_email', value: 'filter_email', criteriaKey: 'email' },
];

/**
 * Pack flat filter fields from the frontend into a JSON criteria object.
 * Only includes filters where the toggle is true and the value is set.
 */
const packCriteria = (data) => {
  const criteria = {};
  for (const { toggle, value, criteriaKey } of FILTER_FIELDS) {
    if (data[toggle] === true) {
      const val = data[value];
      if (val !== undefined && val !== null && val !== '') {
        criteria[criteriaKey] = val;
      }
    }
  }
  return criteria;
};

/**
 * Unpack JSON criteria into flat filter fields for the frontend.
 * Returns an object with is_filter_by_X and filter_X fields.
 */
const unpackCriteria = (criteria) => {
  const flat = {};
  if (!criteria || typeof criteria !== 'object') {
    // Initialize all toggles to false
    for (const { toggle, value } of FILTER_FIELDS) {
      flat[toggle] = false;
      flat[value] = null;
    }
    return flat;
  }
  for (const { toggle, value, criteriaKey } of FILTER_FIELDS) {
    if (criteria[criteriaKey] !== undefined && criteria[criteriaKey] !== null) {
      flat[toggle] = true;
      flat[value] = criteria[criteriaKey];
    } else {
      flat[toggle] = false;
      flat[value] = null;
    }
  }
  return flat;
};

/**
 * Extract only DB-storable fields from input data, packing filter fields into criteria JSON.
 */
const prepareDbData = (data) => {
  const criteria = packCriteria(data);
  return {
    name: data.name,
    description: data.description || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    criteria,
  };
};

/**
 * Enrich a DB record with unpacked flat filter fields for the frontend.
 */
const enrichRecord = (record) => {
  if (!record) return null;
  const flat = unpackCriteria(record.criteria);
  return { ...record, ...flat };
};

/**
 * Search user sets with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;

  const skip = (page - 1) * limit;
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);

  const where = {};

  if (filters?.global?.value) {
    const searchTerm = filters.global.value.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (filters?.is_active?.value !== undefined) {
    where.is_active = filters.is_active.value;
  }

  const [data, total] = await Promise.all([
    prisma.user_sets.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user_sets.count({ where }),
  ]);

  return { data: data.map(enrichRecord), total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all user sets
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'name', sortOrder = 1, is_active } = {}) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active === 'yes' || is_active === true;
  }

  const [data, total] = await Promise.all([
    prisma.user_sets.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.user_sets.count({ where }),
  ]);

  return { data: data.map(enrichRecord), total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get user set by UUID
 */
const getByUuid = async (uuid) => {
  const record = await prisma.user_sets.findUnique({
    where: { uuid },
  });
  return enrichRecord(record);
};

/**
 * Create new user set
 */
const create = async (data) => {
  const { _translations, ...rest } = data;
  const dbData = prepareDbData(rest);
  logger.info('Creating user set with criteria: %o', dbData.criteria);
  const record = await prisma.user_sets.create({ data: dbData });
  return enrichRecord(record);
};

/**
 * Update user set
 */
const update = async (uuid, data) => {
  const { _translations, ...rest } = data;
  const dbData = prepareDbData(rest);
  logger.info('Updating user set %s with criteria: %o', uuid, dbData.criteria);
  try {
    const record = await prisma.user_sets.update({
      where: { uuid },
      data: dbData,
    });
    return enrichRecord(record);
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete user set
 */
const remove = async (uuid) => {
  try {
    await prisma.user_sets.delete({
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
 * Delete multiple user sets
 */
const removeMany = async (uuids) => {
  const result = await prisma.user_sets.deleteMany({
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
