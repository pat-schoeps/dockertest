import { test, expect } from '@playwright/test'

test.describe('Visual Layout Tests', () => {
  test('login page should be properly centered and styled', async ({ page }) => {
    await page.goto('/login')

    // Check that the main container is centered
    const container = page.locator('.mantine-Container-root').first()
    const containerBox = await container.boundingBox()
    const viewport = page.viewportSize()
    
    if (containerBox && viewport) {
      // Container should be centered horizontally
      const expectedCenterX = viewport.width / 2
      const actualCenterX = containerBox.x + containerBox.width / 2
      const tolerance = 50 // Allow some tolerance
      
      expect(Math.abs(actualCenterX - expectedCenterX)).toBeLessThan(tolerance)
      
      // Container should have max width of 420px (as per Mantine pattern)
      expect(containerBox.width).toBeLessThanOrEqual(420)
    }

    // Check that the Paper component (login card) is present and styled
    const paper = page.locator('.mantine-Paper-root')
    await expect(paper).toBeVisible()
    
    const paperBox = await paper.boundingBox()
    if (paperBox) {
      // Paper should have reasonable dimensions
      expect(paperBox.width).toBeGreaterThan(200)
      expect(paperBox.height).toBeGreaterThan(100)
    }

    // Check that the Google button is properly positioned
    const googleButton = page.locator('button', { hasText: 'Sign in with Google' })
    await expect(googleButton).toBeVisible()
    
    const buttonBox = await googleButton.boundingBox()
    const paperBoxFinal = await paper.boundingBox()
    
    if (buttonBox && paperBoxFinal) {
      // Button should be inside the paper container
      expect(buttonBox.x).toBeGreaterThanOrEqual(paperBoxFinal.x)
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(paperBoxFinal.x + paperBoxFinal.width)
      
      // Button should be full width (minus padding)
      const expectedButtonWidth = paperBoxFinal.width - 44 // 22px padding on each side
      const tolerance = 20
      expect(Math.abs(buttonBox.width - expectedButtonWidth)).toBeLessThan(tolerance)
    }

    // Check that the Google icon is present in the button
    const googleIcon = googleButton.locator('svg')
    await expect(googleIcon).toBeVisible()

    // Check title styling
    const title = page.locator('h1')
    await expect(title).toContainText('Welcome back!')
    await expect(title).toHaveCSS('text-align', 'center')

    // Check subtitle styling
    const subtitle = page.locator('text=Sign in to your account to continue')
    await expect(subtitle).toBeVisible()
    await expect(subtitle).toHaveCSS('text-align', 'center')
  })

  test('login page should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Container should still be centered on mobile
    const container = page.locator('.mantine-Container-root').first()
    const containerBox = await container.boundingBox()
    
    if (containerBox) {
      // On mobile, container should take most of the width
      expect(containerBox.width).toBeGreaterThan(300)
      expect(containerBox.width).toBeLessThanOrEqual(420)
    }

    // Button should still be visible and clickable
    const googleButton = page.locator('button', { hasText: 'Sign in with Google' })
    await expect(googleButton).toBeVisible()
    
    const buttonBox = await googleButton.boundingBox()
    if (buttonBox) {
      // Button should have reasonable touch target size
      expect(buttonBox.height).toBeGreaterThan(40)
    }
  })

  test('login page should have proper spacing and margins', async ({ page }) => {
    await page.goto('/login')

    // Check vertical spacing
    const title = page.locator('h1')
    const subtitle = page.locator('text=Sign in to your account to continue')
    const paper = page.locator('.mantine-Paper-root')

    const titleBox = await title.boundingBox()
    const subtitleBox = await subtitle.boundingBox()
    const paperBox = await paper.boundingBox()

    if (titleBox && subtitleBox && paperBox) {
      // Title should be above subtitle
      expect(titleBox.y).toBeLessThan(subtitleBox.y)
      
      // Paper should be below subtitle with proper spacing
      expect(paperBox.y).toBeGreaterThan(subtitleBox.y + subtitleBox.height)
      
      // There should be reasonable spacing (mt={30} = ~30px)
      const spacing = paperBox.y - (subtitleBox.y + subtitleBox.height)
      expect(spacing).toBeGreaterThan(20)
      expect(spacing).toBeLessThan(50)
    }
  })

  test('should take screenshot for visual comparison', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for everything to load
    await page.waitForSelector('button:has-text("Sign in with Google")')
    
    // Take a screenshot of the login page
    await expect(page).toHaveScreenshot('login-page.png')
    
    // Take a screenshot of just the login card
    const paper = page.locator('.mantine-Paper-root')
    await expect(paper).toHaveScreenshot('login-card.png')
  })
})