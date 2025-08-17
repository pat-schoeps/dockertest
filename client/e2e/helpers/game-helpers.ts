import { Page, Locator } from '@playwright/test'

export class GameHelper {
  constructor(private page: Page) {}

  async waitForGameLoad() {
    // Wait for canvas to be visible
    await this.page.waitForSelector('canvas', { timeout: 10000 })
    // Wait for game engine to initialize
    await this.page.waitForTimeout(1000)
  }

  get canvas(): Locator {
    return this.page.locator('canvas')
  }

  async getDebugInfo() {
    // Get the debug text content which contains all the info in one string
    const debugDiv = await this.page.locator('div').filter({ hasText: 'FPS:' }).first()
    const debugText = await debugDiv.textContent() || ''
    
    // Parse the text using regex patterns
    const fpsMatch = debugText.match(/FPS: (\\d+)/)
    const chunksMatch = debugText.match(/Chunks: (\\d+)/)
    const cameraMatch = debugText.match(/Camera: \\(([\\d.-]+), ([\\d.-]+)\\)/)
    const zoomMatch = debugText.match(/Zoom: ([\\d.]+)x/)
    const historyMatch = debugText.match(/History: (\\d+) actions/)
    const undoMatch = debugText.match(/Undo: ([✓✗])/)
    const redoMatch = debugText.match(/Redo: ([✓✗])/)

    return {
      fps: parseInt(fpsMatch?.[1] || '0'),
      chunks: parseInt(chunksMatch?.[1] || '0'),
      camera: cameraMatch ? [parseFloat(cameraMatch[1]), parseFloat(cameraMatch[2])] : null,
      zoom: parseFloat(zoomMatch?.[1] || '1'),
      historyCount: parseInt(historyMatch?.[1] || '0'),
      canUndo: undoMatch?.[1] === '✓',
      canRedo: redoMatch?.[1] === '✓',
    }
  }

  async placeBlock(x: number, y: number) {
    await this.canvas.click({ position: { x, y } })
    await this.page.waitForTimeout(200)
  }

  async removeBlock(x: number, y: number) {
    await this.canvas.click({ position: { x, y }, button: 'right' })
    await this.page.waitForTimeout(200)
  }

  async moveCamera(direction: 'w' | 'a' | 's' | 'd', steps: number = 1) {
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press(direction)
      await this.page.waitForTimeout(100)
    }
  }

  async zoom(direction: 'in' | 'out', steps: number = 1) {
    const key = direction === 'in' ? 'e' : 'q'
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press(key)
      await this.page.waitForTimeout(100)
    }
  }

  async wheelZoom(delta: number) {
    await this.canvas.hover()
    await this.page.mouse.wheel(0, delta)
    await this.page.waitForTimeout(200)
  }

  async toggleGrid() {
    await this.page.keyboard.press('g')
    await this.page.waitForTimeout(200)
  }

  async toggleChunkBorders() {
    await this.page.keyboard.press('b')
    await this.page.waitForTimeout(200)
  }

  async toggleDebugInfo() {
    await this.page.keyboard.press('h')
    await this.page.waitForTimeout(200)
  }

  async undo() {
    await this.page.keyboard.press('Meta+z')
    await this.page.waitForTimeout(200)
  }

  async redo() {
    await this.page.keyboard.press('Meta+Shift+z')
    await this.page.waitForTimeout(200)
  }

  async undoCtrl() {
    await this.page.keyboard.press('Control+z')
    await this.page.waitForTimeout(200)
  }

  async redoCtrl() {
    await this.page.keyboard.press('Control+Shift+z')
    await this.page.waitForTimeout(200)
  }

  async createBlockPattern(pattern: Array<{x: number, y: number, count?: number}>) {
    for (const block of pattern) {
      const count = block.count || 1
      for (let i = 0; i < count; i++) {
        await this.placeBlock(block.x, block.y)
      }
    }
  }

  async waitForStableFramerate(minFps: number = 30, samples: number = 3) {
    const readings: number[] = []
    
    for (let i = 0; i < samples; i++) {
      const debug = await this.getDebugInfo()
      readings.push(debug.fps)
      await this.page.waitForTimeout(1000)
    }
    
    const avgFps = readings.reduce((a, b) => a + b, 0) / readings.length
    return avgFps >= minFps
  }

  async takeCanvasScreenshot(name: string, options: { maxDiffPixels?: number } = {}) {
    return await this.canvas.screenshot({
      path: `test-results/screenshots/${name}`,
      ...options
    })
  }

  // Coordinate conversion helpers
  screenToGameCoords(screenX: number, screenY: number) {
    // This would need to be calibrated based on the actual game setup
    // For now, return screen coordinates
    return { x: screenX, y: screenY }
  }

  // Common test positions
  static get positions() {
    return {
      center: { x: 400, y: 300 },
      topLeft: { x: 200, y: 200 },
      topRight: { x: 600, y: 200 },
      bottomLeft: { x: 200, y: 400 },
      bottomRight: { x: 600, y: 400 },
    }
  }
}