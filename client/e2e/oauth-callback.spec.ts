import { test, expect } from '@playwright/test'

test.describe('Google OAuth Callback', () => {
  test('should handle successful OAuth callback', async ({ page }) => {
    // Mock the Google OAuth API call
    await page.route('**/auth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: {
            code: 200,
            message: 'Logged in successfully.'
          },
          data: {
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg',
              provider: 'google_oauth2'
            },
            token: 'mock-jwt-token'
          }
        })
      })
    })

    // Mock user profile API call
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
              avatar_url: 'https://example.com/avatar.jpg',
              provider: 'google_oauth2'
            }
          }
        })
      })
    })

    // Simulate OAuth callback with authorization code
    await page.goto('/auth/google/callback?code=mock-auth-code')

    // Should show loading state initially
    await expect(page.locator('text=Processing Google authentication')).toBeVisible()

    // Should show success notification
    await expect(page.locator('.mantine-Notification-root')).toBeVisible()
    await expect(page.locator('text=Logged in successfully.')).toBeVisible()

    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should handle OAuth error', async ({ page }) => {
    // Simulate OAuth callback with error
    await page.goto('/auth/google/callback?error=access_denied')

    // Should show error notification
    await expect(page.locator('.mantine-Notification-root')).toBeVisible()
    await expect(page.locator('text=Google authentication was cancelled or failed.')).toBeVisible()

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle missing authorization code', async ({ page }) => {
    // Simulate OAuth callback without code
    await page.goto('/auth/google/callback')

    // Should show error notification
    await expect(page.locator('.mantine-Notification-root')).toBeVisible()
    await expect(page.locator('text=No authorization code received from Google.')).toBeVisible()

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle API error during authentication', async ({ page }) => {
    // Mock API error
    await page.route('**/auth/google', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid authorization code'
        })
      })
    })

    // Simulate OAuth callback
    await page.goto('/auth/google/callback?code=invalid-code')

    // Should show error notification
    await expect(page.locator('.mantine-Notification-root')).toBeVisible()
    await expect(page.locator('text=Invalid authorization code')).toBeVisible()

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })
})