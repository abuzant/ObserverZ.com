# ObserverZ.com - A Tag-Driven Content Discovery Platform for Gen Z

**Observe the world through dynamic topic graphs and personal journals that auto-curate the latest content from the last 7–30 days.**

ObserverZ.com is a modern, two-engine content discovery and curation platform designed specifically for Generation Z. The platform combines intelligent data ingestion with a beautiful, intuitive frontend to help users discover trending topics, build personal journals, and earn rewards by sharing their interests with the community.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ObserverZ.com addresses a critical need in the digital landscape: providing a unified, intelligent view of what matters most across any topic of interest. The platform operates on two core principles:

**The Data Engine** continuously fetches, parses, and analyzes content from multiple sources. It extracts relevant tags and topics using natural language processing, ranks content by popularity and freshness, and stores everything in a sophisticated PostgreSQL database optimized for rapid retrieval.

**The Presentation Engine** renders dynamic index pages for each topic, allowing users to browse trending content, create personal journals of their favorite topics, build social walls to share with friends, and participate in a community-driven ecosystem where quality content is rewarded.

### Target Audience

Generation Z users who value:
- **Snackable content** that updates in real-time
- **Personalization** that respects their privacy
- **Community engagement** through social sharing
- **Transparency** in content ranking and curation
- **Monetization opportunities** for quality contributions

---

## Key Features

### Core Features (MVP)

| Feature | Description | Status |
|---------|-------------|--------|
| **Trending Topics Feed** | Auto-curated feed of trending topics updated in real-time | ✅ Complete |
| **Topic-Specific Feeds** | Browse all articles tagged with a specific keyword or topic | ✅ Complete |
| **Personal Journals** | Create and manage up to 8 default interest tags for personalized feeds | ✅ Complete |
| **Social Walls** | Build shareable collections of your interests and earn $1 per 1000 views | ✅ Complete |
| **Article Interactions** | Star, pin, boost, and comment on articles (with paid addons) | ✅ Complete |
| **Search & Discovery** | Full-text search across all articles and tags | ✅ Complete |
| **Image Galleries** | Browse visual content organized by topic with infinite scroll | ✅ Complete |
| **Geographic Analytics** | View which countries/regions are interested in specific content | ✅ Complete |
| **Related Tags API** | Discover related topics based on any keyword query | ✅ Complete |

### Paid Add-ons

| Add-on | Price | Features |
|--------|-------|----------|
| **Unlimited Stars** | $1.99/month | Star unlimited articles for personal favorites |
| **Comments** | $0.99/month | Post comments on articles (or $0.10 per comment) |
| **Messaging** | $0.99/month | Send internal messages to other users (72h expiry) |
| **Custom Avatar** | $0.99/month | Upload a custom profile avatar |
| **Filtration Module** | $0.33/set | Create custom filters to block/allow/notify on content |
| **API Access** | $0.01/query | Access full API for developers and webmasters |

### Advanced Features (Roadmap)

- **Daily PDF Reports**: Automated infographic-style reports of trending topics (generated at 23:59 UTC daily)
- **Graph Data Visualization**: Self-contained graph objects showing relationships between tags, keywords, and topics
- **Notification System**: Real-time alerts for topics you follow or sources you want to track
- **Widget Builder**: Pre-built widgets for webmasters to embed on their sites
- **Advanced Analytics**: Detailed engagement metrics, earnings tracking, and user rankings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                 │
│              Beautiful, responsive UI for Gen Z              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Express + tRPC)                    │
│         Type-safe RPC endpoints with JWT auth               │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │PostgreSQL│    │  Redis   │    │ Workers  │
   │Database  │    │  Cache   │    │ (Celery) │
   └─────────┘    └──────────┘    └──────────┘
        │
        └─── Data Ingestion Pipeline
             (URL Fetcher, Parser, NLP Tagger)
