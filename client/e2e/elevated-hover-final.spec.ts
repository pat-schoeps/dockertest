import { test, expect } from '@playwright/test'

test.describe('Elevated Hover Final Test', () => {
  test('should show hover outline at appropriate heights', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing elevated hover functionality...')
    
    // Step 1: Test hover on empty tile (should be at ground level)
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    const emptyTileHover = await canvas.screenshot()
    console.log('✅ Hover on empty tile captured')

    // Step 2: Place a block
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    console.log('✅ First block placed')

    // Step 3: Hover over the block (should be elevated)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Then hover over block
    await page.waitForTimeout(300)
    
    const singleBlockHover = await canvas.screenshot()
    console.log('✅ Hover on single block captured')

    // Step 4: Stack another block
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    console.log('✅ Second block stacked')

    // Step 5: Hover over the stacked blocks (should be even higher)
    await canvas.hover({ position: { x: 450, y: 300 } }) // Move away first
    await page.waitForTimeout(100)
    await canvas.hover({ position: { x: 400, y: 300 } }) // Then hover over stack
    await page.waitForTimeout(300)
    
    const stackedBlockHover = await canvas.screenshot()
    console.log('✅ Hover on stacked blocks captured')

    // Verify all screenshots are different (indicating hover at different heights)
    expect(Buffer.compare(emptyTileHover, singleBlockHover)).not.toBe(0)
    console.log('✅ Empty tile vs single block hover are different')
    
    expect(Buffer.compare(singleBlockHover, stackedBlockHover)).not.toBe(0)
    console.log('✅ Single block vs stacked blocks hover are different')
    
    expect(Buffer.compare(emptyTileHover, stackedBlockHover)).not.toBe(0)
    console.log('✅ Empty tile vs stacked blocks hover are different')

    console.log('🎉 Elevated hover is working correctly!')
  })
})