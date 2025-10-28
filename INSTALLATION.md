# ObserverZ.com Installation Guide

This comprehensive guide covers all methods to install and run ObserverZ.com, from quick Docker deployment to advanced Kubernetes setups.

---

## Table of Contents

- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Troubleshooting](#troubleshooting)
- [Post-Installation Configuration](#post-installation-configuration)

---

## Quick Start (Docker Compose)

The fastest way to get ObserverZ.com running is with Docker Compose, which handles all dependencies automatically.

### Prerequisites

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- 4 GB RAM minimum, 8 GB recommended
- 10 GB disk space minimum

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/observerz.git
cd observerz
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

**Key variables to configure:**

```bash
# Database
DB_PASSWORD=your_secure_password_here

# Application
VITE_APP_TITLE=ObserverZ.com
VITE_APP_LOGO=https://your-domain.com/logo.png

# OAuth (if using Manus OAuth)
VITE_APP_ID=your_app_id
JWT_SECRET=your_jwt_secret_key
```

### Step 3: Start Services

```bash
# Build and start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                    STATUS
# observerz-postgres      Up (healthy)
# observerz-redis         Up (healthy)
# observerz-backend       Up
# observerz-frontend      Up
# observerz-nginx         Up
```

### Step 4: Initialize Database

```bash
# Run migrations
docker-compose exec backend pnpm db:push

# Seed initial data (optional)
docker-compose exec backend pnpm db:seed
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Nginx (HTTPS)**: https://localhost (self-signed certificate)

### Verify Installation

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend
curl http://localhost:3001

# View logs
docker-compose logs -f
```

---

## Local Development Setup

For development and testing, install locally without Docker.

### Prerequisites

- Node.js 20+ ([Install Node.js](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL 16+ ([Install PostgreSQL](https://www.postgresql.org/download/))
- Redis 7+ ([Install Redis](https://redis.io/download))
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/observerz.git
cd observerz
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
pnpm install

# This installs:
# - Backend dependencies (Express, tRPC, Drizzle)
# - Frontend dependencies (React, Tailwind, shadcn/ui)
# - Development tools (TypeScript, ESLint, Prettier)
```

### Step 3: Set Up Database

#### Option A: Local PostgreSQL

```bash
# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER observerz WITH PASSWORD 'observerz_password';
CREATE DATABASE observerz OWNER observerz;
GRANT ALL PRIVILEGES ON DATABASE observerz TO observerz;
\q
```

#### Option B: Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run -d \
  --name observerz-postgres \
  -e POSTGRES_DB=observerz \
  -e POSTGRES_USER=observerz \
  -e POSTGRES_PASSWORD=observerz_password \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 4: Set Up Redis

#### Option A: Local Redis

```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or on Linux
sudo systemctl start redis-server
```

#### Option B: Docker Redis

```bash
# Start Redis container
docker run -d \
  --name observerz-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Step 5: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Minimum required:
DATABASE_URL=postgresql://observerz:observerz_password@localhost:5432/observerz
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_dev_jwt_secret
NODE_ENV=development
```

### Step 6: Initialize Database

```bash
# Run migrations
pnpm db:push

# Seed initial data
pnpm db:seed

# Verify schema
pnpm db:status
```

### Step 7: Start Development Servers

```bash
# Terminal 1: Start backend
pnpm dev

# Terminal 2: Start frontend
cd client && pnpm dev

# Application available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Step 8: Verify Development Setup

```bash
# Test backend API
curl http://localhost:3000/api/trpc/tags.trending

# Test frontend
open http://localhost:5173
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] SSL/TLS certificates obtained
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Option 1: Docker Compose (Recommended for Small Deployments)

```bash
# On production server
git clone https://github.com/yourusername/observerz.git
cd observerz

# Configure production environment
cp .env.example .env
nano .env

# Set production values
NODE_ENV=production
VITE_APP_TITLE=ObserverZ.com
# ... other variables

# Generate SSL certificates
mkdir -p nginx/ssl
certbot certonly --standalone -d observerz.com -d www.observerz.com
cp /etc/letsencrypt/live/observerz.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/observerz.com/privkey.pem nginx/ssl/key.pem

# Start services
docker-compose -f docker-compose.yml up -d

# Run migrations
docker-compose exec backend pnpm db:push

# View logs
docker-compose logs -f
```

### Option 2: Kubernetes (For High Availability)

```bash
# Prerequisites: kubectl configured, Helm installed

# Add Helm repository
helm repo add observerz https://charts.observerz.com
helm repo update

# Install with Helm
helm install observerz observerz/observerz \
  --namespace observerz \
  --create-namespace \
  -f values.yaml

# Verify deployment
kubectl get pods -n observerz
kubectl get svc -n observerz
```

### Option 3: Manual Installation on VPS

```bash
# SSH into server
ssh user@your-vps.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nodejs npm postgresql redis-server nginx certbot python3-certbot-nginx

# Clone repository
git clone https://github.com/yourusername/observerz.git
cd observerz

# Install Node dependencies
npm install -g pnpm
pnpm install

# Configure PostgreSQL
sudo -u postgres createdb observerz
sudo -u postgres createuser observerz
sudo -u postgres psql -c "ALTER USER observerz WITH PASSWORD 'secure_password';"

# Run migrations
pnpm db:push

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/observerz
sudo ln -s /etc/nginx/sites-available/observerz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL
sudo certbot --nginx -d observerz.com

# Start application with PM2
npm install -g pm2
pm2 start "pnpm dev" --name observerz
pm2 startup
pm2 save
```

---

## Cloud Platform Deployment

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init -p "Docker running on 64bit Amazon Linux 2" observerz

# Create environment
eb create observerz-prod

# Deploy
eb deploy

# View logs
eb logs

# SSH into instance
eb ssh
```

### Google Cloud Run

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/observerz

# Deploy
gcloud run deploy observerz \
  --image gcr.io/YOUR_PROJECT_ID/observerz \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgresql://...

# View service
gcloud run services describe observerz
```

### DigitalOcean App Platform

```bash
# Create app.yaml
cat > app.yaml << 'EOF'
name: observerz
services:
- name: backend
  github:
    repo: yourusername/observerz
    branch: main
  build_command: pnpm install && pnpm build
  run_command: pnpm start
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${db.connection_string}

- name: frontend
  github:
    repo: yourusername/observerz
    branch: main
  build_command: cd client && pnpm install && pnpm build
  run_command: pnpm start
  source_dir: client

databases:
- name: db
  engine: PG
  version: "16"
EOF

# Deploy
doctl apps create --spec app.yaml
```

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create observerz

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## Post-Installation Configuration

### 1. Create Admin User

```bash
# Connect to database
docker-compose exec postgres psql -U observerz observerz

# Or locally
psql -U observerz -d observerz

# Create admin user
INSERT INTO users (openId, name, email, role)
VALUES ('admin-open-id', 'Admin User', 'admin@observerz.com', 'admin');
```

### 2. Initialize Seed Data

```bash
# Run seed script
docker-compose exec backend pnpm db:seed

# Or locally
pnpm db:seed

# This creates:
# - Default tags (crypto, tech, news, etc.)
# - Sample sources
# - Initial cache configuration
```

### 3. Configure Caching

```bash
# Access admin panel
# Navigate to Settings > Cache Configuration

# Set TTLs for different modules:
# - Tag pages: 15 minutes
# - Article feeds: 5 minutes
# - Related tags: 1 hour
# - Gallery images: 30 minutes
```

### 4. Set Up Email (Optional)

```bash
# Configure SMTP in .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@observerz.com

# Test email
docker-compose exec backend pnpm test:email
```

### 5. Configure OAuth (Optional)

If using Manus OAuth or another provider:

```bash
# Set OAuth variables in .env
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Restart backend
docker-compose restart backend
```

### 6. Set Up Monitoring

```bash
# Configure Sentry for error tracking
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id

# Configure logging
LOG_LEVEL=info

# View logs
docker-compose logs -f backend frontend
```

### 7. Configure Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/observerz"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U observerz observerz | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Redis
docker-compose exec -T redis redis-cli BGSAVE

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Schedule daily backups
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql -U observerz -d observerz -c "SELECT 1;"

# View PostgreSQL logs
docker-compose logs postgres
```

#### Issue: Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

#### Issue: Frontend Not Loading

```bash
# Check frontend service
docker-compose ps frontend

# Check frontend logs
docker-compose logs frontend

# Verify API connectivity
curl http://localhost:3000/health

# Clear browser cache
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (macOS)
```

#### Issue: High Memory Usage

```bash
# Check memory usage
docker stats

# Reduce Redis memory
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb

# Optimize PostgreSQL
docker-compose exec postgres psql -U observerz -c "VACUUM ANALYZE;"
```

#### Issue: Slow API Responses

```bash
# Check database query performance
docker-compose exec postgres psql -U observerz -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check Redis hit rate
docker-compose exec redis redis-cli INFO stats

# Review slow query log
docker-compose logs backend | grep "slow"
```

### Getting Help

- **Documentation**: https://docs.observerz.com
- **Issues**: https://github.com/observerz/observerz/issues
- **Discord**: https://discord.gg/observerz
- **Email**: support@observerz.com

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Database backup | Daily | `./backup.sh` |
| Database optimization | Weekly | `VACUUM ANALYZE;` |
| Log rotation | Daily | Automatic (Docker) |
| Security updates | As needed | `docker-compose pull && docker-compose up -d` |
| Certificate renewal | Monthly | `certbot renew` |

### Updating ObserverZ

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
pnpm install

# Run migrations
pnpm db:push

# Rebuild and restart
docker-compose build
docker-compose up -d
```

---

## Performance Tuning

### Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM articles WHERE created_at > NOW() - INTERVAL '7 days';

-- Create missing indices
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# Monitor Redis performance
redis-cli --stat

# Configure persistence
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# Monitor memory usage
redis-cli INFO memory
```

### Nginx Optimization

```nginx
# In nginx.conf
worker_processes auto;
worker_connections 2048;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

---

## Security Hardening

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Generate strong certificates
certbot certonly --standalone -d observerz.com

# Configure HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
```

### Database Security

```bash
# Change default passwords
ALTER USER observerz WITH PASSWORD 'strong_password_here';

# Restrict connections
# In postgresql.conf:
listen_addresses = 'localhost'

# Enable SSL for connections
ssl = on
```

---

## Next Steps

1. **Configure OAuth**: Set up user authentication
2. **Add Content Sources**: Configure RSS feeds or manual submission
3. **Set Up Monitoring**: Enable error tracking and logging
4. **Customize Branding**: Update logo, colors, and messaging
5. **Deploy to Production**: Follow production deployment guide

For more help, visit the [documentation](https://docs.observerz.com) or join our [Discord community](https://discord.gg/observerz).

---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Status**: Production Ready

