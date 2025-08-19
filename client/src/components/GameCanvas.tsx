import { useEffect, useRef, useState } from 'react'
import { SegmentedControl, Paper, Text } from '@mantine/core'
import { GameEngine } from '../engine/core/Engine.js'
import { AssetManager } from '../engine/assets/AssetManager.js'
import { InputManager } from '../engine/input/InputManager.js'
import { IsometricRenderer } from '../engine/rendering/IsometricRenderer.js'
import { WorldManager } from '../engine/world/WorldManager.js'
import { StateManager } from '../engine/state/StateManager.js'
import { Entity } from '../engine/world/Entity.js'
import { GameConfig } from '../engine/config/GameConfig.js'

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [fps, setFPS] = useState(0)
  const [placementMode, setPlacementMode] = useState<'3d-block' | '2d-tile'>('3d-block')
  const [debugInfo, setDebugInfo] = useState({
    chunks: 0,
    entities: 0,
    camera: { x: 0, y: 0 },
    zoom: 1,
    undoState: { canUndo: false, canRedo: false, historyLength: 0 }
  })

  useEffect(() => {
    if (!canvasRef.current) return
    
    let cancelled = false
    let engine: GameEngine | null = null
    
    const initEngine = async () => {
      // Create game engine
      engine = new GameEngine({
        targetFPS: 60,
        fixedTimeStep: 16.67
      })

      // Create and register modules
      const assetManager = new AssetManager(engine)
      const inputManager = new InputManager(engine, canvasRef.current!)
      const renderer = new IsometricRenderer(engine, canvasRef.current!)
      const worldManager = new WorldManager(engine)
      const stateManager = new StateManager(engine)

      engine.registerModule(assetManager)
      engine.registerModule(inputManager)
      engine.registerModule(renderer)
      engine.registerModule(worldManager)
      engine.registerModule(stateManager)

      // Store engine reference
      engineRef.current = engine

      // Initialize and start engine
      try {
        // Check if cancelled
        if (cancelled) {
          console.log('Initialization cancelled before engine.initialize')
          return
        }
        
        await engine.initialize()
        
        // Check again after async operation
        if (cancelled) {
          console.log('Initialization cancelled after engine.initialize')
          return
        }
        
        // Set up camera BEFORE creating world using config values
        let cameraX = GameConfig.camera.initialX
        let cameraY = GameConfig.camera.initialY
        let cameraZoom = GameConfig.camera.initialZoom
        
        renderer.setCamera(cameraX, cameraY)
        renderer.setZoom(cameraZoom)
        
        // Check if cancelled before creating world
        if (cancelled) {
          console.log('Initialization cancelled before world creation')
          return
        }
        
        // Create initial world with single tile
        worldManager.createWorld(GameConfig.world.defaultWorldId, cameraX, cameraY)

        // Handle keyboard input for camera movement
        engine.eventBus.on('input:keydown', ({ key }) => {
          const moveSpeed = GameConfig.camera.moveSpeed
          
          switch(key) {
            case 'KeyW':
            case 'ArrowUp':
              cameraY -= moveSpeed
              break
            case 'KeyS':
            case 'ArrowDown':
              cameraY += moveSpeed
              break
            case 'KeyA':
            case 'ArrowLeft':
              cameraX -= moveSpeed
              break
            case 'KeyD':
            case 'ArrowRight':
              cameraX += moveSpeed
              break
            case 'KeyQ':
              cameraZoom = Math.max(GameConfig.camera.minZoom, cameraZoom - GameConfig.camera.zoomSpeed)
              renderer.setZoom(cameraZoom)
              break
            case 'KeyE':
              cameraZoom = Math.min(GameConfig.camera.maxZoom, cameraZoom + GameConfig.camera.zoomSpeed)
              renderer.setZoom(cameraZoom)
              break
            case 'KeyG':
              renderer.toggleGrid()
              break
            case 'KeyB':
              renderer.toggleChunkBorders()
              break
            case 'KeyH':
              renderer.toggleDebug()
              break
          }
          
          renderer.setCamera(cameraX, cameraY)
          engine.eventBus.emit('camera:moved', { x: cameraX, y: cameraY })
        })

        // Handle mouse wheel for zoom
        engine.eventBus.on('input:wheel', ({ deltaY }) => {
          cameraZoom = Math.max(GameConfig.camera.minZoom, Math.min(GameConfig.camera.maxZoom, cameraZoom - deltaY * GameConfig.camera.wheelZoomSpeed))
          renderer.setZoom(cameraZoom)
        })

        // Handle tile hover events
        engine.eventBus.on('tile:hover', ({ current, previous }) => {
          renderer.setHoveredTile(current)
        })
        
        // Handle entity clicks
        engine.eventBus.on('entity:clicked', ({ entity }) => {
          console.log('Entity clicked:', entity)
          // Add visual feedback
          entity.color = '#ffff00'
          setTimeout(() => {
            entity.color = entity.getDefaultColor(entity.type)
          }, 200)
        })

        // Set up rendering loop
        engine.eventBus.on('engine:update', () => {
          // Render the world
          const chunks = worldManager.getActiveChunks()
          
          // Debug logging
          if (chunks.size === 0) {
            console.warn('No chunks to render!')
          }
          
          renderer.renderWorld(chunks)
          
          // Update debug info including undo state
          const stateManager = engine.getModule('StateManager')
          const undoState = stateManager ? stateManager.getUndoRedoState() : { canUndo: false, canRedo: false, historyLength: 0 }
          
          setDebugInfo({
            chunks: chunks.size,
            entities: Array.from(chunks.values()).reduce((sum, chunk) => 
              sum + chunk.getEntities().length, 0),
            camera: { x: cameraX, y: cameraY },
            zoom: cameraZoom,
            undoState
          })
        })

        // Track FPS
        engine.eventBus.on('engine:fps', (newFps) => {
          setFPS(newFps)
        })

        // Check if cancelled before starting
        if (cancelled) {
          console.log('Initialization cancelled before engine.start')
          return
        }
        
        // Start the engine
        await engine.start()
        
        if (!cancelled) {
          console.log('Game engine started successfully')
        }
      } catch (error) {
        console.error('Failed to start game engine:', error)
      }
    }

    initEngine()

    // Cleanup
    return () => {
      cancelled = true
      
      // Stop and destroy the engine immediately
      if (engine && (engine as any).running) {
        engine.stop().then(() => {
          return engine.destroy()
        }).then(() => {
          console.log('Engine stopped and cleaned up in effect cleanup')
        }).catch(err => {
          console.error('Error during engine cleanup:', err)
        })
      } else if (engine) {
        engine.destroy().then(() => {
          console.log('Engine cleaned up in effect cleanup')
        }).catch(err => {
          console.error('Error during engine cleanup:', err)
        })
      }
      engineRef.current = null
    }
  }, [])

  // Emit placement mode changes to the game engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.eventBus.emit('placement:modeChanged', { mode: placementMode })
    }
  }, [placementMode])

  return (
    <div style={{ 
      position: 'relative',
      width: '100vw', 
      height: '100vh',
      backgroundColor: GameConfig.rendering.backgroundColor,
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      
      {/* Debug overlay */}
      {GameConfig.debug.showDebugInfo && <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        pointerEvents: 'none'
      }}>
        <div>FPS: {fps}</div>
        <div>Chunks: {debugInfo.chunks}</div>
        <div>Entities: {debugInfo.entities}</div>
        <div>Camera: ({debugInfo.camera.x.toFixed(1)}, {debugInfo.camera.y.toFixed(1)})</div>
        <div>Zoom: {debugInfo.zoom.toFixed(2)}x</div>
        <div>History: {debugInfo.undoState.historyLength} actions</div>
        <div>Undo: {debugInfo.undoState.canUndo ? '✓' : '✗'} | Redo: {debugInfo.undoState.canRedo ? '✓' : '✗'}</div>
      </div>}
      
      {/* Controls help */}
      {GameConfig.debug.showControls && <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        color: '#00ff88',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        pointerEvents: 'none'
      }}>
        <div>Controls:</div>
        <div>WASD/Arrows - Move camera</div>
        <div>Q/E - Zoom in/out</div>
        <div>Mouse wheel - Zoom</div>
        <div>G - Toggle grid</div>
        <div>B - Toggle chunk borders</div>
        <div>H - Toggle debug info</div>
        <div>Click - Place/stack blocks</div>
        <div>Right click - Remove top block</div>
        <div>Cmd+Z - Undo | Cmd+Shift+Z - Redo</div>
      </div>}

      {/* Placement Mode UI */}
      <Paper
        shadow="lg"
        p="md"
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #00ff88',
          minWidth: '200px'
        }}
      >
        <Text size="sm" style={{ color: '#00ff88', marginBottom: 10, fontFamily: 'monospace' }}>
          Placement Mode
        </Text>
        <SegmentedControl
          value={placementMode}
          onChange={(value) => setPlacementMode(value as '3d-block' | '2d-tile')}
          data={[
            { label: '3D Block', value: '3d-block' },
            { label: '2D Tile', value: '2d-tile' }
          ]}
          styles={{
            root: {
              backgroundColor: 'transparent',
            },
            control: {
              backgroundColor: 'rgba(0, 255, 136, 0.2)',
              color: '#00ff88',
              border: '1px solid #00ff88',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 136, 0.3)',
              }
            },
            controlActive: {
              backgroundColor: '#00ff88',
              color: '#000',
              '&:hover': {
                backgroundColor: '#00ff88',
              }
            }
          }}
        />
        <Text size="xs" style={{ color: '#00ccff', marginTop: 10, fontFamily: 'monospace' }}>
          {placementMode === '3d-block' 
            ? 'Place stackable 3D blocks' 
            : 'Place 2D tiles (water/texture)'}
        </Text>
      </Paper>
    </div>
  )
}