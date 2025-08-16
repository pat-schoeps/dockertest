import { Module } from '../core/Module.js'
import { Logger } from '../utils/Logger.js'

/**
 * State manager for tracking game state and UI state
 */
export class StateManager extends Module {
  constructor(engine) {
    super('StateManager', engine)
    this.logger = new Logger('StateManager')
    
    // World state - persisted data
    this.worldState = {
      blocks: new Map(),      // All blocks in the world
      entities: new Map(),    // All entities in the world
      chunks: new Map()       // Chunk metadata
    }
    
    // UI/Interaction state - ephemeral
    this.uiState = {
      hoveredTile: null,      // Currently hovered grid tile {x, y}
      selectedTile: null,     // Currently selected tile {x, y}
      mouseWorldPos: null,    // Mouse position in world coordinates {x, y}
      isPlacingBlock: false,  // Whether in block placement mode
      isDeletingBlock: false, // Whether in block deletion mode
      currentTool: 'select'   // Current tool: 'select', 'place', 'delete'
    }
    
    // History for undo/redo (future feature)
    this.history = []
    this.historyIndex = -1
    this.maxHistory = 50
  }

  async onInitialize() {
    // Listen for mouse movement events
    this.engine.eventBus.on('input:mousemove', ({ worldX, worldY, screenX, screenY }) => {
      this.updateMousePosition(worldX, worldY)
      this.updateHoveredTile(worldX, worldY)
    })
    
    // Listen for mouse leave events
    this.engine.eventBus.on('input:mouseleave', () => {
      this.clearHoveredTile()
    })
    
    // Listen for mouse clicks
    this.engine.eventBus.on('input:mousedown', ({ worldX, worldY, button }) => {
      if (button === 0) { // Left click
        this.handleTileClick(worldX, worldY)
      } else if (button === 2) { // Right click
        this.handleTileRightClick(worldX, worldY)
      }
    })
    
    // Listen for keyboard shortcuts
    this.engine.eventBus.on('input:keydown', ({ key }) => {
      this.handleKeyPress(key)
    })
    
    // Listen for block changes from world
    this.engine.eventBus.on('block:added', ({ block, worldX, worldY, z }) => {
      const key = `${worldX},${worldY},${z}`
      this.worldState.blocks.set(key, block)
    })
    
    this.engine.eventBus.on('block:removed', ({ worldX, worldY, z }) => {
      const key = `${worldX},${worldY},${z}`
      this.worldState.blocks.delete(key)
    })
    
    this.logger.info('StateManager initialized')
  }
  
  /**
   * Update mouse position in world coordinates
   */
  updateMousePosition(worldX, worldY) {
    this.uiState.mouseWorldPos = { x: worldX, y: worldY }
  }
  
  /**
   * Update the currently hovered tile
   */
  updateHoveredTile(worldX, worldY) {
    // Convert world position to grid tile position
    const tileX = Math.floor(worldX)
    const tileY = Math.floor(worldY)
    
    // Check if this is a different tile than currently hovered
    const prevHovered = this.uiState.hoveredTile
    if (!prevHovered || prevHovered.x !== tileX || prevHovered.y !== tileY) {
      this.uiState.hoveredTile = { x: tileX, y: tileY }
      
      
      // Emit hover change event
      this.engine.eventBus.emit('tile:hover', {
        current: { x: tileX, y: tileY },
        previous: prevHovered
      })
    }
  }
  
  /**
   * Clear the hovered tile
   */
  clearHoveredTile() {
    const prevHovered = this.uiState.hoveredTile
    this.uiState.hoveredTile = null
    
    if (prevHovered) {
      this.engine.eventBus.emit('tile:hover', {
        current: null,
        previous: prevHovered
      })
    }
  }
  
  /**
   * Handle tile click
   */
  handleTileClick(worldX, worldY) {
    const tileX = Math.floor(worldX)
    const tileY = Math.floor(worldY)
    
    // Update selected tile
    this.uiState.selectedTile = { x: tileX, y: tileY }
    
    // Check if there's a block at this position
    const blockKey = `${tileX},${tileY},0`
    const hasBlock = this.worldState.blocks.has(blockKey)
    
    // Default behavior: left click places blocks, right click removes them
    if (this.uiState.currentTool === 'select') {
      // In select mode, left click places blocks if no block exists
      if (!hasBlock) {
        this.engine.eventBus.emit('tile:requestPlace', { x: tileX, y: tileY, z: 0 })
      } else {
        // If block exists, just select it
        this.engine.eventBus.emit('tile:selected', { x: tileX, y: tileY })
      }
    } else if (this.uiState.currentTool === 'place' && !hasBlock) {
      this.engine.eventBus.emit('tile:requestPlace', { x: tileX, y: tileY, z: 0 })
    } else if (this.uiState.currentTool === 'delete' && hasBlock) {
      this.engine.eventBus.emit('tile:requestDelete', { x: tileX, y: tileY, z: 0 })
    } else {
      this.engine.eventBus.emit('tile:selected', { x: tileX, y: tileY })
    }
  }
  
  /**
   * Handle tile right click
   */
  handleTileRightClick(worldX, worldY) {
    const tileX = Math.floor(worldX)
    const tileY = Math.floor(worldY)
    
    // Right click to delete block
    const blockKey = `${tileX},${tileY},0`
    if (this.worldState.blocks.has(blockKey)) {
      this.engine.eventBus.emit('tile:requestDelete', { x: tileX, y: tileY, z: 0 })
    }
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(key) {
    switch(key) {
      case 'Digit1':
      case 'KeyS':
        this.setTool('select')
        break
      case 'Digit2':
      case 'KeyP':
        this.setTool('place')
        break
      case 'Digit3':
      case 'KeyX':
        this.setTool('delete')
        break
      case 'Escape':
        this.clearSelection()
        break
    }
  }
  
  /**
   * Set the current tool
   */
  setTool(tool) {
    const prevTool = this.uiState.currentTool
    this.uiState.currentTool = tool
    
    // Update flags
    this.uiState.isPlacingBlock = (tool === 'place')
    this.uiState.isDeletingBlock = (tool === 'delete')
    
    this.engine.eventBus.emit('tool:changed', {
      current: tool,
      previous: prevTool
    })
    
    this.logger.info(`Tool changed to: ${tool}`)
  }
  
  /**
   * Clear selection
   */
  clearSelection() {
    this.uiState.selectedTile = null
    this.engine.eventBus.emit('tile:deselected')
  }
  
  /**
   * Get current UI state
   */
  getUIState() {
    return { ...this.uiState }
  }
  
  /**
   * Get hovered tile
   */
  getHoveredTile() {
    return this.uiState.hoveredTile
  }
  
  /**
   * Get selected tile
   */
  getSelectedTile() {
    return this.uiState.selectedTile
  }
  
  /**
   * Check if a tile has a block
   */
  hasBlockAt(x, y, z = 0) {
    return this.worldState.blocks.has(`${x},${y},${z}`)
  }
  
  onUpdate(deltaTime) {
    // State manager doesn't need regular updates
  }
  
  async onDestroy() {
    this.worldState.blocks.clear()
    this.worldState.entities.clear()
    this.worldState.chunks.clear()
    this.history = []
    
    this.logger.info('StateManager destroyed')
  }
}