# ObserverZ.com - Setup Guide

This guide will help you set up ObserverZ.com for local development or production deployment using Docker.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For Local Development

- **Node.js**: Version 20 or higher
- **pnpm**: Version 10 or higher (install with `npm install -g pnpm`)
- **PostgreSQL**: Version 16 or higher
- **Redis**: Version 7 or higher
- **Git**: Latest version

### For Docker Deployment

- **Docker**: Version 24 or higher
- **Docker Compose**: Version 2.20 or higher

---

## Quick Start

### Option 1: Docker (Recommended for Quick Setup)

```bash
# 1. Clone the repository
git clone https://github.com/abuzant/ObserverZ.com.git
cd ObserverZ.com

# 2. Environment is already configured (.env file exists)
# Edit .env file with your configuration if needed
nano .env

# 3. Start all services with Docker Compose
docker-compose up -d

# 4. Wait for services to start (about 30-60 seconds)
docker-compose logs -f app

# 5. Run database migrations
docker-compose exec app pnpm db:push

# 6. Access the application
# http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/abuzant/ObserverZ.com.git
cd ObserverZ.com

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL and Redis (using Docker)
docker-compose -f docker-compose.dev.yml up -d

# 4. Environment is already configured (.env file exists)
# Verify DATABASE_URL and REDIS_URL point to localhost
cat .env | grep -E "DATABASE_URL|REDIS_URL"

# 5. Run database migrations
pnpm db:push

# 6. Start development server (with hot-reload)
pnpm dev

# 7. Access the application
# The server will auto-detect an available port (usually http://localhost:3000)
```

---

## Local Development

### 1. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install
```

### 2. Start Database Services

You have two options for running PostgreSQL and Redis:

#### Option A: Using Docker (Recommended)

```bash
# Start only database services
docker-compose -f docker-compose.dev.yml up -d

# Check services are running
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

#### Option B: Install Locally

**PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt install postgresql-16

# macOS
brew install postgresql@16

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@16  # macOS
```

**Redis:**
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

### 3. Configure Environment

The `.env` file is already created. Verify the configuration:

```bash
# Check database connection string
cat .env | grep DATABASE_URL

# For local development, it should be:
# DATABASE_URL=postgresql://observerz:observerz_secure_password_change_me@localhost:5432/observerz
```

### 4. Initialize Database

```bash
# Run database migrations
pnpm db:push

# Verify database is set up correctly
pnpm db:check
```

### 5. Start Development Server

```bash
# Start backend with hot-reload
pnpm dev

# The server will:
# - Auto-detect an available port (starting from 3000)
# - Start Vite dev server for frontend
# - Enable hot-module replacement (HMR)
# - Watch for file changes

# Access the application at the displayed URL (usually http://localhost:3000)
```

### 6. Development Workflow

```bash
# Run type checking
pnpm check

# Format code
pnpm format

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## Docker Deployment

### Architecture

ObserverZ uses a monorepo structure where:
- **Frontend**: React + Vite (built to `dist/public`)
- **Backend**: Express + tRPC (built to `dist/index.js`)
- **In Production**: Backend serves the built frontend

### Development with Docker

Use `docker-compose.dev.yml` to run only databases:

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (reset database)
docker-compose -f docker-compose.dev.yml down -v
```

### Production with Docker

Use `docker-compose.yml` for full production deployment:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Run migrations
docker-compose exec app pnpm db:push

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### With Nginx Reverse Proxy

```bash
# Start with Nginx (requires nginx.conf and SSL certificates)
docker-compose --profile with-nginx up -d

# Access via:
# - http://localhost (Nginx forwards to app)
# - https://localhost (with SSL)
```

### Docker Images

Three Dockerfiles are provided:

1. **`Dockerfile`** (Recommended): Unified production build
   - Builds both frontend and backend
   - Multi-stage build for optimal size
   - Production-ready

2. **`Dockerfile.backend`**: Separate backend-only build
   - Useful for microservices architecture
   - Can be used independently

3. **`Dockerfile.frontend`**: Separate frontend-only build (⚠️ Currently not functional - use Dockerfile instead)

---

## Configuration

### Environment Variables

All configuration is in the `.env` file. Key variables:

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
DB_NAME=observerz
DB_USER=observerz
DB_PASSWORD=your_secure_password
```

