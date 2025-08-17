# CLAUDE.md - Project Overview

This document provides context for Claude Code sessions about the monorepo structure and implementation details.

## Project Structure

This is a **monorepo** containing:
- **Rails API** (`/api/`) - Ruby on Rails 8.0.2 in API mode with PostgreSQL
- **React Client** (`/client/`) - React 19 with Vite, TypeScript, Redux Toolkit, Mantine UI
- **Game Engine** (`/client/src/engine/`) - Custom isometric 3D game engine with block-based building
- **Docker Setup** - Complete containerization with docker-compose

## Authentication System

### Rails API Authentication
- **Devise** + **JWT tokens** for authentication
- **Google OAuth2** integration via Omniauth
- **Security hardened** JWT implementation with timing attack prevention
- **CORS configured** to accept requests from React client (port 3001)

**Key Files:**
- `api/app/controllers/concerns/jwt_authenticable.rb` - JWT authentication logic with security fixes
- `api/app/controllers/auth/` - Authentication endpoints (sessions, registrations, oauth)
- `api/app/models/user.rb` - User model with JWT and OAuth support
- `api/config/initializers/devise.rb` - Devise configuration
- `api/config/initializers/omniauth.rb` - Google OAuth configuration

### React Client Authentication
- **Redux Toolkit Query (RTK Query)** for API calls with automatic JWT token handling
- **React Router v7** for navigation with protected routes
- **Automatic token storage** in localStorage
- **Google OAuth flow** integrated with Rails backend

**Key Files:**
- `client/src/services/api.ts` - RTK Query API client with JWT token management
- `client/src/hooks/useAuth.ts` - Custom authentication hook
- `client/src/components/ProtectedRoute.tsx` - Route wrapper for authentication
- `client/src/pages/LoginPage.tsx` - Login/signup form with Google OAuth
- `client/src/pages/GoogleCallbackPage.tsx` - OAuth callback handler
- `client/src/pages/HomePage.tsx` - Protected dashboard page

## Port Configuration

- **Rails API**: `http://localhost:3000`
- **React Client**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432` (when running locally)

## Google OAuth Setup

**Environment Variables Required:**
```
GOOGLE_CLIENT_ID=131058681542-dbhkab8eik24tjj8krrcl5c04fduponb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

**OAuth Flow:**
1. User clicks "Continue with Google" in React app
2. Redirects to Google OAuth with client_id and redirect_uri
3. Google redirects back to `http://localhost:3001/auth/google/callback`
4. React app sends authorization code to Rails API at `/auth/google`
5. Rails exchanges code for user info and creates/finds user
6. Rails returns JWT token to React app
7. React app stores token and redirects to protected routes

## Database Schema

**Users Table:**
- Standard Devise fields (email, encrypted_password, etc.)
- OAuth fields: `provider`, `uid`, `name`, `avatar_url`
- JWT field: `jti` (JWT identifier for token invalidation)

## Testing

**Rails API Tests (RSpec):**
- Located in `api/spec/`
- Comprehensive test suite for all authentication endpoints
- WebMock for mocking OAuth requests
- Factory patterns for test data

**Test Commands:**
```bash
cd api && bundle exec rspec
```

## Development Commands

**Rails API:**
```bash
cd api
bundle exec rails server          # Start server on port 3000
bundle exec rails console         # Rails console
bundle exec rails db:migrate      # Run migrations
bundle exec rspec                 # Run tests
```

**React Client:**
```bash
cd client
npm run dev                       # Start dev server on port 3001
npm run build                     # Production build
npm run lint                      # ESLint
npm run type-check                # TypeScript checking
```

## Docker Setup

**Files:**
- `docker-compose.yml` - Orchestrates PostgreSQL, Rails API, React client
- `api/Dockerfile.dev` - Development Rails container
- `client/Dockerfile` - React container with Vite
- `.env` - Environment variables for containers

**Commands:**
```bash
docker compose up --build        # Start entire stack
docker compose logs -f api       # View Rails logs
docker compose exec api rails console  # Rails console in container
```

## Security Features Implemented

1. **JWT Security:**
   - Constant-time string comparison to prevent timing attacks
   - Algorithm verification to prevent algorithm confusion attacks
   - Secure token extraction from Authorization header
   - JTI (JWT ID) for token invalidation

2. **OAuth Security:**
   - Proper redirect_uri validation
   - PKCE flow support (authorization code + redirect_uri)
   - Secure credential handling

3. **CORS Configuration:**
   - Restricted to specific frontend origin
   - Proper header exposure for Authorization tokens

## Recent Issues Resolved

1. **Google OAuth 401 Error**: Fixed by installing `dotenv-rails` gem to load environment variables
2. **React Router Navigation**: Updated from window.location.href to useNavigate for proper SPA routing
3. **Duplicate Requests**: Identified as React StrictMode behavior (development only)
4. **Port Configuration**: Standardized on Rails API port 3000, React client port 3001

## Development Workflow

