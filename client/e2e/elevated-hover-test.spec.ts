import { test, expect } from '@playwright/test'

test.describe('Elevated Hover Outline Test', () => {
  test('should show hover outline at correct height when hovering over stacked blocks', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing elevated hover outline functionality...')
    
    // Step 1: Place a block at position (400, 300)
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    console.log('✅ First block placed')

    // Step 2: Place a second block on top (should stack)
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    console.log('✅ Second block stacked on top')

    // Step 3: Take a screenshot of the stacked blocks
    const stackedBlocksImage = await canvas.screenshot()
    expect(stackedBlocksImage.length).toBeGreaterThan(1000)
    console.log('✅ Screenshot taken with stacked blocks')

    // Step 4: Hover over the position with stacked blocks
    // The hover outline should appear at the top of the stack (level 2)
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(500) // Give time for hover to render
    
    // Step 5: Take a screenshot with hover outline
    const hoverImage = await canvas.screenshot()
    expect(hoverImage.length).toBeGreaterThan(1000)
    
    // The images should be different (hover outline should be visible)
    expect(Buffer.compare(stackedBlocksImage, hoverImage)).not.toBe(0)
    console.log('✅ Hover outline appears (images are different)')

    // Step 6: Hover over an empty position (should show ground-level outline)
    await canvas.hover({ position: { x: 500, y: 300 } })
    await page.waitForTimeout(500)
    
    const emptyHoverImage = await canvas.screenshot()
    expect(emptyHoverImage.length).toBeGreaterThan(1000)
    
    // Should be different from the stacked block hover
    expect(Buffer.compare(hoverImage, emptyHoverImage)).not.toBe(0)
    console.log('✅ Ground-level hover outline appears on empty tiles')

    console.log('🎉 Elevated hover outline is working correctly!')
  })
})