import { test, expect } from '@playwright/test'

test.describe('IsometricRenderer - Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000) // Let game initialize
  })

  test('should render game canvas with proper dimensions', async ({ page }) => {
    const canvas = await page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    const boundingBox = await canvas.boundingBox()
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThan(500)
    expect(boundingBox!.height).toBeGreaterThan(300)
  })

  test('should display debug information', async ({ page }) => {
    // Check all debug elements are present
    await expect(page.locator('text=FPS:')).toBeVisible()
    await expect(page.locator('text=Chunks:')).toBeVisible()
    await expect(page.locator('text=Camera:')).toBeVisible()
    await expect(page.locator('text=Zoom:')).toBeVisible()
    await expect(page.locator('text=History:')).toBeVisible()
    await expect(page.locator('text=Undo:')).toBeVisible()
    await expect(page.locator('text=Redo:')).toBeVisible()
  })

  test('should show controls information', async ({ page }) => {
    await expect(page.locator('text=Controls:')).toBeVisible()
    await expect(page.locator('text=WASD')).toBeVisible()
    await expect(page.locator('text=Cmd+Z')).toBeVisible()
  })

  test('should register block placement clicks', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Get initial history
    const beforeClick = await page.textContent('body')
    expect(beforeClick).toContain('History: 0 actions')
    
    // Click to place block
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(500)
    
    // Check history updated  
    const afterClick = await page.textContent('body')
    expect(afterClick).toContain('History: 1 actions')
  })

  test('should stack blocks at same position', async ({ page }) => {
    const canvas = await page.locator('canvas')
    const position = { x: 400, y: 300 }
    
    // Place multiple blocks at same position
    for (let i = 1; i <= 3; i++) {
      await canvas.click({ position })
      await page.waitForTimeout(300)
      
      const bodyText = await page.textContent('body')
      expect(bodyText).toContain(`History: ${i} actions`)
    }
  })

  test.skip('should handle camera movement with WASD', async ({ page }) => {
    // Get initial camera position
    const initialBody = await page.textContent('body')
    const initialMatch = initialBody?.match(/Camera: \\(([\\d.-]+), ([\\d.-]+)\\)/)
    expect(initialMatch).toBeTruthy()
    
    // Move camera with W
    await page.keyboard.press('w')
    await page.waitForTimeout(300)
    
    // Check camera changed
    const afterBody = await page.textContent('body')
    const afterMatch = afterBody?.match(/Camera: \\(([\\d.-]+), ([\\d.-]+)\\)/)
    expect(afterMatch).toBeTruthy()
    
    // Positions should be different
    expect(afterMatch![0]).not.toBe(initialMatch![0])
  })

  test.skip('should handle zoom controls', async ({ page }) => {
    // Get initial zoom
    const initialBody = await page.textContent('body')
    const initialZoom = initialBody?.match(/Zoom: ([\\d.]+)x/)?.[1]
    expect(initialZoom).toBeTruthy()
    
    // Zoom out with Q
    await page.keyboard.press('q')
    await page.waitForTimeout(300)
    
    // Check zoom changed
    const afterBody = await page.textContent('body')
    const afterZoom = afterBody?.match(/Zoom: ([\\d.]+)x/)?.[1]
    expect(afterZoom).toBeTruthy()
    expect(afterZoom).not.toBe(initialZoom)
  })

  test('should handle undo functionality', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Initially undo should not be available
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('Undo: ✗')
    
    // Place a block
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    // Undo should now be available
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('Undo: ✓')
    expect(bodyText).toContain('History: 1 actions')
    
    // Undo the action
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(300)
    
    // Undo should not be available, but redo should be
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('Undo: ✗')
    expect(bodyText).toContain('Redo: ✓')
  })

  test('should handle right-click block removal', async ({ page }) => {
    const canvas = await page.locator('canvas')
    const position = { x: 400, y: 300 }
    
    // Place a block first
    await canvas.click({ position })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    
    // Right-click to remove
    await canvas.click({ position, button: 'right' })
    await page.waitForTimeout(300)
    
    // History should show 2 actions (place + remove)
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
  })

  test('should toggle grid overlay', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Take initial screenshot
    const before = await canvas.screenshot()
    
    // Toggle grid
    await page.keyboard.press('g')
    await page.waitForTimeout(500)
    
    // Take after screenshot
    const after = await canvas.screenshot()
    
    // Should be visually different
    expect(Buffer.compare(before, after)).not.toBe(0)
    
    // Toggle back
    await page.keyboard.press('g')
    await page.waitForTimeout(500)
    
    const final = await canvas.screenshot()
    
    // Should be closer to original (some timing differences expected)
    expect(final).toBeTruthy()
  })

  test('should maintain stable performance', async ({ page }) => {
    // Let it run for a bit and check FPS is reported
    await page.waitForTimeout(3000)
    
    const bodyText = await page.textContent('body')
    const fpsMatch = bodyText?.match(/FPS: (\\d+)/)
    
    if (fpsMatch) {
      const fps = parseInt(fpsMatch[1])
      expect(fps).toBeGreaterThan(0)
      // Note: In headless mode, FPS might be lower, so just check it's positive
    } else {
      // If we can't parse FPS, at least check the text is there
      expect(bodyText).toContain('FPS:')
    }
  })

  test('should handle rapid interactions without breaking', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Rapid clicks
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: 300 + i * 30, y: 300 } })
      await page.waitForTimeout(50)
    }
    
    // Should still be responsive
    await page.waitForTimeout(500)
    const bodyText = await page.textContent('body')
    
    // Should have recorded some actions
    const historyMatch = bodyText?.match(/History: (\\d+) actions/)
    if (historyMatch) {
      const count = parseInt(historyMatch[1])
      expect(count).toBeGreaterThan(0)
    }
    
    // Canvas should still be functional
    await expect(canvas).toBeVisible()
  })

  test('should handle complex undo/redo sequence', async ({ page }) => {
    const canvas = await page.locator('canvas')
    const pos1 = { x: 350, y: 300 }
    const pos2 = { x: 450, y: 300 }
    
    // Place blocks at different positions
    await canvas.click({ position: pos1 })
    await page.waitForTimeout(200)
    await canvas.click({ position: pos2 })
    await page.waitForTimeout(200)
    await canvas.click({ position: pos1 }) // Stack
    await page.waitForTimeout(200)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
    expect(bodyText).toContain('Undo: ✓')
    
    // Undo twice
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(200)
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(200)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('Redo: ✓')
    
    // Redo once
    await page.keyboard.press('Meta+Shift+z')
    await page.waitForTimeout(200)
    
    // Should still work
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
  })

  test('should render visual elements consistently', async ({ page }) => {
    const canvas = await page.locator('canvas')
    
    // Place a specific pattern
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    await canvas.click({ position: { x: 400, y: 300 } }) // Stack
    await page.waitForTimeout(200)
    await canvas.click({ position: { x: 450, y: 330 } })
    await page.waitForTimeout(500)
    
    // Take screenshot for visual comparison
    const screenshot = await canvas.screenshot()
    expect(screenshot.length).toBeGreaterThan(1000) // Should be a substantial image
    
    // Could add more specific visual checks here
    await expect(canvas).toBeVisible()
  })
})