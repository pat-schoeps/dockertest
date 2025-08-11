import { Renderer } from './Renderer.js'
import { Logger } from '../utils/Logger.js'

/**
 * Isometric renderer for rendering world chunks
 */
export class IsometricRenderer extends Renderer {
  constructor(engine, canvas) {
    super(engine, canvas)
    this.logger = new Logger('IsometricRenderer')
    
    // Isometric configuration
    this.tileWidth = 64
    this.tileHeight = 32
    this.tileDepth = 20 // Height per Z level
    
    // Rendering options
    this.showGrid = false
    this.showChunkBorders = false
    this.enableGlow = true
    
    // Visible chunks cache
    this.visibleChunks = new Set()
  }

  /**
   * Render a world with chunks
   * @param {Map<string, Chunk>} chunks - Chunks to render
   */
  renderWorld(chunks) {
    // Use proper frame lifecycle - don't apply standard camera transform for isometric
    this.beginFrame(false)
    
    // Get visible chunks
    const visibleChunks = this.getVisibleChunks(chunks)
    
    // Collect all renderables and sort by depth
    const renderables = []
    
    for (const chunk of visibleChunks) {
      // Add blocks
      for (const block of chunk.blocks.values()) {
        if (block.visible) {
          const worldPos = chunk.localToWorld(block.x, block.y)
          renderables.push({
            type: 'block',
            object: block,
            worldX: worldPos.x,
            worldY: worldPos.y,
            z: block.z,
            chunk: chunk
          })
        }
      }
      
      // Add entities
      for (const entity of chunk.entities.values()) {
        if (entity.visible && entity.active) {
          renderables.push({
            type: 'entity',
            object: entity,
            worldX: entity.x,
            worldY: entity.y,
            z: entity.z,
            chunk: chunk
          })
        }
      }
    }
    
    // Sort by isometric depth (back to front)
    renderables.sort((a, b) => {
      // First sort by sum of x and y (isometric rows)
      const depthA = a.worldX + a.worldY + a.z * 100
      const depthB = b.worldX + b.worldY + b.z * 100
      return depthA - depthB
    })
    
    // Debug: Log how many objects we're rendering
    if (renderables.length !== 16) {
      console.warn(`Expected 16 blocks, but rendering ${renderables.length} objects`)
    }
    
    // Render all objects
    for (const renderable of renderables) {
      if (renderable.type === 'block') {
        this.renderBlock(renderable.object, renderable.worldX, renderable.worldY)
      } else if (renderable.type === 'entity') {
        this.renderEntity(renderable.object)
      }
    }
    
    // Render overlays
    if (this.showGrid) {
      this.renderGrid(visibleChunks)
    }
    
    if (this.showChunkBorders) {
      this.renderChunkBorders(visibleChunks)
    }
    
    // End frame properly
    this.endFrame()
  }

  /**
   * Get visible chunks based on camera position
   * @param {Map<string, Chunk>} chunks - All chunks
   * @returns {Chunk[]}
   */
  getVisibleChunks(chunks) {
    // For now, just return all chunks since we have a simple 4x4 grid
    // This avoids any visibility culling issues
    return Array.from(chunks.values())
  }

  /**
   * Convert world coordinates to isometric screen coordinates
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {number} worldZ - World Z position
   * @returns {{x: number, y: number}}
   */
  worldToIsometric(worldX, worldY, worldZ = 0) {
    const isoX = (worldX - worldY) * (this.tileWidth / 2)
    const isoY = (worldX + worldY) * (this.tileHeight / 2) - worldZ * this.tileDepth
    return { x: isoX, y: isoY }
  }

  /**
   * Convert isometric screen coordinates to world coordinates
   * @param {number} isoX - Isometric X position
   * @param {number} isoY - Isometric Y position
   * @returns {{x: number, y: number}}
   */
  isometricToWorld(isoX, isoY) {
    const worldX = (isoX / (this.tileWidth / 2) + isoY / (this.tileHeight / 2)) / 2
    const worldY = (isoY / (this.tileHeight / 2) - isoX / (this.tileWidth / 2)) / 2
    return { x: worldX, y: worldY }
  }

