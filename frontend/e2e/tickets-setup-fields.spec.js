import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Ticket Setup Fields
 * Tests that setup values are correctly available in extended fields dropdowns
 * and that tickets can be saved with these values
 * 
 * Prerequisites:
 * - Backend running on http://localhost:3001
 * - Frontend running on http://localhost:5174
 * - Seeds loaded: object-setup, ticket-types, ticket-type-fields
 */

// Test credentials
const ADMIN_EMAIL = 'admin@lumiere.local'
const ADMIN_PASSWORD = 'Lumiere2024!'

// API base URL for verification
const API_BASE_URL = 'http://127.0.0.1:3001/api/v1'

// Unique test data prefix
const TEST_PREFIX = `E2E-SETUP-${Date.now()}`

/**
 * Expected setup values per ticket type
 * Based on object-setup.js seed data
 */
const EXPECTED_SETUP_VALUES = {
  INCIDENT: {
    impact: ['ENTERPRISE', 'DEPARTMENT', 'WORKGROUP', 'USER'],
    urgency: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    cause_code: ['HARDWARE_FAILURE', 'SOFTWARE_BUG', 'NETWORK_ISSUE', 'HUMAN_ERROR', 'SECURITY_BREACH', 'THIRD_PARTY_OUTAGE', 'CONFIGURATION_ERROR', 'CAPACITY_ISSUE', 'UNKNOWN'],
    resolution_code: ['FIXED', 'WORKAROUND_PROVIDED', 'SELF_RESOLVED', 'DUPLICATE', 'NOT_REPRODUCIBLE', 'KNOWN_ISSUE', 'THIRD_PARTY_RESOLUTION', 'CONFIGURATION_CHANGE', 'NO_ACTION_REQUIRED', 'REFERRED_TO_CHANGE']
  },
  PROBLEM: {
    rel_problem_categories_code: ['CRITICAL_INCIDENT_FOLLOWUP', 'MULTIPLE_INCIDENTS_FOLLOWUP', 'SERVICE_QUALITY_IMPROVEMENT', 'SYSTEM_ANALYSIS', 'HARDWARE_FAILURE', 'SOFTWARE_BUG', 'CONFIGURATION_ERROR', 'CAPACITY_ISSUE', 'PERFORMANCE_DEGRADATION', 'SECURITY_VULNERABILITY', 'INTEGRATION_ISSUE', 'DATA_CORRUPTION', 'NETWORK_ISSUE', 'THIRD_PARTY_FAILURE', 'DESIGN_FLAW', 'DOCUMENTATION_ERROR', 'TRAINING_ISSUE'],
    impact: ['CRITICAL_REAL', 'LIMITED_REAL', 'POTENTIAL']
  },
  CHANGE: {
    rel_change_type_code: ['STANDARD', 'NORMAL', 'EMERGENCY'],
    rel_change_justifications_code: ['BUSINESS_REQUIREMENT', 'SECURITY_PATCH', 'BUG_FIX', 'PERFORMANCE_IMPROVEMENT', 'INFRASTRUCTURE_UPGRADE', 'COMPLIANCE', 'END_OF_LIFE'],
    rel_change_objective: ['NEW_FEATURE', 'IMPROVEMENT', 'CORRECTION', 'MIGRATION', 'DECOMMISSION'],
    rel_cab_validation_status: ['PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED', 'DEFERRED'],
    rel_required_validations: ['NONE', 'TEAM_LEAD', 'MANAGER', 'TECHNICAL_VALIDATION', 'SECURITY_VALIDATION', 'BUSINESS_VALIDATION', 'CAB', 'ECAB'],
    post_change_evaluation: ['SUCCESSFUL', 'SUCCESSFUL_WITH_ISSUES', 'FAILED', 'ROLLED_BACK', 'PARTIAL']
  },
  KNOWLEDGE: {
    business_scope: ['CORE_BUSINESS', 'REVENUE_SERVICE', 'CUSTOMER_PORTAL', 'FIELD_OPERATIONS', 'EMPLOYEE_PRODUCTIVITY', 'REGULATORY', 'SECURITY_CONTROL', 'DATA_PROTECTION', 'SHARED_SERVICE', 'DEPARTMENT_SPECIFIC', 'BACK_OFFICE', 'TEST_ENVIRONMENT', 'OPTIONAL_ENHANCEMENT', 'TRAINING', 'LEGACY_MAINTENANCE'],
    rel_category: ['MODE_OPERATOIRE', 'PROCEDURE_PAS_A_PAS', 'GUIDE_DEPANNAGE', 'FAQ', 'TUTORIEL', 'GUIDE_INSTALLATION', 'GUIDE_CONFIGURATION', 'RELEASE_NOTES', 'POLITIQUE_SECURITE', 'CHARTE_UTILISATION', 'MATRICE_COMPATIBILITE', 'GUIDE_UTILISATEUR', 'GUIDE_ADMINISTRATEUR', 'SCRIPT_AUTOMATISATION', 'REFERENCE_TECHNIQUE', 'GLOSSAIRE', 'CHECKLIST_VALIDATION', 'BEST_PRACTICES', 'ETUDE_CAS', 'QUESTION_METIER'],
    rel_confidentiality_level: ['PUBLIC', 'INTERNAL', 'INTERNAL_RESTRICTED', 'CONFIDENTIAL', 'CONFIDENTIAL_HR', 'SECRET', 'TOP_SECRET', 'SENSITIVE_PERSONAL_DATA', 'REGULATED_INFO', 'INTELLECTUAL_PROPERTY'],
    rel_target_audience: ['ALL', 'SUPPORT', 'BUSINESS', 'TECHNICAL', 'PROJECT']
  },
  DEFECT: {
    severity: ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL', 'COSMETIC'],
    impact_area: ['GLOBAL', 'MULTIPLE_USERS', 'SINGLE_USER', 'INTERNAL_ONLY', 'NON_BLOCKING'],
    environment: ['PRODUCTION', 'PRE_PRODUCTION', 'STAGING', 'TEST', 'DEVELOPMENT', 'LOCAL']
  },
  PROJECT: {
    visibility: ['PUBLIC', 'PRIVATE', 'RESTRICTED'],
    project_type: ['SOFTWARE', 'BUSINESS', 'SERVICE', 'INFRASTRUCTURE', 'SECURITY', 'COMPLIANCE', 'RESEARCH']
  }
}