```

### Data Flow

1. **Ingestion**: URLs are submitted via admin interface or email funnel
2. **Fetching**: HTTP client fetches content with respect for robots.txt
3. **Parsing**: Boilerplate removal and content extraction
4. **Tagging**: NLP-based keyword extraction and topic mapping
5. **Ranking**: Popularity score calculation based on clicks, freshness, and source weight
6. **Storage**: Data persisted to PostgreSQL with Redis caching layer
7. **Delivery**: API serves cached results to frontend with CDN optimization

---

## Tech Stack

### Backend

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4 + tRPC 11
- **Database**: PostgreSQL 16 (Drizzle ORM)
- **Cache**: Redis 7
- **Authentication**: JWT + Manus OAuth
- **Task Queue**: Celery (Python) for background jobs
- **NLP**: YAKE, RaphaNLP, or KeyBERT for keyword extraction

### Frontend

- **Framework**: React 19 + Next.js 15
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **HTTP Client**: tRPC with React Query
- **State Management**: React Context + tRPC cache
- **Build Tool**: Vite 7

### DevOps

- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with SSL/TLS
- **CI/CD**: GitHub Actions (optional)
- **Monitoring**: Sentry for error tracking

---

## Quick Start

### Prerequisites

- Docker and Docker Compose (recommended for 1-click install)
- Node.js 20+ and pnpm (for local development)
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)

### 1-Click Docker Installation

```bash
# Clone the repository
git clone https://github.com/abuzant/ObserverZ.com.git 
cd observerz

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec backend pnpm db:push

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# Nginx (with SSL): https://localhost
```

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

# In another terminal, start the frontend
cd client
pnpm dev

# Application will be available at http://localhost:5173
```

---

## Installation

For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md).

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2 GB | 8+ GB |
| Storage | 10 GB | 50+ GB |
| Bandwidth | 1 Mbps | 10+ Mbps |

### Supported Platforms

- Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- macOS (10.15+)
- Windows (with WSL2)
- Cloud platforms (AWS, Google Cloud, Azure, DigitalOcean)

---

## Configuration

### Environment Variables

All configuration is managed through environment variables. See `.env.example` for a complete list.

**Critical variables:**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/observerz

# Authentication
JWT_SECRET=your_secure_jwt_secret_key
OAUTH_SERVER_URL=https://api.manus.im

# Application
VITE_APP_TITLE=ObserverZ.com
VITE_APP_LOGO=https://example.com/logo.png
```

### Database Initialization

The database schema is automatically created on first run via Drizzle migrations:

```bash
# Generate and run migrations
pnpm db:push

# View migration status
pnpm db:status

# Seed initial data (optional)
pnpm db:seed
```

### Redis Configuration

Redis is used for caching query results and managing session data:

```bash
# Default configuration
REDIS_URL=redis://localhost:6379

# For production with authentication
REDIS_URL=redis://:password@redis.example.com:6379
```

---

## API Documentation

### Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://api.observerz.com/api/trpc/...
```

### Core Endpoints

#### Tags

- `GET /api/trpc/tags.trending` - Get trending topics
- `GET /api/trpc/tags.bySlug` - Get tag by slug
- `GET /api/trpc/tags.feed` - Get articles for a tag
- `GET /api/trpc/tags.related` - Get related tags
- `POST /api/trpc/tags.create` - Create new tag (admin only)

#### Articles

- `GET /api/trpc/articles.byId` - Get article by ID
- `GET /api/trpc/articles.search` - Search articles
- `POST /api/trpc/articles.ingest` - Ingest new article
- `GET /api/trpc/articles.geo` - Get geographic analytics

#### Journals

- `POST /api/trpc/journals.create` - Create new journal
- `GET /api/trpc/journals.list` - List user's journals
- `GET /api/trpc/journals.byId` - Get public journal
- `POST /api/trpc/journals.addTag` - Add tag to journal

#### Wallet & Billing

- `GET /api/trpc/wallet.balance` - Get wallet balance
- `GET /api/trpc/wallet.transactions` - Get transaction history
- `POST /api/trpc/wallet.buyOCT` - Purchase OCT tokens
- `POST /api/trpc/wallet.withdrawUSdt` - Withdraw USDT

### Example Request

```bash
# Get trending topics
curl -X GET "http://localhost:3000/api/trpc/tags.trending?input=%7B%22window%22:%2272h%22,%22limit%22:50%7D" \
  -H "Content-Type: application/json"

# Search articles
curl -X GET "http://localhost:3000/api/trpc/articles.search?input=%7B%22q%22:%22bitcoin%22%7D" \
  -H "Content-Type: application/json"
```

For complete API documentation, see [API.md](./API.md).

---

## Database Schema

The database consists of 40+ tables organized into logical groups:

### Core Tables

- **users**: User accounts and profiles
- **sources**: Content sources (news sites, blogs, social media)
- **articles**: Individual articles and content pieces
- **tags**: Topic tags and keywords
- **article_tags**: Many-to-many relationship between articles and tags

### Analytics Tables

- **click_events**: Track user clicks on articles
- **geo_rollups**: Geographic analytics aggregated by region
- **user_ranks**: User reputation scores based on engagement
- **api_usage**: Track API calls for billing

### User Features

- **journals**: User's personal topic collections
- **walls**: User's shareable interest walls
- **stars**: User's favorite articles
- **pins**: User's pinned articles (max 100, 30-day TTL)
- **comments**: User comments on articles
- **filters**: User's content filters (block/allow/notify)

### Monetization

