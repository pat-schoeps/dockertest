import { test, expect } from '@playwright/test'

test.describe('Rapid Undo Test', () => {
  test('should handle rapid consecutive undo keypresses', async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🔄 Undo called')) {
        consoleMessages.push(msg.text())
        console.log('UNDO EVENT:', msg.text())
      }
    })

    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas')

    // Place three blocks on top of each other
    const position = { x: 400, y: 300 }
    for (let i = 0; i < 3; i++) {
      await canvas.click({ position })
      await page.waitForTimeout(200) // Small delay between placements
    }
    
    // Verify all blocks were placed
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 3 actions')
    console.log('✅ Three blocks placed')

    // Clear console messages
    consoleMessages.length = 0

    // Simulate rapid Cmd+Z presses (like a user would do)
    // Press three times in quick succession with minimal delay
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(50) // Very short delay
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(50) // Very short delay
    await page.keyboard.press('Meta+z')
    
    // Wait for all operations to complete
    await page.waitForTimeout(500)
    
    // Check final state
    bodyText = await page.textContent('body')
    console.log('Final state:', bodyText?.match(/History: \d+ actions|Undo: [✓✗]/g))
    
    // Should have processed all three undos
    expect(bodyText).toContain('History: 3 actions')
    expect(bodyText).toContain('Undo: ✗') // Cannot undo anymore
    expect(bodyText).toContain('Redo: ✓') // Can redo
    
    // Check that we got three undo calls
    console.log(`\n📊 Undo calls captured: ${consoleMessages.length}`)
    consoleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`))
    
    expect(consoleMessages.length).toBe(3)
    console.log('✅ All three rapid undos were processed!')
  })
})