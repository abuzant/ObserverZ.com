# observerZ.com — Product & Architecture Blueprint (v0.1)

> A two‑engine, tag‑driven, self‑curating “newspaper for Gen Z” with personal journals, social walls, and lightweight paid messaging.

---

## 1) Vision & Principles
- **Mission:** Let anyone “observe the world” through dynamic topic graphs and personal journals that auto‑curate the latest from the last 7–30 days.
- **Audience:** Gen Z (mobile‑first, snackable, visual, social sharable, privacy‑aware).
- **Core Tenets:** fresh by default (<30 days), simple creation, tag‑first discovery, transparent ranking, and safety.

---

## 2) High‑Level System Overview
- **Two Engines**
  1) **Data Engine (Backend):** fetch, parse, extract tags/topics, rank links, expose APIs.
  2) **Presentation Engine (Frontend):** auto‑generating index pages + user journals/walls.
- **Admin:** queue URLs, manage sources, moderate tags, view pipeline stats, payouts.
- **Add‑ons:** paid internal messaging + ephemeral email (72h TTL, no attachments).

```text
Users ↔ Frontend (Next.js) ↔ API Gateway (FastAPI/Node) ↔ Services (Workers/Queues)
                                           │
                                   PostgreSQL + Redis + S3
                                           │
                                    Ingestion Pipelines
                                  (Python + Newspaper3k, YT/Twitter APIs,* NLP)
```
*Use official APIs or compliant aggregators; respect ToS/robots.

---

## 3) Data Pipeline (Ingestion → NLP → Storage)
1. **Inputs**
   - Manual via Admin (submit URL, paste text, upload RSS list)
   - Email funnel (ingest emails → extract links/text) 
   - Social signals: trending tags/hashtags from YouTube/Twitter/X (compliant)
2. **Workers**
   - **Fetcher:** HTTP fetch (respect robots + rate limits); extracts canonical URL, title, body, author, publish date, OG/Twitter cards, images.
   - **Parser:** boilerplate removal, language detection, safe‑content flags.
   - **Tagger:** keyword/keyphrase extraction (YAKE/RaphaNLP/KeyBERT), NER, topic mapping, synonym/alias merge, stop‑tag filters.
   - **GraphQ Extractor:** builds a **self‑contained graph object** per **page | tag | keyword | wall | feed**; feeds related‑tags.
   - **Ranker:** popularity score per link = unique clicks (last 72h) + freshness boost + **source_weight (normalized source rank)** + engagement.
   - **De‑dup:** near‑duplicate clustering (MinHash/SimHash) across 7–30 day window.
   - **TTL/Expiry:** external‑news tags auto‑expire after 7 days; global content window = 30 days.
3. **Queues & Scheduling**
   - Celery/RQ workers + Redis; cron for refresh; dead‑letter queue for failures.
   - **Hourly Source Metrics Job:** recompute 30‑day rolling `articles_30d`, `clicks_30d`, `rank_30d` into `source_metrics_30d` (with optional smoothing).
   - **Daily Report Job (23:59 server time):** aggregates last‑24h metrics and renders a **PDF infographic** → local + S3.
   - **GraphQ Maintenance:** periodic compaction (hourly deltas → daily snapshots) and edge‑weight decay.
   - **Notifications Worker:** watches sources/authors marked **notify** in user filters → pushes alerts/digests.
4. **Compliance & Safety**
   - Respect robots.txt; store crawl consent; source allow/deny lists; abuse reporting.

---

## 3a) Caching & Content Delivery (per module)
- **Admin‑configurable TTLs:** global defaults (15 minutes) and per‑module overrides (tag page, wall, journal, related‑tags API, search API, feed API, reports, **galleries**).
- **Layered cache strategy:**
  1) **Edge (CDN/Cloudflare):** `Cache-Control: public, max-age=<TTL>, stale-while-revalidate=60, stale-if-error=600`; **Surrogate-Key** headers (e.g., `gallery:tag:ai`).
  2) **Origin (Redis):** key = `v1:{page_type}:{identifier}:{params_hash}` including `window` (7d/30d), pagination, filters; TTL per module.
  3) **Filesystem artifact cache:** JSON/HTML snapshot files for 24h backup.
