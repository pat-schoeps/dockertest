import { test, expect } from '@playwright/test'

test.describe('Multi-Undo Simplified Test', () => {
  test('should verify multi-undo works in Chromium', async ({ page }) => {
    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000) // Let game initialize

    const canvas = page.locator('canvas')

    console.log('🎯 Testing multi-undo functionality...')
    
    // Place two blocks
    await canvas.click({ position: { x: 350, y: 300 } })
    await page.waitForTimeout(300)
    await canvas.click({ position: { x: 450, y: 300 } })
    await page.waitForTimeout(300)
    
    // Verify both blocks were placed
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    expect(bodyText).toContain('Undo: ✓')
    console.log('✅ Two blocks placed successfully')

    // First undo
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    expect(bodyText).toContain('Undo: ✓') // Should still be able to undo
    expect(bodyText).toContain('Redo: ✓') // Should be able to redo
    console.log('✅ First undo completed')

    // Second undo  
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(300)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    expect(bodyText).toContain('Undo: ✗') // Should NOT be able to undo anymore
    expect(bodyText).toContain('Redo: ✓') // Should be able to redo
    console.log('✅ Second undo completed')
    console.log('🎉 Multi-undo functionality is working correctly!')
  })
})