  /**
   * Render a block
   * @param {Block} block - Block to render
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   */
  renderBlock(block, worldX, worldY) {
    // Get isometric position relative to camera
    const relX = worldX - this.camera.x
    const relY = worldY - this.camera.y
    const iso = this.worldToIsometric(relX, relY, block.z)
    
    // Apply zoom and center on screen
    const screenX = iso.x * this.camera.zoom + this.width / 2
    const screenY = iso.y * this.camera.zoom + this.height / 2
    
    // Save context for scaling
    this.ctx.save()
    this.ctx.translate(screenX, screenY)
    this.ctx.scale(this.camera.zoom, this.camera.zoom)
    
    // Draw block as isometric tile (now at origin due to translation)
    this.drawIsometricTile(
      0,
      0,
      this.tileWidth,
      this.tileHeight,
      block.color,
      block.z * this.tileDepth
    )
    
    this.ctx.restore()
    
    this.renderStats.drawCalls++
  }

  /**
   * Render an entity
   * @param {Entity} entity - Entity to render
   */
  renderEntity(entity) {
    // Get isometric position relative to camera
    const relX = entity.x - this.camera.x
    const relY = entity.y - this.camera.y
    const iso = this.worldToIsometric(relX, relY, entity.z)
    
    // Apply zoom and center on screen
    const screenX = iso.x * this.camera.zoom + this.width / 2
    const screenY = iso.y * this.camera.zoom + this.height / 2
    
    // Save context
    this.ctx.save()
    this.ctx.translate(screenX, screenY)
    this.ctx.scale(this.camera.zoom, this.camera.zoom)
    
    // Draw entity with glow effect
    if (this.enableGlow) {
      this.ctx.shadowColor = entity.color
      this.ctx.shadowBlur = 10
    }
    
    // Draw entity as isometric diamond/cube
    const size = Math.max(entity.width, entity.height) * this.tileWidth / 2
    this.drawIsometricCube(
      0,
      0,
      size,
      size * 0.5,
      size * 0.8,
      entity.color
    )
    
    // Reset shadow
    if (this.enableGlow) {
      this.ctx.shadowBlur = 0
    }
    
    // Draw health bar if damaged
    if (entity.health < entity.maxHealth) {
      this.drawHealthBar(
        0,
        -size,
        entity.health / entity.maxHealth
      )
    }
    
    this.ctx.restore()
    
    this.renderStats.drawCalls++
  }

  /**
   * Draw an isometric tile
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} width - Tile width
   * @param {number} height - Tile height
   * @param {string} color - Fill color
   * @param {number} depth - Z depth offset
   */
  drawIsometricTile(x, y, width, height, color, depth = 0) {
    this.ctx.save()
    
    // Top face (lighter)
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - depth)
    this.ctx.lineTo(x + width / 2, y + height / 2 - depth)
    this.ctx.lineTo(x, y + height - depth)
    this.ctx.lineTo(x - width / 2, y + height / 2 - depth)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()
    
    // Left face (darker) - only if depth > 0
    if (depth > 0) {
      this.ctx.fillStyle = this.darkenColor(color, 0.7)
      this.ctx.beginPath()
      this.ctx.moveTo(x - width / 2, y + height / 2 - depth)
      this.ctx.lineTo(x - width / 2, y + height / 2)
      this.ctx.lineTo(x, y + height)
      this.ctx.lineTo(x, y + height - depth)
      this.ctx.closePath()
      this.ctx.fill()
      
      // Right face (darker)
      this.ctx.fillStyle = this.darkenColor(color, 0.8)
      this.ctx.beginPath()
      this.ctx.moveTo(x, y + height - depth)
      this.ctx.lineTo(x, y + height)
      this.ctx.lineTo(x + width / 2, y + height / 2)
      this.ctx.lineTo(x + width / 2, y + height / 2 - depth)
      this.ctx.closePath()
      this.ctx.fill()
    }
    