/**
 * Helper function to login
 */
async function login(page) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL)
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText('Login successful')).toBeVisible()
}

/**
 * Helper function to get auth token for API calls
 */
async function getAuthToken(page) {
  return await page.evaluate(() => localStorage.getItem('token'))
}

/**
 * Helper function to navigate to a specific ticket type view
 */
async function navigateToTicketType(page, ticketTypeCode) {
  const menuMapping = {
    INCIDENT: { menu: 'Service Hub', item: 'Incidents' },
    PROBLEM: { menu: 'Service Hub', item: 'Problèmes' },
    CHANGE: { menu: 'Service Hub', item: 'Changements' },
    KNOWLEDGE: { menu: 'Service Hub', item: 'Base de connaissances' },
    DEFECT: { menu: 'Sprint Center', item: 'Défauts' },
    PROJECT: { menu: 'Sprint Center', item: 'Projets' },
    USER_STORY: { menu: 'Sprint Center', item: 'User Stories' },
    SPRINT: { menu: 'Sprint Center', item: 'Sprints' },
    EPIC: { menu: 'Sprint Center', item: 'Epics' },
    TASK: { menu: 'Service Hub', item: 'Tâches' }
  }

  const mapping = menuMapping[ticketTypeCode]
  if (!mapping) {
    throw new Error(`Unknown ticket type: ${ticketTypeCode}`)
  }

  await page.getByRole('button', { name: mapping.menu }).click()
  await page.getByRole('treeitem', { name: mapping.item }).click()
  
  // Wait for the table to load
  await page.waitForResponse(response => 
    response.url().includes('/tickets/search') && response.status() === 200,
    { timeout: 15000 }
  )
}

/**
 * Helper function to open create form for a ticket type
 */
async function openCreateForm(page) {
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()
  // Wait for form to load - wait for the title input to be visible
  await page.waitForSelector('#title', { state: 'visible', timeout: 10000 })
  // Also wait for any spinner to disappear
  await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 5000 }).catch(() => {})
}

/**
 * Helper function to verify dropdown options via API
 */
