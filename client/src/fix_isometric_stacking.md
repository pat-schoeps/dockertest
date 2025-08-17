# Fix for Isometric Block Stacking and Highlighting

## Root Cause
The issue is in the `worldToIsometric()` method which uses subtraction for Z coordinates:
```javascript
const isoY = (worldX + worldY) * (this.tileHeight / 2) - worldZ * this.tileDepth
```

This is backwards! Higher Z values should appear higher on screen, not lower.

## Fix 1: Correct the worldToIsometric method
Change line 130 in IsometricRenderer.js:
```javascript
// WRONG (current):
const isoY = (worldX + worldY) * (this.tileHeight / 2) - worldZ * this.tileDepth

// CORRECT:
const isoY = (worldX + worldY) * (this.tileHeight / 2) + worldZ * this.tileDepth
```

## Fix 2: Simplify the highlightTopOfBlock method
Once worldToIsometric is fixed, the highlighting becomes much simpler:

```javascript
highlightTopOfBlock(worldX, worldY, z) {
  this.ctx.save()
  
  // Get the isometric position of the block at level z
  const relX = worldX - this.camera.x
  const relY = worldY - this.camera.y
  
  // Get the block height
  const blockHeight = 1 // Default block height
  const blockDepth = blockHeight * this.tileDepth
  
  // Calculate position at the TOP of the block
  const iso = this.worldToIsometric(relX, relY, z)
  const screenX = iso.x * this.camera.zoom + this.width / 2
  const screenY = (iso.y - blockDepth) * this.camera.zoom + this.height / 2
  
  // Draw highlight
  this.ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'
  this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)'
  this.ctx.lineWidth = 3 / this.camera.zoom
  
  this.ctx.beginPath()
  this.ctx.moveTo(screenX, screenY)
  this.ctx.lineTo(screenX + this.tileWidth / 2 * this.camera.zoom, screenY + this.tileHeight / 2 * this.camera.zoom)
  this.ctx.lineTo(screenX, screenY + this.tileHeight * this.camera.zoom)
  this.ctx.lineTo(screenX - this.tileWidth / 2 * this.camera.zoom, screenY + this.tileHeight / 2 * this.camera.zoom)
  this.ctx.closePath()
  this.ctx.fill()
  this.ctx.stroke()
  
  this.ctx.restore()
}
```

## Fix 3: Update renderBlock to be consistent
Remove the manual stack offset calculation since worldToIsometric now handles Z properly:

```javascript
renderBlock(block, worldX, worldY) {
  const relX = worldX - this.camera.x
  const relY = worldY - this.camera.y
  const iso = this.worldToIsometric(relX, relY, block.z)
  
  const screenX = iso.x * this.camera.zoom + this.width / 2
  const screenY = iso.y * this.camera.zoom + this.height / 2
  
  // Rest of the method remains the same...
}
```

This will fix both the block stacking "sinking" issue AND the highlighting offset problem.
