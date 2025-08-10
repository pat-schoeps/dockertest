import { test, expect } from '@playwright/test'

test.describe('Home Page (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting a token in localStorage
    await page.addInitScript(() => {
      // Set a mock JWT token
      localStorage.setItem('authToken', 'mock-jwt-token')
    })

    // Mock the API response for /api/v1/users/me
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            attributes: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              avatar_url: null,
              provider: 'google_oauth2'
            }
          }
        })
      })
    })
  })

  test('should display welcome message with user name', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to load
    await page.waitForSelector('h1')

    // Check welcome message
    await expect(page.locator('h1')).toContainText('Welcome to the App')

    // Check user greeting
    await expect(page.locator('text=Hello, Test User!')).toBeVisible()

    // Check authenticated message
    await expect(page.locator('text=You have successfully authenticated')).toBeVisible()
  })

  test('should display sign out button', async ({ page }) => {
    await page.goto('/')

    // Check sign out button is present
    const signOutButton = page.locator('button:has-text("Sign Out")')
    await expect(signOutButton).toBeVisible()
    await expect(signOutButton).toBeEnabled()
  })

  test('should sign out when button is clicked', async ({ page }) => {
    await page.goto('/')

    // Click sign out button
    await page.click('button:has-text("Sign Out")')

    // Should redirect to login page
    await expect(page).toHaveURL('/login')

    // Check that token is removed
    const token = await page.evaluate(() => localStorage.getItem('authToken'))
    expect(token).toBeNull()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Override the route to return an error
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unauthorized'
        })
      })
    })

    await page.goto('/')

    // Should redirect to login due to 401
    await expect(page).toHaveURL('/login')
  })
})