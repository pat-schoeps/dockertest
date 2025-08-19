/**
 * Tile data structure for 2D texture elements (rivers, paths, etc.)
 * Unlike Blocks which can stack in 3D, Tiles are 2D and only one can exist per grid position
 */
export class Tile {
  constructor(x, y, type, properties = {}) {
    this.x = x
    this.y = y
    this.z = 0 // Tiles are always at ground level
    this.type = type
    this.properties = properties
    
    // Visual properties
    this.spriteId = properties.spriteId || null
    this.color = properties.color || this.getDefaultColor(type)
    this.visible = properties.visible !== undefined ? properties.visible : true
    
    // Tiles are 2D textures, not solid 3D objects
    this.is2D = true
    this.solid = false
    this.walkable = properties.walkable !== undefined ? properties.walkable : true
    
    // Gameplay properties
    this.interactable = properties.interactable || false
    this.metadata = properties.metadata || {}
  }

  /**
   * Get default color for tile type
   * @param {string} type - Tile type
   * @returns {string}
   */
  getDefaultColor(type) {
    const colors = {
      water: '#00ccff',
      river: '#00ccff',
      path: '#d2b48c',
      road: '#696969',
      grass_overlay: '#90ee90',
      sand_overlay: '#ffd700',
      ice: '#e0ffff',
      lava: '#ff4500',
      mud: '#8b4513'
    }
    return colors[type] || '#808080'
  }

  /**
   * Clone the tile
   * @returns {Tile}
   */
  clone() {
    return new Tile(this.x, this.y, this.type, {
      ...this.properties,
      spriteId: this.spriteId,
      color: this.color,
      visible: this.visible,
      walkable: this.walkable,
      interactable: this.interactable,
      metadata: { ...this.metadata }
    })
  }

  /**
   * Serialize tile to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      type: this.type,
      is2D: true,
      properties: {
        spriteId: this.spriteId,
        color: this.color,
        visible: this.visible,
        walkable: this.walkable,
        interactable: this.interactable,
        metadata: this.metadata
      }
    }
  }

  /**
   * Create tile from JSON
   * @param {Object} json - JSON data
   * @returns {Tile}
   */
  static fromJSON(json) {
    return new Tile(
      json.x,
      json.y,
      json.type,
      json.properties
    )
  }
}