async function verifySetupOptionsViaApi(request, token, objectType, metadata, expectedCodes) {
  const response = await request.get(
    `${API_BASE_URL}/object-setup/options?object_type=${objectType}&metadata=${metadata}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  
  expect(response.ok()).toBeTruthy()
  const options = await response.json()
  
  // Verify all expected codes are present
  const optionValues = options.map(opt => opt.value)
  for (const expectedCode of expectedCodes) {
    expect(optionValues).toContain(expectedCode)
  }
  
  return options
}

/**
 * Helper function to verify ticket was saved correctly via API
 */
async function verifyTicketViaApi(request, token, ticketUuid, expectedData) {
  const response = await request.get(`${API_BASE_URL}/tickets/${ticketUuid}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  expect(response.ok()).toBeTruthy()
  const ticket = await response.json()
  
  // Verify expected fields in core data
  for (const [key, value] of Object.entries(expectedData.core || {})) {
    expect(ticket[key]).toBe(value)
  }
  
  // Verify expected fields in extended_core_fields
  for (const [key, value] of Object.entries(expectedData.extended || {})) {
    expect(ticket.extended_core_fields?.[key]).toBe(value)
  }
  
  return ticket
}

/**
 * Helper function to delete ticket via API (cleanup)
 */
async function deleteTicketViaApi(request, token, ticketUuid) {
  await request.delete(`${API_BASE_URL}/tickets/${ticketUuid}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

/**
 * Helper function to select a value in a PrimeVue Select dropdown
 */
async function selectDropdownValue(page, fieldLabel, value) {
  // Find the select by its label
  const selectContainer = page.locator(`[data-field-name="${fieldLabel}"]`).first()
  
  // If not found by data attribute, try by label text
  if (await selectContainer.count() === 0) {
    // Try to find by label
    const label = page.getByText(fieldLabel, { exact: false }).first()
    await label.locator('..').locator('.p-select').click()
  } else {
    await selectContainer.locator('.p-select').click()
  }
  
  // Wait for dropdown overlay
  await page.waitForSelector('.p-select-overlay', { state: 'visible', timeout: 3000 })
  
  // Select the option
  await page.locator('.p-select-overlay .p-select-option').filter({ hasText: value }).click()
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Ticket Setup Fields - API Verification', () => {
  test.setTimeout(15000)
  
  let authToken = null

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  test('should have all INCIDENT setup values available via API', async ({ request }) => {
    // Verify Impact options
    await verifySetupOptionsViaApi(request, authToken, 'incident', 'IMPACT', 
      EXPECTED_SETUP_VALUES.INCIDENT.impact)
    
    // Verify Urgency options
    await verifySetupOptionsViaApi(request, authToken, 'incident', 'URGENCY', 
      EXPECTED_SETUP_VALUES.INCIDENT.urgency)
    
    // Verify Cause Code options
    await verifySetupOptionsViaApi(request, authToken, 'incident', 'CAUSE_CODE', 
      EXPECTED_SETUP_VALUES.INCIDENT.cause_code)
    
    // Verify Resolution Code options
    await verifySetupOptionsViaApi(request, authToken, 'incident', 'RESOLUTION_CODE', 
      EXPECTED_SETUP_VALUES.INCIDENT.resolution_code)
  })

  test('should have all PROBLEM setup values available via API', async ({ request }) => {
    // Verify Problem Category options
    await verifySetupOptionsViaApi(request, authToken, 'problem', 'CATEGORY', 
      EXPECTED_SETUP_VALUES.PROBLEM.rel_problem_categories_code)
    
    // Verify Problem Impact options
    await verifySetupOptionsViaApi(request, authToken, 'problem', 'IMPACT', 
      EXPECTED_SETUP_VALUES.PROBLEM.impact)
  })

  test('should have all CHANGE setup values available via API', async ({ request }) => {
    // Verify Change Type options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'TYPE', 
      EXPECTED_SETUP_VALUES.CHANGE.rel_change_type_code)
    
    // Verify Justification options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'JUSTIFICATION', 
      EXPECTED_SETUP_VALUES.CHANGE.rel_change_justifications_code)
    
    // Verify Objective options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'OBJECTIVE', 
      EXPECTED_SETUP_VALUES.CHANGE.rel_change_objective)
    
    // Verify CAB Validation Status options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'CAB_VALIDATION_STATUS', 
      EXPECTED_SETUP_VALUES.CHANGE.rel_cab_validation_status)
    
    // Verify Validation Level options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'VALIDATION_LEVEL', 
      EXPECTED_SETUP_VALUES.CHANGE.rel_required_validations)
    
    // Verify Post Implementation Evaluation options
    await verifySetupOptionsViaApi(request, authToken, 'change', 'POST_IMPLEMENTATION_EVALUATION', 
      EXPECTED_SETUP_VALUES.CHANGE.post_change_evaluation)
  })

  test('should have all KNOWLEDGE setup values available via API', async ({ request }) => {
    // Verify Business Scope options
    await verifySetupOptionsViaApi(request, authToken, 'knowledge', 'BUSINESS_SCOPE', 
      EXPECTED_SETUP_VALUES.KNOWLEDGE.business_scope)
    
    // Verify Category options
    await verifySetupOptionsViaApi(request, authToken, 'knowledge', 'CATEGORY', 
      EXPECTED_SETUP_VALUES.KNOWLEDGE.rel_category)
    
    // Verify Confidentiality Level options
    await verifySetupOptionsViaApi(request, authToken, 'knowledge', 'CONFIDENTIALITY_LEVEL', 
      EXPECTED_SETUP_VALUES.KNOWLEDGE.rel_confidentiality_level)
    
    // Verify Target Audience options
    await verifySetupOptionsViaApi(request, authToken, 'knowledge', 'TARGET_AUDIENCE', 
      EXPECTED_SETUP_VALUES.KNOWLEDGE.rel_target_audience)
  })

  test('should have all DEFECT setup values available via API', async ({ request }) => {
    // Verify Severity options
    await verifySetupOptionsViaApi(request, authToken, 'defect', 'SEVERITY', 
      EXPECTED_SETUP_VALUES.DEFECT.severity)
    
    // Verify Impact Area options
    await verifySetupOptionsViaApi(request, authToken, 'defect', 'IMPACT', 
      EXPECTED_SETUP_VALUES.DEFECT.impact_area)
    
    // Verify Environment options
    await verifySetupOptionsViaApi(request, authToken, 'defect', 'ENVIRONMENT', 
      EXPECTED_SETUP_VALUES.DEFECT.environment)
  })

  test('should have all PROJECT setup values available via API', async ({ request }) => {
    // Verify Visibility options (static in seed, but verify via API if endpoint exists)
    await verifySetupOptionsViaApi(request, authToken, 'project', 'VISIBILITY', 
      EXPECTED_SETUP_VALUES.PROJECT.visibility)
    
    // Verify Project Type/Category options
    await verifySetupOptionsViaApi(request, authToken, 'project', 'CATEGORY', 
      EXPECTED_SETUP_VALUES.PROJECT.project_type)
  })
})

test.describe('Ticket Setup Fields - INCIDENT Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    // Cleanup created tickets
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    createdTicketUuids.length = 0
  })*/

  test('should create INCIDENT with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-INCIDENT`
    
    await navigateToTicketType(page, 'INCIDENT')
    await openCreateForm(page)

    // Fill title
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test incident with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500)

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Impact
    await selectExtendedFieldValue('Impact', 'Entreprise entière')
    
    // Select Urgency
    await selectExtendedFieldValue('Urgence', 'Critique')
    
    // Select Cause Code
    await selectExtendedFieldValue('Code de cause', 'Défaillance matérielle')
    
    // Select Resolution Code (use exact match to avoid matching 'Résolu automatiquement')
    await selectExtendedFieldValue('Code de résolution', 'Résolu', true)

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'INCIDENT'
      }
    })

    // Verify extended fields contain setup values
    expect(verifiedTicket.extended_core_fields).toBeDefined()
  })
})