#### Redis
```bash
REDIS_URL=redis://localhost:6379
```

#### Authentication
```bash
JWT_SECRET=your_very_secure_random_string
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your_oauth_user_id
OWNER_NAME=Your Name
```

#### Application
```bash
NODE_ENV=development  # or 'production'
VITE_APP_TITLE=ObserverZ.com
VITE_APP_ID=your_app_id
```

#### AWS S3 (Optional - for file storage)
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
```

### Modifying Configuration

1. Edit the `.env` file:
   ```bash
   nano .env
   ```

2. Restart services to apply changes:
   ```bash
   # Local development
   # Stop the dev server (Ctrl+C) and restart: pnpm dev

   # Docker
   docker-compose restart app
   ```

---

## Database Setup

### Migrations

ObserverZ uses Drizzle ORM for database management:

```bash
# Generate migration files
pnpm drizzle-kit generate

# Apply migrations
pnpm db:push

# Check migration status
pnpm drizzle-kit check
```

### Schema

The database schema is defined in `drizzle/schema.ts` and includes:

- **Core Tables**: users, sources, articles, tags, article_tags
- **Analytics**: click_events, geo_rollups, user_ranks
- **User Features**: journals, walls, stars, pins, comments
- **Monetization**: wallets, wallet_tx, subscriptions, payouts
- **Advanced**: graphs, image_rollups, daily_reports

### Seed Data (Optional)

```bash
# Create seed data script if needed
npx tsx scripts/seed.ts
```

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U observerz observerz > backup-$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U observerz observerz < backup-20250101.sql

# Backup with Docker volumes
docker run --rm -v observerz_postgres_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup.tar.gz /data
```

---

## Troubleshooting

### Port Already in Use

The server auto-detects available ports, but if you need a specific port:

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U observerz -d observerz

# Test from Docker
docker-compose exec postgres psql -U observerz -d observerz

# Check PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Test from Docker
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Docker Build Failures

```bash
# Clean build cache
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# Prune Docker system
docker system prune -a
```

### Permission Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# For Docker volumes
docker-compose down
sudo rm -rf /var/lib/docker/volumes/observerz_*
docker-compose up -d
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache
pnpm store prune
```

### TypeScript Errors

```bash
# Run type checking
pnpm check

# Check specific file
pnpm tsc --noEmit path/to/file.ts
```

### Application Won't Start

```bash
# Check logs
docker-compose logs -f app

# Check environment variables
docker-compose exec app env

# Verify build output
docker-compose exec app ls -la dist/
```

### Database Migration Fails

```bash
# Check current migration status
pnpm drizzle-kit check

# Drop and recreate database (⚠️ DESTRUCTIVE)
docker-compose down -v
docker-compose up -d postgres
sleep 10
pnpm db:push
```

---

## Additional Resources

- **README.md**: Project overview and features
- **INSTALLATION.md**: Detailed installation guide
- **API.md**: Complete API documentation
- **GitHub Issues**: https://github.com/abuzant/ObserverZ.com/issues
- **Contact**: ruslan@observerz.com

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm install              # Install dependencies
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm check                # Type checking
pnpm test                 # Run tests

# Database
pnpm db:push              # Run migrations
pnpm drizzle-kit generate # Generate migration files

# Docker - Development
docker-compose -f docker-compose.dev.yml up -d     # Start databases only
docker-compose -f docker-compose.dev.yml down      # Stop databases

# Docker - Production
docker-compose up -d                               # Start all services
docker-compose down                                # Stop all services
docker-compose logs -f app                         # View logs
docker-compose exec app pnpm db:push              # Run migrations in container
```

---

**Last Updated**: 2025-11-13
**Version**: 1.0.0
**Maintainer**: Ruslan Abuzant
