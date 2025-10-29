const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

/**
 * Build filter condition for changes search (wrapper with CHANGE-specific JSONB columns)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  return buildGenericFilterCondition(column, filterDef, dataType, queryParams, paramIndex, {
    jsonbDateColumns: [
      'requested_start_date_at', 'requested_end_date_at',
      'planned_start_date_at', 'planned_end_date_at',
      'validated_at', 'actual_start_date_at', 'actual_end_date_at'
    ],
    jsonbTextColumns: [
      'rel_services', 'rel_service_offerings', 'rel_change_type_code',
      'r_q1', 'r_q2', 'r_q3', 'r_q4', 'r_q5',
      'i_q1', 'i_q2', 'i_q3', 'i_q4',
      'rel_change_justifications_code', 'rel_change_objective',
      'rel_cab_validation_status', 'post_change_evaluation',
      'test_plan', 'implementation_plan', 'rollbcak_plan', 
      'post_implementation_plan', 'cab_comments', 'success_criteria', 'post_change_comment'
    ],
    jsonbNumericColumns: ['elapsed_time'],
    servicePrefix: '[CHANGE SERVICE]'
  });
};

module.exports = {
  buildFilterCondition
};
