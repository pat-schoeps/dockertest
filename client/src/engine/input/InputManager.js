import { Module } from '../core/Module.js'
import { Logger } from '../utils/Logger.js'

/**
 * Input manager for handling keyboard and mouse events
 */
export class InputManager extends Module {
  constructor(engine, canvas) {
    super('InputManager', engine)
    this.logger = new Logger('InputManager')
    
    this.canvas = canvas
    this.keys = new Map()
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      buttons: new Map(),
      wheel: 0
    }
    
    // Key state tracking
    this.keyDownThisFrame = new Set()
    this.keyUpThisFrame = new Set()
    
    // Mouse state tracking
    this.mouseDownThisFrame = new Set()
    this.mouseUpThisFrame = new Set()
    
    // Bound event handlers
    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      mouseleave: this.handleMouseLeave.bind(this),
      wheel: this.handleWheel.bind(this),
      contextmenu: this.handleContextMenu.bind(this)
    }
  }

  /**
   * Set the canvas element for mouse position calculations
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  setCanvas(canvas) {
    if (this.canvas && this.initialized) {
      this.removeEventListeners()
    }
    
    this.canvas = canvas
    
    if (this.initialized) {
      this.attachEventListeners()
    }
  }

  async onInitialize() {
    if (!this.canvas) {
      this.logger.warn('No canvas set, mouse position will not be accurate')
    }
    this.attachEventListeners()
  }

  async onDestroy() {
    this.removeEventListeners()
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.addEventListener('keydown', this.boundHandlers.keydown)
    document.addEventListener('keyup', this.boundHandlers.keyup)
    
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown)
      this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup)
      this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove)
      this.canvas.addEventListener('mouseleave', this.boundHandlers.mouseleave)
      this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false })
      this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu)
    }
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    document.removeEventListener('keydown', this.boundHandlers.keydown)
    document.removeEventListener('keyup', this.boundHandlers.keyup)
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown)
      this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup)
      this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove)
      this.canvas.removeEventListener('mouseleave', this.boundHandlers.mouseleave)
      this.canvas.removeEventListener('wheel', this.boundHandlers.wheel)
      this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu)
    }
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const key = event.code
    
    // For meta key combinations (Cmd/Ctrl + key), always emit the event
    // This allows repeated undo/redo operations
    const isMetaCombo = event.metaKey || event.ctrlKey
    
    if (!this.keys.get(key) || isMetaCombo) {
      this.keyDownThisFrame.add(key)
      this.engine.eventBus.emit('input:keydown', { key, event })
    }
    
    this.keys.set(key, true)
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} event
   */
  handleKeyUp(event) {
    const key = event.code
    
    if (this.keys.get(key)) {
      this.keyUpThisFrame.add(key)
      this.engine.eventBus.emit('input:keyup', { key, event })
    }
    
    this.keys.set(key, false)
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} event
   */
  handleMouseDown(event) {
    const button = event.button
    
    if (!this.mouse.buttons.get(button)) {
      this.mouseDownThisFrame.add(button)
      
      const position = this.getMousePosition(event)
      this.engine.eventBus.emit('input:mousedown', { 
        button, 
        x: position.x, 
        y: position.y,
        worldX: position.worldX,
        worldY: position.worldY,
        event 
      })
    }
    
    this.mouse.buttons.set(button, true)
  }

  /**
   * Handle mouse up event
   * @param {MouseEvent} event
   */
  handleMouseUp(event) {
    const button = event.button
    
    if (this.mouse.buttons.get(button)) {
      this.mouseUpThisFrame.add(button)
      
      const position = this.getMousePosition(event)
      this.engine.eventBus.emit('input:mouseup', { 
        button, 
        x: position.x, 
        y: position.y,
        worldX: position.worldX,
        worldY: position.worldY,
        event 
      })
    }
    
    this.mouse.buttons.set(button, false)
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} event
   */
  handleMouseMove(event) {
    const position = this.getMousePosition(event)
    
    const deltaX = position.x - this.mouse.x
    const deltaY = position.y - this.mouse.y
    
    this.mouse.x = position.x
    this.mouse.y = position.y
    this.mouse.worldX = position.worldX
    this.mouse.worldY = position.worldY
    
    
    this.engine.eventBus.emit('input:mousemove', {
      screenX: position.x,
      screenY: position.y,
      worldX: position.worldX,
      worldY: position.worldY,
      deltaX,
      deltaY,
      event
    })
  }

  /**
   * Handle mouse leave event
   * @param {MouseEvent} event
   */
  handleMouseLeave(event) {
    this.engine.eventBus.emit('input:mouseleave', { event })
  }
  
  /**
   * Handle wheel event
   * @param {WheelEvent} event
   */
  handleWheel(event) {
    event.preventDefault()
    
    this.mouse.wheel = event.deltaY
    
    this.engine.eventBus.emit('input:wheel', {
      deltaY: event.deltaY,
      deltaX: event.deltaX,
      event
    })
  }

  /**
   * Handle context menu event
   * @param {Event} event
   */
  handleContextMenu(event) {
    event.preventDefault()
  }

  /**
   * Get mouse position relative to canvas
   * @param {MouseEvent} event
   * @returns {{x: number, y: number, worldX: number, worldY: number}}
   */
  getMousePosition(event) {
    if (!this.canvas) {
      return { x: 0, y: 0, worldX: 0, worldY: 0 }
    }
    
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Get the renderer to convert to world coordinates
    const renderer = this.engine.getModule('IsometricRenderer') || this.engine.getModule('Renderer')
    let worldX = x
    let worldY = y
    
    if (renderer && renderer.screenToWorld) {
      const worldPos = renderer.screenToWorld(x, y)
      worldX = worldPos.x
      worldY = worldPos.y
    } else {
      console.warn('No renderer available for world coordinate conversion')
      // Fallback if renderer not available
      worldX = x
      worldY = y
    }
    
    return { x, y, worldX, worldY }
  }

  /**
   * Check if a key is currently pressed
   * @param {string} key - Key code
   * @returns {boolean}
   */
  isKeyPressed(key) {
    return this.keys.get(key) || false
  }

  /**
   * Check if a key was just pressed this frame
   * @param {string} key - Key code
   * @returns {boolean}
   */
  isKeyJustPressed(key) {
    return this.keyDownThisFrame.has(key)
  }

  /**
   * Check if a key was just released this frame
   * @param {string} key - Key code
   * @returns {boolean}
   */
  isKeyJustReleased(key) {
    return this.keyUpThisFrame.has(key)
  }

  /**
   * Check if a mouse button is currently pressed
   * @param {number} button - Mouse button (0=left, 1=middle, 2=right)
   * @returns {boolean}
   */
  isMousePressed(button = 0) {
    return this.mouse.buttons.get(button) || false
  }

  /**
   * Check if a mouse button was just pressed this frame
   * @param {number} button - Mouse button
   * @returns {boolean}
   */
  isMouseJustPressed(button = 0) {
    return this.mouseDownThisFrame.has(button)
  }

  /**
   * Check if a mouse button was just released this frame
   * @param {number} button - Mouse button
   * @returns {boolean}
   */
  isMouseJustReleased(button = 0) {
    return this.mouseUpThisFrame.has(button)
  }

  /**
   * Get current cached mouse position
   * @returns {{x: number, y: number, worldX: number, worldY: number}}
   */
  getCurrentMousePosition() {
    return {
      x: this.mouse.x,
      y: this.mouse.y,
      worldX: this.mouse.worldX,
      worldY: this.mouse.worldY
    }
  }

  /**
   * Get mouse wheel delta
   * @returns {number}
   */
  getMouseWheel() {
    return this.mouse.wheel
  }

  /**
   * Update world mouse position (called by camera/renderer)
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   */
  updateWorldMousePosition(worldX, worldY) {
    this.mouse.worldX = worldX
    this.mouse.worldY = worldY
  }

  /**
   * Clear per-frame input state
   */
  onLateUpdate() {
    this.keyDownThisFrame.clear()
    this.keyUpThisFrame.clear()
    this.mouseDownThisFrame.clear()
    this.mouseUpThisFrame.clear()
    this.mouse.wheel = 0
  }
}