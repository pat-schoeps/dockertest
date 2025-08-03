# CLAUDE.md - Project Overview

This document provides context for Claude Code sessions about the monorepo structure and implementation details.

## Project Structure

This is a **monorepo** containing:
- **Rails API** (`/api/`) - Ruby on Rails 8.0.2 in API mode with PostgreSQL
- **React Client** (`/client/`) - React 19 with Vite, TypeScript, Redux Toolkit, Mantine UI
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

**DevOps:**
- Docker + Docker Compose
- Development and production Dockerfiles
- Volume mounting for hot reload

## Next Steps / TODOs

- [ ] Test Docker setup once Docker is installed
- [ ] Add user profile functionality
- [ ] Implement file upload for avatars
- [ ] Add password reset functionality
- [ ] Implement refresh token rotation
- [ ] Add API rate limiting
- [ ] Set up CI/CD pipeline