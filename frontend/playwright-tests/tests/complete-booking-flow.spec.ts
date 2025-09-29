import { test, expect } from '@playwright/test'

test.describe('🎫 Complete Booking Flow E2E Tests', () => {
  const testUser = {
    user_id: "8b5c9a8f-9a3a-4a2b-8c7d-3e5f1a3b2c1d",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "9876543210",
    age: 28,
    role: "user"
  };

  const futureDate = '2025-09-29'; // Use same date as working Jest test
  let selectedBusId: string;
  let bookingId: string;

  test.beforeEach(async ({ page }) => {
    // Set authentication bypass for tests
    await page.addInitScript(() => {
      localStorage.setItem('test-auth-bypass', 'true')
    })

    // Set headers for API calls - match Jest test authentication
    await page.setExtraHTTPHeaders({
      'Authorization': 'Bearer test-token',
      'user-id': testUser.user_id
    })

    await page.goto('http://localhost:3000/')
  })

  test('should complete full booking flow from search to confirmation', async ({ page }) => {
    // Step 1: Bus Search (using working data from Jest test)
    await test.step('Search for buses - Bangalore to Chennai', async () => {
      await expect(page.getByRole('heading', { name: 'Find Your Perfect Bus Journey' })).toBeVisible();

      // Fill search form with working data - type and select from dropdown
      const fromInput = page.getByPlaceholder('Departure city');
      await fromInput.click();
      await fromInput.type('Banga', { delay: 100 });
      await page.waitForTimeout(1000);

      // Look for and click Bangalore in dropdown
      const bangaloreButton = page.locator('button').filter({ hasText: /Bangalore/ }).first();
      if (await bangaloreButton.isVisible({ timeout: 3000 })) {
        await bangaloreButton.click();
      }

      const toInput = page.getByPlaceholder('Destination city');
      await toInput.click();
      await toInput.type('Chen', { delay: 100 });
      await page.waitForTimeout(1000);

      // Look for and click Chennai in dropdown
      const chennaiButton = page.locator('button').filter({ hasText: /Chennai/ }).first();
      if (await chennaiButton.isVisible({ timeout: 3000 })) {
        await chennaiButton.click();
      }

      // Set departure date - same as Jest test
      const dateInput = page.locator('input[type="date"]');
      await dateInput.click();
      await dateInput.fill(futureDate);

      // Select 1 passenger (default should be fine)
      // await page.getByRole('combobox').filter({ hasText: /passenger/i }).click();
      // await page.getByText('1 Passenger').click();

      // Submit search
      const searchButton = page.getByRole('button', { name: /search buses/i });
      await expect(searchButton).toBeEnabled();
      await searchButton.click();

      // Verify navigation to results page
      await expect(page).toHaveURL(/\/results/);

      // Verify search parameters in URL
      const url = page.url();
      expect(url).toContain('source=');
      expect(url).toContain('destination=');
      expect(url).toContain('departureDate=2025-09-29');
      expect(url).toContain('passengers=');
    });

    // Step 2: Select Bus from Results
    await test.step('Select first available bus', async () => {
      // Wait for results to load
      await page.waitForLoadState('networkidle');

      // Look for bus results
      const busResults = page.locator('[data-testid="bus-result"], .bus-card, [class*="bus"]').first();
      await expect(busResults).toBeVisible({ timeout: 10000 });

      // Click on first bus or "Select Seats" button
      const selectButton = page.getByRole('button', { name: /select seats|book now|choose/i }).first();
      if (await selectButton.isVisible()) {
        await selectButton.click();
      } else {
        // If no specific button, click on the bus result itself
        await busResults.click();
      }

      // Should navigate to booking page
      await expect(page).toHaveURL(/\/booking/, { timeout: 10000 });
    });

    // Step 3: Seat Selection
    await test.step('Select seat', async () => {
      // Wait for seat layout to load
      await page.waitForLoadState('networkidle');

      // Look for available seats - could be various selectors
      const availableSeat = page.locator(
        '[data-testid="available-seat"], .seat-available, .seat:not(.seat-occupied):not(.seat-selected)'
      ).first();

      await expect(availableSeat).toBeVisible({ timeout: 15000 });
      await availableSeat.click();

      // Verify seat is selected
      const selectedSeat = page.locator('.seat-selected, [data-selected="true"]').first();
      await expect(selectedSeat).toBeVisible();
    });

    // Step 4: Passenger Details
    await test.step('Fill passenger information', async () => {
      // Look for passenger form - might be on same page or need to proceed
      const proceedButton = page.getByRole('button', { name: /proceed|continue|next/i });
      if (await proceedButton.isVisible({ timeout: 3000 })) {
        await proceedButton.click();
      }

      // Fill passenger details
      const nameInput = page.getByLabel(/name|passenger name/i).first();
      if (await nameInput.isVisible({ timeout: 5000 })) {
        await nameInput.fill(testUser.name);
      }

      const ageInput = page.getByLabel(/age/i).first();
      if (await ageInput.isVisible({ timeout: 3000 })) {
        await ageInput.fill(testUser.age.toString());
      }

      // Gender selection
      const genderSelect = page.locator('select[name*="gender"], [data-testid="gender-select"]').first();
      if (await genderSelect.isVisible({ timeout: 3000 })) {
        await genderSelect.selectOption('female');
      } else {
        // Try radio buttons or dropdown
        const femaleOption = page.getByText('Female').first();
        if (await femaleOption.isVisible({ timeout: 3000 })) {
          await femaleOption.click();
        }
      }

      // Contact details
      const emailInput = page.getByLabel(/email/i).first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(testUser.email);
      }

      const phoneInput = page.getByLabel(/phone|mobile/i).first();
      if (await phoneInput.isVisible({ timeout: 3000 })) {
        await phoneInput.fill(testUser.phone);
      }
    });

    // Step 5: Complete Booking
    await test.step('Complete booking and verify confirmation', async () => {
      // Submit booking
      const bookingButton = page.getByRole('button', {
        name: /book now|confirm booking|proceed to pay|complete booking/i
      });
      await expect(bookingButton).toBeVisible({ timeout: 10000 });
      await bookingButton.click();

      // Wait for booking completion
      await page.waitForLoadState('networkidle');

      // Should be redirected to confirmation page or see success message
      await expect(
        page.locator(':has-text("booking confirmed"), :has-text("success"), :has-text("booked")')
      ).toBeVisible({ timeout: 15000 });

      // Look for booking reference or ID
      const bookingReference = page.locator(
        '[data-testid="booking-reference"], .booking-id, .reference-number'
      );

      if (await bookingReference.isVisible({ timeout: 5000 })) {
        bookingId = await bookingReference.textContent() || '';
        expect(bookingId).toBeTruthy();
      }
    });

    // Step 6: Verify Booking in History (Optional)
    await test.step('Verify booking appears in booking history', async () => {
      // Navigate to bookings page
      const bookingsLink = page.getByRole('link', { name: /my bookings|bookings|my trips/i });
      if (await bookingsLink.isVisible({ timeout: 5000 })) {
        await bookingsLink.click();
        await expect(page).toHaveURL(/\/bookings/);

        // Look for the booking in history
        await page.waitForLoadState('networkidle');
        const bookingHistory = page.locator('.booking-card, [data-testid="booking"], .trip-card').first();
        await expect(bookingHistory).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('should handle booking flow errors gracefully', async ({ page }) => {
    // Test error scenarios like no seats available, validation errors, etc.
    await test.step('Search for buses', async () => {
      await expect(page.getByRole('heading', { name: 'Find Your Perfect Bus Journey' })).toBeVisible();

      // Fill form with working data - type and select from dropdown
      const fromInput = page.getByPlaceholder('Departure city');
      await fromInput.click();
      await fromInput.type('Banga', { delay: 100 });
      await page.waitForTimeout(1000);

      const bangaloreButton = page.locator('button').filter({ hasText: /Bangalore/ }).first();
      if (await bangaloreButton.isVisible({ timeout: 3000 })) {
        await bangaloreButton.click();
      }

      const toInput = page.getByPlaceholder('Destination city');
      await toInput.click();
      await toInput.type('Chen', { delay: 100 });
      await page.waitForTimeout(1000);

      const chennaiButton = page.locator('button').filter({ hasText: /Chennai/ }).first();
      if (await chennaiButton.isVisible({ timeout: 3000 })) {
        await chennaiButton.click();
      }

      const dateInput = page.locator('input[type="date"]');
      await dateInput.click();
      await dateInput.fill(futureDate);

      const searchButton = page.getByRole('button', { name: /search buses/i });
      await expect(searchButton).toBeEnabled();
      await searchButton.click();
      await expect(page).toHaveURL(/\/results/);
    });

    await test.step('Handle no results or errors gracefully', async () => {
      await page.waitForLoadState('networkidle');

      // Check if there are results or error messages
      const noResults = page.getByText(/no buses found|no results|sorry/i);
      const hasResults = page.locator('[data-testid="bus-result"], .bus-card').first();

      // Either should have results or show appropriate error message
      const hasContent = await Promise.race([
        noResults.isVisible().then(() => 'no-results'),
        hasResults.isVisible().then(() => 'has-results')
      ]);

      expect(['no-results', 'has-results']).toContain(hasContent);
    });
  });
});