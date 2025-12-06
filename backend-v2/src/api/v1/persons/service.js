const prisma = require('../../../config/prisma');
const bcrypt = require('bcrypt');
const authConfig = require('../../../config/auth');
const { buildPrismaWhereFromFilters, buildPrismaOrderBy } = require('../../../utils/primeVueFilters');

/**
 * Search persons with PrimeVue filters
 */
const search = async (params) => {
  const { filters, sortField, sortOrder, page = 1, limit = 25 } = params;
  
  const where = buildPrismaWhereFromFilters(filters, { globalSearchFields: ['first_name', 'last_name', 'email'] });
  const orderBy = buildPrismaOrderBy(sortField, sortOrder);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.persons.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        uuid: true,
        first_name: true,
        last_name: true,
        email: true,
        job_role: true,
        is_active: true,
        role: true,
        phone: true,
        created_at: true,
        updated_at: true,
        // Exclude password_hash for security
      },
    }),
    prisma.persons.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get all persons with pagination
 */
const getAll = async ({ page = 1, limit = 50, sortField = 'last_name', sortOrder = 1 }) => {
  const skip = (page - 1) * limit;
  const orderBy = { [sortField]: sortOrder === 1 ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma.persons.findMany({
      skip,
      take: limit,
      orderBy,
      select: {
        uuid: true,
        first_name: true,
        last_name: true,
        email: true,
        job_role: true,
        is_active: true,
        role: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.persons.count(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get person by UUID
 */
const getById = async (uuid) => {
  return prisma.persons.findUnique({
    where: { uuid },
    select: {
      uuid: true,
      first_name: true,
      last_name: true,
      email: true,
      job_role: true,
      ref_entity_uuid: true,
      is_active: true,
      critical_user: true,
      external_user: true,
      date_format: true,
      internal_id: true,
      notification: true,
      time_zone: true,
      ref_location_uuid: true,
      floor: true,
      room: true,
      ref_approving_manager_uuid: true,
      phone: true,
      business_phone: true,
      business_mobile_phone: true,
      personal_mobile_phone: true,
      language: true,
      role: true,
      roles: true,
      photo: true,
      last_login: true,
      created_at: true,
      updated_at: true,
      // Relations
      ref_entity: true,
      ref_location: true,
      ref_approving_manager: {
        select: {
          uuid: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Create new person
 */
const create = async (data) => {
  return prisma.persons.create({
    data,
    select: {
      uuid: true,
      first_name: true,
      last_name: true,
      email: true,
      job_role: true,
      is_active: true,
      role: true,
      created_at: true,
    },
  });
};

/**
 * Update person
 */
const update = async (uuid, data) => {
  try {
    return await prisma.persons.update({
      where: { uuid },
      data,
      select: {
        uuid: true,
        first_name: true,
        last_name: true,
        email: true,
        job_role: true,
        is_active: true,
        role: true,
        updated_at: true,
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
 * Delete person
 */
const remove = async (uuid) => {
  try {
    await prisma.persons.delete({
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
 * Delete multiple persons
 */
const removeMany = async (uuids) => {
  const result = await prisma.persons.deleteMany({
    where: {
      uuid: { in: uuids },
    },
  });
  return result.count;
};

/**
 * Reset password for a person (admin action)
 * @param {string} uuid - Person UUID
 * @param {string} newPassword - New password to set
 * @param {string} adminUuid - UUID of the admin performing the action
 * @returns {Promise<Object>} - Updated person
 */
const resetPassword = async (uuid, newPassword, adminUuid) => {
  // Check if person exists
  const person = await prisma.persons.findUnique({
    where: { uuid },
    select: { uuid: true, email: true, first_name: true, last_name: true }
  });

  if (!person) {
    const error = new Error('Person not found');
    error.statusCode = 404;
    throw error;
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, authConfig.saltRounds);

  // Update password and set password_needs_reset flag
  const updatedPerson = await prisma.persons.update({
    where: { uuid },
    data: {
      password_hash: hashedPassword,
      password_needs_reset: true
    },
    select: {
      uuid: true,
      email: true,
      first_name: true,
      last_name: true,
      password_needs_reset: true
    }
  });

  // Log the password reset in audit_changes (if audit schema exists)
  try {
    await prisma.audit_changes.create({
      data: {
        object_type: 'persons',
        object_uuid: uuid,
        event_type: 'Password_RESET',
        attribute_name: 'password_hash',
        old_value: null, // Don't store old password hash for security
        new_value: null, // Don't store new password hash for security
        rel_user_uuid: adminUuid
      }
    });
  } catch (auditError) {
    // If audit table doesn't exist yet, just log the error but don't fail the operation
    console.warn('Could not create audit log for password reset:', auditError.message);
  }

  return updatedPerson;
};

module.exports = {
  search,
  getAll,
  getById,
  create,
  update,
  remove,
  removeMany,
  resetPassword,
};
