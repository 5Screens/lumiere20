/**
 * Convert PrimeVue DataTable filters to Prisma where clause
 * Reference: backend/src/api/v1/configuration_items/service.prisma.js
 */

/**
 * Convert a single PrimeVue matchMode to Prisma condition
 * @param {string} fieldName - Field name
 * @param {string} matchMode - PrimeVue match mode
 * @param {any} value - Filter value
 * @param {string[]} dateColumns - List of date column names
 * @returns {Object} Prisma condition
 */
const convertMatchModeToPrisma = (fieldName, matchMode, value, dateColumns = []) => {
  const isDateColumn = dateColumns.includes(fieldName);
  const parseValue = (val) => (isDateColumn && val ? new Date(val) : val);

  switch (matchMode) {
    case 'startsWith':
      return { [fieldName]: { startsWith: value, mode: 'insensitive' } };

    case 'contains':
      return { [fieldName]: { contains: value, mode: 'insensitive' } };

    case 'notContains':
      return { [fieldName]: { not: { contains: value, mode: 'insensitive' } } };

    case 'endsWith':
      return { [fieldName]: { endsWith: value, mode: 'insensitive' } };

    case 'equals':
      return { [fieldName]: Array.isArray(value) ? { in: value } : parseValue(value) };

    case 'notEquals':
      return { [fieldName]: { not: parseValue(value) } };

    case 'lt':
    case 'dateBefore':
      return { [fieldName]: { lt: parseValue(value) } };

    case 'lte':
      return { [fieldName]: { lte: parseValue(value) } };

    case 'gt':
    case 'dateAfter':
      return { [fieldName]: { gt: parseValue(value) } };

    case 'gte':
      return { [fieldName]: { gte: parseValue(value) } };

    case 'dateIs':
      return { [fieldName]: parseValue(value) };

    case 'dateIsNot':
      return { [fieldName]: { not: parseValue(value) } };

    case 'between':
      return {
        [fieldName]: {
          gte: parseValue(value[0]),
          lte: parseValue(value[1]),
        },
      };

    case 'in':
      return { [fieldName]: { in: Array.isArray(value) ? value : [value] } };

    case 'notIn':
      return { [fieldName]: { notIn: Array.isArray(value) ? value : [value] } };

    default:
      return { [fieldName]: value };
  }
};

/**
 * Build Prisma where clause from PrimeVue filters
 * @param {Object} filters - PrimeVue filters object
 * @param {Object} options - Options
 * @param {string[]} options.globalSearchFields - Fields to search in global filter
 * @param {string[]} options.dateColumns - Date column names
 * @returns {Object} Prisma where clause
 */
const buildPrismaWhereFromFilters = (filters = {}, options = {}) => {
  const { globalSearchFields = ['name'], dateColumns = ['created_at', 'updated_at'] } = options;

  const andConditions = [];

  // Handle global search filter
  if (filters.global && filters.global.value) {
    const globalConditions = globalSearchFields.map((field) => ({
      [field]: { contains: filters.global.value, mode: 'insensitive' },
    }));
    andConditions.push({ OR: globalConditions });
  }

  // Process each column filter
  Object.keys(filters).forEach((fieldName) => {
    if (fieldName === 'global') return;

    const filter = filters[fieldName];

    // PrimeVue filter structure: { operator: 'AND'|'OR', constraints: [{value, matchMode}] }
    if (filter.constraints && Array.isArray(filter.constraints)) {
      const fieldConditions = filter.constraints
        .filter(
          (constraint) =>
            constraint.value !== null && constraint.value !== undefined && constraint.value !== ''
        )
        .map((constraint) =>
          convertMatchModeToPrisma(fieldName, constraint.matchMode, constraint.value, dateColumns)
        );

      if (fieldConditions.length > 0) {
        const operator = filter.operator?.toUpperCase() || 'AND';

        if (operator === 'OR' && fieldConditions.length > 1) {
          andConditions.push({ OR: fieldConditions });
        } else if (fieldConditions.length === 1) {
          andConditions.push(fieldConditions[0]);
        } else {
          andConditions.push(...fieldConditions);
        }
      }
    }
  });

  // Return where clause
  if (andConditions.length > 0) {
    return { AND: andConditions };
  }

  return {};
};

/**
 * Build Prisma orderBy from PrimeVue sort params
 * @param {string} sortField - Field to sort by
 * @param {number} sortOrder - 1 for asc, -1 for desc
 * @returns {Object} Prisma orderBy clause
 */
const buildPrismaOrderBy = (sortField = 'created_at', sortOrder = 1) => {
  const direction = sortOrder === 1 ? 'asc' : 'desc';
  return { [sortField]: direction };
};

/**
 * Build pagination response
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination info
 */
const buildPaginationResponse = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  convertMatchModeToPrisma,
  buildPrismaWhereFromFilters,
  buildPrismaOrderBy,
  buildPaginationResponse,
};