- **Invalidation:** new images, new articles with images, star/pin/boost that affects ordering; purge by Surrogate‑Key.
- **Personalized data:** never edge‑cache; `Cache-Control: private, no-store`.
- **Headers:** use **ETag** + **Last-Modified** for conditional gallery fetches.

---

## 4) Data Model (Simplified)
- **tables**
  - `sources(id, type, url, name, trust_score, allowed, created_at)`
  - `source_metrics_30d(source_id, articles_30d, clicks_30d, rank_30d, computed_at)`
  - `articles(id, source_id, canonical_url, title, author, lang, published_at, fetched_at, excerpt, image_url, hash, is_public, status)`
  - `images(id, article_id, source_id, url, thumb_url, width, height, mime, hash, created_at)`
  - `image_tags(image_id, tag_id, weight)`
  - `image_rollups(scope, ref_id, window, image_id, score, created_at)` -- scope: tag|keyword|wall|feed; window: 7d|30d
  - `tags(id, slug, display, type, parent_id, is_trending, created_at)`
  - `tag_aliases(id, tag_id, alias)`
  - `article_tags(article_id, tag_id, weight, expiry_at, boost_minutes)`
  - `related_tags_cache(q, result_json, computed_at)`
  - `click_events(id, article_id, user_id, ip_hash, ua_hash, created_at, country_code, region_code)`
  - `geo_rollups(id, scope, ref_id, window, country_code, region_code, views, last_aggregated_at)`  -- scope: article|system
  - `daily_reports(id, report_date, s3_pdf_url, s3_image_url, metrics_json, created_at)`
  - `graphs(id, scope, ref_id, version, node_count, edge_count, created_at)` -- scope: page|tag|keyword|wall|feed
  - `graph_nodes(graph_id, node_id, type, label, weight, meta_json)`
  - `graph_edges(graph_id, src_node_id, dst_node_id, type, weight, meta_json)`
  - `journals(id, user_id, title, is_public, theme, created_at)`
  - `journal_tags(journal_id, tag_id, priority)`
  - `walls(id, user_id, title, is_public, layout, created_at)`
  - `wall_items(id, wall_id, tag_id | article_id, position)`
  - `emails(id, user_id, from_addr, to_addr, subject, body_text, expires_at, status)`
  - `messages(id, from_user, to_user, body_text, created_at, expires_at)`
  - `comments(id, article_id, user_id, body_text, status, created_at, purchase_type)` -- purchase_type: addon|one_off
  - `subscriptions(id, user_id, addon_type, status, started_at, renewed_at, expires_at, meta)` -- addon_type: comments|avatar|messaging|api
  - `filters(id, user_id, name, mode, created_at)` -- mode: block|allow|mixed
  - `filter_rules(id, filter_id, type, value, action)` -- type: source|keyword|author; action: block|allow|notify
  - `filter_usage(id, user_id, filter_id, scope, ref, applied_at)` -- audit trail for API/UI applications
  - `stars(id, user_id, article_id, created_at, active)` -- active=false when unstarred
  - `cache_config(module, ttl_seconds, updated_at)` -- admin‑set TTLS per module
  - `cache_artifacts(key_hash, path, page_type, identifier, params_hash, generated_at, ttl_seconds)` -- filesystem snapshot index
  - `api_usage(id, user_id, endpoint, units, cost_usd, created_at)`
  - `boosts(id, user_id, article_id, minutes_added, cost_usd, created_at)`
  - `pins(id, user_id, article_id, expires_at, cost_usd, created_at)`
  - `wallets(user_id, oct_balance, usdt_address, created_at)`
  - `wallet_tx(id, user_id, kind, amount, currency, tx_ref, status, created_at)` -- kind: buy_oct|spend_oct|deposit_usdt|withdraw_usdt|payout|refund
  - `user_ranks(user_id, window_start, window_end, views_wall_30d, comments_30d, rank)`
  - `payouts(id, user_id, period_start, period_end, views, rate_per_1k, amount, status)`
