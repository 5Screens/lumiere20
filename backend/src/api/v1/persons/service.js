const prisma = require('../../../config/prisma');
const bcrypt = require('bcrypt');
const authConfig = require('../../../config/auth');
const logger = require('../../../config/logger');
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

/**
 * Get tickets related to a person (as writer, requested_for, or requested_by)
 * @param {string} personUuid - Person UUID
 * @param {Object} options - Filter options
 * @param {string} options.role - Filter by role: 'all', 'writer', 'requested_for', 'requested_by'
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Items per page
 * @param {string} options.locale - Locale for translations
 * @returns {Object} { data, total, pagination }
 */
const getRelatedTickets = async (personUuid, options = {}) => {
  const { role = 'all', page = 1, limit = 50, locale = 'en' } = options;
  const skip = (page - 1) * limit;

  // Build where clause based on role filter
  let where = {};
  if (role === 'writer') {
    where = { writer_uuid: personUuid };
  } else if (role === 'requested_for') {
    where = { requested_for_uuid: personUuid };
  } else if (role === 'requested_by') {
    where = { requested_by_uuid: personUuid };
  } else {
    // 'all' - any of the three roles
    where = {
      OR: [
        { writer_uuid: personUuid },
        { requested_for_uuid: personUuid },
        { requested_by_uuid: personUuid },
      ],
    };
  }

  try {
    const [tickets, total] = await Promise.all([
      prisma.tickets.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
        include: {
          status: {
            include: { category: true },
          },
          ticket_type: true,
          writer: {
            select: { uuid: true, first_name: true, last_name: true },
          },
          requested_by: {
            select: { uuid: true, first_name: true, last_name: true },
          },
          requested_for: {
            select: { uuid: true, first_name: true, last_name: true },
          },
          configuration_item: {
            select: { uuid: true, name: true },
          },
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    // Get status translations
    const statusUuids = tickets.filter(t => t.status).map(t => t.status.uuid);
    const statusTranslationsMap = {};

    if (statusUuids.length > 0) {
      const statusTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'workflow_statuses',
          entity_uuid: { in: statusUuids },
          field_name: 'name',
          locale,
        },
      });

      for (const t of statusTranslations) {
        statusTranslationsMap[t.entity_uuid] = t.value;
      }
    }

    // Get ticket type translations
    const ticketTypeUuids = tickets.filter(t => t.ticket_type).map(t => t.ticket_type.uuid);
    const ticketTypeTranslationsMap = {};

    if (ticketTypeUuids.length > 0) {
      const ticketTypeTranslations = await prisma.translated_fields.findMany({
        where: {
          entity_type: 'ticket_types',
          entity_uuid: { in: ticketTypeUuids },
          field_name: 'label',
          locale,
        },
      });

      for (const t of ticketTypeTranslations) {
        ticketTypeTranslationsMap[t.entity_uuid] = t.value;
      }
    }

    // Transform tickets with translations and role indicator
    const transformed = tickets.map(ticket => {
      // Determine roles for this person on this ticket
      const roles = [];
      if (ticket.writer_uuid === personUuid) roles.push('writer');
      if (ticket.requested_for_uuid === personUuid) roles.push('requested_for');
      if (ticket.requested_by_uuid === personUuid) roles.push('requested_by');

      return {
        uuid: ticket.uuid,
        title: ticket.title,
        ticket_type_code: ticket.ticket_type_code,
        ticket_type: ticket.ticket_type ? {
          ...ticket.ticket_type,
          label: ticketTypeTranslationsMap[ticket.ticket_type.uuid] || ticket.ticket_type.label,
        } : null,
        status: ticket.status ? {
          ...ticket.status,
          name: statusTranslationsMap[ticket.status.uuid] || ticket.status.name,
        } : null,
        writer: ticket.writer,
        requested_by: ticket.requested_by,
        requested_for: ticket.requested_for,
        configuration_item: ticket.configuration_item,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        // Roles this person has on this ticket
        _personRoles: roles,
      };
    });

    return {
      data: transformed,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`[PERSONS] Error getting related tickets for ${personUuid}:`, error);
    throw error;
  }
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
  getRelatedTickets,
};
