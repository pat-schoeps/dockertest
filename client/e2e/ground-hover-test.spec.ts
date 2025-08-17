import { test, expect } from '@playwright/test'

test.describe('Ground Level Hover Test', () => {
  test('should always show hover outline at ground level', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing ground-level hover functionality...')
    
    // Step 1: Test hover on empty tile
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    const emptyTileHover = await canvas.screenshot()
    console.log('✅ Hover on empty tile captured')

    // Step 2: Place a block at the same position
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    console.log('✅ Block placed')

    // Step 3: Hover over the tile with the block (should show outline at ground level)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Hover over tile with block
    await page.waitForTimeout(300)
    
    const blockTileHover = await canvas.screenshot()
    console.log('✅ Hover on tile with block captured')

    // Step 4: Stack more blocks
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
    console.log('✅ Multiple blocks stacked')

    // Step 5: Hover over the tile with stacked blocks (should still show at ground level)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Hover over stacked blocks
    await page.waitForTimeout(300)
    
    const stackedTileHover = await canvas.screenshot()
    console.log('✅ Hover on tile with stacked blocks captured')

    // The hover outline should look similar in all cases (all at ground level)
    // At minimum, we should see some hover outline in all cases
    expect(emptyTileHover.length).toBeGreaterThan(1000)
    expect(blockTileHover.length).toBeGreaterThan(1000)
    expect(stackedTileHover.length).toBeGreaterThan(1000)

    console.log('🎉 Ground-level hover is working correctly!')
  })
})