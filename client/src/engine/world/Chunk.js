import { Block } from './Block.js'
import { Entity } from './Entity.js'

/**
 * World chunk containing blocks and entities
 */
export class Chunk {
  static SIZE = 16 // 16x16 blocks per chunk

  constructor(chunkX, chunkY, worldId = 'default') {
    this.chunkX = chunkX
    this.chunkY = chunkY
    this.worldId = worldId
    
    // Unique chunk identifier
    this.id = `${worldId}_${chunkX}_${chunkY}`
    
    // Version for cache busting
    this.version = Date.now().toString()
    
    // Chunk data
    this.blocks = new Map() // Key: "x,y,z" -> Block
    this.entities = new Map() // Key: entity.id -> Entity
    
    // Metadata
    this.metadata = {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      static: false, // Whether chunk can be modified
      biome: 'plains',
      custom: {}
    }
    
    // Bounds in world space
    this.bounds = {
      minX: chunkX * Chunk.SIZE,
      minY: chunkY * Chunk.SIZE,
      maxX: (chunkX + 1) * Chunk.SIZE,
      maxY: (chunkY + 1) * Chunk.SIZE
    }
    
    // Dirty flag for saving
    this.dirty = false
  }

  /**
   * Get block at position
   * @param {number} x - Local X position (0-15)
   * @param {number} y - Local Y position (0-15)
   * @param {number} z - Z layer
   * @returns {Block|null}
   */
  getBlock(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`) || null
  }

  /**
   * Set block at position
   * @param {number} x - Local X position
   * @param {number} y - Local Y position
   * @param {number} z - Z layer
   * @param {Block} block - Block to set
   * @param {boolean} markAsDirty - Whether to mark chunk as dirty (default true)
   */
  setBlock(x, y, z, block, markAsDirty = true) {
    if (this.metadata.static) {
      throw new Error(`Cannot modify static chunk ${this.id}`)
    }
    
    const key = `${x},${y},${z}`
    
    if (block) {
      // Update block position to local coordinates
      block.x = x
      block.y = y
      block.z = z
      this.blocks.set(key, block)
    } else {
      this.blocks.delete(key)
    }
    
    if (markAsDirty) {
      this.markDirty()
    }
  }

  /**
   * Remove block at position
   * @param {number} x - Local X position
   * @param {number} y - Local Y position
   * @param {number} z - Z layer
   */
  removeBlock(x, y, z) {
    this.setBlock(x, y, z, null)
  }

  /**
   * Get all blocks at a specific Z layer
   * @param {number} z - Z layer
   * @returns {Block[]}
   */
  getBlocksAtLayer(z) {
    const blocks = []
    for (const block of this.blocks.values()) {
      if (block.z === z) {
        blocks.push(block)
      }
    }
    return blocks
  }

  /**
   * Add entity to chunk
   * @param {Entity} entity - Entity to add
   */
  addEntity(entity) {
    if (this.metadata.static) {
      throw new Error(`Cannot modify static chunk ${this.id}`)
    }
    
    this.entities.set(entity.id, entity)
    this.markDirty()
  }

  /**
   * Remove entity from chunk
   * @param {string} entityId - Entity ID
   */
  removeEntity(entityId) {
    if (this.metadata.static) {
      throw new Error(`Cannot modify static chunk ${this.id}`)
    }
    
    this.entities.delete(entityId)
    this.markDirty()
  }

  /**
   * Get entity by ID
   * @param {string} entityId - Entity ID
   * @returns {Entity|null}
   */
  getEntity(entityId) {
    return this.entities.get(entityId) || null
  }

  /**
   * Get all entities
   * @returns {Entity[]}
   */
  getEntities() {
    return Array.from(this.entities.values())
  }

  /**
   * Check if position is within chunk bounds
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @returns {boolean}
   */
  containsPosition(worldX, worldY) {
    return worldX >= this.bounds.minX &&
           worldX < this.bounds.maxX &&
           worldY >= this.bounds.minY &&
           worldY < this.bounds.maxY
  }

  /**
   * Convert world position to local chunk position
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @returns {{x: number, y: number}}
   */
  worldToLocal(worldX, worldY) {
    return {
      x: Math.floor(worldX - this.bounds.minX),
      y: Math.floor(worldY - this.bounds.minY)
    }
  }

  /**
   * Convert local position to world position
   * @param {number} localX - Local X position
   * @param {number} localY - Local Y position
   * @returns {{x: number, y: number}}
   */
  localToWorld(localX, localY) {
    return {
      x: this.bounds.minX + localX,
      y: this.bounds.minY + localY
    }
  }

  /**
   * Mark chunk as dirty (needs saving)
   */
  markDirty() {
    this.dirty = true
    this.metadata.modifiedAt = Date.now()
    this.version = Date.now().toString()
  }

  /**
   * Mark chunk as clean (saved)
   */
  markClean() {
    this.dirty = false
  }

  /**
   * Generate terrain for the chunk
   * @param {string} biome - Biome type
   */
  generateTerrain(biome = 'plains') {
    this.metadata.biome = biome
    
    for (let x = 0; x < Chunk.SIZE; x++) {
      for (let y = 0; y < Chunk.SIZE; y++) {
        // Simple terrain generation
        const worldX = this.bounds.minX + x
        const worldY = this.bounds.minY + y
        
        // Use simple noise-like pattern
        const noise = Math.sin(worldX * 0.1) * Math.cos(worldY * 0.1)
        
        let blockType = 'grass'
        if (noise > 0.3) {
          blockType = 'stone'
        } else if (noise < -0.3) {
          blockType = 'water'
        } else if (Math.random() < 0.1) {
          blockType = 'sand'
        }
        
        const block = new Block(x, y, 0, blockType)
        this.setBlock(x, y, 0, block)
        
        // Add random entities
        if (Math.random() < 0.02 && blockType === 'grass') {
          const entity = new Entity(
            `${this.id}_tree_${x}_${y}`,
            worldX + 0.5,
            worldY + 0.5,
            0,
            'tree'
          )
          this.addEntity(entity)
        }
      }
    }
  }

  /**
   * Serialize chunk to JSON
   * @returns {Object}
   */
  toJSON() {
    const blocksArray = []
    for (const block of this.blocks.values()) {
      blocksArray.push(block.toJSON())
    }
    
    const entitiesArray = []
    for (const entity of this.entities.values()) {
      entitiesArray.push(entity.toJSON())
    }
    
    return {
      id: this.id,
      chunkX: this.chunkX,
      chunkY: this.chunkY,
      worldId: this.worldId,
      version: this.version,
      blocks: blocksArray,
      entities: entitiesArray,
      metadata: this.metadata
    }
  }

  /**
   * Create chunk from JSON
   * @param {Object} json - JSON data
   * @returns {Chunk}
   */
  static fromJSON(json) {
    const chunk = new Chunk(json.chunkX, json.chunkY, json.worldId)
    
    chunk.id = json.id
    chunk.version = json.version
    chunk.metadata = json.metadata
    
    // Load blocks
    chunk.blocks.clear()
    for (const blockData of json.blocks) {
      const block = Block.fromJSON(blockData)
      chunk.blocks.set(`${block.x},${block.y},${block.z}`, block)
    }
    
    // Load entities
    chunk.entities.clear()
    for (const entityData of json.entities) {
      const entity = Entity.fromJSON(entityData)
      chunk.entities.set(entity.id, entity)
    }
    
    chunk.markClean()
    return chunk
  }
}