1. **Local Development**: Run Rails and React servers separately
2. **Containerized Development**: Use Docker Compose for full stack
3. **Testing**: RSpec for backend, npm scripts for frontend
4. **Authentication Flow**: Fully functional Google OAuth + JWT system

## Technology Stack

**Backend:**
- Ruby 3.3.4, Rails 8.0.2
- PostgreSQL database
- Devise + JWT authentication
- Google OAuth2 via Omniauth
- RSpec testing framework

**Frontend:**
- React 19, TypeScript
- Vite build tool
- Redux Toolkit + RTK Query
- Mantine UI component library
- React Router v7
- Custom Game Engine (JavaScript ES6 modules)

**DevOps:**
- Docker + Docker Compose
- Development and production Dockerfiles
- Volume mounting for hot reload

## Game Engine

### Architecture
The client includes a custom-built isometric 3D game engine with modular architecture:

**Core Modules:**
- `Engine.js` - Main game loop with 60 FPS fixed timestep physics
- `EventBus.js` - Event-driven communication between modules
- `Module.js` - Base class for all engine modules

**Key Systems:**
- `IsometricRenderer.js` - 3D isometric rendering with depth sorting
- `WorldManager.js` - Chunk-based world management and block placement
- `StateManager.js` - Game state, UI state, and undo/redo history
- `InputManager.js` - Keyboard and mouse input handling
- `AssetManager.js` - Resource loading and management

### Game Features

**Block Building System:**
- **3D Block Stacking** - Click to place blocks, click again to stack on top
- **Block Types** - Multiple block types (grass, stone, water, sand, etc.)
- **Visual Height Variation** - Stacked blocks get progressively lighter colors
- **Block Properties** - Each block has customizable height (default: 2.0)

**Controls:**
- **WASD/Arrows** - Move camera around the world
- **Q/E** - Zoom in/out
- **Mouse Wheel** - Zoom control
- **Left Click** - Place/stack blocks
- **Right Click** - Remove topmost block
- **Cmd+Z** - Undo last action
- **Cmd+Shift+Z** - Redo action
- **G** - Toggle grid overlay
- **B** - Toggle chunk borders
- **H** - Toggle debug info

**Undo/Redo System:**
- Tracks up to 50 actions in history
- Records block placement and removal
- Preserves exact block properties when undoing/redoing
- Keyboard shortcuts: Cmd+Z (undo), Cmd+Shift+Z (redo)

### Technical Details

**Rendering System:**
- Isometric projection with proper depth sorting
- Camera with zoom and pan controls
- Grid overlay for tile visualization
- Debug overlay showing FPS, chunks, entities, history

**World System:**
- Chunk-based world (16x16 blocks per chunk)
- Dynamic chunk loading/unloading
- Support for multiple Z-layers (height)
- Entity management system

**Coordinate System:**
- World coordinates: X, Y, Z (Z is vertical)
- Isometric screen projection
- Proper stacking visualization with height offsets

### Configuration

**IMPORTANT: Always use GameConfig for units and dimensions!**

All game engine modules should pull values from `client/src/engine/config/GameConfig.js` instead of hardcoding values. This centralized configuration ensures consistency and makes adjustments easier.

Key settings in `client/src/engine/config/GameConfig.js`:
- `block.defaultHeight`: 2.0 (height of each block)
- `block.defaultColor`: '#00ff88' (default block color)
- `rendering.tileWidth`: 64 pixels
- `rendering.tileHeight`: 32 pixels  
- `rendering.tileDepth`: 20 pixels (per Z unit)
- `camera.initialZoom`: 1.2
- `camera.moveSpeed`: 0.5
- `debug.showDebugInfo`: true

**Best Practices:**
- ✅ Use `GameConfig.block.defaultHeight` instead of hardcoded `1` or `2`
- ✅ Use `GameConfig.rendering.tileWidth` instead of hardcoded `64`
- ✅ Use `this.tileDepth` (loaded from config in constructor) instead of hardcoded `20`
- ✅ Use `block.properties?.height || GameConfig.block.defaultHeight` for block height fallbacks
- ❌ Avoid hardcoding dimensions like `const blockHeight = 1`
- ❌ Avoid hardcoding pixel values like `const depth = 20`

### Recent Improvements

1. **Block Stacking** - Implemented proper 3D stacking with visual height representation
2. **Undo/Redo** - Complete action history with keyboard shortcuts
3. **Visual Feedback** - Height-based color variation for stacked blocks
4. **Fixed Rendering** - Corrected isometric coordinate calculations for proper stacking
5. **Hover Highlighting** - Dual highlighting system: ground-level tile selection + top face of highest block
6. **GameConfig Integration** - All dimensions and units now properly use centralized configuration

## Next Steps / TODOs

- [ ] Test Docker setup once Docker is installed
- [ ] Add user profile functionality
- [ ] Implement file upload for avatars
- [ ] Add password reset functionality
- [ ] Implement refresh token rotation
- [ ] Add API rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Add multiplayer support via Rails WebSockets
- [ ] Implement world persistence to database
- [ ] Add more block types and textures
- [ ] Create block selection UI
- [ ] Add sound effects for block placement/removal