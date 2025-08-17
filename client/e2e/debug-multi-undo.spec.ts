import { test, expect } from '@playwright/test'

test.describe('Multi-Undo Debug Test', () => {
  test('should investigate why multi-undo fails', async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('📝 Recording action') ||
        msg.text().includes('🔄 Undo called') ||
        msg.text().includes('✅ Undoing action') ||
        msg.text().includes('📉 Decremented historyIndex') ||
        msg.text().includes('❌ Nothing to undo')
      )) {
        consoleMessages.push(msg.text())
        console.log('🔍 CONSOLE:', msg.text())
      }
    })

    // Navigate to test page  
    await page.goto('/test-game')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000) // Let game initialize

    const canvas = page.locator('canvas')

    console.log('\n🎯 PHASE 1: Place two blocks')
    
    // Click 1: Place first block
    await canvas.click({ position: { x: 350, y: 300 } })
    await page.waitForTimeout(500)
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 1 actions')
    expect(bodyText).toContain('Undo: ✓')
    console.log('✅ First block placed, history = 1')

    // Click 2: Place second block  
    await canvas.click({ position: { x: 450, y: 300 } })
    await page.waitForTimeout(500)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions')
    expect(bodyText).toContain('Undo: ✓')
    console.log('✅ Second block placed, history = 2')

    console.log('\n🎯 PHASE 2: Test first undo')
    
    // First undo
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(500)
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('History: 2 actions') // History doesn't change
    expect(bodyText).toContain('Undo: ✓') // Should still be able to undo
    expect(bodyText).toContain('Redo: ✓') // Should be able to redo
    console.log('✅ First undo completed')

    console.log('\n🎯 PHASE 3: Test second undo (this is where the bug likely occurs)')
    
    // Second undo - this is where the problem occurs
    await page.keyboard.press('Meta+z')
    await page.waitForTimeout(500)
    
    bodyText = await page.textContent('body')
    console.log('📊 After second undo:', bodyText?.match(/History: \d+ actions|Undo: [✓✗]|Redo: [✓✗]/g))
    
    // Expected behavior:
    expect(bodyText).toContain('History: 2 actions') // History doesn't change
    expect(bodyText).toContain('Undo: ✗') // Should NOT be able to undo anymore
    expect(bodyText).toContain('Redo: ✓') // Should be able to redo

    console.log('\n📝 Console messages captured:')
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`)
    })

    // Verify we got the expected console messages
    const recordingMessages = consoleMessages.filter(msg => msg.includes('📝 Recording action'))
    const undoMessages = consoleMessages.filter(msg => msg.includes('🔄 Undo called'))
    const undoingMessages = consoleMessages.filter(msg => msg.includes('✅ Undoing action'))
    
    console.log(`\n📊 Message counts:`)
    console.log(`   Recording: ${recordingMessages.length} (expected: 2)`)
    console.log(`   Undo called: ${undoMessages.length} (expected: 2)`)
    console.log(`   Undoing action: ${undoingMessages.length} (expected: 2)`)

    // If second undo doesn't work, we won't see the second "🔄 Undo called"
    if (undoMessages.length < 2) {
      console.log('🚨 BUG CONFIRMED: Second undo was not called!')
      console.log('🔍 This suggests the issue is in the key event handling or undo availability check')
    }
  })
})