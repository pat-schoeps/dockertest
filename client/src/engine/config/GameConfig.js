/**
 * Central configuration file for game settings
 * Adjust these values to customize the game appearance and behavior
 */

export const GameConfig = {
  // Block/Tile Configuration
  block: {
    defaultColor: '#00ff88',     // Green color for the default block
    defaultHeight: 2.0,           // Height of the 3D block (reduced from 1.75 for better proportions)
    defaultType: 'grass'
  },

  // Camera Configuration
  camera: {
    initialX: 8,                  // Initial camera X position (centered on block at 8,8)
    initialY: 8,                  // Initial camera Y position
    initialZoom: 1.2,             // Initial zoom level
    minZoom: 0.5,                 // Minimum zoom level
    maxZoom: 2.0,                 // Maximum zoom level
    moveSpeed: 0.5,               // Speed of camera movement with keyboard
    zoomSpeed: 0.1,               // Speed of zoom with Q/E keys
    wheelZoomSpeed: 0.001         // Speed of zoom with mouse wheel
  },

  // Isometric Rendering Configuration
  rendering: {
    tileWidth: 64,                // Width of isometric tiles
    tileHeight: 32,               // Height of isometric tiles (diamond shape)
    tileDepth: 20,                // Height per Z level (affects 3D appearance)
    showGridByDefault: true,      // Whether to show grid on startup
    showChunkBorders: false,      // Whether to show chunk borders
    enableGlow: true,             // Whether to enable glow effects on entities
    backgroundColor: '#2a1a4a'    // Canvas background color
  },

  // World Configuration
  world: {
    defaultWorldId: 'default',    // Default world identifier
    chunkSize: 16,                // Size of chunks (16x16 blocks)
    blockPosition: {              // Position of the single block
      x: 8,
      y: 8,
      z: 0
    }
  },

  // Grid Rendering
  grid: {
    color: 'rgba(255, 255, 255, 0.05)',  // Grid line color
    lineWidth: 1,                        // Grid line width
    extent: 10                           // Extra tiles to render beyond screen
  },

  // Entity Colors (for future use)
  entityColors: {
    player: '#00ccff',
    enemy: '#ff4444',
    item: '#ffff00',
    npc: '#ff00ff'
  },

  // Debug Settings
  debug: {
    showFPS: true,                // Show FPS counter
    showDebugInfo: true,          // Show debug overlay
    showControls: true            // Show control instructions
  }
}

// Color utility functions
export const ColorUtils = {
  /**
   * Darken a hex color by a factor
   * @param {string} color - Hex color string
   * @param {number} factor - Darken factor (0-1, where 1 is original color)
   * @returns {string} Darkened hex color
   */
  darken(color, factor) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    const newR = Math.floor(r * factor)
    const newG = Math.floor(g * factor)
    const newB = Math.floor(b * factor)
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  },

  /**
   * Lighten a hex color by a factor
   * @param {string} color - Hex color string
   * @param {number} factor - Lighten factor (0-1, where 0 is original color)
   * @returns {string} Lightened hex color
   */
  lighten(color, factor) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor))
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor))
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor))
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }
}