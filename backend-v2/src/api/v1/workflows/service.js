/**
 * Workflows Service
 * Business logic for workflow management
 */

const { prisma } = require('../../../../prisma/client');
const logger = require('../../../config/logger');

const ENTITY_TYPE = 'workflows';

/**
 * Get all workflows with translations
 */
const getAll = async ({ activeOnly = true, locale = 'en', entityType = null } = {}) => {
  const where = {
    ...(activeOnly ? { is_active: true } : {}),
    ...(entityType ? { entity_type: entityType } : {})
  };
  
  const workflows = await prisma.workflows.findMany({
    where,
    orderBy: { name: 'asc' }
  });
  
  // Get translations
  const workflowUuids = workflows.map(w => w.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: workflowUuids }
    }
  });
  
  // Map translations
  const translationMap = {};
  const allTranslationsMap = {};
  
  for (const t of translations) {
    if (t.locale === locale) {
      if (!translationMap[t.entity_uuid]) {
        translationMap[t.entity_uuid] = {};
      }
      translationMap[t.entity_uuid][t.field_name] = t.value;
    }
    
    if (!allTranslationsMap[t.entity_uuid]) {
      allTranslationsMap[t.entity_uuid] = {};
    }
    if (!allTranslationsMap[t.entity_uuid][t.field_name]) {
      allTranslationsMap[t.entity_uuid][t.field_name] = {};
    }
    allTranslationsMap[t.entity_uuid][t.field_name][t.locale] = t.value;
  }
  
  return workflows.map(wf => ({
    ...wf,
    name: translationMap[wf.uuid]?.name || wf.name,
    description: translationMap[wf.uuid]?.description || wf.description,
    _translations: allTranslationsMap[wf.uuid] || {}
  }));
};

/**
 * Get workflow by UUID with full details (statuses and transitions)
 */
const getByUuid = async (uuid, locale = 'en') => {
  const workflow = await prisma.workflows.findUnique({
    where: { uuid },
    include: {
      statuses: {
        include: {
          category: true,
          transition_sources: {
            include: {
              transition: true
            }
          }
        },
        orderBy: { created_at: 'asc' }
      },
      transitions: {
        include: {
          to_status: true,
          sources: {
            include: {
              from_status: true
            }
          }
        },
        orderBy: { created_at: 'asc' }
      }
    }
  });
  
  if (!workflow) return null;
  
  // Get all translations for workflow, statuses, and transitions
  const statusUuids = workflow.statuses.map(s => s.uuid);
  const transitionUuids = workflow.transitions.map(t => t.uuid);
  const categoryUuids = [...new Set(workflow.statuses.map(s => s.rel_category_uuid))];
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      OR: [
        { entity_type: ENTITY_TYPE, entity_uuid: uuid },
        { entity_type: 'workflow_statuses', entity_uuid: { in: statusUuids } },
        { entity_type: 'workflow_transitions', entity_uuid: { in: transitionUuids } },
        { entity_type: 'workflow_status_categories', entity_uuid: { in: categoryUuids } }
      ]
    }
  });
  
  // Build translation maps
  const buildTranslationMaps = (entityUuids) => {
    const currentLocaleMap = {};
    const allLocalesMap = {};
    
    for (const t of translations) {
      if (!entityUuids.includes(t.entity_uuid)) continue;
      
      if (t.locale === locale) {
        if (!currentLocaleMap[t.entity_uuid]) {
          currentLocaleMap[t.entity_uuid] = {};
        }
        currentLocaleMap[t.entity_uuid][t.field_name] = t.value;
      }
      
      if (!allLocalesMap[t.entity_uuid]) {
        allLocalesMap[t.entity_uuid] = {};
      }
      if (!allLocalesMap[t.entity_uuid][t.field_name]) {
        allLocalesMap[t.entity_uuid][t.field_name] = {};
      }
      allLocalesMap[t.entity_uuid][t.field_name][t.locale] = t.value;
    }
    
    return { currentLocaleMap, allLocalesMap };
  };
  
  const workflowTranslations = buildTranslationMaps([uuid]);
  const statusTranslations = buildTranslationMaps(statusUuids);
  const transitionTranslations = buildTranslationMaps(transitionUuids);
  const categoryTranslations = buildTranslationMaps(categoryUuids);
  
  // Transform statuses
  const statuses = workflow.statuses.map(status => ({
    ...status,
    name: statusTranslations.currentLocaleMap[status.uuid]?.name || status.name,
    _translations: statusTranslations.allLocalesMap[status.uuid] || {},
    category: {
      ...status.category,
      label: categoryTranslations.currentLocaleMap[status.category.uuid]?.label || status.category.code
    }
  }));
  
  // Transform transitions
  const workflowTransitions = workflow.transitions.map(transition => ({
    ...transition,
    name: transitionTranslations.currentLocaleMap[transition.uuid]?.name || transition.name,
    _translations: transitionTranslations.allLocalesMap[transition.uuid] || {},
    to_status: {
      ...transition.to_status,
      name: statusTranslations.currentLocaleMap[transition.to_status.uuid]?.name || transition.to_status.name
    },
    sources: transition.sources.map(source => ({
      ...source,
      from_status: {
        ...source.from_status,
        name: statusTranslations.currentLocaleMap[source.from_status.uuid]?.name || source.from_status.name
      }
    }))
  }));
  
  return {
    ...workflow,
    name: workflowTranslations.currentLocaleMap[uuid]?.name || workflow.name,
    description: workflowTranslations.currentLocaleMap[uuid]?.description || workflow.description,
    _translations: workflowTranslations.allLocalesMap[uuid] || {},
    statuses,
    transitions: workflowTransitions
  };
};