- **indices**
  - GIN on `article.excerpt` & `title` (pg_trgm/full‑text)
  - **Images:** unique on `images.hash`; `(article_id)`, `(source_id, created_at)`
  - `image_rollups`: `(scope, ref_id, window, created_at desc)`
  - Composite `(tag_id, created_at)`; `(article_id, created_at)` for click scopes
  - Unique on `articles.hash` (de‑dup)
  - Map rollups: `(scope, ref_id, window, country_code)`
  - Graphs: `(scope, ref_id, created_at desc)` for latest snapshot; `(graph_id, type)` on nodes/edges
  - Related cache: `(q)`; Tag aliases: `(alias)` unique
  - Filters: `(user_id, created_at)` and `(filter_id, type, value)`
  - **Stars:** `(user_id, article_id)` unique partial on active=true
  - **Cache artifacts:** `(key_hash)` and `(page_type, identifier)`
  - **Cache config:** `(module)`
  - **Source metrics:** unique `(source_id)`; partial indexes on stale `computed_at`
  - Pins: `(user_id, created_at)` with limit checks; Boosts `(article_id, created_at)`
  - Wallet transactions `(user_id, created_at)`
  - Daily reports: unique on `(report_date)`

---

## 5) API Surface (v1 draft)
**Auth:** JWT (access/refresh); OAuth for social sign‑in.

**Content & Feeds**
- `GET /v1/tags/trending?window=72h&limit=50`
- `GET /v1/tags/{slug}/feed?sort=hot|new&window=7d`
- `GET /v1/tags/related?q=keyword&limit=25` — **aka `/getrelatedtags`**
- `GET /v1/articles/{id}`
- `GET /v1/articles/{id}/geo?window=7d`
- `GET /v1/system/geo?window=24h`

**Galleries (Images)**
- `GET /v1/galleries/tags/{slug}?window=7d&limit=25&page=1` → images for a tag/keyword
- `GET /v1/galleries/search?q=keyword&window=7d&limit=25&page=1` → images by keyword (alias‑aware)
- **Pagination:** `limit` ≤ 25; returns `next_page` cursor
- **Billing:** each call is billable **$0.01** via OCT (counts in `api_usage`)

**Sources**
- `GET /v1/sources/{domain}/rank` → `{domain, articles_30d, clicks_30d, rank_30d}`
- `GET /v1/sources/top?limit=100`

**Stars (⭐)**
- `POST /v1/stars { article_id }`
- `DELETE /v1/stars/{article_id}`
- `GET /v1/stars/me`

**Graphs**
- `GET /v1/graphs/{scope}/{ref_id}/latest`
- `GET /v1/graphs/{scope}/{ref_id}/history?limit=...`
- `GET /v1/graphs/{scope}/{ref_id}/neighbors?node=...&depth=1..3`

**Daily Reports (free, public)**
- `GET /v1/reports/latest`
- `GET /v1/reports/{YYYY-MM-DD}`
- `GET /v1/reports`

**Filtration Module**
- `POST /v1/filters` / `GET /v1/filters`
- `POST /v1/filters/{id}/rules` / `DELETE /v1/filters/{id}/rules/{rule_id}`
- **Apply:** any endpoint supports `&apifilter=<id>` (ownership enforced).

**Admin: Cache Config & Invalidation**
- `GET /v1/admin/cache-config`
- `PATCH /v1/admin/cache-config { module, ttl_seconds }`
- `POST /v1/admin/cache/purge { surrogate_keys:[] | route_pattern }`

**Tokens, Billing & Payouts**
- `GET /v1/wallet` / `POST /v1/wallet/buy-oct` / `POST /v1/wallet/withdraw-usdt`
- `GET /v1/wallet/transactions?window=30d`
- `POST /v1/devapi/query`
- `GET /v1/widgets/{type}` / `POST /v1/widgets/create`

**Ranking spec (hot):**  
`hot = log(1 + unique_clicks_72h) + freshness_decay(published_at) + source_weight + journal_boost + boost_bonus(remaining_TTL) + star_boost`
**  
`hot = log(1 + unique_clicks_72h) + freshness_decay(published_at) + source_weight + journal_boost + boost_bonus(remaining_TTL) + star_boost`

---

