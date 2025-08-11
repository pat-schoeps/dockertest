/**
 * Base Module class for all game engine modules
 * Provides lifecycle hooks and common functionality
 */
export class Module {
  constructor(name, engine) {
    this.name = name
    this.engine = engine
    this.enabled = true
    this.initialized = false
  }

  /**
   * Initialize the module (called once)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      throw new Error(`Module ${this.name} already initialized`)
    }
    await this.onInitialize()
    this.initialized = true
  }

  /**
   * Start the module
   */
  async start() {
    if (!this.initialized) {
      throw new Error(`Module ${this.name} not initialized`)
    }
    await this.onStart()
  }

  /**
   * Update the module (called every frame)
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    if (this.enabled && this.initialized) {
      this.onUpdate(deltaTime)
    }
  }

  /**
   * Fixed update (called at fixed intervals for physics)
   * @param {number} fixedDeltaTime - Fixed time step
   */
  fixedUpdate(fixedDeltaTime) {
    if (this.enabled && this.initialized) {
      this.onFixedUpdate(fixedDeltaTime)
    }
  }

  /**
   * Late update (called after all updates)
   * @param {number} deltaTime - Time since last update
   */
  lateUpdate(deltaTime) {
    if (this.enabled && this.initialized) {
      this.onLateUpdate(deltaTime)
    }
  }

  /**
   * Stop the module
   */
  async stop() {
    await this.onStop()
  }

  /**
   * Destroy the module and clean up resources
   */
  async destroy() {
    await this.onDestroy()
    this.initialized = false
  }

  /**
   * Enable the module
   */
  enable() {
    this.enabled = true
    this.onEnable()
  }

  /**
   * Disable the module
   */
  disable() {
    this.enabled = false
    this.onDisable()
  }

  // Lifecycle hooks to be overridden by subclasses
  async onInitialize() {}
  async onStart() {}
  onUpdate(deltaTime) {}
  onFixedUpdate(fixedDeltaTime) {}
  onLateUpdate(deltaTime) {}
  async onStop() {}
  async onDestroy() {}
  onEnable() {}
  onDisable() {}
}