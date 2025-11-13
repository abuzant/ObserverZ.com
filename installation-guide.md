# ObserverZ.com - Complete Installation Guide

**Version**: 1.0.0
**Last Updated**: November 13, 2025
**Maintained by**: Ruslan Abuzant with Claude AI

This comprehensive guide covers everything you need to install, configure, and deploy ObserverZ.com in various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Local Development Setup](#local-development-setup)
4. [Docker Development Setup](#docker-development-setup)
5. [Production Deployment](#production-deployment)
6. [Cloud Platform Deployment](#cloud-platform-deployment)
7. [Database Configuration](#database-configuration)
8. [Environment Variables Reference](#environment-variables-reference)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance & Updates](#maintenance--updates)
12. [Performance Tuning](#performance-tuning)
13. [Security Hardening](#security-hardening)
14. [Backup & Recovery](#backup--recovery)
15. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 10 GB free space
- **Network**: 1 Mbps bandwidth

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: 10+ Mbps bandwidth
- **OS**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows with WSL2

### Software Prerequisites

#### For Local Development

**Required**:
- **Node.js**: 20.x or higher
  ```bash
  # Check version
  node --version  # Should be v20.0.0 or higher
  ```

- **pnpm**: 10.x or higher
  ```bash
  # Install pnpm globally
  npm install -g pnpm@10

  # Check version
  pnpm --version  # Should be 10.0.0 or higher
  ```

- **Git**: Latest version
  ```bash
  # Check version
  git --version
  ```

**For Database Services** (choose one):
- **Option A**: Docker & Docker Compose (recommended)
- **Option B**: Native PostgreSQL 16+ and Redis 7+

#### For Docker Deployment

**Required**:
- **Docker**: 24.x or higher
  ```bash
  # Check version
  docker --version  # Should be 24.0.0 or higher
  ```

- **Docker Compose**: 2.20 or higher
  ```bash
  # Check version
  docker-compose --version  # Should be 2.20.0 or higher
  ```

### Installation of Prerequisites

#### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm@10

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Install Git (if not already installed)
sudo apt install -y git
```

#### macOS

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install pnpm
npm install -g pnpm@10

# Install Docker Desktop
brew install --cask docker

# Install Git (usually pre-installed)
brew install git
```

#### Windows (WSL2)

```powershell
# Install WSL2
wsl --install

# After WSL2 installation, open Ubuntu and follow Ubuntu instructions above
```

---

## Installation Methods

ObserverZ.com can be installed using three methods:

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **Local Development** | Active development, debugging | Hot-reload, full IDE support | Requires Node.js/pnpm |
| **Docker Development** | Testing, isolated environment | Easy cleanup, production parity | Slower iteration |
| **Production Docker** | Staging, production deployment | Scalable, portable | Requires Docker knowledge |

---

## Local Development Setup

This method runs the application directly on your host machine with hot-reload enabled.

### Step 1: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/abuzant/ObserverZ.com.git

# Or clone via SSH (if you have SSH keys set up)
git clone git@github.com:abuzant/ObserverZ.com.git

# Navigate to project directory
cd ObserverZ.com
```

### Step 2: Install Dependencies

```bash
# Install all Node.js dependencies
pnpm install

# This will:
# - Install ~200+ packages
# - Apply patches from patches/ directory
# - Take 2-5 minutes depending on your connection
```

**Verify Installation**:
```bash
# Check if node_modules exists
ls -la node_modules

# Verify critical packages
pnpm list react express drizzle-orm
```

### Step 3: Start Database Services

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps

# Expected output:
# NAME                          STATUS
# observerz-postgres-dev        Up (healthy)
# observerz-redis-dev           Up (healthy)
```

#### Option B: Using Native Services

**PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt install postgresql-16
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew install postgresql@16
brew services start postgresql@16

# Create database and user
sudo -u postgres psql
CREATE DATABASE observerz;
CREATE USER observerz WITH PASSWORD 'observerz_dev_password';
GRANT ALL PRIVILEGES ON DATABASE observerz TO observerz;
\q
```

**Redis**:
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Step 4: Configure Environment Variables

The `.env` file should already exist. Verify and customize if needed:

```bash
# View current configuration
cat .env

# Edit if necessary
nano .env
# or
code .env  # If using VS Code
```

**Key variables for local development**:
```bash
# Database (default values work for docker-compose.dev.yml)
DATABASE_URL=postgresql://observerz:observerz_dev_password@localhost:5432/observerz

# Redis (default values work for docker-compose.dev.yml)
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
VITE_APP_TITLE=ObserverZ.com - Dev

# Authentication (optional for development)
JWT_SECRET=dev_secret_key_change_in_production
```

### Step 5: Initialize Database

```bash
# Generate and run database migrations
pnpm db:push

# Expected output:
# ✓ Applying migrations...
# ✓ Done!
```

**Verify Database Setup**:
```bash
# Connect to PostgreSQL
psql postgresql://observerz:observerz_dev_password@localhost:5432/observerz

# List tables
\dt

# Should show 40+ tables including:
# - users
# - articles
# - tags
# - journals
# - wallets
# etc.

# Exit
\q
```

### Step 6: Start Development Server

```bash
# Start the development server with hot-reload
pnpm dev

# Expected output:
# > observerz@1.0.0 dev
# > NODE_ENV=development tsx watch server/_core/index.ts
#
# Server running on http://localhost:3000
# Press Ctrl+C to stop
```

**What happens**:
1. Server auto-detects available port (starting from 3000)
2. Starts Express server with tRPC API
3. Starts Vite dev server for frontend with HMR
4. Watches for file changes and auto-reloads

### Step 7: Access the Application

Open your browser and navigate to:
- **Application**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/trpc/health.check

### Step 8: Verify Installation

```bash
# In a new terminal, run type checking
pnpm check

# Run tests
pnpm test

# Build the application (to verify build works)
pnpm build
```

---

## Docker Development Setup

This method runs only databases in Docker while you develop on the host.

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/abuzant/ObserverZ.com.git
cd ObserverZ.com

# 2. Start databases
docker-compose -f docker-compose.dev.yml up -d

# 3. Install dependencies
pnpm install

# 4. Run migrations
pnpm db:push

# 5. Start development server
pnpm dev

# Access: http://localhost:3000
```

### Detailed Steps

#### 1. Start Database Containers

```bash
# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop watching logs with Ctrl+C (containers keep running)
```

#### 2. Verify Container Health

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# Check PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U observerz

# Check Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

#### 3. Database Management

```bash
# Access PostgreSQL shell
docker-compose -f docker-compose.dev.yml exec postgres psql -U observerz -d observerz

# Access Redis CLI
docker-compose -f docker-compose.dev.yml exec redis redis-cli

# View PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs postgres

# View Redis logs
docker-compose -f docker-compose.dev.yml logs redis
```

#### 4. Stop and Clean Up

```bash
# Stop containers (data persists)
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose -f docker-compose.dev.yml down -v

# Restart from scratch
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
pnpm db:push  # Re-run migrations
```

---

## Production Deployment

Full Docker deployment for staging or production environments.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌────────────┐                                         │
│  │   Nginx    │ :80, :443 (optional)                    │
│  │  (Alpine)  │                                         │
│  └─────┬──────┘                                         │
│        │                                                 │
│        ▼                                                 │
│  ┌────────────┐                                         │
│  │    App     │ :3000 (ObserverZ)                       │
│  │  (Node 20) │                                         │
│  └─────┬──────┘                                         │
│        │                                                 │
│    ┌───┴────┐                                           │
│    ▼        ▼                                           │
│  ┌────┐  ┌─────┐                                        │
│  │ PG │  │Redis│                                        │
│  │ 16 │  │  7  │                                        │
│  └────┘  └─────┘                                        │
│                                                          │
│  Volumes:                                                │
│  - postgres_data                                         │
│  - redis_data                                            │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/abuzant/ObserverZ.com.git
cd ObserverZ.com

# Configure environment variables
nano .env
```

**Production .env configuration**:
```bash
# Database
DB_NAME=observerz
DB_USER=observerz
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE  # ⚠️ Change this!
DATABASE_URL=postgresql://observerz:YOUR_STRONG_PASSWORD_HERE@postgres:5432/observerz

# Redis
REDIS_URL=redis://redis:6379

# Application
NODE_ENV=production
VITE_APP_TITLE=ObserverZ.com
VITE_APP_ID=your_manus_app_id

# Authentication
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS  # ⚠️ Change this!
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your_manus_user_id
OWNER_NAME=Your Name

# AWS S3 (required for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=observerz-production
AWS_S3_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
LOG_LEVEL=info
```

### Step 3: Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 4: Run Database Migrations

```bash
# Run migrations inside the app container
docker-compose exec app pnpm db:push

# Verify database setup
docker-compose exec postgres psql -U observerz -d observerz -c "\dt"
```

### Step 5: Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Expected output:
# NAME                  STATUS
# observerz-app         Up (healthy)
# observerz-postgres    Up (healthy)
# observerz-redis       Up (healthy)

# Test application
curl http://localhost:3000/api/trpc/health.check

# Check logs for errors
docker-compose logs app | grep -i error
```

### Step 6: Configure Nginx (Optional)

If you want to use Nginx as a reverse proxy:

```bash
# Create SSL directory
mkdir -p ssl

# Copy SSL certificates (see SSL/TLS section below)
# Then start nginx
docker-compose --profile with-nginx up -d

# Verify nginx is running
curl http://localhost
```

---

## Cloud Platform Deployment

### AWS (Elastic Container Service)

#### Prerequisites
- AWS CLI installed and configured
- ECS CLI installed
- ECR repository created

#### Deployment Steps

```bash
# 1. Build and push Docker image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker build -t observerz .
docker tag observerz:latest YOUR_ECR_URL/observerz:latest
docker push YOUR_ECR_URL/observerz:latest

# 2. Set up RDS for PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier observerz-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username observerz \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20

# 3. Set up ElastiCache for Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id observerz-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1

# 4. Deploy to ECS
ecs-cli compose -f docker-compose.yml service up \
  --cluster observerz-cluster \
  --launch-type FARGATE
```

### Google Cloud Platform (Cloud Run)

```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# 2. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable redis.googleapis.com

# 3. Create Cloud SQL instance (PostgreSQL)
gcloud sql instances create observerz-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1

# 4. Create database
gcloud sql databases create observerz --instance=observerz-db

# 5. Create Memorystore (Redis)
gcloud redis instances create observerz-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0

# 6. Deploy to Cloud Run
gcloud run deploy observerz \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean (App Platform)

#### 1. Create app.yaml

```yaml
name: observerz
region: nyc

databases:
  - name: observerz-db
    engine: PG
    version: "16"
    size: db-s-1vcpu-1gb

  - name: observerz-redis
    engine: REDIS
    version: "7"
    size: db-s-1vcpu-1gb

services:
  - name: web
    source:
      repo: https://github.com/abuzant/ObserverZ.com
      branch: main
    dockerfile_path: Dockerfile
    instance_count: 1
    instance_size: basic-xs
    http_port: 3000
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${observerz-db.DATABASE_URL}
      - key: REDIS_URL
        value: ${observerz-redis.DATABASE_URL}
```

#### 2. Deploy

```bash
# Install doctl
brew install doctl  # macOS
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app
doctl apps create --spec app.yaml

# Get app URL
doctl apps list
```

### Heroku

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create observerz-production

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Add Redis
heroku addons:create heroku-redis:mini

# 6. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key
# ... set all other env vars

# 7. Deploy
git push heroku main

# 8. Run migrations
heroku run pnpm db:push

# 9. Open app
heroku open
```

---

## Database Configuration

### PostgreSQL Setup

#### Connection String Format
```
postgresql://username:password@host:port/database
```

#### Manual Database Creation

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE observerz;

# Create user
CREATE USER observerz WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE observerz TO observerz;

# Grant schema privileges (PostgreSQL 15+)
\c observerz
GRANT ALL ON SCHEMA public TO observerz;

# Exit
\q
```

#### Database Configuration Options

```bash
# In .env file
DATABASE_URL=postgresql://observerz:password@localhost:5432/observerz?schema=public&connection_limit=10&pool_timeout=10
```

**Query parameters**:
- `schema=public` - Default schema to use
- `connection_limit=10` - Max connections per pool
- `pool_timeout=10` - Connection timeout in seconds
- `sslmode=require` - Require SSL connection (production)

### Redis Configuration

#### Connection String Format
```
redis://[username:password@]host:port[/database]
```

#### Redis with Password

```bash
# In redis.conf
requirepass your_redis_password

# In .env
REDIS_URL=redis://:your_redis_password@localhost:6379
```

#### Redis Cluster

```bash
# In .env for Redis Cluster
REDIS_URL=redis://node1:6379,node2:6379,node3:6379
```

### Database Migrations

#### Generate Migration

```bash
# After modifying drizzle/schema.ts
pnpm drizzle-kit generate

# This creates a migration file in drizzle/migrations/
```

#### Apply Migrations

```bash
# Apply all pending migrations
pnpm db:push

# Or manually
pnpm drizzle-kit migrate
```

#### Check Migration Status

```bash
pnpm drizzle-kit check
```

#### Rollback (Manual)

```bash
# Connect to database
psql $DATABASE_URL

# Run rollback SQL manually
# (Drizzle doesn't support automatic rollbacks)
```

---

## Environment Variables Reference

### Required Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | string | `postgresql://...` | PostgreSQL connection string |
| `REDIS_URL` | string | `redis://...` | Redis connection string |
| `JWT_SECRET` | string | Random 32+ chars | JWT signing secret |

### Application Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | `development` or `production` |
| `VITE_APP_TITLE` | string | `ObserverZ.com` | Application title |
| `VITE_APP_ID` | string | - | Manus application ID |
| `VITE_APP_LOGO` | URL | - | Logo URL |

### Authentication (Manus OAuth)

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `OAUTH_SERVER_URL` | URL | `https://api.manus.im` | OAuth server URL |
| `VITE_OAUTH_PORTAL_URL` | URL | `https://portal.manus.im` | OAuth portal URL |
| `OWNER_OPEN_ID` | string | - | Owner's Manus user ID |
| `OWNER_NAME` | string | - | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | URL | `https://api.manus.im/forge` | Forge API endpoint |
| `BUILT_IN_FORGE_API_KEY` | string | - | Forge API key |

### AWS S3 (Optional)

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | string | `AKIA...` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | string | - | AWS secret key |
| `AWS_S3_BUCKET` | string | `observerz-storage` | S3 bucket name |
| `AWS_S3_REGION` | string | `us-east-1` | AWS region |

### Email (Optional)

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SMTP_HOST` | string | `smtp.gmail.com` | SMTP server |
| `SMTP_PORT` | number | `587` | SMTP port |
| `SMTP_USER` | string | `noreply@observerz.com` | SMTP username |
| `SMTP_PASSWORD` | string | - | SMTP password |
| `SMTP_FROM` | string | `noreply@observerz.com` | From address |

### Monitoring (Optional)

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SENTRY_DSN` | URL | `https://...@sentry.io/...` | Sentry DSN |
| `LOG_LEVEL` | enum | `info` | `debug`, `info`, `warn`, `error` |

### Ports

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BACKEND_PORT` | number | `3000` | Backend port |
| `DB_PORT` | number | `5432` | PostgreSQL port |
| `REDIS_PORT` | number | `6379` | Redis port |

---

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

#### 1. Install Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot

# macOS
brew install certbot
```

#### 2. Generate Certificates

```bash
# Stop nginx temporarily
docker-compose stop nginx

# Generate certificates (standalone mode)
sudo certbot certonly --standalone \
  -d observerz.com \
  -d www.observerz.com \
  --email your-email@example.com \
  --agree-tos

# Certificates will be saved to:
# /etc/letsencrypt/live/observerz.com/fullchain.pem
# /etc/letsencrypt/live/observerz.com/privkey.pem
```

#### 3. Copy Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/observerz.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/observerz.com/privkey.pem ssl/key.pem

# Set permissions
sudo chown $USER:$USER ssl/*
```

#### 4. Update nginx.conf

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name observerz.com www.observerz.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name observerz.com www.observerz.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to app
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. Start Nginx

```bash
# Start nginx with SSL
docker-compose --profile with-nginx up -d

# Verify HTTPS
curl https://observerz.com
```

#### 6. Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job for auto-renewal
sudo crontab -e

# Add this line (runs every day at 2 AM)
0 2 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/observerz.com/*.pem /path/to/ssl/ && docker-compose restart nginx"
```

### Using Self-Signed Certificates (Development)

```bash
# Generate self-signed certificate
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Start nginx
docker-compose --profile with-nginx up -d

# Access via https://localhost (ignore browser warning)
```

---

## Troubleshooting

### Common Issues

#### Issue: Port Already in Use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tuln | grep 3000

# Kill the process
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=3001
```

#### Issue: Database Connection Failed

**Symptoms**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# or for native installation
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL

# Check PostgreSQL logs
docker-compose logs postgres
# or
sudo journalctl -u postgresql
```

#### Issue: Redis Connection Failed

**Symptoms**: `Error: Redis connection to localhost:6379 failed`

**Solution**:
```bash
# Check if Redis is running
docker-compose ps redis
# or
sudo systemctl status redis

# Test Redis connection
redis-cli ping

# Check Redis logs
docker-compose logs redis
```

#### Issue: Migration Failed

**Symptoms**: `Error: relation "users" already exists`

**Solution**:
```bash
# Check current schema
psql $DATABASE_URL -c "\dt"

# Drop and recreate database (⚠️ destroys all data)
docker-compose down -v
docker-compose up -d postgres
sleep 10
pnpm db:push
```

#### Issue: Docker Build Failed

**Symptoms**: `ERROR [builder X/Y] RUN pnpm install`

**Solution**:
```bash
# Clear Docker build cache
docker-compose build --no-cache

# Remove all stopped containers and images
docker system prune -a

# Rebuild
docker-compose build
```

#### Issue: Node Modules Missing

**Symptoms**: `Error: Cannot find module '...'`

**Solution**:
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

#### Issue: TypeScript Errors

**Symptoms**: Various TypeScript compilation errors

**Solution**:
```bash
# Run type checking
pnpm check

# Check specific file
pnpm tsc --noEmit path/to/file.ts

# Restart TypeScript server (VS Code)
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

#### Issue: Vite Build Failed

**Symptoms**: `Error: Build failed with X errors`

**Solution**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
pnpm build

# Check for circular dependencies
pnpm list --depth=1
```

### Performance Issues

#### Issue: Slow API Responses

**Diagnosis**:
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Check database query performance
docker-compose exec postgres psql -U observerz -d observerz -c "SELECT * FROM pg_stat_activity;"

# Monitor Docker stats
docker stats
```

**Solutions**:
1. Enable Redis caching
2. Add database indices
3. Optimize slow queries
4. Increase server resources

#### Issue: High Memory Usage

**Diagnosis**:
```bash
# Check Docker memory usage
docker stats

# Check Node.js memory
docker-compose exec app node -e "console.log(process.memoryUsage())"
```

**Solutions**:
```bash
# Increase Docker memory limit
# In docker-compose.yml:
services:
  app:
    mem_limit: 2g
    mem_reservation: 1g
```

### Docker-Specific Issues

#### Issue: Permission Denied

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Issue: Volume Mount Issues

**Solution**:
```bash
# Remove volumes and recreate
docker-compose down -v
docker-compose up -d

# Check volume status
docker volume ls
docker volume inspect observerz_postgres_data
```

---

## Maintenance & Updates

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>

# Update to latest (including major versions)
pnpm update --latest
```

### Database Backups

```bash
# Manual backup
docker-compose exec postgres pg_dump -U observerz observerz > backup-$(date +%Y%m%d).sql

# Restore from backup
cat backup-20250101.sql | docker-compose exec -T postgres psql -U observerz observerz

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/observerz"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U observerz observerz | gzip > $BACKUP_DIR/backup-$DATE.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

### Application Updates

```bash
# Pull latest code
git pull origin main

# Install new dependencies
pnpm install

# Run migrations
pnpm db:push

# Rebuild and restart (Docker)
docker-compose up -d --build

# Or restart dev server (local)
# Ctrl+C and run: pnpm dev
```

---

## Performance Tuning

### Database Optimization

```sql
-- Add indices for frequently queried columns
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_tag_id ON article_tags(tag_id);
CREATE INDEX idx_clicks_article_id ON click_events(article_id);

-- Analyze tables
ANALYZE articles;
ANALYZE tags;
ANALYZE article_tags;

-- Vacuum database
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# In docker-compose.yml
services:
  redis:
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Application Optimization

```javascript
// In server/db.ts - increase connection pool
export const db = drizzle(client, {
  pool: {
    max: 20,  // Increase max connections
    idleTimeoutMillis: 30000,
  }
});
```

---

## Security Hardening

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (only allow ports 80, 443, 22)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable PostgreSQL SSL connections
- [ ] Use Redis password authentication
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Enable security headers in nginx
- [ ] Regular security updates

### Firewall Configuration

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Docker Security

```yaml
# In docker-compose.yml
services:
  app:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

---

## Monitoring & Logging

### Application Logs

```bash
# View real-time logs
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app

# Search logs
docker-compose logs app | grep ERROR
```

### System Monitoring

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
```

### Setting Up Sentry

```bash
# 1. Sign up at https://sentry.io
# 2. Create project
# 3. Get DSN
# 4. Add to .env
SENTRY_DSN=https://xxx@sentry.io/xxx

# 5. Restart application
docker-compose restart app
```

---

## Support

If you encounter issues not covered in this guide:

1. Check existing documentation:
   - `README.md` - Project overview
   - `SETUP.md` - Quick setup guide
   - `API.md` - API documentation

2. Search GitHub Issues:
   - https://github.com/abuzant/ObserverZ.com/issues

3. Contact support:
   - Email: ruslan@observerz.com
   - Website: www.abuzant.com

---

**Last Updated**: November 13, 2025
**Version**: 1.0.0
**Maintained by**: Ruslan Abuzant with Claude AI
