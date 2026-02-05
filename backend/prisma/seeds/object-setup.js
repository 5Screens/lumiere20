const { prisma } = require('../client');

/**
 * Seed object_setup table with configuration data from V1
 * This replaces: entity_setup_codes, incident_setup_codes, problem_categories, 
 * defect_setup_codes, project_setup_codes, knowledge_setup_codes, contact_types
 */
async function seedObjectSetup() {
  console.log('Seeding object_setup...');

  const objectSetupData = [
    // ========================================
    // ENTITY - Types (from 07_entity_setup.sql)
    // ========================================
    { object_type: 'entity', metadata: 'TYPE', code: 'COMPANY', icon: 'pi-building', color: 'info', display_order: 1 },
    { object_type: 'entity', metadata: 'TYPE', code: 'BRANCH', icon: 'pi-sitemap', color: 'success', display_order: 2 },
    { object_type: 'entity', metadata: 'TYPE', code: 'DEPARTMENT', icon: 'pi-users', color: 'warning', display_order: 3 },
    { object_type: 'entity', metadata: 'TYPE', code: 'SUPPLIER', icon: 'pi-truck', color: 'secondary', display_order: 4 },
    { object_type: 'entity', metadata: 'TYPE', code: 'CUSTOMER', icon: 'pi-user', color: 'primary', display_order: 5 },

    // ========================================
    // LOCATION - Types
    // ========================================
    { object_type: 'location', metadata: 'TYPE', code: 'OFFICE', icon: 'pi-building', color: 'info', display_order: 1 },
    { object_type: 'location', metadata: 'TYPE', code: 'WAREHOUSE', icon: 'pi-box', color: 'warning', display_order: 2 },
    { object_type: 'location', metadata: 'TYPE', code: 'DATA_CENTER', icon: 'pi-server', color: 'danger', display_order: 3 },
    { object_type: 'location', metadata: 'TYPE', code: 'FACTORY', icon: 'pi-cog', color: 'secondary', display_order: 4 },
    { object_type: 'location', metadata: 'TYPE', code: 'STORE', icon: 'pi-shopping-cart', color: 'success', display_order: 5 },

    // LOCATION - Business Criticality
    { object_type: 'location', metadata: 'BUSINESS_CRITICALITY', code: 'CRITICAL', icon: 'pi-exclamation-circle', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'location', metadata: 'BUSINESS_CRITICALITY', code: 'HIGH', icon: 'pi-exclamation-triangle', color: 'warning', display_order: 2 },
    { object_type: 'location', metadata: 'BUSINESS_CRITICALITY', code: 'MEDIUM', icon: 'pi-info-circle', color: 'info', display_order: 3 },
    { object_type: 'location', metadata: 'BUSINESS_CRITICALITY', code: 'LOW', icon: 'pi-minus-circle', color: 'secondary', display_order: 4 },

    // ========================================
    // INCIDENT - Urgencies (from incident_config.sql)
    // ========================================
    { object_type: 'incident', metadata: 'URGENCY', code: 'CRITICAL', value: 1, icon: 'pi-exclamation-circle', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'incident', metadata: 'URGENCY', code: 'HIGH', value: 2, icon: 'pi-exclamation-triangle', color: 'warning', display_order: 2 },
    { object_type: 'incident', metadata: 'URGENCY', code: 'MEDIUM', value: 3, icon: 'pi-info-circle', color: 'info', display_order: 3 },
    { object_type: 'incident', metadata: 'URGENCY', code: 'LOW', value: 4, icon: 'pi-minus-circle', color: 'secondary', display_order: 4 },

    // INCIDENT - Impacts
    { object_type: 'incident', metadata: 'IMPACT', code: 'ENTERPRISE', value: 1, icon: 'pi-globe', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'incident', metadata: 'IMPACT', code: 'DEPARTMENT', value: 2, icon: 'pi-users', color: 'warning', display_order: 2 },
    { object_type: 'incident', metadata: 'IMPACT', code: 'WORKGROUP', value: 3, icon: 'pi-user-plus', color: 'info', display_order: 3 },
    { object_type: 'incident', metadata: 'IMPACT', code: 'USER', value: 4, icon: 'pi-user', color: 'secondary', display_order: 4 },

    // INCIDENT - Cause codes
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'HARDWARE_FAILURE', icon: 'pi-server', display_order: 1 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'SOFTWARE_BUG', icon: 'pi-code', display_order: 2 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'NETWORK_ISSUE', icon: 'pi-wifi', display_order: 3 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'HUMAN_ERROR', icon: 'pi-user-minus', display_order: 4 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'SECURITY_BREACH', icon: 'pi-shield', color: 'danger', display_order: 5 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'THIRD_PARTY_OUTAGE', icon: 'pi-external-link', display_order: 6 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'CONFIGURATION_ERROR', icon: 'pi-cog', display_order: 7 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'CAPACITY_ISSUE', icon: 'pi-chart-bar', display_order: 8 },
    { object_type: 'incident', metadata: 'CAUSE_CODE', code: 'UNKNOWN', icon: 'pi-question-circle', color: 'secondary', display_order: 9 },

    // INCIDENT - Resolution codes
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'FIXED', icon: 'pi-check-circle', color: 'success', display_order: 1 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'WORKAROUND_PROVIDED', icon: 'pi-directions', color: 'warning', display_order: 2 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'SELF_RESOLVED', icon: 'pi-refresh', display_order: 3 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'DUPLICATE', icon: 'pi-copy', color: 'secondary', display_order: 4 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'NOT_REPRODUCIBLE', icon: 'pi-question', display_order: 5 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'KNOWN_ISSUE', icon: 'pi-info-circle', display_order: 6 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'THIRD_PARTY_RESOLUTION', icon: 'pi-external-link', display_order: 7 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'CONFIGURATION_CHANGE', icon: 'pi-cog', display_order: 8 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'NO_ACTION_REQUIRED', icon: 'pi-minus', color: 'secondary', display_order: 9 },
    { object_type: 'incident', metadata: 'RESOLUTION_CODE', code: 'REFERRED_TO_CHANGE', icon: 'pi-arrow-right', display_order: 10 },

    // ========================================
    // CONTACT - Types (from incident_config.sql)
    // ========================================
    { object_type: 'contact', metadata: 'TYPE', code: 'PHONE', icon: 'pi-phone', display_order: 1 },
    { object_type: 'contact', metadata: 'TYPE', code: 'EMAIL', icon: 'pi-envelope', display_order: 2 },
    { object_type: 'contact', metadata: 'TYPE', code: 'CHAT', icon: 'pi-comments', display_order: 3 },
    { object_type: 'contact', metadata: 'TYPE', code: 'SELF_SERVICE_PORTAL', icon: 'pi-globe', display_order: 4 },
    { object_type: 'contact', metadata: 'TYPE', code: 'WALK_IN', icon: 'pi-user', display_order: 5 },
    { object_type: 'contact', metadata: 'TYPE', code: 'SOCIAL_MEDIA', icon: 'pi-twitter', display_order: 6 },
    { object_type: 'contact', metadata: 'TYPE', code: 'AUTOMATED_ALERT', icon: 'pi-bell', display_order: 7 },

    // ========================================
    // PROBLEM - Categories (from 10_problem_categories.sql)
    // ========================================
    // Business categories
    { object_type: 'problem', metadata: 'CATEGORY', code: 'CRITICAL_INCIDENT_FOLLOWUP', icon: 'pi-exclamation-circle', color: 'danger', display_order: 1 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'MULTIPLE_INCIDENTS_FOLLOWUP', icon: 'pi-list', color: 'warning', display_order: 2 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'SERVICE_QUALITY_IMPROVEMENT', icon: 'pi-chart-line', color: 'info', display_order: 3 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'SYSTEM_ANALYSIS', icon: 'pi-search', display_order: 4 },
    // Technical categories
    { object_type: 'problem', metadata: 'CATEGORY', code: 'HARDWARE_FAILURE', icon: 'pi-server', display_order: 5 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'SOFTWARE_BUG', icon: 'pi-code', display_order: 6 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'CONFIGURATION_ERROR', icon: 'pi-cog', display_order: 7 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'CAPACITY_ISSUE', icon: 'pi-chart-bar', display_order: 8 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'PERFORMANCE_DEGRADATION', icon: 'pi-clock', color: 'warning', display_order: 9 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'SECURITY_VULNERABILITY', icon: 'pi-shield', color: 'danger', display_order: 10 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'INTEGRATION_ISSUE', icon: 'pi-link', display_order: 11 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'DATA_CORRUPTION', icon: 'pi-database', color: 'danger', display_order: 12 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'NETWORK_ISSUE', icon: 'pi-wifi', display_order: 13 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'THIRD_PARTY_FAILURE', icon: 'pi-external-link', display_order: 14 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'DESIGN_FLAW', icon: 'pi-pencil', display_order: 15 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'DOCUMENTATION_ERROR', icon: 'pi-file', display_order: 16 },
    { object_type: 'problem', metadata: 'CATEGORY', code: 'TRAINING_ISSUE', icon: 'pi-book', display_order: 17 },

    // ========================================
    // DEFECT - Severities (from 15_defect_setup.sql)
    // ========================================
    { object_type: 'defect', metadata: 'SEVERITY', code: 'BLOCKER', icon: 'pi-ban', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'defect', metadata: 'SEVERITY', code: 'CRITICAL', icon: 'pi-exclamation-circle', color: 'danger', display_order: 2 },
    { object_type: 'defect', metadata: 'SEVERITY', code: 'MAJOR', icon: 'pi-exclamation-triangle', color: 'warning', display_order: 3 },
    { object_type: 'defect', metadata: 'SEVERITY', code: 'MINOR', icon: 'pi-info-circle', color: 'info', display_order: 4 },
    { object_type: 'defect', metadata: 'SEVERITY', code: 'TRIVIAL', icon: 'pi-minus-circle', color: 'secondary', display_order: 5 },
    { object_type: 'defect', metadata: 'SEVERITY', code: 'COSMETIC', icon: 'pi-palette', color: 'secondary', display_order: 6 },

    // DEFECT - Impacts
    { object_type: 'defect', metadata: 'IMPACT', code: 'GLOBAL', icon: 'pi-globe', color: 'danger', display_order: 1 },
    { object_type: 'defect', metadata: 'IMPACT', code: 'MULTIPLE_USERS', icon: 'pi-users', color: 'warning', display_order: 2 },
    { object_type: 'defect', metadata: 'IMPACT', code: 'SINGLE_USER', icon: 'pi-user', color: 'info', display_order: 3 },
    { object_type: 'defect', metadata: 'IMPACT', code: 'INTERNAL_ONLY', icon: 'pi-lock', color: 'secondary', display_order: 4 },
    { object_type: 'defect', metadata: 'IMPACT', code: 'NON_BLOCKING', icon: 'pi-check', color: 'success', display_order: 5 },

    // DEFECT - Environments
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'PRODUCTION', icon: 'pi-server', color: 'danger', display_order: 1 },
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'PRE_PRODUCTION', icon: 'pi-server', color: 'warning', display_order: 2 },
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'STAGING', icon: 'pi-server', color: 'info', display_order: 3 },
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'TEST', icon: 'pi-check-square', color: 'secondary', display_order: 4 },
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'DEVELOPMENT', icon: 'pi-code', color: 'secondary', display_order: 5 },
    { object_type: 'defect', metadata: 'ENVIRONMENT', code: 'LOCAL', icon: 'pi-desktop', color: 'secondary', display_order: 6 },

    // ========================================
    // PROJECT - Visibility (from 14_project_setup.sql)
    // ========================================
    { object_type: 'project', metadata: 'VISIBILITY', code: 'PUBLIC', icon: 'pi-globe', color: 'success', display_order: 1 },
    { object_type: 'project', metadata: 'VISIBILITY', code: 'PRIVATE', icon: 'pi-lock', color: 'secondary', display_order: 2 },
    { object_type: 'project', metadata: 'VISIBILITY', code: 'RESTRICTED', icon: 'pi-eye-slash', color: 'warning', display_order: 3 },

    // PROJECT - Categories
    { object_type: 'project', metadata: 'CATEGORY', code: 'SOFTWARE', icon: 'pi-code', display_order: 1 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'BUSINESS', icon: 'pi-briefcase', display_order: 2 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'SERVICE', icon: 'pi-cog', display_order: 3 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'INFRASTRUCTURE', icon: 'pi-server', display_order: 4 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'SECURITY', icon: 'pi-shield', display_order: 5 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'COMPLIANCE', icon: 'pi-check-square', display_order: 6 },
    { object_type: 'project', metadata: 'CATEGORY', code: 'RESEARCH', icon: 'pi-search', display_order: 7 },

    // ========================================
    // CHANGE - Types
    // ========================================
    { object_type: 'change', metadata: 'TYPE', code: 'STANDARD', icon: 'pi-check-circle', color: 'success', display_order: 1 },
    { object_type: 'change', metadata: 'TYPE', code: 'NORMAL', icon: 'pi-circle', color: 'info', display_order: 2 },
    { object_type: 'change', metadata: 'TYPE', code: 'EMERGENCY', icon: 'pi-exclamation-triangle', color: 'danger', font_weight: 'bold', display_order: 3 },

    // CHANGE - Justifications
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'BUSINESS_REQUIREMENT', icon: 'pi-briefcase', display_order: 1 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'SECURITY_PATCH', icon: 'pi-shield', color: 'danger', display_order: 2 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'BUG_FIX', icon: 'pi-wrench', display_order: 3 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'PERFORMANCE_IMPROVEMENT', icon: 'pi-chart-line', display_order: 4 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'INFRASTRUCTURE_UPGRADE', icon: 'pi-server', display_order: 5 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'COMPLIANCE', icon: 'pi-check-square', display_order: 6 },
    { object_type: 'change', metadata: 'JUSTIFICATION', code: 'END_OF_LIFE', icon: 'pi-calendar-times', color: 'warning', display_order: 7 },

    // CHANGE - Objectives
    { object_type: 'change', metadata: 'OBJECTIVE', code: 'NEW_FEATURE', icon: 'pi-plus', color: 'success', display_order: 1 },
    { object_type: 'change', metadata: 'OBJECTIVE', code: 'IMPROVEMENT', icon: 'pi-arrow-up', color: 'info', display_order: 2 },
    { object_type: 'change', metadata: 'OBJECTIVE', code: 'CORRECTION', icon: 'pi-wrench', display_order: 3 },
    { object_type: 'change', metadata: 'OBJECTIVE', code: 'MIGRATION', icon: 'pi-arrow-right-arrow-left', display_order: 4 },
    { object_type: 'change', metadata: 'OBJECTIVE', code: 'DECOMMISSION', icon: 'pi-trash', color: 'secondary', display_order: 5 },

    // CHANGE - CAB Validation Status
    { object_type: 'change', metadata: 'CAB_VALIDATION_STATUS', code: 'PENDING', icon: 'pi-clock', color: 'warning', display_order: 1 },
    { object_type: 'change', metadata: 'CAB_VALIDATION_STATUS', code: 'APPROVED', icon: 'pi-check', color: 'success', display_order: 2 },
    { object_type: 'change', metadata: 'CAB_VALIDATION_STATUS', code: 'REJECTED', icon: 'pi-times', color: 'danger', display_order: 3 },
    { object_type: 'change', metadata: 'CAB_VALIDATION_STATUS', code: 'MORE_INFO_REQUIRED', icon: 'pi-question-circle', color: 'info', display_order: 4 },
    { object_type: 'change', metadata: 'CAB_VALIDATION_STATUS', code: 'DEFERRED', icon: 'pi-pause', color: 'secondary', display_order: 5 },

    // CHANGE - Post Implementation Evaluation
    { object_type: 'change', metadata: 'POST_IMPLEMENTATION_EVALUATION', code: 'SUCCESSFUL', icon: 'pi-check-circle', color: 'success', display_order: 1 },
    { object_type: 'change', metadata: 'POST_IMPLEMENTATION_EVALUATION', code: 'SUCCESSFUL_WITH_ISSUES', icon: 'pi-exclamation-circle', color: 'warning', display_order: 2 },
    { object_type: 'change', metadata: 'POST_IMPLEMENTATION_EVALUATION', code: 'FAILED', icon: 'pi-times-circle', color: 'danger', display_order: 3 },
    { object_type: 'change', metadata: 'POST_IMPLEMENTATION_EVALUATION', code: 'ROLLED_BACK', icon: 'pi-undo', color: 'danger', display_order: 4 },
    { object_type: 'change', metadata: 'POST_IMPLEMENTATION_EVALUATION', code: 'PARTIAL', icon: 'pi-minus-circle', color: 'warning', display_order: 5 },

    // CHANGE - Validation Level
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'NONE', icon: 'pi-minus', color: 'secondary', display_order: 1 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'TEAM_LEAD', icon: 'pi-user', color: 'info', display_order: 2 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'MANAGER', icon: 'pi-users', color: 'info', display_order: 3 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'TECHNICAL_VALIDATION', icon: 'pi-cog', color: 'info', display_order: 4 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'SECURITY_VALIDATION', icon: 'pi-shield', color: 'warning', display_order: 5 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'BUSINESS_VALIDATION', icon: 'pi-briefcase', color: 'info', display_order: 6 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'CAB', icon: 'pi-sitemap', color: 'warning', display_order: 7 },
    { object_type: 'change', metadata: 'VALIDATION_LEVEL', code: 'ECAB', icon: 'pi-building', color: 'danger', display_order: 8 },

    // ========================================
    // PROBLEM - Impact (specific to Problem, not reusing Incident)
    // ========================================
    { object_type: 'problem', metadata: 'IMPACT', code: 'CRITICAL_REAL', icon: 'pi-exclamation-circle', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'problem', metadata: 'IMPACT', code: 'LIMITED_REAL', icon: 'pi-exclamation-triangle', color: 'warning', display_order: 2 },
    { object_type: 'problem', metadata: 'IMPACT', code: 'POTENTIAL', icon: 'pi-info-circle', color: 'info', display_order: 3 },

    // ========================================
    // SERVICE - Business Criticality
    // ========================================
    { object_type: 'service', metadata: 'BUSINESS_CRITICALITY', code: 'CRITICAL', icon: 'pi-exclamation-circle', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'service', metadata: 'BUSINESS_CRITICALITY', code: 'HIGH', icon: 'pi-exclamation-triangle', color: 'warning', display_order: 2 },
    { object_type: 'service', metadata: 'BUSINESS_CRITICALITY', code: 'MEDIUM', icon: 'pi-info-circle', color: 'info', display_order: 3 },
    { object_type: 'service', metadata: 'BUSINESS_CRITICALITY', code: 'LOW', icon: 'pi-minus-circle', color: 'secondary', display_order: 4 },

    // SERVICE - Impact Levels (for operational, legal, reputational, financial)
    { object_type: 'service', metadata: 'IMPACT_LEVEL', code: 'CRITICAL', icon: 'pi-exclamation-circle', color: 'danger', font_weight: 'bold', display_order: 1 },
    { object_type: 'service', metadata: 'IMPACT_LEVEL', code: 'HIGH', icon: 'pi-exclamation-triangle', color: 'warning', display_order: 2 },
    { object_type: 'service', metadata: 'IMPACT_LEVEL', code: 'MEDIUM', icon: 'pi-info-circle', color: 'info', display_order: 3 },
    { object_type: 'service', metadata: 'IMPACT_LEVEL', code: 'LOW', icon: 'pi-minus-circle', color: 'secondary', display_order: 4 },
    { object_type: 'service', metadata: 'IMPACT_LEVEL', code: 'NONE', icon: 'pi-minus', color: 'secondary', display_order: 5 },

    // ========================================
    // SERVICE OFFERING - Environment
    // ========================================
    { object_type: 'service_offering', metadata: 'ENVIRONMENT', code: 'PRODUCTION', icon: 'pi-server', color: 'success', display_order: 1 },
    { object_type: 'service_offering', metadata: 'ENVIRONMENT', code: 'STAGING', icon: 'pi-clone', color: 'warning', display_order: 2 },
    { object_type: 'service_offering', metadata: 'ENVIRONMENT', code: 'TEST', icon: 'pi-check-circle', color: 'info', display_order: 3 },
    { object_type: 'service_offering', metadata: 'ENVIRONMENT', code: 'DEVELOPMENT', icon: 'pi-code', color: 'secondary', display_order: 4 },
    { object_type: 'service_offering', metadata: 'ENVIRONMENT', code: 'SANDBOX', icon: 'pi-box', color: 'secondary', display_order: 5 },

    // SERVICE OFFERING - Price Model
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'FREE', icon: 'pi-gift', color: 'success', display_order: 1 },
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'FLAT_RATE', icon: 'pi-money-bill', color: 'info', display_order: 2 },
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'PER_USER', icon: 'pi-user', color: 'info', display_order: 3 },
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'PER_USAGE', icon: 'pi-chart-bar', color: 'warning', display_order: 4 },
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'TIERED', icon: 'pi-list', color: 'info', display_order: 5 },
    { object_type: 'service_offering', metadata: 'PRICE_MODEL', code: 'CUSTOM', icon: 'pi-cog', color: 'secondary', display_order: 6 },

    // SERVICE OFFERING - Currency
    { object_type: 'service_offering', metadata: 'CURRENCY', code: 'EUR', icon: 'pi-euro', display_order: 1 },
    { object_type: 'service_offering', metadata: 'CURRENCY', code: 'USD', icon: 'pi-dollar', display_order: 2 },
    { object_type: 'service_offering', metadata: 'CURRENCY', code: 'GBP', icon: 'pi-pound', display_order: 3 },
    { object_type: 'service_offering', metadata: 'CURRENCY', code: 'CHF', icon: 'pi-money-bill', display_order: 4 },

    // ========================================
    // KNOWLEDGE - Categories (from 13_knowledge_articles_setup.sql)
    // ========================================
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'MODE_OPERATOIRE', icon: 'pi-list', display_order: 1 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'PROCEDURE_PAS_A_PAS', icon: 'pi-step-forward', display_order: 2 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GUIDE_DEPANNAGE', icon: 'pi-wrench', display_order: 3 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'FAQ', icon: 'pi-question-circle', display_order: 4 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'TUTORIEL', icon: 'pi-video', display_order: 5 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GUIDE_INSTALLATION', icon: 'pi-download', display_order: 6 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GUIDE_CONFIGURATION', icon: 'pi-cog', display_order: 7 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'RELEASE_NOTES', icon: 'pi-file', display_order: 8 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'POLITIQUE_SECURITE', icon: 'pi-shield', display_order: 9 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'CHARTE_UTILISATION', icon: 'pi-file-edit', display_order: 10 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'MATRICE_COMPATIBILITE', icon: 'pi-table', display_order: 11 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GUIDE_UTILISATEUR', icon: 'pi-user', display_order: 12 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GUIDE_ADMINISTRATEUR', icon: 'pi-user-edit', display_order: 13 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'SCRIPT_AUTOMATISATION', icon: 'pi-code', display_order: 14 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'REFERENCE_TECHNIQUE', icon: 'pi-book', display_order: 15 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'GLOSSAIRE', icon: 'pi-list', display_order: 16 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'CHECKLIST_VALIDATION', icon: 'pi-check-square', display_order: 17 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'BEST_PRACTICES', icon: 'pi-star', display_order: 18 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'ETUDE_CAS', icon: 'pi-file-pdf', display_order: 19 },
    { object_type: 'knowledge', metadata: 'CATEGORY', code: 'QUESTION_METIER', icon: 'pi-comments', display_order: 20 },

    // KNOWLEDGE - Target Audience
    { object_type: 'knowledge', metadata: 'TARGET_AUDIENCE', code: 'ALL', icon: 'pi-users', display_order: 1 },
    { object_type: 'knowledge', metadata: 'TARGET_AUDIENCE', code: 'SUPPORT', icon: 'pi-headphones', display_order: 2 },
    { object_type: 'knowledge', metadata: 'TARGET_AUDIENCE', code: 'BUSINESS', icon: 'pi-briefcase', display_order: 3 },
    { object_type: 'knowledge', metadata: 'TARGET_AUDIENCE', code: 'TECHNICAL', icon: 'pi-cog', display_order: 4 },
    { object_type: 'knowledge', metadata: 'TARGET_AUDIENCE', code: 'PROJECT', icon: 'pi-folder', display_order: 5 },

    // KNOWLEDGE - Confidentiality Levels
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'PUBLIC', icon: 'pi-globe', color: 'success', display_order: 1 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'INTERNAL', icon: 'pi-building', color: 'info', display_order: 2 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'INTERNAL_RESTRICTED', icon: 'pi-lock', color: 'warning', display_order: 3 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'CONFIDENTIAL', icon: 'pi-eye-slash', color: 'danger', display_order: 4 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'CONFIDENTIAL_HR', icon: 'pi-user-edit', color: 'danger', display_order: 5 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'SECRET', icon: 'pi-shield', color: 'danger', font_weight: 'bold', display_order: 6 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'TOP_SECRET', icon: 'pi-shield', color: 'danger', font_weight: 'bold', display_order: 7 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'SENSITIVE_PERSONAL_DATA', icon: 'pi-id-card', color: 'danger', display_order: 8 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'REGULATED_INFO', icon: 'pi-file-check', color: 'warning', display_order: 9 },
    { object_type: 'knowledge', metadata: 'CONFIDENTIALITY_LEVEL', code: 'INTELLECTUAL_PROPERTY', icon: 'pi-star', color: 'warning', display_order: 10 },

    // KNOWLEDGE - Business Scope
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'CORE_BUSINESS', icon: 'pi-star', color: 'danger', display_order: 1 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'REVENUE_SERVICE', icon: 'pi-dollar', color: 'success', display_order: 2 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'CUSTOMER_PORTAL', icon: 'pi-globe', display_order: 3 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'FIELD_OPERATIONS', icon: 'pi-map', display_order: 4 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'EMPLOYEE_PRODUCTIVITY', icon: 'pi-chart-line', display_order: 5 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'REGULATORY', icon: 'pi-file-check', display_order: 6 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'SECURITY_CONTROL', icon: 'pi-shield', display_order: 7 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'DATA_PROTECTION', icon: 'pi-lock', display_order: 8 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'SHARED_SERVICE', icon: 'pi-share-alt', display_order: 9 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'DEPARTMENT_SPECIFIC', icon: 'pi-users', display_order: 10 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'BACK_OFFICE', icon: 'pi-desktop', display_order: 11 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'TEST_ENVIRONMENT', icon: 'pi-check-square', color: 'secondary', display_order: 12 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'OPTIONAL_ENHANCEMENT', icon: 'pi-plus', color: 'secondary', display_order: 13 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'TRAINING', icon: 'pi-book', display_order: 14 },
    { object_type: 'knowledge', metadata: 'BUSINESS_SCOPE', code: 'LEGACY_MAINTENANCE', icon: 'pi-history', color: 'secondary', display_order: 15 },
  ];

  // Upsert all object_setup records
  let created = 0;
  let updated = 0;

  for (const item of objectSetupData) {
    const result = await prisma.object_setup.upsert({
      where: {
        object_type_metadata_code: {
          object_type: item.object_type,
          metadata: item.metadata,
          code: item.code,
        },
      },
      update: {
        value: item.value || null,
        icon: item.icon || null,
        color: item.color || null,
        font_weight: item.font_weight || null,
        font_style: item.font_style || null,
        display_order: item.display_order,
        is_active: true,
      },
      create: item,
    });

    if (result.created_at.getTime() === result.updated_at.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Object setup seeding completed: ${created} created, ${updated} updated`);

  // Now seed translations
  await seedObjectSetupTranslations();
}

/**
 * Seed translations for object_setup
 */
async function seedObjectSetupTranslations() {
  console.log('Seeding object_setup translations...');

  const translations = {
    // ========================================
    // ENTITY - Types
    // ========================================
    'entity|TYPE|COMPANY': { fr: 'Entreprise', en: 'Company', es: 'Empresa', pt: 'Empresa' },
    'entity|TYPE|BRANCH': { fr: 'Succursale', en: 'Branch', es: 'Sucursal', pt: 'Filial' },
    'entity|TYPE|DEPARTMENT': { fr: 'Département', en: 'Department', es: 'Departamento', pt: 'Departamento' },
    'entity|TYPE|SUPPLIER': { fr: 'Fournisseur', en: 'Supplier', es: 'Proveedor', pt: 'Fornecedor' },
    'entity|TYPE|CUSTOMER': { fr: 'Client', en: 'Customer', es: 'Cliente', pt: 'Cliente' },

    // ========================================
    // LOCATION - Types
    // ========================================
    'location|TYPE|OFFICE': { fr: 'Bureau', en: 'Office', es: 'Oficina', pt: 'Escritório' },
    'location|TYPE|WAREHOUSE': { fr: 'Entrepôt', en: 'Warehouse', es: 'Almacén', pt: 'Armazém' },
    'location|TYPE|DATA_CENTER': { fr: 'Centre de données', en: 'Data Center', es: 'Centro de datos', pt: 'Centro de dados' },
    'location|TYPE|FACTORY': { fr: 'Usine', en: 'Factory', es: 'Fábrica', pt: 'Fábrica' },
    'location|TYPE|STORE': { fr: 'Magasin', en: 'Store', es: 'Tienda', pt: 'Loja' },

    // LOCATION - Business Criticality
    'location|BUSINESS_CRITICALITY|CRITICAL': { fr: 'Critique', en: 'Critical', es: 'Crítico', pt: 'Crítico' },
    'location|BUSINESS_CRITICALITY|HIGH': { fr: 'Élevée', en: 'High', es: 'Alta', pt: 'Alta' },
    'location|BUSINESS_CRITICALITY|MEDIUM': { fr: 'Moyenne', en: 'Medium', es: 'Media', pt: 'Média' },
    'location|BUSINESS_CRITICALITY|LOW': { fr: 'Faible', en: 'Low', es: 'Baja', pt: 'Baixa' },

    // ========================================
    // INCIDENT - Urgencies
    // ========================================
    'incident|URGENCY|CRITICAL': { fr: 'Critique', en: 'Critical', es: 'Crítico', pt: 'Crítico' },
    'incident|URGENCY|HIGH': { fr: 'Élevée', en: 'High', es: 'Alta', pt: 'Alta' },
    'incident|URGENCY|MEDIUM': { fr: 'Moyenne', en: 'Medium', es: 'Media', pt: 'Média' },
    'incident|URGENCY|LOW': { fr: 'Faible', en: 'Low', es: 'Baja', pt: 'Baixa' },

    // INCIDENT - Impacts
    'incident|IMPACT|ENTERPRISE': { fr: 'Entreprise entière', en: 'Enterprise-wide', es: 'Toda la empresa', pt: 'Toda a empresa' },
    'incident|IMPACT|DEPARTMENT': { fr: 'Département', en: 'Department', es: 'Departamento', pt: 'Departamento' },
    'incident|IMPACT|WORKGROUP': { fr: 'Groupe de travail', en: 'Workgroup', es: 'Grupo de trabajo', pt: 'Grupo de trabalho' },
    'incident|IMPACT|USER': { fr: 'Utilisateur unique', en: 'Single User', es: 'Usuario único', pt: 'Usuário único' },

    // INCIDENT - Cause codes
    'incident|CAUSE_CODE|HARDWARE_FAILURE': { fr: 'Défaillance matérielle', en: 'Hardware Failure', es: 'Fallo de hardware', pt: 'Falha de hardware' },
    'incident|CAUSE_CODE|SOFTWARE_BUG': { fr: 'Bogue logiciel', en: 'Software Bug', es: 'Error de software', pt: 'Erro de software' },
    'incident|CAUSE_CODE|NETWORK_ISSUE': { fr: 'Problème réseau', en: 'Network Issue', es: 'Problema de red', pt: 'Problema de rede' },
    'incident|CAUSE_CODE|HUMAN_ERROR': { fr: 'Erreur humaine', en: 'Human Error', es: 'Error humano', pt: 'Erro humano' },
    'incident|CAUSE_CODE|SECURITY_BREACH': { fr: 'Faille de sécurité', en: 'Security Breach', es: 'Brecha de seguridad', pt: 'Violação de segurança' },
    'incident|CAUSE_CODE|THIRD_PARTY_OUTAGE': { fr: 'Panne tierce partie', en: 'Third-party Outage', es: 'Interrupción de terceros', pt: 'Interrupção de terceiros' },
    'incident|CAUSE_CODE|CONFIGURATION_ERROR': { fr: 'Erreur de configuration', en: 'Configuration Error', es: 'Error de configuración', pt: 'Erro de configuração' },
    'incident|CAUSE_CODE|CAPACITY_ISSUE': { fr: 'Problème de capacité', en: 'Capacity Issue', es: 'Problema de capacidad', pt: 'Problema de capacidade' },
    'incident|CAUSE_CODE|UNKNOWN': { fr: 'Cause inconnue', en: 'Unknown Cause', es: 'Causa desconocida', pt: 'Causa desconhecida' },

    // INCIDENT - Resolution codes
    'incident|RESOLUTION_CODE|FIXED': { fr: 'Résolu', en: 'Fixed', es: 'Resuelto', pt: 'Resolvido' },
    'incident|RESOLUTION_CODE|WORKAROUND_PROVIDED': { fr: 'Solution de contournement fournie', en: 'Workaround Provided', es: 'Solución alternativa proporcionada', pt: 'Solução alternativa fornecida' },
    'incident|RESOLUTION_CODE|SELF_RESOLVED': { fr: 'Résolu automatiquement', en: 'Self Resolved', es: 'Resuelto automáticamente', pt: 'Resolvido automaticamente' },
    'incident|RESOLUTION_CODE|DUPLICATE': { fr: 'Doublon', en: 'Duplicate', es: 'Duplicado', pt: 'Duplicado' },
    'incident|RESOLUTION_CODE|NOT_REPRODUCIBLE': { fr: 'Non reproductible', en: 'Not Reproducible', es: 'No reproducible', pt: 'Não reproduzível' },
    'incident|RESOLUTION_CODE|KNOWN_ISSUE': { fr: 'Problème connu', en: 'Known Issue', es: 'Problema conocido', pt: 'Problema conhecido' },
    'incident|RESOLUTION_CODE|THIRD_PARTY_RESOLUTION': { fr: 'Résolution par un tiers', en: 'Third-party Resolution', es: 'Resolución de terceros', pt: 'Resolução de terceiros' },
    'incident|RESOLUTION_CODE|CONFIGURATION_CHANGE': { fr: 'Changement de configuration', en: 'Configuration Change', es: 'Cambio de configuración', pt: 'Mudança de configuração' },
    'incident|RESOLUTION_CODE|NO_ACTION_REQUIRED': { fr: 'Aucune action requise', en: 'No Action Required', es: 'No se requiere acción', pt: 'Nenhuma ação necessária' },
    'incident|RESOLUTION_CODE|REFERRED_TO_CHANGE': { fr: 'Référé à un changement', en: 'Referred to Change', es: 'Referido a cambio', pt: 'Referido a mudança' },

    // ========================================
    // CONTACT - Types
    // ========================================
    'contact|TYPE|PHONE': { fr: 'Téléphone', en: 'Phone', es: 'Teléfono', pt: 'Telefone' },
    'contact|TYPE|EMAIL': { fr: 'Email', en: 'Email', es: 'Correo electrónico', pt: 'E-mail' },
    'contact|TYPE|CHAT': { fr: 'Chat', en: 'Chat', es: 'Chat', pt: 'Chat' },
    'contact|TYPE|SELF_SERVICE_PORTAL': { fr: 'Portail libre-service', en: 'Self-service Portal', es: 'Portal de autoservicio', pt: 'Portal de autoatendimento' },
    'contact|TYPE|WALK_IN': { fr: 'En personne', en: 'Walk-in', es: 'En persona', pt: 'Presencial' },
    'contact|TYPE|SOCIAL_MEDIA': { fr: 'Réseaux sociaux', en: 'Social Media', es: 'Redes sociales', pt: 'Redes sociais' },
    'contact|TYPE|AUTOMATED_ALERT': { fr: 'Alerte automatisée', en: 'Automated Alert', es: 'Alerta automatizada', pt: 'Alerta automatizado' },

    // ========================================
    // PROBLEM - Categories
    // ========================================
    'problem|CATEGORY|CRITICAL_INCIDENT_FOLLOWUP': { fr: 'Suite incident critique', en: 'Critical incident follow-up', es: 'Seguimiento de incidente crítico', pt: 'Acompanhamento de incidente crítico' },
    'problem|CATEGORY|MULTIPLE_INCIDENTS_FOLLOWUP': { fr: 'Suite plusieurs incidents du même type', en: 'Multiple incidents of the same type follow-up', es: 'Seguimiento de múltiples incidentes del mismo tipo', pt: 'Acompanhamento de múltiplos incidentes do mesmo tipo' },
    'problem|CATEGORY|SERVICE_QUALITY_IMPROVEMENT': { fr: 'Amélioration de la qualité d\'un service', en: 'Service quality improvement', es: 'Mejora de la calidad del servicio', pt: 'Melhoria da qualidade do serviço' },
    'problem|CATEGORY|SYSTEM_ANALYSIS': { fr: 'Analyse du SI', en: 'Information system analysis', es: 'Análisis del sistema de información', pt: 'Análise do sistema de informação' },
    'problem|CATEGORY|HARDWARE_FAILURE': { fr: 'Défaillance matérielle', en: 'Hardware Failure', es: 'Fallo de hardware', pt: 'Falha de hardware' },
    'problem|CATEGORY|SOFTWARE_BUG': { fr: 'Bug logiciel', en: 'Software Bug', es: 'Error de software', pt: 'Erro de software' },
    'problem|CATEGORY|CONFIGURATION_ERROR': { fr: 'Erreur de configuration', en: 'Configuration Error', es: 'Error de configuración', pt: 'Erro de configuração' },
    'problem|CATEGORY|CAPACITY_ISSUE': { fr: 'Problème de capacité', en: 'Capacity Issue', es: 'Problema de capacidad', pt: 'Problema de capacidade' },
    'problem|CATEGORY|PERFORMANCE_DEGRADATION': { fr: 'Dégradation des performances', en: 'Performance Degradation', es: 'Degradación del rendimiento', pt: 'Degradação de desempenho' },
    'problem|CATEGORY|SECURITY_VULNERABILITY': { fr: 'Vulnérabilité de sécurité', en: 'Security Vulnerability', es: 'Vulnerabilidad de seguridad', pt: 'Vulnerabilidade de segurança' },
    'problem|CATEGORY|INTEGRATION_ISSUE': { fr: 'Problème d\'intégration', en: 'Integration Issue', es: 'Problema de integración', pt: 'Problema de integração' },
    'problem|CATEGORY|DATA_CORRUPTION': { fr: 'Corruption de données', en: 'Data Corruption', es: 'Corrupción de datos', pt: 'Corrupção de dados' },
    'problem|CATEGORY|NETWORK_ISSUE': { fr: 'Problème réseau', en: 'Network Issue', es: 'Problema de red', pt: 'Problema de rede' },
    'problem|CATEGORY|THIRD_PARTY_FAILURE': { fr: 'Défaillance d\'un tiers', en: 'Third Party Failure', es: 'Fallo de terceros', pt: 'Falha de terceiros' },
    'problem|CATEGORY|DESIGN_FLAW': { fr: 'Défaut de conception', en: 'Design Flaw', es: 'Defecto de diseño', pt: 'Falha de design' },
    'problem|CATEGORY|DOCUMENTATION_ERROR': { fr: 'Erreur de documentation', en: 'Documentation Error', es: 'Error de documentación', pt: 'Erro de documentação' },
    'problem|CATEGORY|TRAINING_ISSUE': { fr: 'Problème de formation', en: 'Training Issue', es: 'Problema de formación', pt: 'Problema de treinamento' },

    // ========================================
    // DEFECT - Severities
    // ========================================
    'defect|SEVERITY|BLOCKER': { fr: 'Bloquant', en: 'Blocker', es: 'Bloqueante', pt: 'Bloqueador' },
    'defect|SEVERITY|CRITICAL': { fr: 'Critique', en: 'Critical', es: 'Crítico', pt: 'Crítico' },
    'defect|SEVERITY|MAJOR': { fr: 'Majeur', en: 'Major', es: 'Mayor', pt: 'Maior' },
    'defect|SEVERITY|MINOR': { fr: 'Mineur', en: 'Minor', es: 'Menor', pt: 'Menor' },
    'defect|SEVERITY|TRIVIAL': { fr: 'Mineur (trivial)', en: 'Trivial', es: 'Trivial', pt: 'Trivial' },
    'defect|SEVERITY|COSMETIC': { fr: 'Cosmétique', en: 'Cosmetic', es: 'Cosmético', pt: 'Cosmético' },

    // DEFECT - Impacts
    'defect|IMPACT|GLOBAL': { fr: 'Global', en: 'Global', es: 'Global', pt: 'Global' },
    'defect|IMPACT|MULTIPLE_USERS': { fr: 'Plusieurs utilisateurs', en: 'Multiple users', es: 'Múltiples usuarios', pt: 'Múltiplos usuários' },
    'defect|IMPACT|SINGLE_USER': { fr: 'Utilisateur unique', en: 'Single user', es: 'Usuario único', pt: 'Usuário único' },
    'defect|IMPACT|INTERNAL_ONLY': { fr: 'Interne uniquement', en: 'Internal only', es: 'Solo interno', pt: 'Apenas interno' },
    'defect|IMPACT|NON_BLOCKING': { fr: 'Non bloquant', en: 'Non blocking', es: 'No bloqueante', pt: 'Não bloqueador' },

    // DEFECT - Environments
    'defect|ENVIRONMENT|PRODUCTION': { fr: 'Production', en: 'Production', es: 'Producción', pt: 'Produção' },
    'defect|ENVIRONMENT|PRE_PRODUCTION': { fr: 'Pré-production', en: 'Pre-production', es: 'Pre-producción', pt: 'Pré-produção' },
    'defect|ENVIRONMENT|STAGING': { fr: 'Pré-prod technique', en: 'Staging', es: 'Staging', pt: 'Staging' },
    'defect|ENVIRONMENT|TEST': { fr: 'Test', en: 'Test', es: 'Prueba', pt: 'Teste' },
    'defect|ENVIRONMENT|DEVELOPMENT': { fr: 'Développement', en: 'Development', es: 'Desarrollo', pt: 'Desenvolvimento' },
    'defect|ENVIRONMENT|LOCAL': { fr: 'Local', en: 'Local', es: 'Local', pt: 'Local' },

    // ========================================
    // PROJECT - Visibility
    // ========================================
    'project|VISIBILITY|PUBLIC': { fr: 'Public', en: 'Public', es: 'Público', pt: 'Público' },
    'project|VISIBILITY|PRIVATE': { fr: 'Privé', en: 'Private', es: 'Privado', pt: 'Privado' },
    'project|VISIBILITY|RESTRICTED': { fr: 'Restreint', en: 'Restricted', es: 'Restringido', pt: 'Restrito' },

    // PROJECT - Categories
    'project|CATEGORY|SOFTWARE': { fr: 'Logiciel', en: 'Software', es: 'Software', pt: 'Software' },
    'project|CATEGORY|BUSINESS': { fr: 'Métier', en: 'Business', es: 'Negocio', pt: 'Negócio' },
    'project|CATEGORY|SERVICE': { fr: 'Service', en: 'Service', es: 'Servicio', pt: 'Serviço' },
    'project|CATEGORY|INFRASTRUCTURE': { fr: 'Infrastructure', en: 'Infrastructure', es: 'Infraestructura', pt: 'Infraestrutura' },
    'project|CATEGORY|SECURITY': { fr: 'Sécurité', en: 'Security', es: 'Seguridad', pt: 'Segurança' },
    'project|CATEGORY|COMPLIANCE': { fr: 'Conformité', en: 'Compliance', es: 'Cumplimiento', pt: 'Conformidade' },
    'project|CATEGORY|RESEARCH': { fr: 'Recherche', en: 'Research', es: 'Investigación', pt: 'Pesquisa' },

    // ========================================
    // CHANGE - Types
    // ========================================
    'change|TYPE|STANDARD': { fr: 'Standard', en: 'Standard', es: 'Estándar', pt: 'Padrão' },
    'change|TYPE|NORMAL': { fr: 'Normal', en: 'Normal', es: 'Normal', pt: 'Normal' },
    'change|TYPE|EMERGENCY': { fr: 'Urgence', en: 'Emergency', es: 'Emergencia', pt: 'Emergência' },

    // CHANGE - Justifications
    'change|JUSTIFICATION|BUSINESS_REQUIREMENT': { fr: 'Exigence métier', en: 'Business Requirement', es: 'Requisito de negocio', pt: 'Requisito de negócio' },
    'change|JUSTIFICATION|SECURITY_PATCH': { fr: 'Correctif de sécurité', en: 'Security Patch', es: 'Parche de seguridad', pt: 'Patch de segurança' },
    'change|JUSTIFICATION|BUG_FIX': { fr: 'Correction de bug', en: 'Bug Fix', es: 'Corrección de error', pt: 'Correção de bug' },
    'change|JUSTIFICATION|PERFORMANCE_IMPROVEMENT': { fr: 'Amélioration des performances', en: 'Performance Improvement', es: 'Mejora de rendimiento', pt: 'Melhoria de desempenho' },
    'change|JUSTIFICATION|INFRASTRUCTURE_UPGRADE': { fr: 'Mise à niveau infrastructure', en: 'Infrastructure Upgrade', es: 'Actualización de infraestructura', pt: 'Atualização de infraestrutura' },
    'change|JUSTIFICATION|COMPLIANCE': { fr: 'Conformité', en: 'Compliance', es: 'Cumplimiento', pt: 'Conformidade' },
    'change|JUSTIFICATION|END_OF_LIFE': { fr: 'Fin de vie', en: 'End of Life', es: 'Fin de vida', pt: 'Fim de vida' },

    // CHANGE - Objectives
    'change|OBJECTIVE|NEW_FEATURE': { fr: 'Nouvelle fonctionnalité', en: 'New Feature', es: 'Nueva funcionalidad', pt: 'Nova funcionalidade' },
    'change|OBJECTIVE|IMPROVEMENT': { fr: 'Amélioration', en: 'Improvement', es: 'Mejora', pt: 'Melhoria' },
    'change|OBJECTIVE|CORRECTION': { fr: 'Correction', en: 'Correction', es: 'Corrección', pt: 'Correção' },
    'change|OBJECTIVE|MIGRATION': { fr: 'Migration', en: 'Migration', es: 'Migración', pt: 'Migração' },
    'change|OBJECTIVE|DECOMMISSION': { fr: 'Décommissionnement', en: 'Decommission', es: 'Desmantelamiento', pt: 'Descomissionamento' },

    // CHANGE - CAB Validation Status
    'change|CAB_VALIDATION_STATUS|PENDING': { fr: 'En attente', en: 'Pending', es: 'Pendiente', pt: 'Pendente' },
    'change|CAB_VALIDATION_STATUS|APPROVED': { fr: 'Approuvé', en: 'Approved', es: 'Aprobado', pt: 'Aprovado' },
    'change|CAB_VALIDATION_STATUS|REJECTED': { fr: 'Rejeté', en: 'Rejected', es: 'Rechazado', pt: 'Rejeitado' },
    'change|CAB_VALIDATION_STATUS|MORE_INFO_REQUIRED': { fr: 'Informations supplémentaires requises', en: 'More Info Required', es: 'Se requiere más información', pt: 'Mais informações necessárias' },
    'change|CAB_VALIDATION_STATUS|DEFERRED': { fr: 'Différé', en: 'Deferred', es: 'Diferido', pt: 'Adiado' },

    // CHANGE - Post Implementation Evaluation
    'change|POST_IMPLEMENTATION_EVALUATION|SUCCESSFUL': { fr: 'Réussi', en: 'Successful', es: 'Exitoso', pt: 'Bem-sucedido' },
    'change|POST_IMPLEMENTATION_EVALUATION|SUCCESSFUL_WITH_ISSUES': { fr: 'Réussi avec problèmes', en: 'Successful with Issues', es: 'Exitoso con problemas', pt: 'Bem-sucedido com problemas' },
    'change|POST_IMPLEMENTATION_EVALUATION|FAILED': { fr: 'Échoué', en: 'Failed', es: 'Fallido', pt: 'Falhou' },
    'change|POST_IMPLEMENTATION_EVALUATION|ROLLED_BACK': { fr: 'Annulé (rollback)', en: 'Rolled Back', es: 'Revertido', pt: 'Revertido' },
    'change|POST_IMPLEMENTATION_EVALUATION|PARTIAL': { fr: 'Partiel', en: 'Partial', es: 'Parcial', pt: 'Parcial' },

    // CHANGE - Validation Level
    'change|VALIDATION_LEVEL|NONE': { fr: 'Aucune', en: 'None', es: 'Ninguna', pt: 'Nenhuma' },
    'change|VALIDATION_LEVEL|TEAM_LEAD': { fr: 'Chef d\'équipe', en: 'Team Lead', es: 'Líder de equipo', pt: 'Líder de equipe' },
    'change|VALIDATION_LEVEL|MANAGER': { fr: 'Manager', en: 'Manager', es: 'Gerente', pt: 'Gerente' },
    'change|VALIDATION_LEVEL|TECHNICAL_VALIDATION': { fr: 'Validation technique (architecte, expert infra)', en: 'Technical validation (architect, infra expert)', es: 'Validación técnica (arquitecto, experto infra)', pt: 'Validação técnica (arquiteto, especialista infra)' },
    'change|VALIDATION_LEVEL|SECURITY_VALIDATION': { fr: 'Validation sécurité (RSSI, DPO)', en: 'Security validation (CISO, DPO)', es: 'Validación de seguridad (CISO, DPO)', pt: 'Validação de segurança (CISO, DPO)' },
    'change|VALIDATION_LEVEL|BUSINESS_VALIDATION': { fr: 'Validation métier (responsable de service, product owner)', en: 'Business validation (service owner, product owner)', es: 'Validación de negocio (responsable de servicio, product owner)', pt: 'Validação de negócio (responsável de serviço, product owner)' },
    'change|VALIDATION_LEVEL|CAB': { fr: 'CAB (Change Advisory Board)', en: 'CAB (Change Advisory Board)', es: 'CAB (Comité de cambios)', pt: 'CAB (Comitê de mudanças)' },
    'change|VALIDATION_LEVEL|ECAB': { fr: 'ECAB (Emergency CAB)', en: 'ECAB (Emergency CAB)', es: 'ECAB (CAB de emergencia)', pt: 'ECAB (CAB de emergência)' },

    // ========================================
    // PROBLEM - Impact (specific to Problem)
    // ========================================
    'problem|IMPACT|CRITICAL_REAL': { fr: 'Impact réel critique', en: 'Critical Real Impact', es: 'Impacto real crítico', pt: 'Impacto real crítico' },
    'problem|IMPACT|LIMITED_REAL': { fr: 'Impact réel limité', en: 'Limited Real Impact', es: 'Impacto real limitado', pt: 'Impacto real limitado' },
    'problem|IMPACT|POTENTIAL': { fr: 'Impact potentiel', en: 'Potential Impact', es: 'Impacto potencial', pt: 'Impacto potencial' },

    // ========================================
    // KNOWLEDGE - Categories (partial - most important ones)
    // ========================================
    'knowledge|CATEGORY|MODE_OPERATOIRE': { fr: 'Mode opératoire', en: 'Operating Mode', es: 'Modo operativo', pt: 'Modo operacional' },
    'knowledge|CATEGORY|PROCEDURE_PAS_A_PAS': { fr: 'Procédure pas à pas', en: 'Step-by-Step Procedure', es: 'Procedimiento paso a paso', pt: 'Procedimento passo a passo' },
    'knowledge|CATEGORY|GUIDE_DEPANNAGE': { fr: 'Guide de dépannage', en: 'Troubleshooting Guide', es: 'Guía de solución de problemas', pt: 'Guia de solução de problemas' },
    'knowledge|CATEGORY|FAQ': { fr: 'Foire aux questions (FAQ)', en: 'Frequently Asked Questions (FAQ)', es: 'Preguntas frecuentes (FAQ)', pt: 'Perguntas frequentes (FAQ)' },
    'knowledge|CATEGORY|TUTORIEL': { fr: 'How-to / Tutoriel', en: 'How-to / Tutorial', es: 'Cómo / Tutorial', pt: 'Como fazer / Tutorial' },
    'knowledge|CATEGORY|GUIDE_INSTALLATION': { fr: 'Guide d\'installation', en: 'Installation Guide', es: 'Guía de instalación', pt: 'Guia de instalação' },
    'knowledge|CATEGORY|GUIDE_CONFIGURATION': { fr: 'Guide de configuration', en: 'Configuration Guide', es: 'Guía de configuración', pt: 'Guia de configuração' },
    'knowledge|CATEGORY|RELEASE_NOTES': { fr: 'Notice de mise à jour / Release Notes', en: 'Release Notes', es: 'Notas de la versión', pt: 'Notas de lançamento' },
    'knowledge|CATEGORY|POLITIQUE_SECURITE': { fr: 'Politique de sécurité', en: 'Security Policy', es: 'Política de seguridad', pt: 'Política de segurança' },
    'knowledge|CATEGORY|CHARTE_UTILISATION': { fr: 'Charte d\'utilisation', en: 'Usage Charter', es: 'Carta de uso', pt: 'Carta de uso' },
    'knowledge|CATEGORY|MATRICE_COMPATIBILITE': { fr: 'Matrice de compatibilité', en: 'Compatibility Matrix', es: 'Matriz de compatibilidad', pt: 'Matriz de compatibilidade' },
    'knowledge|CATEGORY|GUIDE_UTILISATEUR': { fr: 'Guide utilisateur', en: 'User Guide', es: 'Guía del usuario', pt: 'Guia do usuário' },
    'knowledge|CATEGORY|GUIDE_ADMINISTRATEUR': { fr: 'Guide administrateur', en: 'Administrator Guide', es: 'Guía del administrador', pt: 'Guia do administrador' },
    'knowledge|CATEGORY|SCRIPT_AUTOMATISATION': { fr: 'Script d\'automatisation', en: 'Automation Script', es: 'Script de automatización', pt: 'Script de automação' },
    'knowledge|CATEGORY|REFERENCE_TECHNIQUE': { fr: 'Référence technique', en: 'Technical Reference', es: 'Referencia técnica', pt: 'Referência técnica' },
    'knowledge|CATEGORY|GLOSSAIRE': { fr: 'Glossaire / Terminologie', en: 'Glossary / Terminology', es: 'Glosario / Terminología', pt: 'Glossário / Terminologia' },
    'knowledge|CATEGORY|CHECKLIST_VALIDATION': { fr: 'Checklist de validation', en: 'Validation Checklist', es: 'Lista de verificación', pt: 'Lista de verificação' },
    'knowledge|CATEGORY|BEST_PRACTICES': { fr: 'Bonnes pratiques / Best Practices', en: 'Best Practices', es: 'Mejores prácticas', pt: 'Melhores práticas' },
    'knowledge|CATEGORY|ETUDE_CAS': { fr: 'Étude de cas', en: 'Case Study', es: 'Estudio de caso', pt: 'Estudo de caso' },
    'knowledge|CATEGORY|QUESTION_METIER': { fr: 'Question fréquente métier', en: 'Common Business Question', es: 'Pregunta de negocio común', pt: 'Pergunta de negócio comum' },

    // KNOWLEDGE - Target Audience
    'knowledge|TARGET_AUDIENCE|ALL': { fr: 'Tous', en: 'All', es: 'Todos', pt: 'Todos' },
    'knowledge|TARGET_AUDIENCE|SUPPORT': { fr: 'Support', en: 'Support', es: 'Soporte', pt: 'Suporte' },
    'knowledge|TARGET_AUDIENCE|BUSINESS': { fr: 'Métier', en: 'Business', es: 'Negocio', pt: 'Negócio' },
    'knowledge|TARGET_AUDIENCE|TECHNICAL': { fr: 'Technique', en: 'Technical', es: 'Técnico', pt: 'Técnico' },
    'knowledge|TARGET_AUDIENCE|PROJECT': { fr: 'Projet', en: 'Project', es: 'Proyecto', pt: 'Projeto' },

    // KNOWLEDGE - Confidentiality Levels
    'knowledge|CONFIDENTIALITY_LEVEL|PUBLIC': { fr: 'Public', en: 'Public', es: 'Público', pt: 'Público' },
    'knowledge|CONFIDENTIALITY_LEVEL|INTERNAL': { fr: 'Interne', en: 'Internal', es: 'Interno', pt: 'Interno' },
    'knowledge|CONFIDENTIALITY_LEVEL|INTERNAL_RESTRICTED': { fr: 'Interne Restreint', en: 'Internal Restricted', es: 'Interno Restringido', pt: 'Interno Restrito' },
    'knowledge|CONFIDENTIALITY_LEVEL|CONFIDENTIAL': { fr: 'Confidentiel', en: 'Confidential', es: 'Confidencial', pt: 'Confidencial' },
    'knowledge|CONFIDENTIALITY_LEVEL|CONFIDENTIAL_HR': { fr: 'Confidentiel RH', en: 'HR Confidential', es: 'Confidencial RRHH', pt: 'Confidencial RH' },
    'knowledge|CONFIDENTIALITY_LEVEL|SECRET': { fr: 'Secret', en: 'Secret', es: 'Secreto', pt: 'Secreto' },
    'knowledge|CONFIDENTIALITY_LEVEL|TOP_SECRET': { fr: 'Très Secret', en: 'Top Secret', es: 'Alto Secreto', pt: 'Altamente Secreto' },
    'knowledge|CONFIDENTIALITY_LEVEL|SENSITIVE_PERSONAL_DATA': { fr: 'Données personnelles sensibles', en: 'Sensitive Personal Data', es: 'Datos personales sensibles', pt: 'Dados pessoais sensíveis' },
    'knowledge|CONFIDENTIALITY_LEVEL|REGULATED_INFO': { fr: 'Informations réglementées (GDPR/PII)', en: 'Regulated Information (GDPR/PII)', es: 'Información regulada (GDPR/PII)', pt: 'Informação regulamentada (GDPR/PII)' },
    'knowledge|CONFIDENTIALITY_LEVEL|INTELLECTUAL_PROPERTY': { fr: 'Propriété intellectuelle', en: 'Intellectual Property', es: 'Propiedad intelectual', pt: 'Propriedade intelectual' },

    // KNOWLEDGE - Business Scope
    'knowledge|BUSINESS_SCOPE|CORE_BUSINESS': { fr: 'Core Business Process', en: 'Core Business Process', es: 'Proceso de negocio principal', pt: 'Processo de negócio principal' },
    'knowledge|BUSINESS_SCOPE|REVENUE_SERVICE': { fr: 'Revenue Generating Service', en: 'Revenue Generating Service', es: 'Servicio generador de ingresos', pt: 'Serviço gerador de receita' },
    'knowledge|BUSINESS_SCOPE|CUSTOMER_PORTAL': { fr: 'Customer-Facing Portal', en: 'Customer-Facing Portal', es: 'Portal orientado al cliente', pt: 'Portal voltado ao cliente' },
    'knowledge|BUSINESS_SCOPE|FIELD_OPERATIONS': { fr: 'Field Operations Support', en: 'Field Operations Support', es: 'Soporte de operaciones de campo', pt: 'Suporte de operações de campo' },
    'knowledge|BUSINESS_SCOPE|EMPLOYEE_PRODUCTIVITY': { fr: 'Employee Productivity Tool', en: 'Employee Productivity Tool', es: 'Herramienta de productividad', pt: 'Ferramenta de produtividade' },
    'knowledge|BUSINESS_SCOPE|REGULATORY': { fr: 'Regulatory & Compliance', en: 'Regulatory & Compliance', es: 'Regulatorio y cumplimiento', pt: 'Regulatório e conformidade' },
    'knowledge|BUSINESS_SCOPE|SECURITY_CONTROL': { fr: 'Information Security Control', en: 'Information Security Control', es: 'Control de seguridad', pt: 'Controle de segurança' },
    'knowledge|BUSINESS_SCOPE|DATA_PROTECTION': { fr: 'Data Protection / GDPR', en: 'Data Protection / GDPR', es: 'Protección de datos / GDPR', pt: 'Proteção de dados / GDPR' },
    'knowledge|BUSINESS_SCOPE|SHARED_SERVICE': { fr: 'Enterprise Shared Service', en: 'Enterprise Shared Service', es: 'Servicio compartido', pt: 'Serviço compartilhado' },
    'knowledge|BUSINESS_SCOPE|DEPARTMENT_SPECIFIC': { fr: 'Department-Specific Function', en: 'Department-Specific Function', es: 'Función específica del departamento', pt: 'Função específica do departamento' },
    'knowledge|BUSINESS_SCOPE|BACK_OFFICE': { fr: 'Back-Office Automation', en: 'Back-Office Automation', es: 'Automatización de back-office', pt: 'Automação de back-office' },
    'knowledge|BUSINESS_SCOPE|TEST_ENVIRONMENT': { fr: 'Testing / Staging Environment', en: 'Testing / Staging Environment', es: 'Entorno de pruebas', pt: 'Ambiente de testes' },
    'knowledge|BUSINESS_SCOPE|OPTIONAL_ENHANCEMENT': { fr: 'Optional Enhancement', en: 'Optional Enhancement', es: 'Mejora opcional', pt: 'Melhoria opcional' },
    'knowledge|BUSINESS_SCOPE|TRAINING': { fr: 'Training & Onboarding', en: 'Training & Onboarding', es: 'Formación e incorporación', pt: 'Treinamento e integração' },
    'knowledge|BUSINESS_SCOPE|LEGACY_MAINTENANCE': { fr: 'Legacy System Maintenance', en: 'Legacy System Maintenance', es: 'Mantenimiento de sistemas legacy', pt: 'Manutenção de sistemas legados' },

    // ========================================
    // SERVICE - Business Criticality
    // ========================================
    'service|BUSINESS_CRITICALITY|CRITICAL': { fr: 'Critique', en: 'Critical', es: 'Crítico', pt: 'Crítico' },
    'service|BUSINESS_CRITICALITY|HIGH': { fr: 'Élevée', en: 'High', es: 'Alta', pt: 'Alta' },
    'service|BUSINESS_CRITICALITY|MEDIUM': { fr: 'Moyenne', en: 'Medium', es: 'Media', pt: 'Média' },
    'service|BUSINESS_CRITICALITY|LOW': { fr: 'Faible', en: 'Low', es: 'Baja', pt: 'Baixa' },

    // SERVICE - Impact Levels
    'service|IMPACT_LEVEL|CRITICAL': { fr: 'Critique', en: 'Critical', es: 'Crítico', pt: 'Crítico' },
    'service|IMPACT_LEVEL|HIGH': { fr: 'Élevé', en: 'High', es: 'Alto', pt: 'Alto' },
    'service|IMPACT_LEVEL|MEDIUM': { fr: 'Moyen', en: 'Medium', es: 'Medio', pt: 'Médio' },
    'service|IMPACT_LEVEL|LOW': { fr: 'Faible', en: 'Low', es: 'Bajo', pt: 'Baixo' },
    'service|IMPACT_LEVEL|NONE': { fr: 'Aucun', en: 'None', es: 'Ninguno', pt: 'Nenhum' },

    // ========================================
    // SERVICE OFFERING - Environment
    // ========================================
    'service_offering|ENVIRONMENT|PRODUCTION': { fr: 'Production', en: 'Production', es: 'Producción', pt: 'Produção' },
    'service_offering|ENVIRONMENT|STAGING': { fr: 'Pré-production', en: 'Staging', es: 'Preproducción', pt: 'Pré-produção' },
    'service_offering|ENVIRONMENT|TEST': { fr: 'Test', en: 'Test', es: 'Prueba', pt: 'Teste' },
    'service_offering|ENVIRONMENT|DEVELOPMENT': { fr: 'Développement', en: 'Development', es: 'Desarrollo', pt: 'Desenvolvimento' },
    'service_offering|ENVIRONMENT|SANDBOX': { fr: 'Bac à sable', en: 'Sandbox', es: 'Sandbox', pt: 'Sandbox' },

    // SERVICE OFFERING - Price Model
    'service_offering|PRICE_MODEL|FREE': { fr: 'Gratuit', en: 'Free', es: 'Gratis', pt: 'Gratuito' },
    'service_offering|PRICE_MODEL|FLAT_RATE': { fr: 'Forfait', en: 'Flat Rate', es: 'Tarifa plana', pt: 'Taxa fixa' },
    'service_offering|PRICE_MODEL|PER_USER': { fr: 'Par utilisateur', en: 'Per User', es: 'Por usuario', pt: 'Por usuário' },
    'service_offering|PRICE_MODEL|PER_USAGE': { fr: 'À l\'usage', en: 'Per Usage', es: 'Por uso', pt: 'Por uso' },
    'service_offering|PRICE_MODEL|TIERED': { fr: 'Par paliers', en: 'Tiered', es: 'Por niveles', pt: 'Por níveis' },
    'service_offering|PRICE_MODEL|CUSTOM': { fr: 'Personnalisé', en: 'Custom', es: 'Personalizado', pt: 'Personalizado' },

    // SERVICE OFFERING - Currency
    'service_offering|CURRENCY|EUR': { fr: 'Euro (€)', en: 'Euro (€)', es: 'Euro (€)', pt: 'Euro (€)' },
    'service_offering|CURRENCY|USD': { fr: 'Dollar US ($)', en: 'US Dollar ($)', es: 'Dólar US ($)', pt: 'Dólar US ($)' },
    'service_offering|CURRENCY|GBP': { fr: 'Livre Sterling (£)', en: 'British Pound (£)', es: 'Libra esterlina (£)', pt: 'Libra esterlina (£)' },
    'service_offering|CURRENCY|CHF': { fr: 'Franc Suisse (CHF)', en: 'Swiss Franc (CHF)', es: 'Franco suizo (CHF)', pt: 'Franco suíço (CHF)' },
  };

  // Get all object_setup records to get their UUIDs
  const objectSetupRecords = await prisma.object_setup.findMany();
  const uuidMap = {};
  for (const record of objectSetupRecords) {
    const key = `${record.object_type}|${record.metadata}|${record.code}`;
    uuidMap[key] = record.uuid;
  }

  // Insert translations
  let translationsCreated = 0;
  for (const [key, locales] of Object.entries(translations)) {
    const uuid = uuidMap[key];
    if (!uuid) {
      console.warn(`  Warning: No object_setup record found for key: ${key}`);
      continue;
    }

    for (const [locale, value] of Object.entries(locales)) {
      await prisma.translated_fields.upsert({
        where: {
          entity_type_entity_uuid_field_name_locale: {
            entity_type: 'object_setup',
            entity_uuid: uuid,
            field_name: 'label',
            locale: locale,
          },
        },
        update: { value },
        create: {
          entity_type: 'object_setup',
          entity_uuid: uuid,
          field_name: 'label',
          locale: locale,
          value: value,
        },
      });
      translationsCreated++;
    }
  }

  console.log(`Object setup translations seeding completed: ${translationsCreated} translations`);
}

module.exports = { seedObjectSetup };
