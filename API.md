# ObserverZ.com API Documentation

Complete API reference for ObserverZ.com tRPC endpoints.

---

## Authentication

All protected endpoints require a valid JWT token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtaining a Token

1. User logs in via OAuth
2. Token is stored in session cookie
3. Automatically included in all requests

---

## Tags API

### Get Trending Tags

```
GET /api/trpc/tags.trending
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| window | string | No | "72h" | Time window: "24h", "72h", "7d", "30d" |
| limit | number | No | 50 | Number of results (1-100) |

**Response:**

```json
{
  "id": 1,
  "slug": "bitcoin",
  "display": "Bitcoin",
  "type": "keyword",
  "is_trending": true,
  "trend_score": 95.5,
  "article_count": 1250,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Example:**

```bash
curl "http://localhost:3000/api/trpc/tags.trending?input=%7B%22window%22:%2272h%22,%22limit%22:20%7D"
```

---

### Get Tag by Slug

```
GET /api/trpc/tags.bySlug
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Tag slug (e.g., "bitcoin") |

**Response:**

```json
{
  "id": 1,
  "slug": "bitcoin",
  "display": "Bitcoin",
  "type": "keyword",
  "description": "Bitcoin and cryptocurrency discussions",
  "is_trending": true,
  "trend_score": 95.5,
  "article_count": 1250
}
```

---

### Get Tag Feed

```
GET /api/trpc/tags.feed
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| slug | string | Yes | - | Tag slug |
| limit | number | No | 20 | Results per page (1-100) |
| offset | number | No | 0 | Pagination offset |
| sort | string | No | "trending" | Sort by: "trending", "recent", "popular" |

**Response:**

```json
[
  {
    "id": 12345,
    "title": "Bitcoin Reaches New All-Time High",
    "excerpt": "Bitcoin surpasses previous record...",
    "author": "John Doe",
    "source": "CryptoNews",
    "image_url": "https://...",
    "published_at": "2024-01-20T15:30:00Z",
    "click_count": 5432,
    "star_count": 234,
    "tags": ["bitcoin", "crypto", "markets"]
  }
]
```

---

### Get Related Tags

```
GET /api/trpc/tags.related
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search query or tag slug |
| limit | number | No | 10 | Number of results (1-50) |

**Response:**

```json
[
  {
    "id": 2,
    "slug": "ethereum",
    "display": "Ethereum",
    "relevance_score": 0.92
  },
  {
    "id": 3,
    "slug": "crypto",
    "display": "Cryptocurrency",
    "relevance_score": 0.88
  }
]
```

---

### Create Tag (Admin Only)

```
POST /api/trpc/tags.create
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | URL-friendly tag name |
| display | string | Yes | Human-readable tag name |
| type | string | No | Tag type: "keyword", "category", "person" |
| description | string | No | Tag description |

**Response:**

```json
{
  "id": 100,
  "slug": "new-tag",
  "display": "New Tag",
  "type": "keyword",
  "created_at": "2024-01-20T16:45:00Z"
}
```

---

## Articles API

### Get Article by ID

```
GET /api/trpc/articles.byId
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Article ID |

**Response:**

```json
{
  "id": 12345,
  "title": "Bitcoin Reaches New All-Time High",
  "excerpt": "Bitcoin surpasses previous record...",
  "content": "Full article content...",
  "author": "John Doe",
  "source_id": 5,
  "source": {
    "name": "CryptoNews",
    "domain": "cryptonews.com",
    "logo_url": "https://..."
  },
  "canonical_url": "https://cryptonews.com/article",
  "image_url": "https://...",
  "published_at": "2024-01-20T15:30:00Z",
  "created_at": "2024-01-20T16:00:00Z",
  "tags": [
    {"id": 1, "slug": "bitcoin", "display": "Bitcoin"},
    {"id": 2, "slug": "crypto", "display": "Cryptocurrency"}
  ],
  "click_count": 5432,
  "star_count": 234,
  "comment_count": 45,
  "geo_data": {
    "top_countries": [
      {"country": "US", "clicks": 2000},
      {"country": "UK", "clicks": 1200}
    ]
  }
}
```

---

### Search Articles

```
GET /api/trpc/articles.search
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search query |
| limit | number | No | 20 | Results per page (1-100) |
| offset | number | No | 0 | Pagination offset |
| tags | array | No | [] | Filter by tag IDs |
| sources | array | No | [] | Filter by source IDs |
| date_from | string | No | - | ISO 8601 date (e.g., "2024-01-20") |
| date_to | string | No | - | ISO 8601 date |
| lang | string | No | "en" | Language code (e.g., "en", "es", "fr") |

**Response:**

```json
{
  "results": [
    {
      "id": 12345,
      "title": "Bitcoin Reaches New All-Time High",
      "excerpt": "Bitcoin surpasses previous record...",
      "author": "John Doe",
      "source": "CryptoNews",
      "published_at": "2024-01-20T15:30:00Z",
      "relevance_score": 0.95
    }
  ],
  "total": 1250,
  "limit": 20,
  "offset": 0
}
```

---

### Ingest Article

```
POST /api/trpc/articles.ingest
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | Article URL |
| title | string | No | Article title (auto-extracted if not provided) |
| excerpt | string | No | Article excerpt |
| tags | array | No | Tag IDs to associate |
| source_id | number | No | Source ID (auto-detected if not provided) |

**Response:**

```json
{
  "id": 12346,
  "title": "New Article",
  "url": "https://example.com/article",
  "status": "processing",
  "created_at": "2024-01-20T17:00:00Z"
}
```

---

### Get Geographic Analytics

```
GET /api/trpc/articles.geo
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| article_id | number | No | - | Filter by article ID |
| tag_id | number | No | - | Filter by tag ID |
| window | string | No | "24h" | Time window: "24h", "7d", "30d" |

**Response:**

```json
{
  "top_countries": [
    {"country": "US", "country_code": "US", "clicks": 5000},
    {"country": "UK", "country_code": "GB", "clicks": 3200},
    {"country": "Canada", "country_code": "CA", "clicks": 2100}
  ],
  "top_regions": [
    {"region": "California", "country": "US", "clicks": 1200},
    {"region": "New York", "country": "US", "clicks": 900}
  ],
  "total_clicks": 10300
}
```

---

## Journals API

### Create Journal

```
POST /api/trpc/journals.create
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Journal title |
| description | string | No | Journal description |
| is_public | boolean | No | Default: false |

**Response:**

```json
{
  "id": 1,
  "title": "My Crypto Journal",
  "description": "Tracking crypto news",
  "is_public": false,
  "created_at": "2024-01-20T17:30:00Z",
  "tag_count": 0
}
```

---

### List User Journals

```
GET /api/trpc/journals.list
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "My Crypto Journal",
    "description": "Tracking crypto news",
    "is_public": false,
    "tag_count": 5,
    "article_count": 234,
    "created_at": "2024-01-20T17:30:00Z"
  }
]
```

---

### Get Journal by ID

```
GET /api/trpc/journals.byId
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Journal ID |

