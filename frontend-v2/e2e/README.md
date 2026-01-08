# E2E Tests with Playwright

This directory contains end-to-end tests for the Lumiere V2 frontend application using Playwright.

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd frontend-v2
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Ensure the application is running:**
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5174`

4. **Ensure UAT seed data is loaded:**
   ```bash
   cd ../backend-v2
   node prisma/seeds/run-single.js uat.tickets
   ```

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests with browser visible
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Files

| File | Description |
|------|-------------|
| `tasks-filters.spec.js` | Tests for all filter types in the Tasks list view |
| `tasks-crud-create.spec.js` | Tests for creating tasks via the frontend |

## Test Coverage

### Tasks Filters (`tasks-filters.spec.js`)

| Test | Description | Expected Result |
|------|-------------|-----------------|
| Global search filter | Search for "Email System" | 1,000 results |
| Column text filter | Filter title containing "documentation" | 5,000 results |
| Status filter | Filter by status "En cours" | 1 result |
| Date filter (before) | Filter created_at before 24/12/2025 | 0 results |
| Date filter (after) | Filter created_at after 23/12/2025 | 50,000 results |
| Relation filter | Filter by assigned group "BLD-Automation 2025" | 501 results |
| Combined filters | Multiple filters applied together | Fewer results |

### Tasks CRUD Create (`tasks-crud-create.spec.js`)

| Test | Description | API Verification |
|------|-------------|------------------|
| Create minimal task | Create task with title + description only | GET /tasks/{uuid} → verify title, description, ticket_type_code |
| Create complete task | Create task with all fields filled | GET /tasks/{uuid} → verify all fields |
| Validation error | Try to save without required fields | Show validation warning |
| Cancel creation | Cancel and return to list | No API call |
| Unsaved changes dialog | Cancel with data → show confirmation | Dialog visible |

**Prerequisites for CRUD tests:**
```bash
cd backend-v2
node prisma/seeds/run-single.js e2e-crud
```

**Cleanup after tests:**
```bash
node prisma/seeds/run-single.js e2e-crud-cleanup
```

## Configuration

The Playwright configuration is in `playwright.config.js` at the root of `frontend-v2`.

Key settings:
- **Base URL:** `http://localhost:5174`
- **Browser:** Chromium (default)
- **Screenshots:** On failure only
- **Traces:** On first retry

## Adding New Tests

1. Create a new file in `e2e/` with the `.spec.js` extension
2. Import test utilities:
   ```javascript
   import { test, expect } from '@playwright/test'
   ```
3. Use the helper functions for login and navigation
4. Run your tests with `npm run test:e2e`

## CI/CD Integration

For CI environments, set the `CI` environment variable:
```bash
CI=true npm run test:e2e
```

This will:
- Disable parallel execution
- Enable retries (2 attempts)
- Fail on `test.only` usage