/**
 * Get workflows for a specific entity type
 */
const getByEntityType = async (entityType, entityTypeUuid = null, locale = 'en') => {
  const where = {
    entity_type: entityType,
    is_active: true,
    ...(entityTypeUuid ? { rel_entity_type_uuid: entityTypeUuid } : {})
  };
  
  return getAll({ activeOnly: true, locale, entityType });
};

/**
 * Create a new workflow
 */
const create = async (data) => {
  const { _translations, ...workflowData } = data;
  
  const workflow = await prisma.workflows.create({
    data: workflowData
  });
  
  // Create translations if provided
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (!['name', 'description'].includes(fieldName)) continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: ENTITY_TYPE,
              entity_uuid: workflow.uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Created workflow: ${workflow.name} (${workflow.uuid})`);
  return workflow;
};

/**
 * Update a workflow
 */
const update = async (uuid, data) => {
  const { _translations, ...rawData } = data;
  
  // Filter only allowed fields for update
  const allowedFields = ['name', 'description', 'entity_type', 'is_active'];
  const workflowData = {};
  for (const field of allowedFields) {
    if (rawData[field] !== undefined) {
      workflowData[field] = rawData[field];
    }
  }
  
  const workflow = await prisma.workflows.update({
    where: { uuid },
    data: workflowData
  });
  
  // Update translations if provided
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (!['name', 'description'].includes(fieldName)) continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.upsert({
            where: {
              entity_type_entity_uuid_field_name_locale: {
                entity_type: ENTITY_TYPE,
                entity_uuid: uuid,
                field_name: fieldName,
                locale
              }
            },
            update: { value },
            create: {
              entity_type: ENTITY_TYPE,
              entity_uuid: uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Updated workflow: ${workflow.name} (${workflow.uuid})`);
  return workflow;
};

/**
 * Delete a workflow (cascades to statuses and transitions)
 */
const remove = async (uuid) => {
  // Delete translations for workflow, statuses, and transitions
  const workflow = await prisma.workflows.findUnique({
    where: { uuid },
    include: {
      statuses: true,
      transitions: true
    }
  });
  
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.code = 'P2025';
    throw error;
  }
  
  const statusUuids = workflow.statuses.map(s => s.uuid);
  const transitionUuids = workflow.transitions.map(t => t.uuid);
  
  // Delete all related translations
  await prisma.translated_fields.deleteMany({
    where: {
      OR: [
        { entity_type: ENTITY_TYPE, entity_uuid: uuid },
        { entity_type: 'workflow_statuses', entity_uuid: { in: statusUuids } },
        { entity_type: 'workflow_transitions', entity_uuid: { in: transitionUuids } }
      ]
    }
  });
  
  // Delete workflow (cascades to statuses and transitions via Prisma)
  await prisma.workflows.delete({
    where: { uuid }
  });
  
  logger.info(`[WORKFLOWS] Deleted workflow: ${workflow.name} (${uuid})`);
  return workflow;
};

/**
 * Search workflows with PrimeVue filters
 */
