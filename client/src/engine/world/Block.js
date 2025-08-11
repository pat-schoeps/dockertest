/**
 * Block data structure for world tiles
 */
export class Block {
  constructor(x, y, z, type, properties = {}) {
    this.x = x
    this.y = y
    this.z = z // Height/layer for isometric depth
    this.type = type
    this.properties = properties
    
    // Visual properties
    this.spriteId = properties.spriteId || null
    this.color = properties.color || this.getDefaultColor(type)
    this.solid = properties.solid !== undefined ? properties.solid : true
    this.visible = properties.visible !== undefined ? properties.visible : true
    
    // Gameplay properties
    this.walkable = properties.walkable !== undefined ? properties.walkable : !this.solid
    this.interactable = properties.interactable || false
    this.metadata = properties.metadata || {}
  }

  /**
   * Get default color for block type
   * @param {string} type - Block type
   * @returns {string}
   */
  getDefaultColor(type) {
    const colors = {
      grass: '#00ff88',
      stone: '#a0a0ff',
      water: '#00ccff',
      sand: '#ffd700',
      dirt: '#8b4513',
      wood: '#8b4513',
      brick: '#cd5c5c',
      metal: '#c0c0c0',
      ice: '#e0ffff',
      lava: '#ff4500'
    }
    return colors[type] || '#808080'
  }

  /**
   * Get isometric position for rendering
   * @deprecated Use renderer's worldToIsometric() method instead
   * @returns {{isoX: number, isoY: number}}
   */
  getIsoPosition() {
    // This method is deprecated - rendering should use the renderer's coordinate system
    console.warn('Block.getIsoPosition() is deprecated. Use renderer.worldToIsometric() instead')
    const isoX = (this.x - this.y) * 32
    const isoY = (this.x + this.y) * 16 - this.z * 20
    return { isoX, isoY }
  }

  /**
   * Clone the block
   * @returns {Block}
   */
  clone() {
    return new Block(this.x, this.y, this.z, this.type, {
      ...this.properties,
      spriteId: this.spriteId,
      color: this.color,
      solid: this.solid,
      visible: this.visible,
      walkable: this.walkable,
      interactable: this.interactable,
      metadata: { ...this.metadata }
    })
  }

  /**
   * Serialize block to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      type: this.type,
      properties: {
        spriteId: this.spriteId,
        color: this.color,
        solid: this.solid,
        visible: this.visible,
        walkable: this.walkable,
        interactable: this.interactable,
        metadata: this.metadata
      }
    }
  }

  /**
   * Create block from JSON
   * @param {Object} json - JSON data
   * @returns {Block}
   */
  static fromJSON(json) {
    return new Block(
      json.x,
      json.y,
      json.z,
      json.type,
      json.properties
    )
  }
}