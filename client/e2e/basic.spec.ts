import { test, expect } from '@playwright/test'

test.describe('Basic App Tests', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check that the login page loads
    await expect(page).toHaveURL('/login')
    
    // Check for welcome title
    await expect(page.locator('h1')).toContainText('Welcome back!')
    
    // Check for Google sign-in button
    const googleButton = page.locator('button', { hasText: 'Sign in with Google' })
    await expect(googleButton).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})