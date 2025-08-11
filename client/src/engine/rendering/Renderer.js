import { Module } from '../core/Module.js'
import { Logger } from '../utils/Logger.js'

/**
 * Base renderer class for canvas rendering
 */
export class Renderer extends Module {
  constructor(engine, canvas) {
    super('Renderer', engine)
    this.logger = new Logger('Renderer')
    
    this.canvas = canvas
    this.ctx = null
    this.width = 0
    this.height = 0
    
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    }
    
    this.backgroundColor = '#2a1a4a'
    this.showDebug = false
    this.renderStats = {
      drawCalls: 0,
      lastFrameTime: 0
    }
  }

  /**
   * Set the canvas element
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  setCanvas(canvas) {
    this.canvas = canvas
    if (canvas) {
      this.ctx = canvas.getContext('2d')
      this.resize()
    }
  }

  async onInitialize() {
    if (!this.canvas) {
      throw new Error('Canvas not set for renderer')
    }
    
    this.ctx = this.canvas.getContext('2d')
    this.resize()
    
    // Listen for window resize
    window.addEventListener('resize', () => this.resize())
    
    this.logger.info('Renderer initialized')
  }

  /**
   * Resize canvas to match its display size
   */
  resize() {
    if (!this.canvas) return
    
    // Get the display size
    const displayWidth = this.canvas.clientWidth
    const displayHeight = this.canvas.clientHeight
    
    // Check if the canvas resolution matches display size
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
      this.width = displayWidth
      this.height = displayHeight
      
      this.engine.eventBus.emit('renderer:resize', {
        width: this.width,
        height: this.height
      })
      
      this.logger.info(`Canvas resized to ${this.width}x${this.height}`)
    }
  }

  /**
   * Set camera position
   * @param {number} x - Camera X position
   * @param {number} y - Camera Y position
   */
  setCamera(x, y) {
    this.camera.x = x
    this.camera.y = y
  }

  /**
   * Set camera zoom
   * @param {number} zoom - Zoom level
   */
  setZoom(zoom) {
    this.camera.zoom = Math.max(0.1, Math.min(10, zoom))
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @returns {{x: number, y: number}}
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (screenY - this.height / 2) / this.camera.zoom + this.camera.y
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @returns {{x: number, y: number}}
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom + this.width / 2,
      y: (worldY - this.camera.y) * this.camera.zoom + this.height / 2
    }
  }

  /**
   * Check if a world position is visible on screen
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {number} size - Object size (for bounds checking)
   * @returns {boolean}
   */
  isVisible(worldX, worldY, size = 0) {
    const screen = this.worldToScreen(worldX, worldY)
    const halfSize = size * this.camera.zoom / 2
    
    return screen.x + halfSize >= 0 && 
           screen.x - halfSize <= this.width &&
           screen.y + halfSize >= 0 && 
           screen.y - halfSize <= this.height
  }

  /**
   * Begin frame rendering
   * @param {boolean} applyTransform - Whether to apply camera transform (default true)
   */
  beginFrame(applyTransform = true) {
    this.renderStats.drawCalls = 0
    this.renderStats.lastFrameTime = performance.now()
    
    // Reset canvas transform to identity
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    
    // Clear canvas
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Save context state
    this.ctx.save()
    
    // Apply camera transform only if requested (for standard 2D rendering)
    if (applyTransform) {
      this.ctx.translate(this.width / 2, this.height / 2)
      this.ctx.scale(this.camera.zoom, this.camera.zoom)
      this.ctx.translate(-this.camera.x, -this.camera.y)
    }
  }

  /**
   * End frame rendering
   */
  endFrame() {
    // Restore context state
    this.ctx.restore()
    
    // Draw debug info if enabled
    if (this.showDebug) {
      this.drawDebugInfo()
    }
    
    this.renderStats.lastFrameTime = performance.now() - this.renderStats.lastFrameTime
  }

  /**
   * Draw a rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {string} color - Fill color
   * @param {string} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  drawRect(x, y, width, height, color, strokeColor = null, strokeWidth = 1) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
    
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = strokeWidth
      this.ctx.strokeRect(x, y, width, height)
    }
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw a circle
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} radius - Radius
   * @param {string} color - Fill color
   * @param {string} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  drawCircle(x, y, radius, color, strokeColor = null, strokeWidth = 1) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    
    if (color) {
      this.ctx.fillStyle = color
      this.ctx.fill()
    }
    
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor
      this.ctx.lineWidth = strokeWidth
      this.ctx.stroke()
    }
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw a line
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {string} color - Line color
   * @param {number} width - Line width
   */
  drawLine(x1, y1, x2, y2, color, width = 1) {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = width
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw text
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} color - Text color
   * @param {string} font - Font string
   * @param {string} align - Text alignment
   */
  drawText(text, x, y, color = 'white', font = '16px monospace', align = 'left') {
    this.ctx.font = font
    this.ctx.fillStyle = color
    this.ctx.textAlign = align
    this.ctx.fillText(text, x, y)
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw an image
   * @param {HTMLImageElement} image - Image to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width (optional)
   * @param {number} height - Height (optional)
   */
  drawImage(image, x, y, width = null, height = null) {
    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height)
    } else {
      this.ctx.drawImage(image, x, y)
    }
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw debug information
   */
  drawDebugInfo() {
    const debugInfo = [
      `FPS: ${this.engine.getFPS()}`,
      `Draw Calls: ${this.renderStats.drawCalls}`,
      `Frame Time: ${this.renderStats.lastFrameTime.toFixed(2)}ms`,
      `Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`,
      `Zoom: ${this.camera.zoom.toFixed(2)}x`
    ]
    
    this.ctx.save()
    this.ctx.font = '14px monospace'
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 10, 200, debugInfo.length * 20 + 10)
    
    this.ctx.fillStyle = '#00ff88'
    debugInfo.forEach((line, i) => {
      this.ctx.fillText(line, 15, 30 + i * 20)
    })
    this.ctx.restore()
  }

  /**
   * Toggle debug display
   */
  toggleDebug() {
    this.showDebug = !this.showDebug
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  async onDestroy() {
    window.removeEventListener('resize', () => this.resize())
  }
}