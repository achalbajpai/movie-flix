import { test, expect } from '@playwright/test'

test.describe('Bus Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set authentication bypass for tests
    await page.addInitScript(() => {
      localStorage.setItem('test-auth-bypass', 'true')
    })

    // Set headers for API calls
    await page.setExtraHTTPHeaders({
      'Authorization': 'Bearer test-token',
      'user-id': '8b5c9a8f-9a3a-4a2b-8c7d-3e5f1a3b2c1d'
    })

    await page.goto('http://localhost:3000/')
  })

  test('should complete the full bus search flow successfully', async ({ page }) => {
    // Wait for the main page to load completely
    await expect(page.getByRole('heading', { name: 'Find Your Perfect Bus Journey' })).toBeVisible()

    // Simple approach: Type slowly and click dropdown options
    const fromInput = page.getByPlaceholder('Departure city')
    await fromInput.click()
    await fromInput.type('Mum', { delay: 100 })
    await page.waitForTimeout(1000)

    // Look for and click Mumbai in dropdown
    const mumbaiButton = page.locator('button').filter({ hasText: /Mumbai/ }).first()
    if (await mumbaiButton.isVisible({ timeout: 3000 })) {
      await mumbaiButton.click()
    }

    const toInput = page.getByPlaceholder('Destination city')
    await toInput.click()
    await toInput.type('Del', { delay: 100 })
    await page.waitForTimeout(1000)

    // Look for and click Delhi in dropdown
    const delhiButton = page.locator('button').filter({ hasText: /Delhi/ }).first()
    if (await delhiButton.isVisible({ timeout: 3000 })) {
      await delhiButton.click()
    }

    // Select departure date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0] ?? ''
    const dateInput = page.locator('input[type="date"]')
    await dateInput.click()
    await dateInput.fill(dateString)

    // Wait for form state to update
    await page.waitForTimeout(500)

    // Select number of passengers
    const passengersSelect = page.getByRole('combobox').filter({ hasText: /passenger/i })
    await passengersSelect.click()
    await page.getByText('2 Passengers').click()

    const searchButton = page.getByRole('button', { name: /search buses/i })
    await expect(searchButton).toBeEnabled()
    await searchButton.click()

    await expect(page).toHaveURL(/\/results/)

    // Verify URL contains correct search parameters
    const url = page.url()
    expect(url).toContain('source=')
    expect(url).toContain('destination=')
    expect(url).toContain('departureDate=')
    expect(url).toContain('passengers=2')

    await expect(page.locator('main')).toBeVisible()
  })

  test('should show search button is initially disabled', async ({ page }) => {
    // Initially button should be disabled when no fields are filled
    const searchButton = page.getByRole('button', { name: /search buses/i })
    await expect(searchButton).toBeDisabled()
  })

  test('should validate date is not in the past', async ({ page }) => {
    await page.getByPlaceholder('Departure city').fill('Mumbai')
    await page.getByPlaceholder('Destination city').fill('Delhi')

    // The input should have min attribute set to today
    const dateInput = page.locator('input[type="date"]')
    const minDate = await dateInput.getAttribute('min')
    const today = new Date().toISOString().split('T')[0]
    expect(minDate).toBe(today)
  })
})