    this.ctx.restore()
  }

  /**
   * Draw an isometric cube
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {number} width - Cube width
   * @param {number} height - Cube height
   * @param {number} depth - Cube depth
   * @param {string} color - Fill color
   */
  drawIsometricCube(x, y, width, height, depth, color) {
    this.ctx.save()
    
    // Top face
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - depth)
    this.ctx.lineTo(x + width / 2, y - depth + height / 2)
    this.ctx.lineTo(x, y - depth + height)
    this.ctx.lineTo(x - width / 2, y - depth + height / 2)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Left face
    this.ctx.fillStyle = this.darkenColor(color, 0.7)
    this.ctx.beginPath()
    this.ctx.moveTo(x - width / 2, y - depth + height / 2)
    this.ctx.lineTo(x - width / 2, y + height / 2)
    this.ctx.lineTo(x, y + height)
    this.ctx.lineTo(x, y - depth + height)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Right face
    this.ctx.fillStyle = this.darkenColor(color, 0.85)
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - depth + height)
    this.ctx.lineTo(x, y + height)
    this.ctx.lineTo(x + width / 2, y + height / 2)
    this.ctx.lineTo(x + width / 2, y - depth + height / 2)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Outline
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()
    
    this.ctx.restore()
  }

  /**
   * Draw health bar
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} percentage - Health percentage (0-1)
   */
  drawHealthBar(x, y, percentage) {
    const width = 40
    const height = 4
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(x - width / 2, y, width, height)
    
    // Health
    const healthColor = percentage > 0.5 ? '#00ff00' : 
                       percentage > 0.25 ? '#ffff00' : '#ff0000'
    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x - width / 2, y, width * percentage, height)
    
    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x - width / 2, y, width, height)
  }

  /**
   * Render grid overlay
   * @param {Chunk[]} chunks - Visible chunks
   */
  renderGrid(chunks) {
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 1 / this.camera.zoom
    
    for (const chunk of chunks) {
      for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
          const worldPos = chunk.localToWorld(x, y)
          
          // Get position relative to camera
          const relX = worldPos.x - this.camera.x
          const relY = worldPos.y - this.camera.y
          const iso = this.worldToIsometric(relX, relY)
          
          // Apply zoom and center on screen
          const screenX = iso.x * this.camera.zoom + this.width / 2
          const screenY = iso.y * this.camera.zoom + this.height / 2
          
          // Draw grid cell
          this.ctx.beginPath()
          this.ctx.moveTo(screenX, screenY)
          this.ctx.lineTo(screenX + this.tileWidth / 2 * this.camera.zoom, screenY + this.tileHeight / 2 * this.camera.zoom)
          this.ctx.lineTo(screenX, screenY + this.tileHeight * this.camera.zoom)
          this.ctx.lineTo(screenX - this.tileWidth / 2 * this.camera.zoom, screenY + this.tileHeight / 2 * this.camera.zoom)
          this.ctx.closePath()
          this.ctx.stroke()
        }
      }
    }
    
    this.ctx.restore()
  }

  /**
   * Render chunk borders
   * @param {Chunk[]} chunks - Visible chunks
   */
  renderChunkBorders(chunks) {
    this.ctx.save()
    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
    this.ctx.lineWidth = 2 / this.camera.zoom
    
    for (const chunk of chunks) {
      const corners = [
        chunk.localToWorld(0, 0),
        chunk.localToWorld(16, 0),
        chunk.localToWorld(16, 16),
        chunk.localToWorld(0, 16)
      ]
      
      // Convert corners to screen coordinates with camera transform
      const screenCorners = corners.map(c => {
        const relX = c.x - this.camera.x
        const relY = c.y - this.camera.y
        const iso = this.worldToIsometric(relX, relY)
        return {
          x: iso.x * this.camera.zoom + this.width / 2,
          y: iso.y * this.camera.zoom + this.height / 2
        }
      })
      
      this.ctx.beginPath()
      this.ctx.moveTo(screenCorners[0].x, screenCorners[0].y)
      for (let i = 1; i < screenCorners.length; i++) {
        this.ctx.lineTo(screenCorners[i].x, screenCorners[i].y)
      }
      this.ctx.closePath()
      this.ctx.stroke()
    }
    
    this.ctx.restore()
  }

  /**
   * Darken a color
   * @param {string} color - Hex color
   * @param {number} factor - Darken factor (0-1)
   * @returns {string}
   */
  darkenColor(color, factor) {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Darken
    const newR = Math.floor(r * factor)
    const newG = Math.floor(g * factor)
    const newB = Math.floor(b * factor)
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }

  /**
   * Toggle grid display
   */
  toggleGrid() {
    this.showGrid = !this.showGrid
  }

  /**
   * Toggle chunk borders display
   */
  toggleChunkBorders() {
    this.showChunkBorders = !this.showChunkBorders
  }

  /**
   * Toggle glow effects
   */
  toggleGlow() {
    this.enableGlow = !this.enableGlow
  }
}