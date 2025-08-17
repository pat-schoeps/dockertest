import { Module } from '../core/Module.js'
import { Logger } from '../utils/Logger.js'
import { Chunk } from './Chunk.js'
import { Block } from './Block.js'
import { Entity } from './Entity.js'
import { GameConfig } from '../config/GameConfig.js'

/**
 * World manager for handling chunks and world data
 */
export class WorldManager extends Module {
  constructor(engine) {
    super('WorldManager', engine)
    this.logger = new Logger('WorldManager')
    
    this.worldId = 'default'
    this.chunks = new Map()
    this.activeChunks = new Set()
    
    // Player/camera position for chunk loading
    this.viewX = 0
    this.viewY = 0
    this.viewDistance = 3 // Chunks to load around view position
    
    // Entity management
    this.globalEntities = new Map() // Entities that span multiple chunks
    this.playerEntity = null
  }

  async onInitialize() {
    // Listen for camera updates
    this.engine.eventBus.on('camera:moved', ({ x, y }) => {
      this.updateView(x, y)
    })
    
    // Listen for input events
    this.engine.eventBus.on('input:mousedown', ({ worldX, worldY, button }) => {
      if (button === 0) { // Left click
        this.handleClick(worldX, worldY)
      }
    })
    
    // Listen for block placement requests from state manager
    this.engine.eventBus.on('tile:requestPlace', ({ x, y, z }) => {
      this.placeBlock(x, y, z)
    })
    
    // Listen for exact block placement requests (for undo/redo)
    this.engine.eventBus.on('tile:requestPlaceExact', ({ x, y, z, block }) => {
      this.placeBlockExact(x, y, z, block)
    })
    
    // Listen for block removal requests from state manager
    this.engine.eventBus.on('tile:requestDelete', ({ x, y, z }) => {
      this.removeBlock(x, y, z)
    })
    
    this.logger.info('World manager initialized')
  }

  /**
   * Create a new world
   * @param {string} worldId - World identifier
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   */
  createWorld(worldId = 'default', centerX = 0, centerY = 0) {
    this.worldId = worldId
    this.chunks.clear()
    this.activeChunks.clear()
    this.globalEntities.clear()
    
    this.viewX = centerX
    this.viewY = centerY
    
    // Create a single chunk with initial content
    this.createInitialContent()
    
    this.logger.info(`Created world: ${worldId}`)
    this.engine.eventBus.emit('world:created', { worldId })
  }

  /**
   * Create initial content for the world
   */
  createInitialContent() {
    // Create a single empty chunk at origin
    const chunk = new Chunk(0, 0, this.worldId)
    
    // Clear any existing blocks first (in case of re-initialization)
    chunk.blocks.clear()
    
    // No blocks added - just an empty chunk for the grid
    
    // Add the chunk (will replace any existing chunk with same ID)
    const chunkId = chunk.id
    this.chunks.set(chunkId, chunk)
    this.activeChunks.clear()
    this.activeChunks.add(chunkId)
    
    this.logger.info(`Created empty world. Chunk ID: ${chunkId}, Blocks: ${chunk.blocks.size}`)
    
    // Only log in development for debugging
    if (this.chunks.size > 1) {
      console.warn('Multiple chunks detected - this should not happen with simple grid')
    }
  }

  /**
   * Update view position and load/unload chunks
   * @param {number} x - View X position
   * @param {number} y - View Y position
   */
  updateView(x, y) {
    this.viewX = x
    this.viewY = y
    // Disabled automatic chunk loading for simple grid
    // this.updateActiveChunks()
  }

