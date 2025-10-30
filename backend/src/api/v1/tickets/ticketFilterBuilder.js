const logger = require('../../../config/logger');

/**
 * Build filter condition for ticket search (generic logic shared across all ticket types)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @param {Object} options - Type-specific options
 * @param {Array} options.jsonbDateColumns - List of date columns stored in JSONB
 * @param {Array} options.jsonbNumericColumns - List of numeric columns stored in JSONB
 * @param {Array} options.jsonbTextColumns - List of text columns stored in JSONB
 * @param {Array} options.jsonbArrayColumns - List of array columns stored in JSONB
 * @param {string} options.servicePrefix - Prefix for logging (e.g., '[CHANGE SERVICE]')
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex, options = {}) => {
  const { 
    jsonbDateColumns = [],
    jsonbNumericColumns = [],
    jsonbTextColumns = [],
    jsonbArrayColumns = [],
    servicePrefix = '[TICKET SERVICE]'
  } = options;
  
  const { operator, value, empty_string_is_null } = filterDef;
  let condition = '';
  
  // ============================================================================
  // RELATIONAL COLUMNS (assigned_to_group, assigned_to_person)
  // ============================================================================
  
  if (column === 'assigned_to_group') {
    logger.info(`${servicePrefix} Building condition for relational column: assigned_to_group`);
    if (operator === 'is_null') {
      condition = `NOT EXISTS (
        SELECT 1 FROM core.rel_tickets_groups_persons rtgp
        WHERE rtgp.rel_ticket = t.uuid
          AND rtgp.type = 'ASSIGNED'
          AND rtgp.ended_at IS NULL
          AND rtgp.rel_assigned_to_group IS NOT NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'is_not_null') {
      condition = `EXISTS (
        SELECT 1 FROM core.rel_tickets_groups_persons rtgp
        WHERE rtgp.rel_ticket = t.uuid
          AND rtgp.type = 'ASSIGNED'
          AND rtgp.ended_at IS NULL
          AND rtgp.rel_assigned_to_group IS NOT NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'equals' || operator === 'is') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        queryParams.push(...value);
        condition = `EXISTS (
          SELECT 1 FROM core.rel_tickets_groups_persons rtgp
          WHERE rtgp.rel_ticket = t.uuid
            AND rtgp.type = 'ASSIGNED'
            AND rtgp.ended_at IS NULL
            AND rtgp.rel_assigned_to_group IN (${placeholders})
        )`;
      } else {
        condition = `EXISTS (
          SELECT 1 FROM core.rel_tickets_groups_persons rtgp
          WHERE rtgp.rel_ticket = t.uuid
            AND rtgp.type = 'ASSIGNED'
            AND rtgp.ended_at IS NULL
            AND rtgp.rel_assigned_to_group = $${paramIndex++}
        )`;
        queryParams.push(value);
      }
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  if (column === 'assigned_to_person') {
    logger.info(`${servicePrefix} Building condition for relational column: assigned_to_person`);
    if (operator === 'is_null') {
      condition = `NOT EXISTS (
        SELECT 1 FROM core.rel_tickets_groups_persons rtgp
        WHERE rtgp.rel_ticket = t.uuid
          AND rtgp.type = 'ASSIGNED'
          AND rtgp.ended_at IS NULL
          AND rtgp.rel_assigned_to_person IS NOT NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'is_not_null') {
      condition = `EXISTS (
        SELECT 1 FROM core.rel_tickets_groups_persons rtgp
        WHERE rtgp.rel_ticket = t.uuid
          AND rtgp.type = 'ASSIGNED'
          AND rtgp.ended_at IS NULL
          AND rtgp.rel_assigned_to_person IS NOT NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'equals' || operator === 'is') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        queryParams.push(...value);
        condition = `EXISTS (
          SELECT 1 FROM core.rel_tickets_groups_persons rtgp
          WHERE rtgp.rel_ticket = t.uuid
            AND rtgp.type = 'ASSIGNED'
            AND rtgp.ended_at IS NULL
            AND rtgp.rel_assigned_to_person IN (${placeholders})
        )`;
      } else {
        condition = `EXISTS (
          SELECT 1 FROM core.rel_tickets_groups_persons rtgp
          WHERE rtgp.rel_ticket = t.uuid
            AND rtgp.type = 'ASSIGNED'
            AND rtgp.ended_at IS NULL
            AND rtgp.rel_assigned_to_person = $${paramIndex++}
        )`;
        queryParams.push(value);
      }
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  // ============================================================================
  // JSONB COLUMNS (type-specific fields stored in core_extended_attributes)
  // ============================================================================
  
  const allJsonbColumns = [...jsonbDateColumns, ...jsonbNumericColumns, ...jsonbTextColumns, ...jsonbArrayColumns];
  
  if (allJsonbColumns.includes(column)) {
    const jsonbPath = `t.core_extended_attributes->>'${column}'`;
    const jsonbArrayPath = `t.core_extended_attributes->'${column}'`;
    
    // Handle NULL checks for JSONB columns
    if (operator === 'is_null') {
      condition = `(t.core_extended_attributes->>'${column}' IS NULL OR t.core_extended_attributes->>'${column}' = '')`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'is_not_null') {
      condition = `(t.core_extended_attributes->>'${column}' IS NOT NULL AND t.core_extended_attributes->>'${column}' != '')`;
      return { condition, newParamIndex: paramIndex };
    }
    
    // Handle DATE columns stored in JSONB
    if (jsonbDateColumns.includes(column) && (dataType === 'timestamp' || dataType === 'datetime')) {
      if (operator === 'after') {
        condition = `DATE((${jsonbPath})::timestamp) > DATE($${paramIndex++})`;
        queryParams.push(value);
      } else if (operator === 'on_or_after') {
        condition = `DATE((${jsonbPath})::timestamp) >= DATE($${paramIndex++})`;
        queryParams.push(value);
      } else if (operator === 'before') {
        condition = `DATE((${jsonbPath})::timestamp) < DATE($${paramIndex++})`;
        queryParams.push(value);
      } else if (operator === 'on_or_before') {
        condition = `DATE((${jsonbPath})::timestamp) <= DATE($${paramIndex++})`;
        queryParams.push(value);
      } else if (operator === 'between') {
        const startDate = value.gte || value.start;
        const endDate = value.lte || value.end;
        condition = `DATE((${jsonbPath})::timestamp) BETWEEN DATE($${paramIndex++}) AND DATE($${paramIndex++})`;
        queryParams.push(startDate, endDate);
      } else if (operator === 'on' || operator === 'equals') {
        condition = `DATE((${jsonbPath})::timestamp) = DATE($${paramIndex++})`;
        queryParams.push(value);
      }
      return { condition, newParamIndex: paramIndex };
    }
    
    // Handle NUMERIC columns stored in JSONB
    if (jsonbNumericColumns.includes(column)) {
      const jsonbNumericPath = `(${jsonbPath})::numeric`;
      if (operator === 'equals') {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          condition = `${jsonbNumericPath} IN (${placeholders})`;
          queryParams.push(...value);
        } else {
          condition = `${jsonbNumericPath} = $${paramIndex++}`;
          queryParams.push(value);
        }
      } else if (operator === 'lt') {
        condition = `${jsonbNumericPath} < $${paramIndex++}`;
        queryParams.push(value);
      } else if (operator === 'lte') {
        condition = `${jsonbNumericPath} <= $${paramIndex++}`;
        queryParams.push(value);
      } else if (operator === 'gt') {
        condition = `${jsonbNumericPath} > $${paramIndex++}`;
        queryParams.push(value);
      } else if (operator === 'gte') {
        condition = `${jsonbNumericPath} >= $${paramIndex++}`;
        queryParams.push(value);
      } else if (operator === 'between') {
        const startValue = value.gte || value.min || value.start;
        const endValue = value.lte || value.max || value.end;
        condition = `${jsonbNumericPath} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        queryParams.push(startValue, endValue);
      }
      return { condition, newParamIndex: paramIndex };
    }
    
    // Handle ARRAY columns stored in JSONB (e.g., rel_target_audience, business_scope)
    if (jsonbArrayColumns.includes(column)) {
      if (operator === 'equals' || operator === 'is') {
        if (Array.isArray(value)) {
          // For arrays, check if JSONB array contains ANY of the values
          const conditions = value.map((val) => {
            queryParams.push(JSON.stringify([val]));
            return `${jsonbArrayPath} @> $${paramIndex++}::jsonb`;
          });
          condition = `(${conditions.join(' OR ')})`;
        } else {
          // Single value: check if JSONB array contains this value
          queryParams.push(JSON.stringify([value]));
          condition = `${jsonbArrayPath} @> $${paramIndex++}::jsonb`;
        }
      } else if (operator === 'contains') {
        // For text search in array elements
        condition = `EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${jsonbArrayPath}) AS elem
          WHERE LOWER(elem) LIKE LOWER($${paramIndex++})
        )`;
        queryParams.push(`%${value}%`);
      }
      return { condition, newParamIndex: paramIndex };
    }
    
    // Handle TEXT columns stored in JSONB
    if (jsonbTextColumns.includes(column)) {
      if (operator === 'equals' || operator === 'is') {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          condition = `${jsonbPath} IN (${placeholders})`;
          queryParams.push(...value);
        } else {
          condition = `${jsonbPath} = $${paramIndex++}`;
          queryParams.push(value);
        }
      } else if (operator === 'contains') {
        condition = `LOWER(${jsonbPath}) LIKE LOWER($${paramIndex++})`;
        queryParams.push(`%${value}%`);
      }
      return { condition, newParamIndex: paramIndex };
    }
  }
  
  // ============================================================================
  // STANDARD COLUMNS (physical columns in core.tickets table)
  // ============================================================================
  
  // Handle NULL checks
  if (operator === 'is_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(t.${column} IS NULL OR t.${column} = '')`;
    } else {
      condition = `t.${column} IS NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  if (operator === 'is_not_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(t.${column} IS NOT NULL AND t.${column} != '')`;
    } else {
      condition = `t.${column} IS NOT NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  // Handle TEXT/STRING/UUID type
  if (dataType === 'text' || dataType === 'string' || dataType === 'uuid') {
    if (operator === 'contains') {
      if (Array.isArray(value)) {
        const conditions = value.map((val, index) => {
          const cond = `LOWER(CAST(t.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
          queryParams.push(`%${val}%`);
          return cond;
        });
        condition = `(${conditions.join(' OR ')})`;
      } else {
        condition = `LOWER(CAST(t.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
        queryParams.push(`%${value}%`);
      }
    } else if (operator === 'equals' || operator === 'is') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} = $${paramIndex++}`;
        queryParams.push(value);
      }
    } else if (operator === 'not_equals') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} NOT IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} != $${paramIndex++}`;
        queryParams.push(value);
      }
    }
  }
  
  // Handle NUMBER type
  else if (dataType === 'number' || dataType === 'integer' || dataType === 'numeric') {
    if (operator === 'equals') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} = $${paramIndex++}`;
        queryParams.push(value);
      }
    } else if (operator === 'lt') {
      condition = `t.${column} < $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'lte') {
      condition = `t.${column} <= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gt') {
      condition = `t.${column} > $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gte') {
      condition = `t.${column} >= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'between') {
      const startValue = value.gte || value.min || value.start;
      const endValue = value.lte || value.max || value.end;
      condition = `t.${column} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      queryParams.push(startValue, endValue);
    }
  }
  
  // Handle DATE type
  else if (dataType === 'date' || dataType === 'timestamp' || dataType === 'datetime') {
    if (operator === 'after') {
      condition = `DATE(t.${column}) > DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'on_or_after') {
      condition = `DATE(t.${column}) >= DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'before') {
      condition = `DATE(t.${column}) < DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'on_or_before') {
      condition = `DATE(t.${column}) <= DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'between') {
      const startDate = value.gte || value.start;
      const endDate = value.lte || value.end;
      condition = `DATE(t.${column}) BETWEEN DATE($${paramIndex++}) AND DATE($${paramIndex++})`;
      queryParams.push(startDate, endDate);
    } else if (operator === 'on' || operator === 'equals') {
      condition = `DATE(t.${column}) = DATE($${paramIndex++})`;
      queryParams.push(value);
    }
  }
  
  // Handle BOOLEAN type
  else if (dataType === 'boolean' || dataType === 'bool') {
    if (operator === 'is_true') {
      condition = `t.${column} = true`;
    } else if (operator === 'is_false') {
      condition = `t.${column} = false`;
    } else if (operator === 'any') {
      condition = '1=1';
    }
  }
  
  return { condition, newParamIndex: paramIndex };
};

module.exports = {
  buildFilterCondition
};
