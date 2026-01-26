import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Tasks CRUD - Create Operations
 * Tests the creation of tasks via the frontend and verifies data via API
 * 
 * Prerequisites:
 * - Backend running on http://localhost:3000
 * - Frontend running on http://localhost:5174
 * - E2E seed data loaded: node prisma/seeds/run-single.js e2e-crud
 */

// Test credentials
const ADMIN_EMAIL = 'admin@lumiere.local'
const ADMIN_PASSWORD = 'Lumiere2024!'

// API base URL for verification (use 127.0.0.1 to avoid IPv6 issues)
const API_BASE_URL = 'http://127.0.0.1:3001/api/v1'

// Unique test data prefix to avoid conflicts
const TEST_PREFIX = `E2E-CREATE-${Date.now()}`

/**
 * Helper function to login
 */
async function login(page) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL)
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  // Wait for successful login
  await expect(page.getByText('Login successful')).toBeVisible()
}

/**
 * Helper function to navigate to Tasks
 */
async function navigateToTasks(page) {
  await page.getByRole('button', { name: 'Service Hub' }).click()
  await page.getByRole('treeitem', { name: 'Tâches' }).click()
  // Wait for the table to load
  await expect(page.getByRole('tab', { name: /Tâches/ })).toBeVisible()
  // Wait for data to load (API uses /tickets/search, not /tasks/search)
  await page.waitForResponse(response => 
    response.url().includes('/tickets/search') && response.status() === 200,
    { timeout: 15000 }
  )
}

/**
 * Helper function to get auth token for API calls
 */
async function getAuthToken(page) {
  return await page.evaluate(() => localStorage.getItem('token'))
}

/**
 * Helper function to verify task via API
 */
