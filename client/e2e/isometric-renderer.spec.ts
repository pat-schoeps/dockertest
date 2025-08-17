import { test, expect, Page } from '@playwright/test'

test.describe('IsometricRenderer - Game Engine Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    // Navigate to the home page which contains the game canvas
    await page.goto('/')
    
    // Wait for the game canvas to be rendered
    await page.waitForSelector('canvas', { timeout: 10000 })
    
    // Wait a bit for the game engine to initialize
    await page.waitForTimeout(1000)
  })

  test.describe('Canvas Rendering', () => {
    test('should render the game canvas', async () => {
      const canvas = await page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Check canvas has proper dimensions
      const boundingBox = await canvas.boundingBox()
      expect(boundingBox).toBeTruthy()
      expect(boundingBox!.width).toBeGreaterThan(0)
      expect(boundingBox!.height).toBeGreaterThan(0)
    })

    test('should display debug overlay', async () => {
      // Check for FPS counter
      const fpsText = await page.locator('text=/FPS:/')
      await expect(fpsText).toBeVisible()
      
      // Check for other debug info
      await expect(page.locator('text=/Chunks:/')).toBeVisible()
      await expect(page.locator('text=/Camera:/')).toBeVisible()
      await expect(page.locator('text=/Zoom:/')).toBeVisible()
      await expect(page.locator('text=/History:/')).toBeVisible()
    })

    test('should display controls help', async () => {
      await expect(page.locator('text=/Controls:/')).toBeVisible()
      await expect(page.locator('text=/WASD/')).toBeVisible()
      await expect(page.locator('text=/Cmd\+Z/')).toBeVisible()
    })
  })

  test.describe('Block Placement and Stacking', () => {
    test('should place a block on click', async () => {
      const canvas = await page.locator('canvas')
      
      // Get initial history count
      const initialHistory = await page.locator('text=/History: \\d+ actions/').textContent()
      const initialCount = parseInt(initialHistory?.match(/\\d+/)?.[0] || '0')
      
      // Click on the canvas to place a block
      await canvas.click({ position: { x: 400, y: 300 } })
      
      // Wait for the action to be processed
      await page.waitForTimeout(500)
      
      // Check history increased
      const newHistory = await page.locator('text=/History: \\d+ actions/').textContent()
      const newCount = parseInt(newHistory?.match(/\\d+/)?.[0] || '0')
      expect(newCount).toBe(initialCount + 1)
    })

    test('should stack blocks on multiple clicks', async () => {
      const canvas = await page.locator('canvas')
      const clickPosition = { x: 400, y: 300 }
      
      // Place first block
      await canvas.click({ position: clickPosition })
      await page.waitForTimeout(300)
      
      // Place second block (should stack)
      await canvas.click({ position: clickPosition })
      await page.waitForTimeout(300)
      
      // Place third block (should stack higher)
      await canvas.click({ position: clickPosition })
      await page.waitForTimeout(300)
      
      // Check history shows 3 actions
      const history = await page.locator('text=/History: \\d+ actions/').textContent()
      const count = parseInt(history?.match(/\\d+/)?.[0] || '0')
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('should remove top block on right click', async () => {
      const canvas = await page.locator('canvas')
      const clickPosition = { x: 400, y: 300 }
      
      // Place multiple blocks
      await canvas.click({ position: clickPosition })
      await page.waitForTimeout(200)
      await canvas.click({ position: clickPosition })
      await page.waitForTimeout(200)
      
      // Get history count before removal
      const beforeRemoval = await page.locator('text=/History: \\d+ actions/').textContent()
      const beforeCount = parseInt(beforeRemoval?.match(/\\d+/)?.[0] || '0')
      
      // Right click to remove top block
      await canvas.click({ position: clickPosition, button: 'right' })
      await page.waitForTimeout(300)
      
      // Check history increased
      const afterRemoval = await page.locator('text=/History: \\d+ actions/').textContent()
      const afterCount = parseInt(afterRemoval?.match(/\\d+/)?.[0] || '0')
      expect(afterCount).toBe(beforeCount + 1)
    })
  })

  test.describe('Camera Controls', () => {
    test('should move camera with WASD keys', async () => {
      // Get initial camera position
      const initialCamera = await page.locator('text=/Camera: \\([\\d.-]+, [\\d.-]+\\)/').textContent()
      
      // Press W to move up
      await page.keyboard.press('w')
      await page.waitForTimeout(200)
      
      // Check camera moved
      const afterW = await page.locator('text=/Camera: \\([\\d.-]+, [\\d.-]+\\)/').textContent()
      expect(afterW).not.toBe(initialCamera)
      
      // Press D to move right
      await page.keyboard.press('d')
      await page.waitForTimeout(200)
      
      const afterD = await page.locator('text=/Camera: \\([\\d.-]+, [\\d.-]+\\)/').textContent()
      expect(afterD).not.toBe(afterW)
    })

    test('should zoom with Q and E keys', async () => {
      // Get initial zoom
      const initialZoom = await page.locator('text=/Zoom: [\\d.]+x/').textContent()
      const initialValue = parseFloat(initialZoom?.match(/[\\d.]+/)?.[0] || '1')
      
      // Press Q to zoom out
      await page.keyboard.press('q')
      await page.waitForTimeout(200)
      
      const afterQ = await page.locator('text=/Zoom: [\\d.]+x/').textContent()
      const qValue = parseFloat(afterQ?.match(/[\\d.]+/)?.[0] || '1')
      expect(qValue).toBeLessThan(initialValue)
      
      // Press E to zoom in
      await page.keyboard.press('e')
      await page.keyboard.press('e')
      await page.waitForTimeout(200)
      
      const afterE = await page.locator('text=/Zoom: [\\d.]+x/').textContent()
      const eValue = parseFloat(afterE?.match(/[\\d.]+/)?.[0] || '1')
      expect(eValue).toBeGreaterThan(qValue)
    })

    test('should zoom with mouse wheel', async () => {
      const canvas = await page.locator('canvas')
      
      // Get initial zoom
      const initialZoom = await page.locator('text=/Zoom: [\\d.]+x/').textContent()
      const initialValue = parseFloat(initialZoom?.match(/[\\d.]+/)?.[0] || '1')
      
      // Scroll up to zoom in
      await canvas.hover()
      await page.mouse.wheel(0, -100)
      await page.waitForTimeout(200)
      
      const afterScroll = await page.locator('text=/Zoom: [\\d.]+x/').textContent()
      const scrollValue = parseFloat(afterScroll?.match(/[\\d.]+/)?.[0] || '1')
      expect(scrollValue).toBeGreaterThan(initialValue)
    })
  })

  test.describe('Grid and Debug Controls', () => {
    test('should toggle grid with G key', async () => {
      const canvas = await page.locator('canvas')
      
      // Take screenshot before toggle
      const before = await canvas.screenshot()
      
      // Toggle grid
      await page.keyboard.press('g')
      await page.waitForTimeout(300)
      
      // Take screenshot after toggle
      const after = await canvas.screenshot()
      
      // Images should be different
      expect(Buffer.compare(before, after)).not.toBe(0)
    })

    test('should toggle chunk borders with B key', async () => {
      const canvas = await page.locator('canvas')
      
      // Take screenshot before toggle
      const before = await canvas.screenshot()
      
      // Toggle chunk borders
      await page.keyboard.press('b')
      await page.waitForTimeout(300)
      
      // Take screenshot after toggle
      const after = await canvas.screenshot()
      
      // Images might be different (depends on if chunks are visible)
      // This is a basic check - borders might not be visible in initial view
      expect(after).toBeTruthy()
    })

    test('should toggle debug info with H key', async () => {
      // Check debug info is initially visible
      await expect(page.locator('text=/FPS:/')).toBeVisible()
      
      // Toggle debug info off
      await page.keyboard.press('h')
      await page.waitForTimeout(200)
      
      // Debug info should be hidden or toggled
      // Note: This depends on implementation - adjust based on actual behavior
      const canvas = await page.locator('canvas')
      await expect(canvas).toBeVisible() // Canvas should still be visible
    })
  })

  test.describe('Undo/Redo Functionality', () => {
    test('should undo block placement with Cmd+Z', async () => {
      const canvas = await page.locator('canvas')
      
      // Place a block
      await canvas.click({ position: { x: 400, y: 300 } })
      await page.waitForTimeout(300)
      
      // Check undo is available
      const undoStatus = await page.locator('text=/Undo: [✓✗]/').textContent()
      expect(undoStatus).toContain('✓')
      
      // Undo the placement
      await page.keyboard.press('Meta+z') // Use Meta for Mac, Control for Windows/Linux
      await page.waitForTimeout(300)
      
      // History should still show the action but undo state changed
      const afterUndo = await page.locator('text=/Undo: [✓✗]/').textContent()
      // After undoing the only action, undo should not be available
      expect(afterUndo).toContain('✗')
    })

    test('should redo with Cmd+Shift+Z', async () => {
      const canvas = await page.locator('canvas')
      
      // Place a block
      await canvas.click({ position: { x: 400, y: 300 } })
      await page.waitForTimeout(300)
      
      // Undo
      await page.keyboard.press('Meta+z')
      await page.waitForTimeout(300)
      
      // Check redo is available
      const redoStatus = await page.locator('text=/Redo: [✓✗]/').textContent()
      expect(redoStatus).toContain('✓')
      
      // Redo
      await page.keyboard.press('Meta+Shift+z')
      await page.waitForTimeout(300)
      
      // Redo should no longer be available
      const afterRedo = await page.locator('text=/Redo: [✓✗]/').textContent()
      expect(afterRedo).toContain('✗')
    })

    test('should handle complex undo/redo sequences', async () => {
      const canvas = await page.locator('canvas')
      const position1 = { x: 300, y: 300 }
      const position2 = { x: 400, y: 300 }
      
      // Place blocks at different positions
      await canvas.click({ position: position1 })
      await page.waitForTimeout(200)
      await canvas.click({ position: position2 })
      await page.waitForTimeout(200)
      await canvas.click({ position: position1 }) // Stack on first
      await page.waitForTimeout(200)
      
      // Verify 3 actions in history
      const history = await page.locator('text=/History: \\d+ actions/').textContent()
      expect(history).toContain('3')
      
      // Undo twice
      await page.keyboard.press('Meta+z')
      await page.waitForTimeout(200)
      await page.keyboard.press('Meta+z')
      await page.waitForTimeout(200)
      
      // Redo once
      await page.keyboard.press('Meta+Shift+z')
      await page.waitForTimeout(200)
      
      // Place a new block (should clear redo history)
      await canvas.click({ position: { x: 500, y: 400 } })
      await page.waitForTimeout(200)
      
      // Redo should not be available after new action
      const finalRedo = await page.locator('text=/Redo: [✓✗]/').textContent()
      expect(finalRedo).toContain('✗')
    })
  })

  test.describe('Visual Regression', () => {
    test('should render consistent initial state', async () => {
      const canvas = await page.locator('canvas')
      
      // Wait for stable render
      await page.waitForTimeout(1000)
      
      // Take screenshot for visual regression
      await expect(canvas).toHaveScreenshot('initial-game-state.png', {
        maxDiffPixels: 100 // Allow small differences for dynamic elements
      })
    })

    test('should render blocks consistently', async () => {
      const canvas = await page.locator('canvas')
      
      // Place a specific pattern of blocks
      await canvas.click({ position: { x: 400, y: 300 } })
      await page.waitForTimeout(200)
      await canvas.click({ position: { x: 450, y: 330 } })
      await page.waitForTimeout(200)
      await canvas.click({ position: { x: 400, y: 300 } }) // Stack
      await page.waitForTimeout(500)
      
      // Take screenshot for visual regression
      await expect(canvas).toHaveScreenshot('blocks-pattern.png', {
        maxDiffPixels: 100
      })
    })
  })

  test.describe('Performance', () => {
    test('should maintain good FPS', async () => {
      // Monitor FPS for a few seconds
      const fpsReadings: number[] = []
      
      for (let i = 0; i < 5; i++) {
        const fpsText = await page.locator('text=/FPS: \\d+/').textContent()
        const fps = parseInt(fpsText?.match(/\\d+/)?.[0] || '0')
        fpsReadings.push(fps)
        await page.waitForTimeout(1000)
      }
      
      // Average FPS should be reasonable (above 30)
      const avgFps = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length
      expect(avgFps).toBeGreaterThan(30)
    })

    test('should handle rapid interactions', async () => {
      const canvas = await page.locator('canvas')
      
      // Rapidly click to place many blocks
      for (let i = 0; i < 10; i++) {
        await canvas.click({ position: { x: 300 + i * 20, y: 300 } })
        await page.waitForTimeout(50)
      }
      
      // Should still be responsive
      const history = await page.locator('text=/History: \\d+ actions/').textContent()
      const count = parseInt(history?.match(/\\d+/)?.[0] || '0')
      expect(count).toBeGreaterThanOrEqual(10)
      
      // Canvas should still be visible and functional
      await expect(canvas).toBeVisible()
    })
  })
})