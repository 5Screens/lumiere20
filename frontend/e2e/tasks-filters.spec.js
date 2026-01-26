import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Tasks Filters
 * Tests all available filter types in the Tasks list view
 */

// Test credentials
const ADMIN_EMAIL = 'admin@lumiere.local'
const ADMIN_PASSWORD = 'Lumiere2024!'

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
  // Wait for data to load
  await page.waitForResponse(response => 
    response.url().includes('/tickets/search') && response.status() === 200
  )
}

/**
 * Helper function to clear all filters
 */
async function clearFilters(page) {
  const clearButton = page.getByRole('tabpanel', { name: /Liste/ })
    .locator('button')
    .filter({ hasText: /^$/ })
    .nth(0)
  
  // Only click if enabled (filters are active)
  if (await clearButton.isEnabled()) {
    await clearButton.click()
    // Wait for data to reload
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )
  }
}

/**
 * Helper function to get the total count from pagination
 */
async function getTotalCount(page) {
  const paginationText = await page.locator('text=/Affichage de \\d+ à \\d+ sur (\\d+) éléments/').textContent()
  const match = paginationText?.match(/sur (\d+) éléments/)
  return match ? parseInt(match[1], 10) : 0
}

test.describe('Tasks Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await navigateToTasks(page)
  })

  test('should filter by global search text', async ({ page }) => {
    // Get initial count
    const initialCount = await getTotalCount(page)
    expect(initialCount).toBe(50000)

    // Apply global filter
    const searchInput = page.getByRole('tabpanel', { name: /Liste/ }).getByPlaceholder('Rechercher')
    await searchInput.fill('Email System')
    await searchInput.press('Enter')

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(1000)
    expect(filteredCount).toBeLessThan(initialCount)

    // Verify results contain the search term
    const firstRowTitle = await page.locator('tbody tr').first().locator('td').nth(0).textContent()
    expect(firstRowTitle?.toLowerCase()).toContain('email system')

    // Clear filters
    await clearFilters(page)
    const resetCount = await getTotalCount(page)
    expect(resetCount).toBe(50000)
  })

  test('should filter by column description contains', async ({ page }) => {
    // Open filter menu for Tickets column
    await page.getByRole('columnheader', { name: 'Description Show Filter Menu' })
      .getByLabel('Show Filter Menu').click()

    // The filter mode should be "Contient" by default
    await expect(page.getByRole('combobox', { name: 'Contient' })).toBeVisible()

    // Enter filter value (PrimeVue uses popover, not dialog)
    const filterOverlay = page.locator('.p-datatable-filter-overlay')
    await filterOverlay.getByRole('textbox').fill('needed')

    // Apply filter (wait for overlay animation to stabilize)
    await filterOverlay.getByRole('button', { name: 'Appliquer' }).click({ force: true })

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(10000)

    // Verify results contain the search term
    const firstRowTitle = await page.locator('tbody tr').first().locator('td').nth(1).textContent()
    expect(firstRowTitle?.toLowerCase()).toContain('needed')

    // Clear filters
    await clearFilters(page)
  })

  test('should filter by status (workflow status)', async ({ page }) => {
    // Open filter menu for État column
    await page.getByRole('columnheader', { name: 'État Show Filter Menu' })
      .getByLabel('Show Filter Menu').click()

    // Click on status dropdown
    await page.locator('dialog').locator('div').filter({ hasText: 'Sélectionner un statut' }).nth(1).click()

    // Select "En cours" status
    await page.getByRole('option', { name: 'En cours' }).click()

    // Close dropdown
    await page.keyboard.press('Escape')

    // Apply filter
    await page.getByRole('button', { name: 'Appliquer' }).click()

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count (should be 1 based on our test)
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(1)

    // Verify the status in the result
    await expect(page.locator('tbody tr').first().getByText('En cours')).toBeVisible()

    // Clear filters
    await clearFilters(page)
  })

  test('should filter by date (created_at before)', async ({ page }) => {
    // Open filter menu for Créé le column
    await page.locator('th:nth-child(13) .p-datatable-filter .p-button').click()

    // Change filter mode to "Date avant"
    await page.locator('dialog').getByRole('combobox', { name: /Date/ }).click()
    await page.getByRole('option', { name: 'Date avant' }).click()

    // Open date picker
    await page.locator('dialog').getByRole('combobox').nth(1).click()

    // Select date 24/12/2025
    await page.getByRole('gridcell', { name: '24' }).click()

    // Apply filter
    await page.getByRole('button', { name: 'Appliquer' }).click()

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count (should be 0 since all tickets were created on 24/12/2025)
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(0)

    // Clear filters
    await clearFilters(page)
  })

  test('should filter by date (created_at after)', async ({ page }) => {
    // Open filter menu for Créé le column
    await page.locator('th:nth-child(13) .p-datatable-filter .p-button').click()

    // Change filter mode to "Date après"
    await page.locator('dialog').getByRole('combobox', { name: /Date/ }).click()
    await page.getByRole('option', { name: 'Date après' }).click()

    // Open date picker
    await page.locator('dialog').getByRole('combobox').nth(1).click()

    // Select date 23/12/2025 (day before)
    await page.getByRole('gridcell', { name: '23' }).click()

    // Apply filter
    await page.getByRole('button', { name: 'Appliquer' }).click()

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count (should be 50000 since all tickets were created on 24/12/2025)
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(50000)

    // Clear filters
    await clearFilters(page)
  })

  test('should filter by assigned group (relation)', async ({ page }) => {
    // Open filter menu for Groupe assigné column
    await page.locator('th:nth-child(11) .p-datatable-filter .p-button').click()

    // Click on group dropdown
    await page.locator('dialog').locator('div').filter({ hasText: 'Sélectionner un groupe' }).nth(1).click()

    // Select "BLD-Automation 2025" group
    await page.getByRole('option', { name: 'BLD-Automation 2025' }).click()

    // Close dropdown
    await page.keyboard.press('Escape')

    // Apply filter
    await page.getByRole('button', { name: 'Appliquer' }).click()

    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Verify filtered count
    const filteredCount = await getTotalCount(page)
    expect(filteredCount).toBe(501)

    // Verify the group in the results
    await expect(page.locator('tbody tr').first().getByText('BLD-Automation 2025')).toBeVisible()

    // Clear filters
    await clearFilters(page)
  })

  test('should combine multiple filters', async ({ page }) => {
    // First, apply global filter
    const searchInput = page.getByRole('tabpanel', { name: /Liste/ }).getByPlaceholder('Rechercher')
    await searchInput.fill('documentation')
    await searchInput.press('Enter')

    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    const afterGlobalFilter = await getTotalCount(page)
    expect(afterGlobalFilter).toBe(5000)

    // Then, apply column filter for assigned group
    await page.locator('th:nth-child(11) .p-datatable-filter .p-button').click()
    await page.locator('dialog').locator('div').filter({ hasText: 'Sélectionner un groupe' }).nth(1).click()
    await page.getByRole('option', { name: 'BLD-Automation 2025' }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Appliquer' }).click()

    await page.waitForResponse(response => 
      response.url().includes('/tickets/search') && response.status() === 200
    )

    // Combined filters should return fewer results
    const afterCombinedFilters = await getTotalCount(page)
    expect(afterCombinedFilters).toBeLessThan(afterGlobalFilter)

    // Clear all filters
    await clearFilters(page)
    const resetCount = await getTotalCount(page)
    expect(resetCount).toBe(50000)
  })
})
