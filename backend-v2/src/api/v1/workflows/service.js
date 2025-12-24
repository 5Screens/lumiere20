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
const getAll = async ({ activeOnly = true, locale = 'en', entityType = null, search = null } = {}) => {
  const where = {
    ...(activeOnly ? { is_active: true } : {}),
    ...(entityType ? { entity_type: entityType } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { entity_type: { contains: search, mode: 'insensitive' } }
      ]
    } : {})
  };
  
  const workflows = await prisma.workflows.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          statuses: true,
          transitions: true
        }
      }
    }
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
  
  // Get subtype labels for workflows that have rel_entity_type_uuid
  const subtypeUuids = workflows.filter(w => w.rel_entity_type_uuid).map(w => w.rel_entity_type_uuid);
  const subtypeLabels = {};
  
  if (subtypeUuids.length > 0) {
    // Try to get labels from ci_types (most common case)
    const ciTypes = await prisma.ci_types.findMany({
      where: { uuid: { in: subtypeUuids } },
      select: { uuid: true, label: true, code: true }
    });
    
    for (const ct of ciTypes) {
      subtypeLabels[ct.uuid] = ct.label || ct.code;
    }
    
    // Try to get labels from ticket_types for remaining
    const remainingUuids = subtypeUuids.filter(u => !subtypeLabels[u]);
    if (remainingUuids.length > 0) {
      const ticketTypes = await prisma.ticket_types.findMany({
        where: { uuid: { in: remainingUuids } },
        select: { uuid: true, code: true }
      });
      
      for (const tt of ticketTypes) {
        subtypeLabels[tt.uuid] = tt.code;
      }
    }
    
    // Get translations for subtypes
    const subtypeTranslations = await prisma.translated_fields.findMany({
      where: {
        entity_uuid: { in: subtypeUuids },
        field_name: 'label',
        locale
      }
    });
    
    for (const t of subtypeTranslations) {
      subtypeLabels[t.entity_uuid] = t.value;
    }
  }
  
  return workflows.map(wf => ({
    ...wf,
    name: translationMap[wf.uuid]?.name || wf.name,
    description: translationMap[wf.uuid]?.description || wf.description,
    _translations: allTranslationsMap[wf.uuid] || {},
    statusCount: wf._count.statuses,
    transitionCount: wf._count.transitions,
    subtypeLabel: wf.rel_entity_type_uuid ? subtypeLabels[wf.rel_entity_type_uuid] || null : null
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
 * Duplicate a workflow with all its statuses and transitions
 */
const duplicate = async (uuid, locale = 'en') => {
  // Get original workflow with all details
  const original = await prisma.workflows.findUnique({
    where: { uuid },
    include: {
      statuses: {
        include: {
          category: true
        }
      },
      transitions: {
        include: {
          sources: true
        }
      }
    }
  });
  
  if (!original) {
    const error = new Error('Workflow not found');
    error.code = 'P2025';
    throw error;
  }
  
  // Get translations for original workflow and its statuses/transitions
  const statusUuids = original.statuses.map(s => s.uuid);
  const transitionUuids = original.transitions.map(t => t.uuid);
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      OR: [
        { entity_type: ENTITY_TYPE, entity_uuid: uuid },
        { entity_type: 'workflow_statuses', entity_uuid: { in: statusUuids } },
        { entity_type: 'workflow_transitions', entity_uuid: { in: transitionUuids } }
      ]
    }
  });
  
  // Create new workflow
  const newWorkflow = await prisma.workflows.create({
    data: {
      name: `${original.name} (copy)`,
      description: original.description,
      entity_type: original.entity_type,
      is_active: false // Start as inactive
    }
  });
  
  // Copy workflow translations
  const workflowTranslations = translations.filter(t => t.entity_type === ENTITY_TYPE && t.entity_uuid === uuid);
  for (const t of workflowTranslations) {
    await prisma.translated_fields.create({
      data: {
        entity_type: ENTITY_TYPE,
        entity_uuid: newWorkflow.uuid,
        field_name: t.field_name,
        locale: t.locale,
        value: t.field_name === 'name' ? `${t.value} (copy)` : t.value
      }
    });
  }
  
  // Map old status UUIDs to new ones
  const statusUuidMap = {};
  
  // Create new statuses
  for (const status of original.statuses) {
    const newStatus = await prisma.workflow_statuses.create({
      data: {
        rel_workflow_uuid: newWorkflow.uuid,
        name: status.name,
        rel_category_uuid: status.rel_category_uuid,
        allow_all_inbound: status.allow_all_inbound,
        is_initial: status.is_initial,
        position_x: status.position_x,
        position_y: status.position_y
      }
    });
    
    statusUuidMap[status.uuid] = newStatus.uuid;
    
    // Copy status translations
    const statusTranslations = translations.filter(t => t.entity_type === 'workflow_statuses' && t.entity_uuid === status.uuid);
    for (const t of statusTranslations) {
      await prisma.translated_fields.create({
        data: {
          entity_type: 'workflow_statuses',
          entity_uuid: newStatus.uuid,
          field_name: t.field_name,
          locale: t.locale,
          value: t.value
        }
      });
    }
  }
  
  // Create new transitions with mapped status UUIDs
  for (const transition of original.transitions) {
    const newTransition = await prisma.workflow_transitions.create({
      data: {
        rel_workflow_uuid: newWorkflow.uuid,
        name: transition.name,
        rel_to_status_uuid: statusUuidMap[transition.rel_to_status_uuid]
      }
    });
    
    // Copy transition sources with mapped UUIDs
    for (const source of transition.sources) {
      await prisma.workflow_transition_sources.create({
        data: {
          rel_transition_uuid: newTransition.uuid,
          rel_from_status_uuid: statusUuidMap[source.rel_from_status_uuid]
        }
      });
    }
    
    // Copy transition translations
    const transitionTranslations = translations.filter(t => t.entity_type === 'workflow_transitions' && t.entity_uuid === transition.uuid);
    for (const t of transitionTranslations) {
      await prisma.translated_fields.create({
        data: {
          entity_type: 'workflow_transitions',
          entity_uuid: newTransition.uuid,
          field_name: t.field_name,
          locale: t.locale,
          value: t.value
        }
      });
    }
  }
  
  logger.info(`[WORKFLOWS] Duplicated workflow: ${original.name} -> ${newWorkflow.name} (${newWorkflow.uuid})`);
  
  // Return the new workflow with counts
  return {
    ...newWorkflow,
    statusCount: original.statuses.length,
    transitionCount: original.transitions.length
  };
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
 * Save all workflow changes (statuses and transitions) in a single transaction
 */
const saveAll = async (uuid, data, locale = 'en') => {
  const { name, description, entity_type, is_active, statuses, transitions } = data;
  
  // Get current workflow state
  const currentWorkflow = await prisma.workflows.findUnique({
    where: { uuid },
    include: {
      statuses: true,
      transitions: {
        include: { sources: true }
      }
    }
  });
  
  if (!currentWorkflow) {
    const error = new Error('Workflow not found');
    error.code = 'P2025';
    throw error;
  }
  
  // Map temp UUIDs to real UUIDs for new statuses
  const statusUuidMap = {};
  
  await prisma.$transaction(async (tx) => {
    // Update workflow properties
    await tx.workflows.update({
      where: { uuid },
      data: { name, description, entity_type, is_active }
    });
    
    // Get current status UUIDs
    const currentStatusUuids = currentWorkflow.statuses.map(s => s.uuid);
    const newStatusUuids = statuses.filter(s => s.uuid).map(s => s.uuid);
    
    // Delete removed statuses
    const statusesToDelete = currentStatusUuids.filter(id => !newStatusUuids.includes(id));
    if (statusesToDelete.length > 0) {
      // Delete translations for removed statuses
      await tx.translated_fields.deleteMany({
        where: {
          entity_type: 'workflow_statuses',
          entity_uuid: { in: statusesToDelete }
        }
      });
      
      await tx.workflow_statuses.deleteMany({
        where: { uuid: { in: statusesToDelete } }
      });
    }
    
    // Create or update statuses
    for (const status of statuses) {
      let statusUuid;
      
      if (!status.uuid || status._isNew) {
        // New status
        const newStatus = await tx.workflow_statuses.create({
          data: {
            rel_workflow_uuid: uuid,
            name: status.name,
            rel_category_uuid: status.rel_category_uuid,
            allow_all_inbound: status.allow_all_inbound || false,
            is_initial: status.is_initial || false,
            position_x: status.position_x || 0,
            position_y: status.position_y || 0
          }
        });
        statusUuid = newStatus.uuid;
        // Map temp UUID to real UUID (frontend sends tempUuid for new statuses)
        if (status.tempUuid) {
          statusUuidMap[status.tempUuid] = newStatus.uuid;
        }
        if (status.uuid) {
          statusUuidMap[status.uuid] = newStatus.uuid;
        }
      } else {
        // Update existing status
        await tx.workflow_statuses.update({
          where: { uuid: status.uuid },
          data: {
            name: status.name,
            rel_category_uuid: status.rel_category_uuid,
            allow_all_inbound: status.allow_all_inbound || false,
            is_initial: status.is_initial || false,
            position_x: status.position_x || 0,
            position_y: status.position_y || 0
          }
        });
        statusUuid = status.uuid;
        statusUuidMap[status.uuid] = status.uuid;
      }
      
      // Save translations for status name
      if (status._translations?.name) {
        // Delete existing translations for this status
        await tx.translated_fields.deleteMany({
          where: {
            entity_type: 'workflow_statuses',
            entity_uuid: statusUuid,
            field_name: 'name'
          }
        });
        
        // Create new translations
        for (const [langCode, value] of Object.entries(status._translations.name)) {
          if (value && value.trim()) {
            await tx.translated_fields.create({
              data: {
                entity_type: 'workflow_statuses',
                entity_uuid: statusUuid,
                field_name: 'name',
                locale: langCode,
                value: value.trim()
              }
            });
          }
        }
      }
    }
    
    // Get current transition UUIDs
    const currentTransitionUuids = currentWorkflow.transitions.map(t => t.uuid);
    const newTransitionUuids = transitions.filter(t => t.uuid).map(t => t.uuid);
    
    // Delete removed transitions
    const transitionsToDelete = currentTransitionUuids.filter(id => !newTransitionUuids.includes(id));
    if (transitionsToDelete.length > 0) {
      // Delete translations for removed transitions
      await tx.translated_fields.deleteMany({
        where: {
          entity_type: 'workflow_transitions',
          entity_uuid: { in: transitionsToDelete }
        }
      });
      
      // Delete transition sources first
      await tx.workflow_transition_sources.deleteMany({
        where: { rel_transition_uuid: { in: transitionsToDelete } }
      });
      
      await tx.workflow_transitions.deleteMany({
        where: { uuid: { in: transitionsToDelete } }
      });
    }
    
    // Create or update transitions
    for (const transition of transitions) {
      // Resolve status UUIDs (may be temp UUIDs for new statuses)
      // Check multiple possible field names for the target status
      const rawToStatusUuid = transition.to_status_uuid || transition.rel_to_status_uuid || transition.to_status?.uuid;
      const toStatusUuid = statusUuidMap[rawToStatusUuid] || rawToStatusUuid;
      const sourceStatusUuids = (transition.source_status_uuids || transition.sources?.map(s => s.from_status?.uuid || s.rel_from_status_uuid) || [])
        .filter(Boolean)
        .map(id => statusUuidMap[id] || id);
      
      // Skip transition if target status is not resolved
      if (!toStatusUuid) {
        logger.warn(`[WORKFLOWS SERVICE] Skipping transition "${transition.name}" - no valid target status UUID`);
        continue;
      }
      
      let transitionUuid;
      
      if (!transition.uuid || transition._isNew) {
        // New transition
        const newTransition = await tx.workflow_transitions.create({
          data: {
            rel_workflow_uuid: uuid,
            name: transition.name,
            rel_to_status_uuid: toStatusUuid
          }
        });
        transitionUuid = newTransition.uuid;
        
        // Create sources
        for (const sourceUuid of sourceStatusUuids) {
          await tx.workflow_transition_sources.create({
            data: {
              rel_transition_uuid: newTransition.uuid,
              rel_from_status_uuid: sourceUuid
            }
          });
        }
      } else {
        // Update existing transition
        await tx.workflow_transitions.update({
          where: { uuid: transition.uuid },
          data: {
            name: transition.name,
            rel_to_status_uuid: toStatusUuid
          }
        });
        transitionUuid = transition.uuid;
        
        // Delete old sources and recreate
        await tx.workflow_transition_sources.deleteMany({
          where: { rel_transition_uuid: transition.uuid }
        });
        
        for (const sourceUuid of sourceStatusUuids) {
          await tx.workflow_transition_sources.create({
            data: {
              rel_transition_uuid: transition.uuid,
              rel_from_status_uuid: sourceUuid
            }
          });
        }
      }
      
      // Save translations for transition name
      if (transition._translations?.name) {
        // Delete existing translations for this transition
        await tx.translated_fields.deleteMany({
          where: {
            entity_type: 'workflow_transitions',
            entity_uuid: transitionUuid,
            field_name: 'name'
          }
        });
        
        // Create new translations
        for (const [langCode, value] of Object.entries(transition._translations.name)) {
          if (value && value.trim()) {
            await tx.translated_fields.create({
              data: {
                entity_type: 'workflow_transitions',
                entity_uuid: transitionUuid,
                field_name: 'name',
                locale: langCode,
                value: value.trim()
              }
            });
          }
        }
      }
    }
  });
  
  logger.info(`[WORKFLOWS] Saved all changes for workflow: ${name} (${uuid})`);
  
  // Return updated workflow
  return getByUuid(uuid, locale);
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
 * Get the workflow for a specific entity instance using workflow_entity_config mapping
 * @param {string} entityType - The entity type (e.g., 'configuration_items', 'tickets', 'persons')
 * @param {string} entityUuid - The UUID of the entity instance
 * @param {string} locale - Locale for translations
 * @returns {Object|null} The workflow with statuses and transitions, or null if not found
 */
const getWorkflowForEntity = async (entityType, entityUuid, locale = 'en') => {
  // Get the entity config to know how to find the subtype
  const entityConfig = await prisma.workflow_entity_config.findUnique({
    where: { entity_type: entityType }
  });
  
  if (!entityConfig) {
    logger.warn(`[WORKFLOWS] No workflow entity config found for entity type: ${entityType}`);
    return null;
  }
  
  let subtypeUuid = null;
  let subtypeCode = null;
  
  // Get the entity to find its subtype value
  try {
    const entity = await prisma[entityType].findUnique({
      where: { uuid: entityUuid },
      select: { [entityConfig.subtype_field]: true }
    });
    
    if (!entity) {
      logger.warn(`[WORKFLOWS] Entity not found: ${entityType}/${entityUuid}`);
      return null;
    }
    
    subtypeCode = entity[entityConfig.subtype_field];
    
    // If there's a subtype table, resolve the UUID
    if (entityConfig.subtype_table && entityConfig.subtype_code_field) {
      const subtypeRecord = await prisma[entityConfig.subtype_table].findFirst({
        where: { [entityConfig.subtype_code_field]: subtypeCode }
      });
      
      if (subtypeRecord) {
        subtypeUuid = subtypeRecord[entityConfig.subtype_uuid_field || 'uuid'];
      }
    }
  } catch (error) {
    logger.error(`[WORKFLOWS] Error getting entity subtype:`, error);
    return null;
  }
  
  // Find the workflow for this entity type and subtype
  // First try to find a specific workflow for this subtype
  let workflow = null;
  
  if (subtypeUuid) {
    workflow = await prisma.workflows.findFirst({
      where: {
        entity_type: entityType,
        rel_entity_type_uuid: subtypeUuid,
        is_active: true
      }
    });
  }
  
  // If no specific workflow found, try to find a generic one for the entity type
  if (!workflow) {
    workflow = await prisma.workflows.findFirst({
      where: {
        entity_type: entityType,
        rel_entity_type_uuid: null,
        is_active: true
      }
    });
  }
  
  if (!workflow) {
    logger.info(`[WORKFLOWS] No workflow found for ${entityType}/${subtypeCode || 'generic'}`);
    return null;
  }
  
  // Return full workflow details
  return getByUuid(workflow.uuid, locale);
};

/**
 * Get all statuses for a ticket type (for filter dropdowns)
 * @param {string} ticketTypeCode - The ticket type code (e.g., 'TASK', 'INCIDENT', 'PROBLEM')
 * @param {string} locale - Locale for translations
 * @returns {Array} List of statuses with category info
 */
const getStatusesByTicketType = async (ticketTypeCode, locale = 'en') => {
  // Find the ticket type UUID
  const ticketType = await prisma.ticket_types.findFirst({
    where: { code: ticketTypeCode }
  });

  if (!ticketType) {
    logger.warn(`[WORKFLOWS] Ticket type not found: ${ticketTypeCode}`);
    return [];
  }

  // Find the workflow for this ticket type
  // First try specific workflow for this ticket type
  let workflow = await prisma.workflows.findFirst({
    where: {
      entity_type: 'tickets',
      rel_entity_type_uuid: ticketType.uuid,
      is_active: true
    }
  });

  // If no specific workflow, try generic tickets workflow
  if (!workflow) {
    workflow = await prisma.workflows.findFirst({
      where: {
        entity_type: 'tickets',
        rel_entity_type_uuid: null,
        is_active: true
      }
    });
  }

  if (!workflow) {
    logger.info(`[WORKFLOWS] No workflow found for ticket type: ${ticketTypeCode}`);
    return [];
  }

  // Get all statuses for this workflow with category info
  const statuses = await prisma.workflow_statuses.findMany({
    where: { rel_workflow_uuid: workflow.uuid },
    include: {
      category: true
    },
    orderBy: { position_y: 'asc' }
  });

  // Get translations for status names
  const statusUuids = statuses.map(s => s.uuid);
  const translations = await prisma.translated_fields.findMany({
    where: {
      entity_type: 'workflow_statuses',
      entity_uuid: { in: statusUuids },
      field_name: 'name',
      locale
    }
  });

  const translationMap = {};
  translations.forEach(t => {
    translationMap[t.entity_uuid] = t.value;
  });

  return statuses.map(status => ({
    uuid: status.uuid,
    name: translationMap[status.uuid] || status.name,
    category: status.category ? {
      uuid: status.category.uuid,
      code: status.category.code,
      name: status.category.name,
      color: status.category.color
    } : null
  }));
};

/**
 * Get available statuses for a specific entity instance
 * Uses workflow_entity_config to determine the workflow and current status
 * @param {string} entityType - The entity type (e.g., 'configuration_items', 'tickets', 'persons')
 * @param {string} entityUuid - The UUID of the entity instance
 * @param {string} currentStatusUuid - The current status UUID of the entity (optional, will be fetched if not provided)
 * @param {string} locale - Locale for translations
 * @returns {Array} List of available statuses with transition info
 */
const getAvailableStatusesForEntity = async (entityType, entityUuid, currentStatusUuid = null, locale = 'en') => {
  const workflow = await getWorkflowForEntity(entityType, entityUuid, locale);
  
  if (!workflow) {
    return [];
  }
  
  // If no current status provided, return all statuses (for new entities)
  if (!currentStatusUuid) {
    // Return initial statuses or all statuses with allow_all_inbound
    return workflow.statuses
      .filter(s => s.is_initial || s.allow_all_inbound)
      .map(s => ({
        uuid: s.uuid,
        name: s.name,
        category: s.category,
        transitionName: null,
        isInitial: s.is_initial
      }));
  }
  
  // Get available statuses based on current status
  return getAvailableStatuses(workflow.uuid, currentStatusUuid, locale);
};

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
      transitionUuid: transition.uuid,
      transitionName: transition.name
    });
  }
  
  for (const status of statusesWithAllInbound) {
    if (!availableStatusMap.has(status.uuid)) {
      availableStatusMap.set(status.uuid, {
        status,
        transitionUuid: null,
        transitionName: null // Direct access via allow_all_inbound
      });
    }
  }
  
  // Get translations for statuses, categories, and transitions
  const statusUuids = Array.from(availableStatusMap.keys());
  const categoryUuids = [...new Set(
    Array.from(availableStatusMap.values()).map(v => v.status.rel_category_uuid)
  )];
  const transitionUuids = Array.from(availableStatusMap.values())
    .filter(v => v.transitionUuid)
    .map(v => v.transitionUuid);
  
  const translations = await prisma.translated_fields.findMany({
    where: {
      OR: [
        { entity_type: 'workflow_statuses', entity_uuid: { in: statusUuids }, locale },
        { entity_type: 'workflow_status_categories', entity_uuid: { in: categoryUuids }, locale },
        { entity_type: 'workflow_transitions', entity_uuid: { in: transitionUuids }, locale }
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
  return Array.from(availableStatusMap.values()).map(({ status, transitionUuid, transitionName }) => ({
    uuid: status.uuid,
    name: translationMap[status.uuid]?.name || status.name,
    category: {
      uuid: status.category.uuid,
      code: status.category.code,
      color: status.category.color,
      label: translationMap[status.category.uuid]?.label || status.category.code
    },
    transitionName: transitionUuid ? (translationMap[transitionUuid]?.name || transitionName) : transitionName
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
  duplicate,
  saveAll,
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
  getAvailableStatuses,
  getWorkflowForEntity,
  getAvailableStatusesForEntity,
  getStatusesByTicketType
};