  /**
   * Update active chunks based on view position
   */
  updateActiveChunks() {
    const chunkX = Math.floor(this.viewX / Chunk.SIZE)
    const chunkY = Math.floor(this.viewY / Chunk.SIZE)
    
    const newActiveChunks = new Set()
    
    // Determine which chunks should be active
    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dy = -this.viewDistance; dy <= this.viewDistance; dy++) {
        const cx = chunkX + dx
        const cy = chunkY + dy
        const chunkId = `${this.worldId}_${cx}_${cy}`
        
        newActiveChunks.add(chunkId)
        
        // Load chunk if not already loaded
        if (!this.chunks.has(chunkId)) {
          this.loadChunk(cx, cy)
        }
      }
    }
    
    // Unload chunks that are no longer active
    for (const chunkId of this.activeChunks) {
      if (!newActiveChunks.has(chunkId)) {
        this.unloadChunk(chunkId)
      }
    }
    
    this.activeChunks = newActiveChunks
  }

  /**
   * Load or generate a chunk
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkY - Chunk Y coordinate
   */
  loadChunk(chunkX, chunkY) {
    const chunkId = `${this.worldId}_${chunkX}_${chunkY}`
    
    // Check if chunk exists in storage (would be loaded from server/cache)
    // For now, generate procedurally
    const chunk = new Chunk(chunkX, chunkY, this.worldId)
    chunk.generateTerrain()
    
    this.chunks.set(chunkId, chunk)
    
    this.logger.debug(`Loaded chunk: ${chunkId}`)
    this.engine.eventBus.emit('chunk:loaded', { chunkId, chunk })
  }

  /**
   * Unload a chunk
   * @param {string} chunkId - Chunk identifier
   */
  unloadChunk(chunkId) {
    const chunk = this.chunks.get(chunkId)
    if (!chunk) return
    
    // Save chunk if dirty (would save to server/cache)
    if (chunk.dirty) {
      this.saveChunk(chunk)
    }
    
    this.chunks.delete(chunkId)
    
    this.logger.debug(`Unloaded chunk: ${chunkId}`)
    this.engine.eventBus.emit('chunk:unloaded', { chunkId })
  }

  /**
   * Save a chunk (placeholder for server integration)
   * @param {Chunk} chunk - Chunk to save
   */
  saveChunk(chunk) {
    // In production, this would send to server or save to cache
    const data = chunk.toJSON()
    
    // For now, just mark as clean
    chunk.markClean()
    
    this.logger.debug(`Saved chunk: ${chunk.id}`)
    this.engine.eventBus.emit('chunk:saved', { chunkId: chunk.id, data })
  }

  /**
   * Get chunk at world position
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {boolean} createIfMissing - Whether to create chunk if it doesn't exist
   * @returns {Chunk|null}
   */
  getChunkAt(worldX, worldY, createIfMissing = false) {
    const chunkX = Math.floor(worldX / Chunk.SIZE)
    const chunkY = Math.floor(worldY / Chunk.SIZE)
    const chunkId = `${this.worldId}_${chunkX}_${chunkY}`
    
    let chunk = this.chunks.get(chunkId)
    
    // Auto-create chunk if missing and requested
    if (!chunk && createIfMissing) {
      chunk = new Chunk(chunkX, chunkY, this.worldId)
      this.chunks.set(chunkId, chunk)
      this.activeChunks.add(chunkId)
      this.logger.info(`Auto-created chunk: ${chunkId} for world position (${worldX}, ${worldY})`)
    }
    
    return chunk
  }

  /**
   * Get block at world position
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {number} z - Z layer
   * @returns {Block|null}
   */
  getBlockAt(worldX, worldY, z = 0) {
    const chunk = this.getChunkAt(worldX, worldY)
    if (!chunk) return null
    
    const local = chunk.worldToLocal(worldX, worldY)
    return chunk.getBlock(local.x, local.y, z)
  }

  /**
   * Find the highest block Z-coordinate at the given world position
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @returns {number} Highest Z coordinate, or -1 if no blocks
   */
  getHighestBlockZ(worldX, worldY) {
    const chunk = this.getChunkAt(worldX, worldY)
    if (!chunk) return -1
    
    const local = chunk.worldToLocal(worldX, worldY)
    let highestZ = -1
    
    // Search through all blocks in the chunk to find the highest Z at this position
    for (const [key, block] of chunk.blocks) {
      const [blockX, blockY, blockZ] = key.split(',').map(Number)
      if (blockX === local.x && blockY === local.y && blockZ > highestZ) {
        highestZ = blockZ
      }
    }
    
    return highestZ
  }

  /**
   * Set block at world position
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {number} z - Z layer
   * @param {Block} block - Block to set
   */
  setBlockAt(worldX, worldY, z, block) {
    const chunk = this.getChunkAt(worldX, worldY, true) // Auto-create chunk if missing
    if (!chunk) {
      this.logger.error(`Failed to create chunk for position (${worldX}, ${worldY})`)
      return
    }
    
    const local = chunk.worldToLocal(worldX, worldY)
    chunk.setBlock(local.x, local.y, z, block)
    
    this.engine.eventBus.emit('block:changed', {
      worldX,
      worldY,
      z,
      block,
      chunkId: chunk.id
    })
  }

  /**
   * Place a new block at the specified position
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} z - Z layer (default 0)
   */
  placeBlock(x, y, z = 0) {
    // Check if block already exists at this position
    if (this.getBlockAt(x, y, z)) {
      this.logger.warn(`Block already exists at (${x}, ${y}, ${z})`)
      return
    }
    
    // Create a new block with default properties
    // Slightly vary the color based on height to make stacking more visible
    let blockColor = GameConfig.block.defaultColor
    if (z > 0) {
      // Lighten the color slightly for each level up
      const lightenFactor = Math.min(0.1 + (z * 0.05), 0.3)
      const hex = blockColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      const newR = Math.min(255, Math.floor(r + (255 - r) * lightenFactor))
      const newG = Math.min(255, Math.floor(g + (255 - g) * lightenFactor))
      const newB = Math.min(255, Math.floor(b + (255 - b) * lightenFactor))
      
      blockColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    }
    
    const block = new Block(x, y, z, GameConfig.block.defaultType, {
      color: blockColor,
      height: GameConfig.block.defaultHeight
    })
    
    // Place the block
    this.setBlockAt(x, y, z, block)
    
    // Emit block added event for state management
    this.engine.eventBus.emit('block:added', {
      block,
      worldX: x,
      worldY: y,
      z
    })
    
    this.logger.info(`Placed block at (${x}, ${y}, ${z})`)
  }

  /**
   * Place an exact block at the specified position (for undo/redo)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} z - Z layer
   * @param {Block} block - Exact block to place
   */
  placeBlockExact(x, y, z, block) {
    // Check if block already exists at this position
    if (this.getBlockAt(x, y, z)) {
      this.logger.warn(`Block already exists at (${x}, ${y}, ${z}) for exact placement`)
      return
    }
    
    // Create a new block with exact properties from the provided block
    const newBlock = block.clone()
    newBlock.x = x  // Ensure correct position
    newBlock.y = y
    newBlock.z = z
    
    // Place the block
    this.setBlockAt(x, y, z, newBlock)
    
    // Emit block added event for state management
    this.engine.eventBus.emit('block:added', {
      block: newBlock,
      worldX: x,
      worldY: y,
      z
    })
    
    this.logger.info(`Placed exact block at (${x}, ${y}, ${z})`)
  }

  /**
   * Remove a block at the specified position
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} z - Z layer (default 0)
   */
  removeBlock(x, y, z = 0) {
    const block = this.getBlockAt(x, y, z)
    if (!block) {
      this.logger.warn(`No block found at (${x}, ${y}, ${z})`)
      return
    }
    
    // Remove the block from the chunk
    const chunk = this.getChunkAt(x, y)
    if (chunk) {
      const local = chunk.worldToLocal(x, y)
      chunk.removeBlock(local.x, local.y, z)
    }
    
    // Emit block removed event for state management
    this.engine.eventBus.emit('block:removed', {
      block,
      worldX: x,
      worldY: y,
      z
    })
    
    this.logger.info(`Removed block at (${x}, ${y}, ${z})`)
  }

  /**
   * Add entity to world
   * @param {Entity} entity - Entity to add
   */
  addEntity(entity) {
    const chunk = this.getChunkAt(entity.x, entity.y)
    if (chunk) {
      chunk.addEntity(entity)
      
      this.engine.eventBus.emit('entity:added', {
        entity,
        chunkId: chunk.id
      })
    } else {
      // Add to global entities if chunk not loaded
      this.globalEntities.set(entity.id, entity)
    }
  }

  /**
   * Remove entity from world
   * @param {string} entityId - Entity ID
   */
  removeEntity(entityId) {
    // Check all active chunks
    for (const chunk of this.chunks.values()) {
      if (chunk.getEntity(entityId)) {
        chunk.removeEntity(entityId)
        
        this.engine.eventBus.emit('entity:removed', {
          entityId,
          chunkId: chunk.id
        })
        return
      }
    }
    
    // Check global entities
    this.globalEntities.delete(entityId)
  }

  /**
   * Get entities in radius
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} radius - Search radius
   * @returns {Entity[]}
   */
  getEntitiesInRadius(centerX, centerY, radius) {
    const entities = []
    const radiusSq = radius * radius
    
    for (const chunk of this.chunks.values()) {
      for (const entity of chunk.getEntities()) {
        const dx = entity.x - centerX
        const dy = entity.y - centerY
        const distSq = dx * dx + dy * dy
        
        if (distSq <= radiusSq) {
          entities.push(entity)
        }
      }
    }
    
    return entities
  }

  /**
   * Handle click in world
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   */
  handleClick(worldX, worldY) {
    // Check for entity clicks
    const entities = this.getEntitiesInRadius(worldX, worldY, 1)
    
    for (const entity of entities) {
      if (entity.interactable) {
        this.engine.eventBus.emit('entity:clicked', {
          entity,
          worldX,
          worldY
        })
        
        this.logger.info(`Clicked entity: ${entity.id} (${entity.type})`)
        return
      }
    }
    
    // Check for block clicks
    const block = this.getBlockAt(Math.floor(worldX), Math.floor(worldY))
    if (block && block.interactable) {
      this.engine.eventBus.emit('block:clicked', {
        block,
        worldX: Math.floor(worldX),
        worldY: Math.floor(worldY)
      })
      
      this.logger.info(`Clicked block: ${block.type} at (${Math.floor(worldX)}, ${Math.floor(worldY)})`)
    }
  }

  /**
   * Set player entity
   * @param {Entity} entity - Player entity
   */
  setPlayerEntity(entity) {
    this.playerEntity = entity
    this.addEntity(entity)
    
    // Center view on player
    this.updateView(entity.x, entity.y)
    
    this.engine.eventBus.emit('player:spawned', { entity })
  }

  /**
   * Update world state
   * @param {number} deltaTime - Time since last update
   */
  onUpdate(deltaTime) {
    // Update all entities in active chunks
    for (const chunkId of this.activeChunks) {
      const chunk = this.chunks.get(chunkId)
      if (!chunk) continue
      
      for (const entity of chunk.getEntities()) {
        if (entity.animated) {
          entity.updateAnimation(deltaTime)
        }
        if (entity.movable) {
          entity.updatePhysics(deltaTime)
        }
      }
    }
    
    // Player position tracking disabled for simple grid
    // if (this.playerEntity) {
    //   this.updateView(this.playerEntity.x, this.playerEntity.y)
    // }
  }

  /**
   * Get all active chunks
   * @returns {Map<string, Chunk>}
   */
  getActiveChunks() {
    const active = new Map()
    for (const chunkId of this.activeChunks) {
      const chunk = this.chunks.get(chunkId)
      if (chunk) {
        active.set(chunkId, chunk)
      }
    }
    return active
  }

  /**
   * Serialize world state
   * @returns {Object}
   */
  toJSON() {
    const chunks = []
    for (const chunk of this.chunks.values()) {
      chunks.push(chunk.toJSON())
    }
    
    return {
      worldId: this.worldId,
      viewX: this.viewX,
      viewY: this.viewY,
      chunks,
      playerEntity: this.playerEntity ? this.playerEntity.toJSON() : null
    }
  }

  async onDestroy() {
    // Save all dirty chunks
    for (const chunk of this.chunks.values()) {
      if (chunk.dirty) {
        this.saveChunk(chunk)
      }
    }
    
    this.chunks.clear()
    this.activeChunks.clear()
    this.globalEntities.clear()
    this.playerEntity = null
    
    this.logger.info('WorldManager destroyed and cleaned up')
  }
}