## 6) Frontend UX (Gen Z‑tuned)
- **Tech:** Next.js 15 + React Server Components, Edge caching (Vercel/Cloudflare). 
- **Index Pages:** Infinite card feed per tag; chips for quick tag‑hops; auto‑expire badges.
- **Personal Journal:** up to 8 default interest tags; private or public; shareable link; quick add from any card; poster‑style cover.
- **Social Wall:** grid or collage of interests; remix templates; shareable profile.
- **Actions:** Boost ($0.10), Comment ($0.99/mo or $0.10 one‑off), Pin ($0.10; adds to **My PINs**), **Star (⭐)** $0.10 one‑off or **$1.99/mo unlimited**.
- **Wallet:** OCT balance widget; **Buy OCT** (MoonPay) and **Withdraw USDT** flows.
- **My PINs:** up to 100 pinned items with TTL indicators and quick unpin.
- **My ⭐ Stars:** personal favorites page.
- **Galleries:**
  - **Tag Gallery pages** with **masonry/infinite scroll** of `img_src` from recent (7d/30d) items.
  - Lightbox viewer, lazy‑loading, swipe on mobile, share card per image.
  - Auto‑refresh (silent) every N minutes; cache‑friendly.
- **Link Transparency:** 72h Click Rank chip + Source Rank 30d.
- **Maps:** per‑post 7d map; homepage 24h map.
- **Daily Infographic:** poster‑style PDF viewer and archive calendar.
- **Embeds:** copy‑paste `<script>` for Related Tags and **Gallery** per tag/keyword.
- **Graph Viewers:** constellation view over stored graphs.
- **Typeahead:** `/v1/tags/related` based suggestions.
- **Filtration UI:** block/hide/notify controls; apply **Filtration Set**.
- **Freshness:** 7D/30D toggles; graceful archive.
- **Accessibility:** prefers‑reduced‑motion, large tap targets, dark/light themes.

---

## 7) Admin UI (Vue + Bootstrap, simple v1)
- Queue URLs, monitor fetch jobs, retry failures.
- Tag manager (merge synonyms, set parent/child, mark trending).
- Source control (allowlist/denylist, trust weighting).
- Stats: ingestions/hour, unique clicks 72h, top tags, payout liability.
- Moderation: takedowns, abuse reports, user strikes.

---

## 8) Monetization, Tokens (OCT), & Payouts
- **Free tier:** journals/walls; $1.00 per 1,000 unique views on public pages.*
- **Tokenization:** introduce **OCT — Observed Content Tokens** as the platform credit.
  - **Buy OCT:** credit/debit via **MoonPay** and on‑chain **USDT** deposits.
  - **Spend OCT:** boosts ($0.10), pins ($0.10), one‑off comments ($0.10), avatar ($0.99/mo), comment add‑on ($0.99/mo), **Filtration set ($0.33/set)**, **Star (⭐) $0.10 / item** or **$1.99/mo unlimited**, API calls ($0.01/query), messaging add‑on (price TBA).
  - **Withdrawals:** users can **cash out in USDT** to a self‑custody wallet (KYC thresholds apply).
  - **Accounting:** off‑chain OCT ledger with **1:1 pricing peg** to USD for UX; on‑chain USDT rails for in/out.
- **Add‑ons (monthly unless noted):**
  - **Comments:** $0.99 — unlock commenting anywhere.
  - **Avatar:** $0.99 — custom profile avatar.
  - **Messaging + ephemeral email:** bundle priced; 72h TTL.
  - **Developer API access:** $0.01 per query (metered).
  - **Filtration module:** $0.33 **per filtration set** (block/allow lists and notify rules); users can own multiple sets and apply by id.
  - **Star Unlimited:** $1.99 — unlimited ⭐ for the month.
- **Micro‑transactions:**
  - **Boost:** $0.10 — extend expiry +60m per boost (≤30d cap).
  - **One‑off comment:** $0.10 — single comment without monthly add‑on.
  - **Pin:** $0.10 — add to **My PINs** (max 100, 30d TTL).
  - **Star (one‑off):** $0.10 — favorite an item until unstarred.
- **Anti‑Fraud & Risk:** device/entity scoring, AML/KYT on USDT flows, velocity caps, clawbacks for abuse; dispute flow.
- **Payout flow:** monthly; min threshold; KYC for creators above threshold; payout rail: **USDT** only (phase 1). 

*Rates tuneable based on RPM, sponsor yield, infra costs.

--- 

*Rates tuneable based on RPM, sponsor yield, infra costs.

---

