import { Module } from '../core/Module.js'
import { Logger } from '../utils/Logger.js'

/**
 * Asset types supported by the manager
 */
export const AssetType = {
  IMAGE: 'image',
  AUDIO: 'audio',
  JSON: 'json',
  TEXT: 'text',
  BINARY: 'binary'
}

/**
 * Asset loader for managing game resources
 */
export class AssetManager extends Module {
  constructor(engine) {
    super('AssetManager', engine)
    this.logger = new Logger('AssetManager')
    
    this.assets = new Map()
    this.loading = new Map()
    this.basePath = ''
    
    this.totalAssets = 0
    this.loadedAssets = 0
  }

  /**
   * Set base path for asset loading
   * @param {string} path - Base path
   */
  setBasePath(path) {
    this.basePath = path.endsWith('/') ? path : path + '/'
  }

  /**
   * Load an asset
   * @param {string} key - Asset key for retrieval
   * @param {string} url - Asset URL
   * @param {string} type - Asset type
   * @returns {Promise<any>}
   */
  async load(key, url, type = AssetType.IMAGE) {
    // Check if already loaded
    if (this.assets.has(key)) {
      return this.assets.get(key)
    }
    
    // Check if currently loading
    if (this.loading.has(key)) {
      return this.loading.get(key)
    }
    
    const fullUrl = this.basePath + url
    
    // Create loading promise
    const loadPromise = this.loadAsset(fullUrl, type)
      .then(asset => {
        this.assets.set(key, asset)
        this.loading.delete(key)
        this.loadedAssets++
        
        this.engine.eventBus.emit('asset:loaded', {
          key,
          url: fullUrl,
          type,
          asset
        })
        
        this.logger.info(`Loaded asset: ${key}`)
        return asset
      })
      .catch(error => {
        this.loading.delete(key)
        this.logger.error(`Failed to load asset ${key}:`, error)
        
        this.engine.eventBus.emit('asset:error', {
          key,
          url: fullUrl,
          type,
          error
        })
        
        throw error
      })
    
    this.loading.set(key, loadPromise)
    this.totalAssets++
    
    return loadPromise
  }

  /**
   * Load multiple assets
   * @param {Array<{key: string, url: string, type?: string}>} assets - Assets to load
   * @returns {Promise<Map<string, any>>}
   */
  async loadBatch(assets) {
    const promises = assets.map(({ key, url, type }) => 
      this.load(key, url, type).then(asset => [key, asset])
    )
    
    const results = await Promise.all(promises)
    return new Map(results)
  }

  /**
   * Load asset based on type
   * @param {string} url - Asset URL
   * @param {string} type - Asset type
   * @returns {Promise<any>}
   */
  async loadAsset(url, type) {
    switch (type) {
      case AssetType.IMAGE:
        return this.loadImage(url)
      case AssetType.AUDIO:
        return this.loadAudio(url)
      case AssetType.JSON:
        return this.loadJSON(url)
      case AssetType.TEXT:
        return this.loadText(url)
      case AssetType.BINARY:
        return this.loadBinary(url)
      default:
        throw new Error(`Unknown asset type: ${type}`)
    }
  }

  /**
   * Load an image
   * @param {string} url - Image URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  /**
   * Load audio
   * @param {string} url - Audio URL
   * @returns {Promise<HTMLAudioElement>}
   */
  loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true })
      audio.addEventListener('error', () => reject(new Error(`Failed to load audio: ${url}`)), { once: true })
      audio.src = url
    })
  }

  /**
   * Load JSON data
   * @param {string} url - JSON URL
   * @returns {Promise<any>}
   */
  async loadJSON(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url} (${response.status})`)
    }
    return response.json()
  }

  /**
   * Load text data
   * @param {string} url - Text URL
   * @returns {Promise<string>}
   */
  async loadText(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load text: ${url} (${response.status})`)
    }
    return response.text()
  }

  /**
   * Load binary data
   * @param {string} url - Binary URL
   * @returns {Promise<ArrayBuffer>}
   */
  async loadBinary(url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load binary: ${url} (${response.status})`)
    }
    return response.arrayBuffer()
  }

  /**
   * Get a loaded asset
   * @param {string} key - Asset key
   * @returns {any}
   */
  get(key) {
    if (!this.assets.has(key)) {
      throw new Error(`Asset not loaded: ${key}`)
    }
    return this.assets.get(key)
  }

  /**
   * Check if asset is loaded
   * @param {string} key - Asset key
   * @returns {boolean}
   */
  has(key) {
    return this.assets.has(key)
  }

  /**
   * Unload an asset
   * @param {string} key - Asset key
   */
  unload(key) {
    if (this.assets.has(key)) {
      const asset = this.assets.get(key)
      
      // Clean up based on asset type
      if (asset instanceof HTMLImageElement) {
        asset.src = ''
      } else if (asset instanceof HTMLAudioElement) {
        asset.pause()
        asset.src = ''
      }
      
      this.assets.delete(key)
      this.loadedAssets--
      
      this.engine.eventBus.emit('asset:unloaded', { key })
      this.logger.info(`Unloaded asset: ${key}`)
    }
  }

  /**
   * Unload all assets
   */
  unloadAll() {
    for (const key of this.assets.keys()) {
      this.unload(key)
    }
    this.totalAssets = 0
    this.loadedAssets = 0
  }

  /**
   * Get loading progress
   * @returns {{loaded: number, total: number, progress: number}}
   */
  getProgress() {
    const progress = this.totalAssets > 0 
      ? this.loadedAssets / this.totalAssets 
      : 1
    
    return {
      loaded: this.loadedAssets,
      total: this.totalAssets,
      progress
    }
  }

  async onDestroy() {
    this.unloadAll()
  }
}