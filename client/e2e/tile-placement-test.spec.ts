import { test, expect } from '@playwright/test'

test.describe('2D Tile Placement Test', () => {
  test('should switch between 3D blocks and 2D tiles placement modes', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing 2D tile placement functionality...')
    
    // Step 1: Verify initial placement mode is 3D blocks
    const placementModeToggle = page.locator('[role="radiogroup"]')
    await expect(placementModeToggle).toBeVisible()
    
    // Should be on 3D Block mode initially
    const activeButton = page.locator('[role="radiogroup"] [data-active="true"]').first()
    await expect(activeButton).toContainText('3D Block')
    console.log('✅ Initial placement mode is 3D blocks')

    // Step 2: Place a 3D block first
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    console.log('✅ 3D block placed')

    // Step 3: Switch to 2D tile mode
    const tileButton = page.locator('text=2D Tile')
    await tileButton.click()
    await page.waitForTimeout(300)
    
    // Verify the mode switched
    const activeTileButton = page.locator('[role="radiogroup"] [data-active="true"]').first()
    await expect(activeTileButton).toContainText('2D Tile')
    console.log('✅ Switched to 2D tile mode')

    // Step 4: Place a 2D tile at a different position
    await canvas.click({ position: { x: 450, y: 300 } })
    await page.waitForTimeout(300)
    
    // Check that an action was recorded (2D tile placement)
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    console.log('✅ 2D tile placed')

    // Step 5: Try to place another 2D tile at the same position (should be prevented)
    await canvas.click({ position: { x: 450, y: 300 } })
    await page.waitForTimeout(300)
    
    // History should still be 2 actions (no new tile placed)
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    console.log('✅ Duplicate 2D tile placement prevented')

    // Step 6: Switch back to 3D blocks and place another block
    const blockButton = page.locator('text=3D Block')
    await blockButton.click()
    await page.waitForTimeout(300)
    
    await canvas.click({ position: { x: 500, y: 300 } })
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
    console.log('✅ Switched back to 3D blocks and placed another block')

    console.log('🎉 2D tile placement functionality is working correctly!')
  })
})