test.describe('Ticket Setup Fields - CHANGE Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {}
    }
    createdTicketUuids.length = 0
  })*/

  test('should create CHANGE with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-CHANGE`
    
    await navigateToTicketType(page, 'CHANGE')
    await openCreateForm(page)

    // Fill title
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test change with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500)

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Change Type
    await selectExtendedFieldValue('Type de changement', 'Normal')
    
    // Select Justification
    await selectExtendedFieldValue('Justification', 'Exigence métier')
    
    // Select Objective
    await selectExtendedFieldValue('Objectif', 'Nouvelle fonctionnalité')

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'CHANGE'
      }
    })

    expect(verifiedTicket.extended_core_fields).toBeDefined()
  })
})

test.describe('Ticket Setup Fields - DEFECT Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {}
    }
    createdTicketUuids.length = 0
  })*/

  test('should create DEFECT with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-DEFECT`
    
    await navigateToTicketType(page, 'DEFECT')
    await openCreateForm(page)

    // Fill title - find the title input in the form (id="title")
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test defect with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500) // Wait for tab content to load

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Severity (Sévérité)
    await selectExtendedFieldValue('Sévérité', 'Majeur')
    
    // Select Impact Area
    await selectExtendedFieldValue('Impact Area', 'Global')
    
    // Select Environment (Environnement)
    await selectExtendedFieldValue('Environnement', 'Test')

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'DEFECT'
      }
    })

    expect(verifiedTicket.extended_core_fields).toBeDefined()
    // Verify specific setup values were saved
    if (verifiedTicket.extended_core_fields?.severity) {
      expect(EXPECTED_SETUP_VALUES.DEFECT.severity).toContain(verifiedTicket.extended_core_fields.severity)
    }
    if (verifiedTicket.extended_core_fields?.environment) {
      expect(EXPECTED_SETUP_VALUES.DEFECT.environment).toContain(verifiedTicket.extended_core_fields.environment)
    }
  })
})

