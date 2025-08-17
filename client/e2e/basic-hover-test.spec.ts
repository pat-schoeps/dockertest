import { test, expect } from '@playwright/test'

test.describe('Basic Hover Test', () => {
  test('should show hover outline on any tile', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    console.log('🎯 Testing basic hover functionality...')
    
    // Take screenshot without hover
    const noHoverImage = await canvas.screenshot()
    expect(noHoverImage.length).toBeGreaterThan(1000)
    console.log('✅ Screenshot taken without hover')

    // Hover over a position
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)
    
    // Take screenshot with hover
    const hoverImage = await canvas.screenshot()
    expect(hoverImage.length).toBeGreaterThan(1000)
    
    // Images should be different (hover outline should appear)
    expect(Buffer.compare(noHoverImage, hoverImage)).not.toBe(0)
    console.log('✅ Hover outline appears (images are different)')

    // Move to different position
    await canvas.hover({ position: { x: 500, y: 350 } })
    await page.waitForTimeout(300)
    
    const hover2Image = await canvas.screenshot()
    expect(hover2Image.length).toBeGreaterThan(1000)
    
    // Should be different from first hover position
    expect(Buffer.compare(hoverImage, hover2Image)).not.toBe(0)
    console.log('✅ Hover outline moves with mouse')

    console.log('🎉 Basic hover functionality is working!')
  })
})