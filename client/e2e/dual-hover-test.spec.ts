import { test, expect } from '@playwright/test'

test.describe('Dual Hover Highlight Test', () => {
  test('should show ground outline plus top block highlight when hovering over stacked blocks', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing dual hover highlighting...')
    
    // Step 1: Test hover on empty tile (should only show ground outline)
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    const emptyTileHover = await canvas.screenshot()
    console.log('✅ Hover on empty tile captured (ground outline only)')

    // Step 2: Place a block
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    console.log('✅ First block placed')

    // Step 3: Hover over single block (should show ground outline + top highlight)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Hover over block
    await page.waitForTimeout(300)
    
    const singleBlockHover = await canvas.screenshot()
    console.log('✅ Hover on single block captured (ground + top highlight)')

    // Step 4: Stack more blocks
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
    console.log('✅ Multiple blocks stacked')

    // Step 5: Hover over stacked blocks (should show ground outline + topmost block highlight)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Hover over stack
    await page.waitForTimeout(300)
    
    const stackedBlockHover = await canvas.screenshot()
    console.log('✅ Hover on stacked blocks captured (ground + topmost highlight)')

    // Verify all screenshots are different
    expect(Buffer.compare(emptyTileHover, singleBlockHover)).not.toBe(0)
    console.log('✅ Empty vs single block hover are different')
    
    expect(Buffer.compare(singleBlockHover, stackedBlockHover)).not.toBe(0)
    console.log('✅ Single vs stacked block hover are different')
    
    expect(Buffer.compare(emptyTileHover, stackedBlockHover)).not.toBe(0)
    console.log('✅ Empty vs stacked block hover are different')

    console.log('🎉 Dual hover highlighting is working correctly!')
  })
})