- **wallets**: User OCT token balances
- **wallet_tx**: Transaction history
- **subscriptions**: Active subscriptions to paid features
- **payouts**: Monthly earnings payouts

### Advanced Features

- **graphs**: Knowledge graphs per tag/keyword
- **image_rollups**: Image galleries organized by topic
- **daily_reports**: Archived daily infographic reports
- **cache_config**: Admin-configurable cache TTLs

For detailed schema documentation, see [SCHEMA.md](./SCHEMA.md).

---

## Deployment

### Docker Compose (Recommended for Production)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend frontend

# Stop services
docker-compose down
```

### Kubernetes (Advanced)

Kubernetes manifests are available in the `k8s/` directory for enterprise deployments.

### Cloud Platforms

#### AWS

```bash
# Using ECS with Docker Compose
ecs-cli compose -f docker-compose.yml service up

# Using Elastic Beanstalk
eb create observerz-env
eb deploy
```

#### Google Cloud

```bash
# Using Cloud Run
gcloud run deploy observerz --source . --platform managed
```

#### DigitalOcean

```bash
# Using App Platform
doctl apps create --spec app.yaml
```

### SSL/TLS Certificates

For production, use Let's Encrypt with Certbot:

```bash
# Generate certificates
certbot certonly --standalone -d observerz.com -d www.observerz.com

# Copy certificates to nginx directory
cp /etc/letsencrypt/live/observerz.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/observerz.com/privkey.pem nginx/ssl/key.pem

# Auto-renewal (cron job)
0 0 1 * * certbot renew --quiet
```

---

## Data Ingestion

### Manual URL Submission

Users and admins can submit URLs via the admin interface or API:

```bash
# Using the ingestion script
npx ts-node scripts/ingest.ts https://example.com/article crypto bitcoin

# Using the API
curl -X POST http://localhost:3000/api/trpc/articles.ingest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "title": "Article Title",
    "excerpt": "Article excerpt...",
    "tags": [1, 2, 3]
  }'
```

### Email Funnel

Set up an email address (e.g., `submit@observerz.com`) to receive article submissions:

```bash
# Configure mail server in .env
SMTP_HOST=smtp.example.com
SMTP_USER=observerz@example.com
```

### RSS Feed Integration

Automatically ingest articles from RSS feeds:

```bash
# Add RSS source
curl -X POST http://localhost:3000/api/trpc/sources.addRSS \
  -d '{"url": "https://example.com/feed.xml"}'
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost:3001/health

# Check database
docker-compose exec postgres pg_isready -U observerz
```

### Database Maintenance

```bash
# Backup database
docker-compose exec postgres pg_dump -U observerz observerz > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U observerz observerz < backup.sql

# Vacuum and analyze
docker-compose exec postgres psql -U observerz -c "VACUUM ANALYZE;"
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow backend logs
docker-compose logs -f backend

# View logs for specific time period
docker-compose logs --since 1h
```

---

## Performance Optimization

### Caching Strategy

The platform implements a multi-layer caching strategy:

1. **CDN Cache**: Static assets cached for 30 days
2. **Redis Cache**: Query results cached for 15 minutes (configurable)
3. **Database Query Cache**: Prepared statements and connection pooling
4. **Filesystem Cache**: JSON artifacts cached for 24 hours

### Database Optimization

- Composite indices on frequently queried columns
- Partial indices for active/non-expired records
- GIN indices for full-text search on article content
- Connection pooling with PgBouncer

### Frontend Optimization

- Code splitting and lazy loading
- Image optimization with WebP format
- Service workers for offline support
- HTTP/2 push for critical assets

---

## Contributing

We welcome contributions from the community! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linter
pnpm lint

# Format code
pnpm format
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support & Community

- **Documentation**: https://observerz.com
- **Email**: ruslan@observerz.com
- **Issues**: https://github.com/ObserverZ.com/issues

---

## Roadmap

### Q1 2024

- [ ] Advanced analytics dashboard
- [ ] Notification system
- [ ] Widget builder for webmasters
- [ ] Mobile app (React Native)

### Q2 2024

- [ ] AI-powered content recommendations
- [ ] Video content support
- [ ] Live streaming integration
- [ ] Creator marketplace

### Q3 2024

- [ ] Blockchain-based reputation system
- [ ] DAO governance
- [ ] Cross-chain token support
- [ ] Enterprise API tier

---

## Acknowledgments

Built with ❤️ for Generation Z by the Ruslan Abuzant <www.abuzant.com> 

Special thanks to our contributors and the open-source community for the amazing tools and libraries that make this project possible.

---

**Last Updated**: October 2025
**Version**: 1.2.11 MVP  
**Status**: Production Ready