**Response:**

```json
{
  "id": 1,
  "title": "My Crypto Journal",
  "description": "Tracking crypto news",
  "is_public": true,
  "owner": {
    "id": 100,
    "name": "John Doe",
    "avatar_url": "https://..."
  },
  "tags": [
    {"id": 1, "slug": "bitcoin", "display": "Bitcoin"},
    {"id": 2, "slug": "ethereum", "display": "Ethereum"}
  ],
  "articles": [
    {
      "id": 12345,
      "title": "Bitcoin News",
      "excerpt": "...",
      "published_at": "2024-01-20T15:30:00Z"
    }
  ],
  "view_count": 1234,
  "created_at": "2024-01-20T17:30:00Z"
}
```

---

### Add Tag to Journal

```
POST /api/trpc/journals.addTag
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| journal_id | number | Yes | Journal ID |
| tag_id | number | Yes | Tag ID |

**Response:**

```json
{
  "success": true,
  "tag_count": 6
}
```

---

## Stars API

### Star Article

```
POST /api/trpc/stars.create
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| article_id | number | Yes | Article ID |

**Response:**

```json
{
  "success": true,
  "star_id": 5000,
  "created_at": "2024-01-20T18:00:00Z"
}
```

---

### Unstar Article

```
POST /api/trpc/stars.delete
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| star_id | number | Yes | Star ID |

**Response:**

```json
{
  "success": true
}
```

---

### List User Stars

```
GET /api/trpc/stars.list
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 20 | Results per page |
| offset | number | No | 0 | Pagination offset |

**Response:**