## 9) Trust, Safety, & Legal
- Content policy; user reporting; transparency logs for takedowns.
- **Image safety:** NSFW/violent detection with human review queue; blocklist per source/domain; EXIF strip; hotlink rules; cache + transform thumbnails.
- Copyright: display thumbnails + link to source; comply with robots and site policies.
- Data retention: default 30 days for content; 72h for emails/messages.
- GDPR/CCPA pathways; parental controls for U18; age‑gate where required.
- Robots/ToS compliance for all crawled sources; cache snippets only; link‑out for full.
- Payments & Tokens: KYC thresholds for payouts; KYT on USDT flows; MoonPay compliance; regional restrictions enforced.

---

## 10) MVP Scope (8–10 weeks)
**Week 1–2: Foundations**  
- Repo scaffolding, auth, DB schema, migrations, basic admin login.  
- Minimal ingestion of hand‑curated sources (RSS + manual URL queue).  

**Week 3–4: Tagger & Feeds**  
- Keyword extraction + NER → tag table; trending calc; tag index pages.  
- Click‑through redirector + 72h rank metric.

**Week 5–6: Journals**  
- Create journal; pick up to 8 tags; public/private; shareable page.  
- Basic payout counter (views) without payments yet.

**Week 7–8: Walls & Admin**  
- Social wall templates; simple moderation; admin stats dashboard.  

**Week 9–10 (Stretch):**
- Messaging & ephemeral email prototype; payouts ledger; KYC stub; CDN cache.

---

## 11) Tech Stack (opinionated v0)
- **Backend APIs:** FastAPI (Python) for ingestion & NLP; Node (NestJS) for auth/billing/token ledger & MoonPay webhooks.
- **Workers:** Python (Celery/RQ) + Redis; Newspaper3k; yt‑dlp (metadata‑only).*  
- **DB & Cache:** PostgreSQL + Redis; S3/MinIO for snapshots/thumbnails & **daily report PDFs/images**.
- **Edge/CDN:** Cloudflare with **Surrogate-Key** tagging + `stale-while-revalidate`.
- **Search:** Postgres full‑text now; OpenSearch as v2.
- **Payments & Tokens:**
  - **MoonPay** Checkout (fiat → OCT) + webhook verification.
  - **USDT** deposits/withdrawals via managed custody or self‑hosted wallet service with KYT.
  - **OCT** off‑chain ledger service with idempotent transactions.
- **Graph Engine:** NetworkX/igraph for metrics; graph JSON persisted to Postgres; optional Neo4j as v2 if needed.
- **PDF Rendering Pipeline:** Playwright (Chromium) or Puppeteer to render a responsive HTML **infographic** → PDF (A3 portrait); charts via **Chart.js** or **ECharts**; CSS print styles.
- **Infra:** Docker + Terraform; Fly.io/Render or AWS (Fargate + RDS + CloudFront).  
- **Edge:** Cloudflare for cache + bot filtering + signed redirects.
- **Frontend:** Next.js + Tailwind; Admin: Vue + Bootstrap.
- **HTTP Headers:** public data → `Cache-Control: public, max-age=<TTL>, stale-while-revalidate`; personalized data → `Cache-Control: private, no-store`; **ETag** for conditional GET; **Vary** on `Authorization, Accept-Language` where relevant.

*Honor platform ToS; avoid unauthorized scraping; use APIs where available.

---

*Honor platform ToS; avoid unauthorized scraping; use APIs where available.

---

## 12) Analytics & Observability
- **Events:** impressions, unique views, clicks, shares, saves, follows, reports, **comments**, **boosts**, **pins**, **stars**, API requests (billable), **gallery impressions/click-through**, map‑view aggregations, **daily report views/downloads**, **filter applies**.
- **Viewer Geography Aggregation:**
  - **Per‑post 7‑day** rollups for map (country/region buckets + counts + %).
  - **Homepage 24‑hour** system‑wide rollup for map.
