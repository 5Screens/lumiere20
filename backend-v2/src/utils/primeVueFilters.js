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
 * @param {string[]} uuidColumns - List of UUID column names (use equals instead of contains)
 * @returns {Object} Prisma condition
 */
// Helper to validate UUID format
const isValidUuid = (value) => {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const convertMatchModeToPrisma = (fieldName, matchMode, value, dateColumns = [], uuidColumns = []) => {
  const isDateColumn = dateColumns.includes(fieldName);
  const isUuidColumn = uuidColumns.includes(fieldName);
  const nullableUuidColumns = new Set(['assigned_group_uuid', 'assigned_person_uuid', 'rel_status_uuid']);
  
  // Parse date value - if it's a date-only string (YYYY-MM-DD), keep it as-is for range queries
  const parseValue = (val) => {
    if (!isDateColumn || !val) return val;
    return new Date(val);
  };
  
  // Check if value is a date-only string (YYYY-MM-DD format from frontend)
  const isDateOnlyString = (val) => {
    return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
  };
  
  // UUID columns: only accept valid UUIDs, skip invalid values
  if (isUuidColumn) {
    if (Array.isArray(value)) {
      const validUuids = value.filter(isValidUuid);
      if (!validUuids.length) {
        return null;
      }

      const isNot = matchMode === 'notEquals' || matchMode === 'notIn';
      if (isNot && nullableUuidColumns.has(fieldName)) {
        return { OR: [{ [fieldName]: { notIn: validUuids } }, { [fieldName]: null }] };
      }
      return { [fieldName]: isNot ? { notIn: validUuids } : { in: validUuids } };
    }

    if (!isValidUuid(value)) {
      // Return null to indicate this filter should be skipped
      return null;
    }

    // UUID columns default to equals
    if (matchMode === 'notEquals') {
      return { [fieldName]: { not: value } };
    }

    return { [fieldName]: value };
  }

  // If value is an array (from MultiSelect), convert to IN/NOT IN depending on matchMode
  if (Array.isArray(value)) {
    if (!value.length) {
      return null;
    }

    const isNot = matchMode === 'notEquals' || matchMode === 'notIn';
    if (isNot && nullableUuidColumns.has(fieldName)) {
      return { OR: [{ [fieldName]: { notIn: value } }, { [fieldName]: null }] };
    }
    return { [fieldName]: isNot ? { notIn: value } : { in: value } };
  }

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
      // For date-only strings (YYYY-MM-DD), create a range for the entire day
      if (isDateOnlyString(value)) {
        const startOfDay = new Date(value + 'T00:00:00.000Z');
        const endOfDay = new Date(value + 'T23:59:59.999Z');
        return { [fieldName]: { gte: startOfDay, lte: endOfDay } };
      }
      return { [fieldName]: parseValue(value) };

    case 'dateIsNot':
      // For date-only strings, exclude the entire day range
      if (isDateOnlyString(value)) {
        const startOfDay = new Date(value + 'T00:00:00.000Z');
        const endOfDay = new Date(value + 'T23:59:59.999Z');
        return { OR: [{ [fieldName]: { lt: startOfDay } }, { [fieldName]: { gt: endOfDay } }] };
      }
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
 * @param {string[]} options.uuidColumns - UUID column names (use equals instead of contains)
 * @returns {Object} Prisma where clause
 */
const buildPrismaWhereFromFilters = (filters = {}, options = {}) => {
  const { globalSearchFields = ['name'], dateColumns = ['created_at', 'updated_at'], uuidColumns = [] } = options;

  const andConditions = [];

  // Handle global search filter (supports both 'global' and 'globalFilter' keys)
  // Smart space handling: split search terms and require ALL words to match (in any field)
  const globalFilter = filters.global || filters.globalFilter;
  if (globalFilter && globalFilter.value) {
    const searchValue = globalFilter.value.trim();
    const searchTerms = searchValue.split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerms.length > 1) {
      // Multiple words: each word must match at least one field (AND between words)
      const wordConditions = searchTerms.map(term => ({
        OR: globalSearchFields.map(field => ({
          [field]: { contains: term, mode: 'insensitive' },
        })),
      }));
      andConditions.push({ AND: wordConditions });
    } else if (searchTerms.length === 1) {
      // Single word: match any field
      const globalConditions = globalSearchFields.map((field) => ({
        [field]: { contains: searchTerms[0], mode: 'insensitive' },
      }));
      andConditions.push({ OR: globalConditions });
    }
  }

  // Process each column filter
  Object.keys(filters).forEach((fieldName) => {
    if (fieldName === 'global' || fieldName === 'globalFilter') return;

    const filter = filters[fieldName];

    // PrimeVue filter structure: { operator: 'AND'|'OR', constraints: [{value, matchMode}] }
    if (filter.constraints && Array.isArray(filter.constraints)) {
      const fieldConditions = filter.constraints
        .filter(
          (constraint) =>
            constraint.value !== null && constraint.value !== undefined && constraint.value !== ''
        )
        .map((constraint) =>
          convertMatchModeToPrisma(fieldName, constraint.matchMode, constraint.value, dateColumns, uuidColumns)
        )
        .filter((condition) => condition !== null);  // Filter out null conditions (invalid UUIDs)

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
    // Simple filter format: { value, matchMode } (without constraints array)
    else if (filter.value !== null && filter.value !== undefined && filter.value !== '') {
      const condition = convertMatchModeToPrisma(fieldName, filter.matchMode || 'equals', filter.value, dateColumns, uuidColumns);
      if (condition !== null) {
        andConditions.push(condition);
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
  const field = sortField || 'created_at';
  const order = sortOrder ?? 1;
  const direction = order === 1 || order === 'asc' ? 'asc' : 'desc';
  return { [field]: direction };
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