const search = async (filters, locale = 'en') => {
  const { first = 0, rows = 10, sortField = 'name', sortOrder = 1, globalFilter } = filters;
  
  let where = {};
  
  if (globalFilter) {
    where.OR = [
      { name: { contains: globalFilter, mode: 'insensitive' } },
      { entity_type: { contains: globalFilter, mode: 'insensitive' } }
    ];
  }
  
  const [workflows, total] = await Promise.all([
    prisma.workflows.findMany({
      where,
      skip: first,
      take: rows,
      orderBy: { [sortField]: sortOrder === 1 ? 'asc' : 'desc' },
      include: {
        _count: {
          select: { statuses: true, transitions: true }
        }
      }
    }),
    prisma.workflows.count({ where })
  ]);
  
  // Get translations
  const workflowUuids = workflows.map(w => w.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      entity_uuid: { in: workflowUuids }
    }
  });
  
  const translationMap = {};
  const allTranslationsMap = {};
  
  for (const t of translations) {
    if (t.locale === locale) {
      if (!translationMap[t.entity_uuid]) {
        translationMap[t.entity_uuid] = {};
      }
      translationMap[t.entity_uuid][t.field_name] = t.value;
    }
    
    if (!allTranslationsMap[t.entity_uuid]) {
      allTranslationsMap[t.entity_uuid] = {};
    }
    if (!allTranslationsMap[t.entity_uuid][t.field_name]) {
      allTranslationsMap[t.entity_uuid][t.field_name] = {};
    }
    allTranslationsMap[t.entity_uuid][t.field_name][t.locale] = t.value;
  }
  
  const data = workflows.map(wf => ({
    ...wf,
    name: translationMap[wf.uuid]?.name || wf.name,
    description: translationMap[wf.uuid]?.description || wf.description,
    _translations: allTranslationsMap[wf.uuid] || {},
    statusCount: wf._count.statuses,
    transitionCount: wf._count.transitions
  }));
  
  return { data, total };
};

// ============================================
// WORKFLOW STATUSES
// ============================================

/**
 * Create a workflow status
 */
const createStatus = async (workflowUuid, data) => {
  const { _translations, ...statusData } = data;
  
  const status = await prisma.workflow_statuses.create({
    data: {
      ...statusData,
      rel_workflow_uuid: workflowUuid
    }
  });
  
  // Create translations
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'name') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: 'workflow_statuses',
              entity_uuid: status.uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Created status: ${status.name} in workflow ${workflowUuid}`);
  return status;
};

/**
 * Update a workflow status
 */
const updateStatus = async (uuid, data) => {
  const { _translations, ...rawData } = data;
  
  // Filter only allowed fields for update
  const allowedFields = ['name', 'rel_category_uuid', 'allow_all_inbound', 'is_initial', 'position_x', 'position_y'];
  const statusData = {};
  for (const field of allowedFields) {
    if (rawData[field] !== undefined) {
      statusData[field] = rawData[field];
    }
  }
  
  const status = await prisma.workflow_statuses.update({
    where: { uuid },
    data: statusData
  });
  
  // Update translations
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'name') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.upsert({
            where: {
              entity_type_entity_uuid_field_name_locale: {
                entity_type: 'workflow_statuses',
                entity_uuid: uuid,
                field_name: fieldName,
                locale
              }
            },
            update: { value },
            create: {
              entity_type: 'workflow_statuses',
              entity_uuid: uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Updated status: ${status.name} (${uuid})`);
  return status;
};

/**
 * Delete a workflow status
 */
const removeStatus = async (uuid) => {
  // Delete translations
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: 'workflow_statuses',
      entity_uuid: uuid
    }
  });
  
  const status = await prisma.workflow_statuses.delete({
    where: { uuid }
  });
  
  logger.info(`[WORKFLOWS] Deleted status: ${status.name} (${uuid})`);
  return status;
};

// ============================================
// WORKFLOW TRANSITIONS
// ============================================

/**
 * Create a workflow transition
 */