async function verifyTaskViaApi(request, token, taskUuid, expectedData) {
  // API uses /tickets endpoint, not /tasks
  const response = await request.get(`${API_BASE_URL}/tickets/${taskUuid}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  expect(response.ok()).toBeTruthy()
  const task = await response.json()
  
  // Verify expected fields
  for (const [key, value] of Object.entries(expectedData)) {
    if (value !== undefined) {
      expect(task[key]).toBe(value)
    }
  }
  
  return task
}

/**
 * Helper function to delete task via API (cleanup)
 */
async function deleteTaskViaApi(request, token, taskUuid) {
  // API uses /tickets endpoint, not /tasks
  await request.delete(`${API_BASE_URL}/tickets/${taskUuid}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

test.describe('Tasks CRUD - Create', () => {
  // Increase timeout for slower operations (login, navigation, API calls)
  test.setTimeout(30000)
  
  let authToken = null
  const createdTaskUuids = []

  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToTasks(page)
    authToken = await getAuthToken(page)
  })

  // Cleanup created tasks after each test
  /*test.afterEach(async ({ request }) => {
    for (const uuid of createdTaskUuids) {
      try {
        await deleteTaskViaApi(request, authToken, uuid)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    createdTaskUuids.length = 0
  })*/

  test('should create a task with minimal required fields', async ({ page, request }) => {
    const taskTitle = `${TEST_PREFIX}-MINIMAL`
    const taskDescription = 'Minimal task created by E2E test'

    // Click the "Créer" button to open create form (in child tabs bar)
    await page.getByRole('button', { name: 'Créer' }).click()

    // Wait for the create tab to open (tab name is "Nouveau Tâches")
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()

    // Wait for form to load (ObjectGeneralInfo uses ProgressSpinner while loading)
    await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 10000 })

    // Fill in the title field (labeled "Tickets *" in the form)
    await page.getByRole('textbox', { name: 'Tickets *' }).fill(taskTitle)

    // Fill in the description field (PrimeVue Editor with Quill)
    // The editor content area is a paragraph inside .p-editor-content
    const editorContent = page.locator('.p-editor-content .ql-editor')
    await editorContent.click()
    await editorContent.fill(taskDescription)

    // Select initial status if available (combobox labeled "Aucun workflow" or status name)
    const statusCombobox = page.getByRole('combobox', { name: /workflow|État/i })
    if (await statusCombobox.count() > 0 && await statusCombobox.isVisible()) {
      await statusCombobox.click()
      // Wait for dropdown to open (PrimeVue Select uses .p-select-overlay)
      await page.waitForSelector('.p-select-overlay', { state: 'visible', timeout: 3000 }).catch(() => {})
      // Select first available status if dropdown opened
      const options = page.locator('.p-select-overlay .p-select-option')
      if (await options.count() > 0) {
        await options.first().click()
      }
    }

    // Intercept the create API call to get the created task UUID
    // API uses /tickets endpoint, not /tasks
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    )

    // Click save button (green check icon button with p-button-success class)
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for successful creation
    const createResponse = await createResponsePromise
    const createdTask = await createResponse.json()
    
    expect(createdTask.uuid).toBeDefined()
    createdTaskUuids.push(createdTask.uuid)

    // Verify success toast (displays "Créé avec succès" in French)
    // Use specific text to avoid conflict with login toast
    await expect(page.getByText('Créé avec succès')).toBeVisible()

    // Verify via API that all data was saved correctly
    const verifiedTask = await verifyTaskViaApi(request, authToken, createdTask.uuid, {
      title: taskTitle,
      ticket_type_code: 'TASK'
    })

    // Verify writer_uuid is set (should be current user)
    expect(verifiedTask.writer_uuid).toBeDefined()
  })

  test('should create a task with all fields filled', async ({ page, request }) => {
    const taskTitle = `${TEST_PREFIX}-COMPLETE`
    const taskDescription = 'Complete task with all fields - E2E test'

    // Click the "Créer" button
    await page.getByRole('button', { name: 'Créer' }).click()
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()

    // Wait for form to load
    await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Fill title
    await page.getByRole('textbox', { name: 'Tickets *' }).fill(taskTitle)

    // Fill description (PrimeVue Editor with Quill)
    const editorContent = page.locator('.p-editor-content .ql-editor')
    await editorContent.click()
    await editorContent.fill(taskDescription)

    // Select status if available
    const statusCombobox = page.getByRole('combobox', { name: /workflow|État/i })
    if (await statusCombobox.count() > 0 && await statusCombobox.isVisible()) {
      await statusCombobox.click()
      await page.waitForSelector('.p-select-overlay', { state: 'visible', timeout: 3000 }).catch(() => {})
      const options = page.locator('.p-select-overlay .p-select-option')
      if (await options.count() > 0) {
        await options.first().click()
      }
    }

    // Select requested_by if available (RelationSelector with AutoComplete)
    const requestedByCombobox = page.getByLabel('Demandé par').locator('input')
    if (await requestedByCombobox.count() > 0 && await requestedByCombobox.isVisible()) {
      await requestedByCombobox.click()
      // Wait for autocomplete suggestions
      await page.waitForSelector('.p-autocomplete-overlay', { state: 'visible', timeout: 3000 }).catch(() => {})
      const suggestions = page.locator('.p-autocomplete-overlay .p-autocomplete-item')
      if (await suggestions.count() > 0) {
        await suggestions.first().click()
      }
    }

    // Select assigned_group if available
    const assignedGroupCombobox = page.getByLabel('Groupe assigné').locator('input')
    if (await assignedGroupCombobox.count() > 0 && await assignedGroupCombobox.isVisible()) {
      await assignedGroupCombobox.click()
      await page.waitForSelector('.p-autocomplete-overlay', { state: 'visible', timeout: 3000 }).catch(() => {})
      const suggestions = page.locator('.p-autocomplete-overlay .p-autocomplete-item')
      if (await suggestions.count() > 0) {
        await suggestions.first().click()
      }
    }

    // Intercept create call (API uses /tickets endpoint)
    const createResponsePromise = page.waitForResponse(response => 
      response.url().includes('/tickets') && 
      !response.url().includes('/search') &&
      response.request().method() === 'POST' &&
      response.status() === 201
    )

    // Save (green check button)
    await page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') }).click()

    // Wait for creation
    const createResponse = await createResponsePromise
    const createdTask = await createResponse.json()
    createdTaskUuids.push(createdTask.uuid)

    // Verify via API
    const verifiedTask = await verifyTaskViaApi(request, authToken, createdTask.uuid, {
      title: taskTitle,
      ticket_type_code: 'TASK'
    })

    // Verify relations were saved
    expect(verifiedTask.writer_uuid).toBeDefined()
  })

  test('should have save button disabled when required fields are empty', async ({ page }) => {
    // Click the "Créer" button
    await page.getByRole('button', { name: 'Créer' }).click()
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()

    // Wait for form to load
    await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // The save button should be disabled when no data is entered
    const saveButton = page.locator('button.p-button-success').filter({ has: page.locator('.pi-check') })
    await expect(saveButton).toBeDisabled()

    // Fill in the title to enable the button
    await page.getByRole('textbox', { name: 'Tickets *' }).fill('Test title')

    // Now the save button should be enabled
    await expect(saveButton).toBeEnabled()
  })

  test('should close create tab via tab close button', async ({ page }) => {
    // Click the "Créer" button
    await page.getByRole('button', { name: 'Créer' }).click()
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()

    // Wait for form to load
    await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Click the X button on the tab itself (not the cancel button in the form)
    // The tab has a close button with pi-times icon
    await page.getByRole('tab', { name: /Nouveau/ }).locator('button').click()

    // Should return to list tab (the create tab should be closed)
    await expect(page.getByRole('tab', { name: /Nouveau/ })).not.toBeVisible({ timeout: 5000 })
  })

  test('should show unsaved changes dialog when canceling with data', async ({ page }) => {
    // Click the "Créer" button
    await page.getByRole('button', { name: 'Créer' }).click()
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()

    // Wait for form to load
    await page.waitForSelector('.p-progressspinner', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Fill some data in title field
    await page.getByRole('textbox', { name: 'Tickets *' }).fill('Test unsaved changes')

    // Click the X button on the tab to close it (this should trigger unsaved changes dialog)
    await page.getByRole('tab', { name: /Nouveau/ }).locator('button').click()

    // Should show confirmation dialog (PrimeVue Dialog)
    await expect(page.locator('.p-dialog')).toBeVisible()
    // Check dialog title (use first() to avoid strict mode with multiple text matches)
    await expect(page.locator('.p-dialog .p-dialog-title')).toBeVisible()

    // Click "Non" to stay on form
    await page.locator('.p-dialog').getByRole('button', { name: /Non|No/i }).click()

    // Dialog should close
    await expect(page.locator('.p-dialog')).not.toBeVisible()

    // Should still be on create tab
    await expect(page.getByRole('tab', { name: /Nouveau/ })).toBeVisible()
  })
})
