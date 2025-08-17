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
    
    // History for undo/redo
    this.history = []
    this.historyIndex = -1
    this.maxHistory = 50
    this.isUndoingOrRedoing = false // Prevent recording undo actions during undo/redo
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
    this.engine.eventBus.on('input:keydown', ({ key, event }) => {
      this.handleKeyPress(key, event)
    })
    
    // Listen for block changes from world
    this.engine.eventBus.on('block:added', ({ block, worldX, worldY, z }) => {
      const key = `${worldX},${worldY},${z}`
      this.worldState.blocks.set(key, block)
      
      // Record action for undo if not currently undoing/redoing
      if (!this.isUndoingOrRedoing) {
        this.recordAction({
          type: 'block:placed',
          data: {
            x: worldX,
            y: worldY,
            z: z,
            block: block.clone() // Store a copy of the block
          },
          undo: {
            type: 'block:remove',
            data: { x: worldX, y: worldY, z: z }
          }
        })
      }
    })
    
    this.engine.eventBus.on('block:removed', ({ block, worldX, worldY, z }) => {
      const key = `${worldX},${worldY},${z}`
      this.worldState.blocks.delete(key)
      
      // Record action for undo if not currently undoing/redoing
      if (!this.isUndoingOrRedoing && block) {
        this.recordAction({
          type: 'block:removed',
          data: {
            x: worldX,
            y: worldY,
            z: z
          },
          undo: {
            type: 'block:place',
            data: {
              x: worldX,
              y: worldY,
              z: z,
              block: block.clone() // Store a copy of the removed block
            }
          }
        })
      }
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
    
    // Find the highest block at this position
    const highestZ = this.getHighestBlockZ(tileX, tileY)
    const hasAnyBlock = highestZ >= 0
    
    // Default behavior: left click places blocks (stacks if blocks exist), right click removes them
    if (this.uiState.currentTool === 'select') {
      // In select mode, left click always places blocks (stacks on top if blocks exist)
      const targetZ = hasAnyBlock ? highestZ + 1 : 0
      this.engine.eventBus.emit('tile:requestPlace', { x: tileX, y: tileY, z: targetZ })
    } else if (this.uiState.currentTool === 'place') {
      // Place mode - always stack on top
      const targetZ = hasAnyBlock ? highestZ + 1 : 0
      this.engine.eventBus.emit('tile:requestPlace', { x: tileX, y: tileY, z: targetZ })
    } else if (this.uiState.currentTool === 'delete' && hasAnyBlock) {
      // Delete mode - remove the topmost block
      this.engine.eventBus.emit('tile:requestDelete', { x: tileX, y: tileY, z: highestZ })
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
    
    // Right click to delete the topmost block
    const highestZ = this.getHighestBlockZ(tileX, tileY)
    if (highestZ >= 0) {
      this.engine.eventBus.emit('tile:requestDelete', { x: tileX, y: tileY, z: highestZ })
    }
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(key, event) {
    // Check for undo/redo shortcuts first
    if (event && (event.metaKey || event.ctrlKey)) {
      switch(key) {
        case 'KeyZ':
          event.preventDefault()
          if (event.shiftKey) {
            this.redo()
          } else {
            this.undo()
          }
          return
      }
    }
    
    // Regular tool shortcuts
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
  
  /**
   * Find the highest block Z-coordinate at the given position
   * @param {number} x - Tile X position
   * @param {number} y - Tile Y position
   * @returns {number} Highest Z coordinate, or -1 if no blocks
   */
  getHighestBlockZ(x, y) {
    let highestZ = -1
    
    // Search through all blocks to find the highest Z at this X,Y position
    for (const [key, block] of this.worldState.blocks) {
      const [blockX, blockY, blockZ] = key.split(',').map(Number)
      if (blockX === x && blockY === y && blockZ > highestZ) {
        highestZ = blockZ
      }
    }
    
    return highestZ
  }

  /**
   * Record an action for undo/redo
   * @param {Object} action - Action object with type, data, and undo properties
   */
  recordAction(action) {
    console.log(`📝 Recording action: ${action.type}, isUndoingOrRedoing=${this.isUndoingOrRedoing}`)
    
    // Remove any future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
      console.log(`✂️ Trimmed future history`)
    }
    
    // Add the action with timestamp
    this.history.push({
      ...action,
      timestamp: Date.now()
    })
    
    // Maintain max history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
    
    console.log(`✅ Action recorded: historyIndex=${this.historyIndex}, historyLength=${this.history.length}`)
    this.logger.debug(`Recorded action: ${action.type}`, action.data)
  }

  /**
   * Undo the last action
   */
  undo() {
    console.log(`🔄 Undo called: historyIndex=${this.historyIndex}, historyLength=${this.history.length}`)
    
    if (this.historyIndex < 0 || this.historyIndex >= this.history.length) {
      this.logger.info('Nothing to undo')
      console.log('❌ Nothing to undo')
      return
    }
    
    const action = this.history[this.historyIndex]
    this.logger.info(`Undoing: ${action.type}`)
    console.log(`✅ Undoing action: ${action.type} at index ${this.historyIndex}`)
    
    // Set flag to prevent recording undo actions
    this.isUndoingOrRedoing = true
    console.log(`🚫 Set isUndoingOrRedoing = true`)
    
    try {
      // Execute the undo action
      this.executeUndoAction(action.undo)
      this.historyIndex--
      console.log(`📉 Decremented historyIndex to ${this.historyIndex}`)
      
      this.engine.eventBus.emit('action:undone', { action })
    } catch (error) {
      this.logger.error('Failed to undo action:', error)
      console.error('❌ Undo failed:', error)
    } finally {
      this.isUndoingOrRedoing = false
      console.log(`✅ Set isUndoingOrRedoing = false`)
    }
  }

  /**
   * Redo the next action
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      this.logger.info('Nothing to redo')
      return
    }
    
    this.historyIndex++
    const action = this.history[this.historyIndex]
    this.logger.info(`Redoing: ${action.type}`)
    
    // Set flag to prevent recording redo actions
    this.isUndoingOrRedoing = true
    
    try {
      // Execute the original action again
      this.executeRedoAction(action)
      
      this.engine.eventBus.emit('action:redone', { action })
    } catch (error) {
      this.logger.error('Failed to redo action:', error)
      this.historyIndex-- // Revert index on error
    } finally {
      this.isUndoingOrRedoing = false
    }
  }

  /**
   * Execute an undo action
   * @param {Object} undoAction - The undo action to execute
   */
  executeUndoAction(undoAction) {
    console.log(`🎯 Executing undo action: ${undoAction.type}`, undoAction.data)
    
    switch(undoAction.type) {
      case 'block:place':
        // Undo a removal by placing the block back with exact properties
        console.log(`🟢 Requesting place exact at (${undoAction.data.x}, ${undoAction.data.y}, ${undoAction.data.z})`)
        this.engine.eventBus.emit('tile:requestPlaceExact', undoAction.data)
        break
      case 'block:remove':
        // Undo a placement by removing the block
        console.log(`🔴 Requesting delete at (${undoAction.data.x}, ${undoAction.data.y}, ${undoAction.data.z})`)
        this.engine.eventBus.emit('tile:requestDelete', undoAction.data)
        break
      default:
        this.logger.warn(`Unknown undo action type: ${undoAction.type}`)
        console.log(`❓ Unknown undo action type: ${undoAction.type}`)
    }
  }

  /**
   * Execute a redo action
   * @param {Object} action - The original action to execute again
   */
  executeRedoAction(action) {
    switch(action.type) {
      case 'block:placed':
        // Redo a placement with exact properties
        this.engine.eventBus.emit('tile:requestPlaceExact', action.data)
        break
      case 'block:removed':
        // Redo a removal
        this.engine.eventBus.emit('tile:requestDelete', action.data)
        break
      default:
        this.logger.warn(`Unknown redo action type: ${action.type}`)
    }
  }

  /**
   * Clear all undo/redo history
   */
  clearHistory() {
    this.history = []
    this.historyIndex = -1
    this.logger.info('Undo/redo history cleared')
  }

  /**
   * Get undo/redo state for UI
   * @returns {Object} State object with canUndo and canRedo flags
   */
  getUndoRedoState() {
    return {
      canUndo: this.historyIndex >= 0,
      canRedo: this.historyIndex < this.history.length - 1,
      historyLength: this.history.length,
      currentIndex: this.historyIndex
    }
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