const createTransition = async (workflowUuid, data) => {
  const { _translations, sources, ...transitionData } = data;
  
  const transition = await prisma.workflow_transitions.create({
    data: {
      ...transitionData,
      rel_workflow_uuid: workflowUuid
    }
  });
  
  // Create sources
  if (sources && sources.length > 0) {
    await prisma.workflow_transition_sources.createMany({
      data: sources.map(sourceUuid => ({
        rel_transition_uuid: transition.uuid,
        rel_from_status_uuid: sourceUuid
      }))
    });
  }
  
  // Create translations
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'name') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.create({
            data: {
              entity_type: 'workflow_transitions',
              entity_uuid: transition.uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Created transition: ${transition.name} in workflow ${workflowUuid}`);
  return transition;
};

/**
 * Update a workflow transition
 */
const updateTransition = async (uuid, data) => {
  const { _translations, sources, ...transitionData } = data;
  
  const transition = await prisma.workflow_transitions.update({
    where: { uuid },
    data: transitionData
  });
  
  // Update sources if provided
  if (sources !== undefined) {
    // Delete existing sources
    await prisma.workflow_transition_sources.deleteMany({
      where: { rel_transition_uuid: uuid }
    });
    
    // Create new sources
    if (sources && sources.length > 0) {
      await prisma.workflow_transition_sources.createMany({
        data: sources.map(sourceUuid => ({
          rel_transition_uuid: uuid,
          rel_from_status_uuid: sourceUuid
        }))
      });
    }
  }
  
  // Update translations
  if (_translations) {
    for (const [fieldName, locales] of Object.entries(_translations)) {
      if (fieldName !== 'name') continue;
      
      for (const [locale, value] of Object.entries(locales)) {
        if (value !== null && value !== undefined && value !== '') {
          await prisma.translated_fields.upsert({
            where: {
              entity_type_entity_uuid_field_name_locale: {
                entity_type: 'workflow_transitions',
                entity_uuid: uuid,
                field_name: fieldName,
                locale
              }
            },
            update: { value },
            create: {
              entity_type: 'workflow_transitions',
              entity_uuid: uuid,
              field_name: fieldName,
              locale,
              value
            }
          });
        }
      }
    }
  }
  
  logger.info(`[WORKFLOWS] Updated transition: ${transition.name} (${uuid})`);
  return transition;
};

/**
 * Delete a workflow transition
 */
const removeTransition = async (uuid) => {
  // Delete translations
  await prisma.translated_fields.deleteMany({
    where: {
      entity_type: 'workflow_transitions',
      entity_uuid: uuid
    }
  });
  
  const transition = await prisma.workflow_transitions.delete({
    where: { uuid }
  });
  
  logger.info(`[WORKFLOWS] Deleted transition: ${transition.name} (${uuid})`);
  return transition;
};

// ============================================
// AVAILABLE STATUSES (for end users)
// ============================================

/**
 * Get available statuses for an object based on its current status
 */
const getAvailableStatuses = async (workflowUuid, currentStatusUuid, locale = 'en') => {
  // Get all transitions where current status is a source OR destination has allow_all_inbound
  const [transitionsFromCurrent, statusesWithAllInbound] = await Promise.all([
    // Transitions from current status
    prisma.workflow_transitions.findMany({
      where: {
        rel_workflow_uuid: workflowUuid,
        sources: {
          some: {
            rel_from_status_uuid: currentStatusUuid
          }
        }
      },
      include: {
        to_status: {
          include: { category: true }
        }
      }
    }),
    // Statuses with allow_all_inbound (accessible from any state)
    prisma.workflow_statuses.findMany({
      where: {
        rel_workflow_uuid: workflowUuid,
        allow_all_inbound: true,
        uuid: { not: currentStatusUuid } // Exclude current status
      },
      include: { category: true }
    })
  ]);
  
  // Combine and deduplicate
  const availableStatusMap = new Map();
  
  for (const transition of transitionsFromCurrent) {
    availableStatusMap.set(transition.to_status.uuid, {
      status: transition.to_status,
      transitionName: transition.name
    });
  }
  
  for (const status of statusesWithAllInbound) {
    if (!availableStatusMap.has(status.uuid)) {
      availableStatusMap.set(status.uuid, {
        status,
        transitionName: null // Direct access via allow_all_inbound
      });
    }
  }
  
  // Get translations
  const statusUuids = Array.from(availableStatusMap.keys());
  const categoryUuids = [...new Set(
    Array.from(availableStatusMap.values()).map(v => v.status.rel_category_uuid)
  )];
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      OR: [
        { entity_type: 'workflow_statuses', entity_uuid: { in: statusUuids }, locale },
        { entity_type: 'workflow_status_categories', entity_uuid: { in: categoryUuids }, locale }
      ]
    }
  });
  
  const translationMap = {};
  for (const t of translations) {
    if (!translationMap[t.entity_uuid]) {
      translationMap[t.entity_uuid] = {};
    }
    translationMap[t.entity_uuid][t.field_name] = t.value;
  }
  
  // Build result
  return Array.from(availableStatusMap.values()).map(({ status, transitionName }) => ({
    uuid: status.uuid,
    name: translationMap[status.uuid]?.name || status.name,
    category: {
      uuid: status.category.uuid,
      code: status.category.code,
      color: status.category.color,
      label: translationMap[status.category.uuid]?.label || status.category.code
    },
    transitionName
  }));
};

module.exports = {
  // Workflows
  getAll,
  getByUuid,
  getByEntityType,
  create,
  update,
  remove,
  search,
  
  // Statuses
  createStatus,
  updateStatus,
  removeStatus,
  
  // Transitions
  createTransition,
  updateTransition,
  removeTransition,
  
  // Available statuses
  getAvailableStatuses
};
