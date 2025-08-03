# Dockerized Monorepo

This monorepo contains a Rails API and React client app, fully containerized with Docker.

## Prerequisites

- Docker and Docker Compose installed
- Copy environment variables to `.env` file (already created)

## Quick Start

Run the entire stack with one command:

```bash
docker compose up --build
```

This will start:
- **PostgreSQL Database** on port 5432
- **Rails API** on port 3000
- **React Client** on port 3001

## Services

### Database (PostgreSQL)
- Port: 5432
- Database: `api_development`
- User: `postgres`
- Password: `password`

### Rails API
- Port: 3000
- Includes JWT authentication with Devise
- Google OAuth2 integration
- Automatic database setup and migrations

### React Client
- Port: 3001
- Built with Vite, TypeScript, Redux Toolkit
- Mantine UI components
- React Router for navigation

## Development Workflow

### Start the stack
```bash
docker compose up --build
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f client
```

### Run Rails commands
```bash
# Rails console
docker compose exec api bundle exec rails console

# Run migrations
docker compose exec api bundle exec rails db:migrate

# Run tests
docker compose exec api bundle exec rspec
```

### Run React commands
```bash
# Install new packages
docker compose exec client npm install <package-name>

# Run linter
docker compose exec client npm run lint

# Build production
docker compose exec client npm run build
```

### Stop the stack
```bash
docker compose down
```

### Clean restart (rebuild images)
```bash
docker compose down
docker compose up --build
```

## Environment Variables

The `.env` file at the root contains:
- Google OAuth credentials
- JWT secret key
- Database configuration

## File Structure

```
.
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Environment variables
├── api/                        # Rails API
│   ├── Dockerfile.dev          # Development Docker image
│   ├── .dockerignore          # Files to exclude from Docker build
│   └── ...                    # Rails application files
└── client/                     # React application
    ├── Dockerfile             # React Docker image
    ├── .dockerignore          # Files to exclude from Docker build
    └── ...                    # React application files
```

## Testing the Setup

1. Start the stack: `docker compose up --build`
2. Visit http://localhost:3001 for the React app
3. API is available at http://localhost:3000
4. Try the Google OAuth login flow

## Troubleshooting

### Port conflicts
If ports 3000, 3001, or 5432 are in use, stop other services or modify ports in `docker-compose.yml`

### Database issues
```bash
# Reset database
docker compose exec api bundle exec rails db:drop db:create db:migrate
```

### Rebuild specific service
```bash
docker compose up --build api
```