- **Graph Metrics:** node/edge counts, centrality (degree/betweenness), cluster counts; store per snapshot for trend lines.
- **Source Metrics:** hourly rollup job writes `articles_30d`, `clicks_30d`, `rank_30d`.
- **Galleries Metrics:** top images by tag/keyword, CTR, dwell time in lightbox, scroll depth.
- **Daily Report Aggregation:** include a **Top Images** strip (7d/30d) in the infographic.
- **User Profile Rank (30‑day window):** `profile_rank = unique_views_on_user_social_wall_30d + comments_made_30d`.
- **Commerce & Abuse Dashboards:** API spend, gallery abuse (NSFW), boost velocity, pin saturation, dispute queue.
- **SLOs:** ingestion latency < 5m; gallery API p95 < 250ms (cached); daily PDF job success 99.5%; uptime 99.9%.

---

## 13) Risk Register (early)
- **API/ToS Compliance:** must prefer official feeds/APIs → legal review.  
- **Fraud & Abuse:** view/click gaming → device scoring, rate limits, reviews.  
- **False Trends:** brigading → cross‑source weighting + anomaly detection.  
- **Cost Overruns:** heavy crawl/storage → strict TTL, archive policy, tiered storage.  
- **Safety:** harmful content → policy, filters, human moderation queue.

---

## 14) Detailed Ranking & Expiry Rules
- **Freshness decay:** `decay = e^(−Δt / τ)`; τ ≈ 36h for hot, 7d for new.
- **72h Rank Badge:** quantiles: Top 1%, 5%, 20%, 50%.
- **Expiry:**
  - Default: tag→article edges older than 7d (external news) are removed; global content window max = 30d.
  - **Boosts:** each **$0.10 boost** adds **+60 minutes** to the entry’s expiry **(capped by 30 days max)**; stored as additive `boost_minutes` on the tag→article edge; audit trail retained.
  - Journals/walls remain but display “archived snapshot” for old links.
- **Related Tags (for `/v1/tags/related`):**
  - For a query `q`, find tag node `Tq` (or alias). Compute score for each neighbor tag `Ti` using **weighted co‑occurrence** over the last 7 days:
    - `cooc_7d = sum(weight(tag_pair, article))` across articles where both tags appear (weight includes recency decay).
    - `pmi = log2( P(Tq, Ti) / (P(Tq)·P(Ti)) )` with add‑k smoothing.
    - `engagement = normalized(clicks_72h(Ti)) + pin_boost(Ti) + boost_signal(Ti)`.
    - `score = α·normalize(cooc_7d) + β·normalize(pmi) + γ·normalize(engagement)` with defaults α=0.5, β=0.2, γ=0.3.
  - Return **top 25** by `score`, excluding `Tq`, filter by minimum support (e.g., ≥5 co‑occurrences) and safe‑list categories.
  - Cache results for 10 minutes per `q`.
- **Source Rank (30-day window):**
  - For a domain `d`: `rank_30d = clicks_30d(d) / articles_30d(d)` using only items within the last **30 days**.
  - Example: `reuters.com` → `articles_30d=900`, `clicks_30d=4200` ⇒ `rank_30d = 4200 / 900 = 4.67` (display **4.6** rounded‑1).
  - **Smoothing (optional for fairness):** `rank_30d = (clicks_30d + κ) / (articles_30d + λ)` with small priors (e.g., κ=50, λ=20) to avoid tiny‑sample spikes.
  - Recompute hourly; store in `source_metrics_30d`; expose with article/source payloads.
  - Normalize to `[0..1]` for use as `source_weight` in ranking if desired.

---

## 15) Wireframe Notes (text)
- **Home:** search + trending tags carousel → entering a tag page.
- **Tag page:** hero chip row; ranked card list; “Add to My Journal.”
- **Journal:** 8 tag slots; reorder by priority; private toggle; share link.
- **Wall:** masonry grid; remix templates; shareable profile.
- **Card:** source favicon, time since, 72h rank, image, title, tag chips.

---

## 16) Next Steps (pick & run)
1) Approve MVP scope & stack.  
2) I’ll generate:
   - ERD SQL migration v1
   - OpenAPI (YAML) for endpoints
   - Next.js starter (journal + tag page)
   - Admin (Vue+Bootstrap) skeleton with queue + tags
3) Define payout math and anti‑fraud policy draft for T&Cs.

---

## 17) Open Questions (we can default sensibly)
- Reward currency display (USD vs internal credits).  
- KYC thresholds & payout rails.  
- Allowed source list (start with 50 trusted domains + RSS).  
- Exact rank weights (we’ll tune with live data).

---

**End of v0.1** — Ready to iterate.

