const prisma = require('../../../config/prisma');

/**
 * Get object type metadata with its fields
 * @param {string} code - Object type code (e.g., 'entities', 'locations')
 * @returns {Object} Object type with fields
 */
const getObjectType = async (code) => {
  return prisma.object_types.findUnique({
    where: { code },
    include: {
      fields: {
        orderBy: { display_order: 'asc' },
      },
    },
  });
};

/**
 * Get all active object types
 * @returns {Array} List of object types
 */
const getAllObjectTypes = async () => {
  return prisma.object_types.findMany({
    where: { is_active: true },
    orderBy: { code: 'asc' },
  });
};

/**
 * Get fields for a specific object type
 * @param {string} objectTypeCode - Object type code
 * @param {Object} options - Filter options
 * @returns {Array} List of fields
 */
const getFields = async (objectTypeCode, options = {}) => {
  const { showInTable, showInForm, showInDetail } = options;

  const objectType = await prisma.object_types.findUnique({
    where: { code: objectTypeCode },
  });

  if (!objectType) {
    return [];
  }

  const where = { object_type_uuid: objectType.uuid };

  if (showInTable !== undefined) where.show_in_table = showInTable;
  if (showInForm !== undefined) where.show_in_form = showInForm;
  if (showInDetail !== undefined) where.show_in_detail = showInDetail;

  return prisma.object_fields.findMany({
    where,
    orderBy: { display_order: 'asc' },
  });
};

/**
 * Get table columns for a specific object type
 * @param {string} objectTypeCode - Object type code
 * @returns {Array} List of columns for DataTable
 */
const getTableColumns = async (objectTypeCode) => {
  return getFields(objectTypeCode, { showInTable: true });
};

/**
 * Get form fields for a specific object type
 * @param {string} objectTypeCode - Object type code
 * @returns {Array} List of fields for form
 */
const getFormFields = async (objectTypeCode) => {
  return getFields(objectTypeCode, { showInForm: true });
};

/**
 * Get object types as select options
 * @returns {Array} List of options { label, value }
 */
const getAsOptions = async () => {
  const objectTypes = await prisma.object_types.findMany({
    where: { is_active: true },
    orderBy: { code: 'asc' },
  });
  
  return objectTypes.map(ot => ({
    label: ot.label || ot.code,
    value: ot.code
  }));
};

module.exports = {
  getObjectType,
  getAllObjectTypes,
  getFields,
  getTableColumns,
  getFormFields,
  getAsOptions,
};
