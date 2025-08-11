import { EventBus } from './EventBus.js'
import { Logger } from '../utils/Logger.js'

/**
 * Main game engine class that orchestrates all modules
 */
export class GameEngine {
  constructor(config = {}) {
    this.config = {
      targetFPS: 60,
      fixedTimeStep: 16.67, // 60 FPS in milliseconds
      maxDeltaTime: 100,
      ...config
    }
    
    this.modules = new Map()
    this.eventBus = new EventBus()
    this.logger = new Logger('GameEngine')
    
    this.running = false
    this.lastTime = 0
    this.accumulator = 0
    this.frameCount = 0
    this.fps = 0
    this.fpsUpdateTime = 0
    
    this.animationFrameId = null
  }

  /**
   * Register a module with the engine
   * @param {Module} module - The module to register
   */
  registerModule(module) {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} already registered`)
    }
    this.modules.set(module.name, module)
    this.logger.info(`Registered module: ${module.name}`)
  }

  /**
   * Get a module by name
   * @param {string} name - Module name
   * @returns {Module|undefined}
   */
  getModule(name) {
    return this.modules.get(name)
  }

  /**
   * Initialize all modules
   */
  async initialize() {
    this.logger.info('Initializing engine...')
    
    // Initialize modules in registration order
    for (const [name, module] of this.modules) {
      try {
        await module.initialize()
        this.logger.info(`Initialized module: ${name}`)
      } catch (error) {
        this.logger.error(`Failed to initialize module ${name}:`, error)
        throw error
      }
    }
    
    this.eventBus.emit('engine:initialized')
    this.logger.info('Engine initialized successfully')
  }

  /**
   * Start the game engine
   */
  async start() {
    if (this.running) {
      this.logger.warn('Engine already running')
      return
    }

    this.logger.info('Starting engine...')
    
    // Start all modules
    for (const [name, module] of this.modules) {
      try {
        await module.start()
        this.logger.info(`Started module: ${name}`)
      } catch (error) {
        this.logger.error(`Failed to start module ${name}:`, error)
        throw error
      }
    }
    
    this.running = true
    this.lastTime = performance.now()
    this.fpsUpdateTime = this.lastTime
    
    this.eventBus.emit('engine:started')
    this.logger.info('Engine started successfully')
    
    // Start the game loop
    this.gameLoop()
  }

  /**
   * Main game loop
   */
  gameLoop() {
    // Double-check running state to prevent ghost loops
    if (!this.running) {
      console.log('Game loop called but engine not running, stopping')
      return
    }
    
    const currentTime = performance.now()
    let deltaTime = Math.min(currentTime - this.lastTime, this.config.maxDeltaTime)
    this.lastTime = currentTime
    
    // Update FPS counter
    this.frameCount++
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.fpsUpdateTime = currentTime
      this.eventBus.emit('engine:fps', this.fps)
    }
    
    // Fixed timestep for physics
    this.accumulator += deltaTime
    while (this.accumulator >= this.config.fixedTimeStep) {
      this.fixedUpdate(this.config.fixedTimeStep)
      this.accumulator -= this.config.fixedTimeStep
    }
    
    // Variable timestep updates
    this.update(deltaTime)
    this.lateUpdate(deltaTime)
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop())
  }

  /**
   * Update all modules
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    for (const module of this.modules.values()) {
      module.update(deltaTime)
    }
    this.eventBus.emit('engine:update', deltaTime)
  }

  /**
   * Fixed update for physics
   * @param {number} fixedDeltaTime - Fixed time step
   */
  fixedUpdate(fixedDeltaTime) {
    for (const module of this.modules.values()) {
      module.fixedUpdate(fixedDeltaTime)
    }
    this.eventBus.emit('engine:fixedUpdate', fixedDeltaTime)
  }

  /**
   * Late update (after all regular updates)
   * @param {number} deltaTime - Time since last update
   */
  lateUpdate(deltaTime) {
    for (const module of this.modules.values()) {
      module.lateUpdate(deltaTime)
    }
    this.eventBus.emit('engine:lateUpdate', deltaTime)
  }

  /**
   * Stop the engine
   */
  async stop() {
    if (!this.running) {
      this.logger.warn('Engine not running')
      return
    }

    this.logger.info('Stopping engine...')
    this.running = false
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Stop all modules in reverse order
    const moduleArray = Array.from(this.modules.entries()).reverse()
    for (const [name, module] of moduleArray) {
      try {
        await module.stop()
        this.logger.info(`Stopped module: ${name}`)
      } catch (error) {
        this.logger.error(`Failed to stop module ${name}:`, error)
      }
    }
    
    this.eventBus.emit('engine:stopped')
    this.logger.info('Engine stopped successfully')
  }

  /**
   * Destroy the engine and clean up resources
   */
  async destroy() {
    if (this.running) {
      await this.stop()
    }

    this.logger.info('Destroying engine...')
    
    // Destroy all modules
    for (const [name, module] of this.modules) {
      try {
        await module.destroy()
        this.logger.info(`Destroyed module: ${name}`)
      } catch (error) {
        this.logger.error(`Failed to destroy module ${name}:`, error)
      }
    }
    
    this.modules.clear()
    this.eventBus.clear()
    this.eventBus.emit('engine:destroyed')
    this.logger.info('Engine destroyed successfully')
  }

  /**
   * Get current FPS
   * @returns {number}
   */
  getFPS() {
    return this.fps
  }
}