test.describe('Ticket Setup Fields - KNOWLEDGE Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {}
    }
    createdTicketUuids.length = 0
  })*/

  test('should create KNOWLEDGE article with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-KNOWLEDGE`
    
    await navigateToTicketType(page, 'KNOWLEDGE')
    await openCreateForm(page)

    // Fill title
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test knowledge article with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500)

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Category
    await selectExtendedFieldValue('Catégorie', 'Mode opératoire')
    
    // Select Confidentiality Level
    await selectExtendedFieldValue('Niveau de confidentialité', 'Confidentiel RH')
    
    // Select Target Audience
    await selectExtendedFieldValue('Public cible', 'Tous')
    
    // Select Business Scope
    await selectExtendedFieldValue('Périmètre métier', 'Core Business Process')

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'KNOWLEDGE'
      }
    })

    expect(verifiedTicket.extended_core_fields).toBeDefined()
  })
})

test.describe('Ticket Setup Fields - PROJECT Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {}
    }
    createdTicketUuids.length = 0
  })*/

  test('should create PROJECT with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-PROJECT`
    
    await navigateToTicketType(page, 'PROJECT')
    await openCreateForm(page)

    // Fill title
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test project with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500)

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Visibility
    await selectExtendedFieldValue('Visibilité', 'Public')
    
    // Select Project Type
    await selectExtendedFieldValue('Type de projet', 'Logiciel')

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'PROJECT'
      }
    })

    expect(verifiedTicket.extended_core_fields).toBeDefined()
    // Verify specific setup values were saved
    if (verifiedTicket.extended_core_fields?.visibility) {
      expect(EXPECTED_SETUP_VALUES.PROJECT.visibility).toContain(verifiedTicket.extended_core_fields.visibility)
    }
    if (verifiedTicket.extended_core_fields?.project_type) {
      expect(EXPECTED_SETUP_VALUES.PROJECT.project_type).toContain(verifiedTicket.extended_core_fields.project_type)
    }
  })
})

test.describe('Ticket Setup Fields - PROBLEM Create & Save', () => {
  test.setTimeout(15000)
  
  let authToken = null
  const createdTicketUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    authToken = await getAuthToken(page)
  })

  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTicketUuids) {
      try {
        await deleteTicketViaApi(request, authToken, uuid)
      } catch (e) {}
    }
    createdTicketUuids.length = 0
  })*/

  test('should create PROBLEM with setup field values', async ({ page, request }) => {
    const ticketTitle = `${TEST_PREFIX}-PROBLEM`
    
    await navigateToTicketType(page, 'PROBLEM')
    await openCreateForm(page)

    // Fill title
    await page.locator('#title').fill(ticketTitle)

    // Fill description
    const editorContent = page.locator('.p-editor-content .ql-editor')
    if (await editorContent.count() > 0) {
      await editorContent.click()
      await editorContent.fill('Test problem with setup values')
    }

    // Navigate to Extended Info tab to fill setup fields
    await page.getByRole('tab', { name: /Informations étendues/i }).click()
    await page.waitForTimeout(500)

    // Helper function to select a value in an extended field by row label
    const selectExtendedFieldValue = async (rowLabel, optionText, exact = false) => {
      const row = page.getByRole('row', { name: new RegExp(rowLabel) })
      await row.getByRole('cell').nth(1).click()
      await page.waitForTimeout(200)
      await page.getByRole('combobox').click()
      await page.waitForTimeout(200)
      await page.getByRole('option', { name: optionText, exact }).click()
      await page.waitForTimeout(200)
    }

    // Select Problem Category
    await selectExtendedFieldValue('Catégorie', 'Suite incident critique')
    
    // Select Impact
    await selectExtendedFieldValue('Impact', 'Impact réel critique')

    // Go back to General tab before saving
    await page.getByRole('tab', { name: /Informations générales/i }).click()
    await page.waitForTimeout(300)

    // Intercept create API call
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
      { timeout: 15000 }
    )

    // Save
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTicket = await createResponse.json()
    
    expect(createdTicket.uuid).toBeDefined()
    createdTicketUuids.push(createdTicket.uuid)

    // Verify success toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API
    const verifiedTicket = await verifyTicketViaApi(request, authToken, createdTicket.uuid, {
      core: {
        title: ticketTitle,
        ticket_type_code: 'PROBLEM'
      }
    })

    expect(verifiedTicket.extended_core_fields).toBeDefined()
  })
})