```json
[
  {
    "id": 5000,
    "article": {
      "id": 12345,
      "title": "Bitcoin News",
      "excerpt": "...",
      "published_at": "2024-01-20T15:30:00Z"
    },
    "created_at": "2024-01-20T18:00:00Z"
  }
]
```

---

## Wallet API

### Get Wallet Balance

```
GET /api/trpc/wallet.balance
```

**Response:**

```json
{
  "user_id": 100,
  "oct_balance": 1500.50,
  "usdt_balance": 150.25,
  "total_earned": 2500.00,
  "total_withdrawn": 1000.00,
  "pending_payout": 350.00
}
```

---

### Get Transaction History

```
GET /api/trpc/wallet.transactions
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 20 | Results per page |
| offset | number | No | 0 | Pagination offset |
| type | string | No | - | Filter: "earn", "spend", "withdraw" |

**Response:**

```json
[
  {
    "id": 1000,
    "type": "earn",
    "amount": 50.00,
    "currency": "OCT",
    "description": "Article views",
    "reference_id": 12345,
    "created_at": "2024-01-20T15:30:00Z"
  }
]
```

---

### Buy OCT Tokens

```
POST /api/trpc/wallet.buyOCT
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Amount in USD |
| payment_method | string | Yes | "credit_card", "paypal", "crypto" |

**Response:**

```json
{
  "transaction_id": "tx_12345",
  "amount_usd": 100.00,
  "amount_oct": 1000.00,
  "status": "pending",
  "payment_url": "https://payment.example.com/..."
}
```

---

### Withdraw USDT

```
POST /api/trpc/wallet.withdrawUSDT
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Amount in USDT |
| wallet_address | string | Yes | Ethereum wallet address |

**Response:**

```json
{
  "withdrawal_id": "wd_12345",
  "amount": 150.00,
  "status": "pending",
  "estimated_arrival": "2024-01-22T18:00:00Z"
}
```

---

## User API

### Get Current User

```
GET /api/trpc/auth.me
```

**Response:**

```json
{
  "id": 100,
  "openId": "user_open_id",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://...",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z",
  "last_signed_in": "2024-01-20T18:00:00Z"
}
```

---

### Update User Profile

```
POST /api/trpc/users.update
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | User name |
| email | string | No | Email address |
| avatar_url | string | No | Avatar image URL |
| bio | string | No | User bio |

**Response:**

```json
{
  "id": 100,
  "name": "John Doe",
  "email": "john@example.com",
  "updated_at": "2024-01-20T18:30:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation error",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication token |
| FORBIDDEN | 403 | User lacks permission for this action |
| NOT_FOUND | 404 | Resource not found |
| INVALID_INPUT | 400 | Validation error |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited:

- **Free tier**: 100 requests/hour
- **Pro tier**: 1,000 requests/hour
- **Developer tier**: 10,000 requests/hour

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705779600
```

---

## Pagination

Paginated endpoints use `limit` and `offset` parameters:

```bash
# Get first 20 results
?limit=20&offset=0

# Get next 20 results
?limit=20&offset=20
```

---

## Filtering

Most list endpoints support filtering:

```bash
# Filter by tag
?tags=1,2,3

# Filter by date range
?date_from=2024-01-15&date_to=2024-01-20

# Filter by language
?lang=en
```

---

## Webhooks

Webhooks allow real-time notifications of events:

```bash
# Register webhook
POST /api/trpc/webhooks.register
{
  "url": "https://your-domain.com/webhook",
  "events": ["article.created", "tag.trending"]
}

# Webhook payload
POST https://your-domain.com/webhook
{
  "event": "article.created",
  "data": {
    "id": 12345,
    "title": "New Article",
    "url": "https://..."
  },
  "timestamp": "2024-01-20T18:00:00Z"
}
```

---

## SDK & Client Libraries

### JavaScript/TypeScript

```typescript
import { trpc } from '@observerz/sdk';

const tags = await trpc.tags.trending.query({
  window: '72h',
  limit: 20
});
```

### Python

```python
from observerz import Client

client = Client(api_key='your_api_key')
tags = client.tags.trending(window='72h', limit=20)
```

---

## Support

For API support:
- **Documentation**: https://docs.observerz.com
- **Issues**: https://github.com/observerz/observerz/issues
- **Email**: api-support@observerz.com

---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Status**: Production Ready

