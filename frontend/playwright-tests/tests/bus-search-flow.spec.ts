import { test, expect } from '@playwright/test'

test.describe('Bus Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
  })

  test('should complete the full bus search flow successfully', async ({ page }) => {
    // Wait for the page to load completely
    await expect(page.getByRole('heading', { name: 'Find Your Perfect Bus Journey' })).toBeVisible()

    const fromInput = page.getByPlaceholder('Departure city')
    await fromInput.click()
    await fromInput.fill('Mumbai')
    await page.waitForTimeout(1000) // Wait for API response

    // If cities are loaded, click the first one, otherwise continue with typed text
    const firstFromCity = page.locator('button').filter({ hasText: 'Mumbai' }).first()
    if (await firstFromCity.isVisible({ timeout: 2000 })) {
      await firstFromCity.click()
    }

    const toInput = page.getByPlaceholder('Destination city')
    await toInput.click()
    await toInput.fill('Delhi')
    await page.waitForTimeout(1000) // Wait for API response

    // If cities are loaded, click the first one, otherwise continue with typed text
    const firstToCity = page.locator('button').filter({ hasText: 'Delhi' }).first()
    if (await firstToCity.isVisible({ timeout: 2000 })) {
      await firstToCity.click()
    }

    // Select departure date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.locator('input[type="date"]').fill(dateString)

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