/**
 * Entity data structure for interactive world objects
 */
export class Entity {
  constructor(id, x, y, z, type, properties = {}) {
    this.id = id
    this.x = x
    this.y = y
    this.z = z
    this.type = type
    this.properties = properties
    
    // Visual properties
    this.spriteId = properties.spriteId || null
    this.color = properties.color || this.getDefaultColor(type)
    this.width = properties.width || 1
    this.height = properties.height || 1
    this.visible = properties.visible !== undefined ? properties.visible : true
    
    // Animation properties
    this.animated = properties.animated || false
    this.animationFrame = 0
    this.animationSpeed = properties.animationSpeed || 100 // ms per frame
    this.animationTime = 0
    
    // Gameplay properties
    this.solid = properties.solid !== undefined ? properties.solid : true
    this.interactable = properties.interactable !== undefined ? properties.interactable : true
    this.movable = properties.movable || false
    this.health = properties.health || 100
    this.maxHealth = properties.maxHealth || 100
    
    // State
    this.active = true
    this.metadata = properties.metadata || {}
    
    // Physics
    this.velocity = { x: 0, y: 0, z: 0 }
    this.acceleration = { x: 0, y: 0, z: 0 }
  }

  /**
   * Get default color for entity type
   * @param {string} type - Entity type
   * @returns {string}
   */
  getDefaultColor(type) {
    const colors = {
      player: '#ff00ff',
      npc: '#00ff00',
      enemy: '#ff0000',
      chest: '#ffd700',
      door: '#8b4513',
      tree: '#228b22',
      rock: '#696969',
      crystal: '#00ffff',
      portal: '#9370db',
      item: '#ffff00'
    }
    return colors[type] || '#ffffff'
  }

  /**
   * Update entity animation
   * @param {number} deltaTime - Time since last update
   */
  updateAnimation(deltaTime) {
    if (!this.animated) return
    
    this.animationTime += deltaTime
    if (this.animationTime >= this.animationSpeed) {
      this.animationFrame++
      this.animationTime = 0
    }
  }

  /**
   * Update entity physics
   * @param {number} deltaTime - Time since last update
   */
  updatePhysics(deltaTime) {
    if (!this.movable) return
    
    const dt = deltaTime / 1000 // Convert to seconds
    
    // Update velocity from acceleration
    this.velocity.x += this.acceleration.x * dt
    this.velocity.y += this.acceleration.y * dt
    this.velocity.z += this.acceleration.z * dt
    
    // Update position from velocity
    this.x += this.velocity.x * dt
    this.y += this.velocity.y * dt
    this.z += this.velocity.z * dt
  }

  /**
   * Get isometric position for rendering
   * @deprecated Use renderer's worldToIsometric() method instead
   * @returns {{isoX: number, isoY: number}}
   */
  getIsoPosition() {
    // This method is deprecated - rendering should use the renderer's coordinate system
    console.warn('Entity.getIsoPosition() is deprecated. Use renderer.worldToIsometric() instead')
    const isoX = (this.x - this.y) * 32
    const isoY = (this.x + this.y) * 16 - this.z * 20
    return { isoX, isoY }
  }

  /**
   * Get bounding box
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
   */
  getBounds() {
    return {
      minX: this.x,
      minY: this.y,
      maxX: this.x + this.width,
      maxY: this.y + this.height
    }
  }

  /**
   * Check collision with another entity
   * @param {Entity} other - Other entity
   * @returns {boolean}
   */
  collidesWith(other) {
    const thisBounds = this.getBounds()
    const otherBounds = other.getBounds()
    
    return thisBounds.minX < otherBounds.maxX &&
           thisBounds.maxX > otherBounds.minX &&
           thisBounds.minY < otherBounds.maxY &&
           thisBounds.maxY > otherBounds.minY &&
           Math.abs(this.z - other.z) < 0.5
  }

  /**
   * Apply damage to entity
   * @param {number} damage - Damage amount
   */
  takeDamage(damage) {
    this.health = Math.max(0, this.health - damage)
    if (this.health === 0) {
      this.active = false
    }
  }

  /**
   * Heal entity
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  /**
   * Clone the entity
   * @returns {Entity}
   */
  clone() {
    const cloned = new Entity(
      this.id + '_clone',
      this.x,
      this.y,
      this.z,
      this.type,
      { ...this.properties }
    )
    
    // Copy state
    cloned.velocity = { ...this.velocity }
    cloned.acceleration = { ...this.acceleration }
    cloned.health = this.health
    cloned.active = this.active
    
    return cloned
  }

  /**
   * Serialize entity to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      z: this.z,
      type: this.type,
      properties: {
        spriteId: this.spriteId,
        color: this.color,
        width: this.width,
        height: this.height,
        visible: this.visible,
        animated: this.animated,
        animationSpeed: this.animationSpeed,
        solid: this.solid,
        interactable: this.interactable,
        movable: this.movable,
        health: this.health,
        maxHealth: this.maxHealth,
        metadata: this.metadata
      },
      state: {
        active: this.active,
        velocity: this.velocity,
        acceleration: this.acceleration,
        animationFrame: this.animationFrame
      }
    }
  }

  /**
   * Create entity from JSON
   * @param {Object} json - JSON data
   * @returns {Entity}
   */
  static fromJSON(json) {
    const entity = new Entity(
      json.id,
      json.x,
      json.y,
      json.z,
      json.type,
      json.properties
    )
    
    if (json.state) {
      entity.active = json.state.active
      entity.velocity = json.state.velocity || { x: 0, y: 0, z: 0 }
      entity.acceleration = json.state.acceleration || { x: 0, y: 0, z: 0 }
      entity.animationFrame = json.state.animationFrame || 0
    }
    
    return entity
  }
}