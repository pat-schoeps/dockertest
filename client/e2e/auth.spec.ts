import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page with Google sign-in button', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Check page title
    await expect(page.locator('h1')).toContainText('Welcome back!')

    // Check subtitle
    await expect(page.locator('text=Sign in to your account to continue')).toBeVisible()

    // Check Google sign-in button is present
    const googleButton = page.locator('button:has-text("Sign in with Google")')
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()

    // Check the button has Google icon
    await expect(googleButton.locator('svg')).toBeVisible()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/')

    // Should be redirected to login
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome back!')
  })

  test('should show error when Google client ID is not configured', async ({ page }) => {
    // Mock missing environment variable
    await page.addInitScript(() => {
      // @ts-ignore
      window.__VITE_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
      // @ts-ignore
      import.meta.env.VITE_GOOGLE_CLIENT_ID = ''
    })

    await page.goto('/login')

    // Click Google sign-in button
    await page.click('button:has-text("Sign in with Google")')

    // Check for error notification
    await expect(page.locator('text=Configuration Error')).toBeVisible()
    await expect(page.locator('text=Google Client ID not configured')).toBeVisible()

    // Restore original value
    await page.addInitScript(() => {
      // @ts-ignore
      import.meta.env.VITE_GOOGLE_CLIENT_ID = window.__VITE_GOOGLE_CLIENT_ID
    })
  })

  test('should initiate Google OAuth flow when button is clicked', async ({ page, context }) => {
    await page.goto('/login')

    // Set up listener for popup/navigation
    const [popup] = await Promise.all([
      // Wait for navigation or popup
      context.waitForEvent('page'),
      // Click Google sign-in button
      page.click('button:has-text("Sign in with Google")')
    ]).catch(() => [null])

    // If it's a navigation (not popup), check the URL
    if (!popup) {
      // Check that we're redirected to Google OAuth
      await expect(page).toHaveURL(/accounts\.google\.com/)
    } else {
      // If it's a popup, check the popup URL
      await expect(popup).toHaveURL(/accounts\.google\.com/)
      await popup.close()
    }
  })

  test('login page should be responsive', async ({ page }) => {
    await page.goto('/login')

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()

    // Container should maintain max width
    const container = page.locator('.mantine-Container-root').first()
    const box = await container.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(420)
  })
})