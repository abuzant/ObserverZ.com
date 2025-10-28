import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  real,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const sourceTypeEnum = pgEnum("source_type", ["news", "blog", "social", "video", "other"]);
export const articleStatusEnum = pgEnum("article_status", ["active", "archived", "removed"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
export const addonTypeEnum = pgEnum("addon_type", ["comments", "avatar", "messaging", "api", "stars"]);
export const filterModeEnum = pgEnum("filter_mode", ["block", "allow", "mixed"]);
export const filterTypeEnum = pgEnum("filter_type", ["source", "keyword", "author"]);
export const filterActionEnum = pgEnum("filter_action", ["block", "allow", "notify"]);
export const graphScopeEnum = pgEnum("graph_scope", ["page", "tag", "keyword", "wall", "feed"]);
export const graphNodeTypeEnum = pgEnum("graph_node_type", ["tag", "keyword", "entity", "topic"]);
export const graphEdgeTypeEnum = pgEnum("graph_edge_type", ["related", "synonym", "hierarchy", "co_occurrence"]);
export const walletTxKindEnum = pgEnum("wallet_tx_kind", [
  "buy_oct",
  "spend_oct",
  "deposit_usdt",
  "withdraw_usdt",
  "payout",
  "refund",
]);
export const walletTxStatusEnum = pgEnum("wallet_tx_status", ["pending", "completed", "failed", "cancelled"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const emailStatusEnum = pgEnum("email_status", ["sent", "read", "expired"]);
export const commentPurchaseTypeEnum = pgEnum("comment_purchase_type", ["addon", "one_off"]);
export const imageScopeEnum = pgEnum("image_scope", ["tag", "keyword", "wall", "feed"]);

// ============================================================================
// CORE USERS & AUTH
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: userRoleEnum("role").default("user").notNull(),
    avatar_url: text("avatar_url"),
    bio: text("bio"),
    is_public: boolean("is_public").default(false),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
    last_signed_in: timestamp("last_signed_in").defaultNow().notNull(),
  },
  (table) => ({
    openIdIdx: uniqueIndex("users_openId_idx").on(table.openId),
    emailIdx: index("users_email_idx").on(table.email),
    createdIdx: index("users_created_at_idx").on(table.created_at),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// SOURCES & ARTICLES
// ============================================================================

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    type: sourceTypeEnum("type").default("news"),
    url: varchar("url", { length: 2048 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    domain: varchar("domain", { length: 256 }).notNull(),
    trust_score: real("trust_score").default(0),
    allowed: boolean("allowed").default(true),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    urlIdx: uniqueIndex("sources_url_idx").on(table.url),
    domainIdx: index("sources_domain_idx").on(table.domain),
  })
);

export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

export const source_metrics_30d = pgTable(
  "source_metrics_30d",
  {
    id: serial("id").primaryKey(),
    source_id: integer("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
    articles_30d: integer("articles_30d").default(0),
    clicks_30d: integer("clicks_30d").default(0),
    rank_30d: real("rank_30d").default(0),
    computed_at: timestamp("computed_at").defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: uniqueIndex("source_metrics_30d_source_id_idx").on(table.source_id),
    computedIdx: index("source_metrics_30d_computed_at_idx").on(table.computed_at),
  })
);

export type SourceMetrics30d = typeof source_metrics_30d.$inferSelect;
export type InsertSourceMetrics30d = typeof source_metrics_30d.$inferInsert;

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    source_id: integer("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
    canonical_url: varchar("canonical_url", { length: 2048 }).notNull().unique(),
    title: text("title").notNull(),
    author: varchar("author", { length: 256 }),
    lang: varchar("lang", { length: 10 }).default("en"),
    published_at: timestamp("published_at"),
    fetched_at: timestamp("fetched_at").defaultNow().notNull(),
    excerpt: text("excerpt"),
    image_url: text("image_url"),
    hash: varchar("hash", { length: 64 }).unique(),
    is_public: boolean("is_public").default(true),
    status: articleStatusEnum("status").default("active"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sourceIdx: index("articles_source_id_idx").on(table.source_id),
    hashIdx: uniqueIndex("articles_hash_idx").on(table.hash),
    urlIdx: uniqueIndex("articles_canonical_url_idx").on(table.canonical_url),
    publishedIdx: index("articles_published_at_idx").on(table.published_at),
    createdIdx: index("articles_created_at_idx").on(table.created_at),
  })
);

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ============================================================================
// IMAGES & GALLERIES
// ============================================================================

export const images = pgTable(
  "images",
  {
    id: serial("id").primaryKey(),
    article_id: integer("article_id").references(() => articles.id, { onDelete: "cascade" }),
    source_id: integer("source_id").references(() => sources.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    thumb_url: text("thumb_url"),
    width: integer("width"),
    height: integer("height"),
    mime: varchar("mime", { length: 64 }),
    hash: varchar("hash", { length: 64 }).unique(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    articleIdx: index("images_article_id_idx").on(table.article_id),
    sourceIdx: index("images_source_id_idx").on(table.source_id),
    hashIdx: uniqueIndex("images_hash_idx").on(table.hash),
    createdIdx: index("images_created_at_idx").on(table.created_at),
  })
);

export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

export const image_tags = pgTable(
  "image_tags",
  {
    id: serial("id").primaryKey(),
    image_id: integer("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    weight: real("weight").default(1),
  },
  (table) => ({
    imageIdx: index("image_tags_image_id_idx").on(table.image_id),
    tagIdx: index("image_tags_tag_id_idx").on(table.tag_id),
  })
);

export type ImageTag = typeof image_tags.$inferSelect;
export type InsertImageTag = typeof image_tags.$inferInsert;

export const image_rollups = pgTable(
  "image_rollups",
  {
    id: serial("id").primaryKey(),
    scope: imageScopeEnum("scope").notNull(),
    ref_id: integer("ref_id").notNull(),
    window: varchar("window", { length: 10 }).notNull(), // "7d", "30d"
    image_id: integer("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
    score: real("score").default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    scopeRefIdx: index("image_rollups_scope_ref_id_idx").on(table.scope, table.ref_id),
    windowIdx: index("image_rollups_window_idx").on(table.window),
    createdIdx: index("image_rollups_created_at_idx").on(table.created_at),
  })
);

export type ImageRollup = typeof image_rollups.$inferSelect;
export type InsertImageRollup = typeof image_rollups.$inferInsert;

// ============================================================================
// TAGS & KEYWORDS
// ============================================================================

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    display: varchar("display", { length: 256 }).notNull(),
    type: varchar("type", { length: 64 }).default("general"),
    parent_id: integer("parent_id").references((): any => tags.id, { onDelete: "set null" }),
    is_trending: boolean("is_trending").default(false),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table: any) => ({
    slugIdx: uniqueIndex("tags_slug_idx").on(table.slug),
    parentIdx: index("tags_parent_id_idx").on(table.parent_id),
    createdIdx: index("tags_created_at_idx").on(table.created_at),
  })
);

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export const tag_aliases = pgTable(
  "tag_aliases",
  {
    id: serial("id").primaryKey(),
    tag_id: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    alias: varchar("alias", { length: 256 }).notNull().unique(),
  },
  (table) => ({
    tagIdx: index("tag_aliases_tag_id_idx").on(table.tag_id),
    aliasIdx: uniqueIndex("tag_aliases_alias_idx").on(table.alias),
  })
);

export type TagAlias = typeof tag_aliases.$inferSelect;
export type InsertTagAlias = typeof tag_aliases.$inferInsert;

export const article_tags = pgTable(
  "article_tags",
  {
    id: serial("id").primaryKey(),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    weight: real("weight").default(1),
    expiry_at: timestamp("expiry_at"),
    boost_minutes: integer("boost_minutes").default(0),
  },
  (table) => ({
    articleIdx: index("article_tags_article_id_idx").on(table.article_id),
    tagIdx: index("article_tags_tag_id_idx").on(table.tag_id),
    expiryIdx: index("article_tags_expiry_at_idx").on(table.expiry_at),
  })
);

export type ArticleTag = typeof article_tags.$inferSelect;
export type InsertArticleTag = typeof article_tags.$inferInsert;

export const related_tags_cache = pgTable(
  "related_tags_cache",
  {
    id: serial("id").primaryKey(),
    q: varchar("q", { length: 256 }).notNull().unique(),
    result_json: jsonb("result_json").notNull(),
    computed_at: timestamp("computed_at").defaultNow().notNull(),
  },
  (table) => ({
    qIdx: uniqueIndex("related_tags_cache_q_idx").on(table.q),
  })
);

export type RelatedTagsCache = typeof related_tags_cache.$inferSelect;
export type InsertRelatedTagsCache = typeof related_tags_cache.$inferInsert;

// ============================================================================
// CLICK TRACKING & GEO
// ============================================================================

export const click_events = pgTable(
  "click_events",
  {
    id: serial("id").primaryKey(),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    user_id: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    ip_hash: varchar("ip_hash", { length: 64 }),
    ua_hash: varchar("ua_hash", { length: 64 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    country_code: varchar("country_code", { length: 2 }),
    region_code: varchar("region_code", { length: 10 }),
  },
  (table) => ({
    articleIdx: index("click_events_article_id_idx").on(table.article_id),
    userIdx: index("click_events_user_id_idx").on(table.user_id),
    createdIdx: index("click_events_created_at_idx").on(table.created_at),
    geoIdx: index("click_events_country_code_idx").on(table.country_code),
  })
);

export type ClickEvent = typeof click_events.$inferSelect;
export type InsertClickEvent = typeof click_events.$inferInsert;

export const geo_rollups = pgTable(
  "geo_rollups",
  {
    id: serial("id").primaryKey(),
    scope: varchar("scope", { length: 64 }).notNull(), // "article", "system"
    ref_id: integer("ref_id"),
    window: varchar("window", { length: 10 }).notNull(), // "7d", "24h", "30d"
    country_code: varchar("country_code", { length: 2 }).notNull(),
    region_code: varchar("region_code", { length: 10 }),
    views: integer("views").default(0),
    last_aggregated_at: timestamp("last_aggregated_at").defaultNow().notNull(),
  },
  (table) => ({
    scopeRefIdx: index("geo_rollups_scope_ref_id_idx").on(table.scope, table.ref_id),
    windowIdx: index("geo_rollups_window_idx").on(table.window),
    geoIdx: index("geo_rollups_country_code_idx").on(table.country_code),
  })
);

export type GeoRollup = typeof geo_rollups.$inferSelect;
export type InsertGeoRollup = typeof geo_rollups.$inferInsert;

// ============================================================================
// GRAPHS & RELATIONSHIPS
// ============================================================================

export const graphs = pgTable(
  "graphs",
  {
    id: serial("id").primaryKey(),
    scope: graphScopeEnum("scope").notNull(),
    ref_id: integer("ref_id").notNull(),
    version: integer("version").default(1),
    node_count: integer("node_count").default(0),
    edge_count: integer("edge_count").default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    scopeRefIdx: index("graphs_scope_ref_id_idx").on(table.scope, table.ref_id),
    createdIdx: index("graphs_created_at_idx").on(table.created_at),
  })
);

export type Graph = typeof graphs.$inferSelect;
export type InsertGraph = typeof graphs.$inferInsert;

export const graph_nodes = pgTable(
  "graph_nodes",
  {
    id: serial("id").primaryKey(),
    graph_id: integer("graph_id").notNull().references(() => graphs.id, { onDelete: "cascade" }),
    node_id: varchar("node_id", { length: 256 }).notNull(),
    type: graphNodeTypeEnum("type").notNull(),
    label: varchar("label", { length: 256 }).notNull(),
    weight: real("weight").default(1),
    meta_json: jsonb("meta_json"),
  },
  (table) => ({
    graphIdx: index("graph_nodes_graph_id_idx").on(table.graph_id),
  })
);

export type GraphNode = typeof graph_nodes.$inferSelect;
export type InsertGraphNode = typeof graph_nodes.$inferInsert;

export const graph_edges = pgTable(
  "graph_edges",
  {
    id: serial("id").primaryKey(),
    graph_id: integer("graph_id").notNull().references(() => graphs.id, { onDelete: "cascade" }),
    src_node_id: varchar("src_node_id", { length: 256 }).notNull(),
    dst_node_id: varchar("dst_node_id", { length: 256 }).notNull(),
    type: graphEdgeTypeEnum("type").notNull(),
    weight: real("weight").default(1),
    meta_json: jsonb("meta_json"),
  },
  (table) => ({
    graphIdx: index("graph_edges_graph_id_idx").on(table.graph_id),
  })
);

export type GraphEdge = typeof graph_edges.$inferSelect;
export type InsertGraphEdge = typeof graph_edges.$inferInsert;

// ============================================================================
// JOURNALS & WALLS
// ============================================================================

export const journals = pgTable(
  "journals",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description"),
    is_public: boolean("is_public").default(false),
    theme: varchar("theme", { length: 64 }).default("default"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("journals_user_id_idx").on(table.user_id),
  })
);

export type Journal = typeof journals.$inferSelect;
export type InsertJournal = typeof journals.$inferInsert;

export const journal_tags = pgTable(
  "journal_tags",
  {
    id: serial("id").primaryKey(),
    journal_id: integer("journal_id").notNull().references(() => journals.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    priority: integer("priority").default(0),
  },
  (table) => ({
    journalIdx: index("journal_tags_journal_id_idx").on(table.journal_id),
    tagIdx: index("journal_tags_tag_id_idx").on(table.tag_id),
  })
);

export type JournalTag = typeof journal_tags.$inferSelect;
export type InsertJournalTag = typeof journal_tags.$inferInsert;

export const walls = pgTable(
  "walls",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description"),
    is_public: boolean("is_public").default(false),
    layout: varchar("layout", { length: 64 }).default("grid"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("walls_user_id_idx").on(table.user_id),
  })
);

export type Wall = typeof walls.$inferSelect;
export type InsertWall = typeof walls.$inferInsert;

export const wall_items = pgTable(
  "wall_items",
  {
    id: serial("id").primaryKey(),
    wall_id: integer("wall_id").notNull().references(() => walls.id, { onDelete: "cascade" }),
    tag_id: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }),
    article_id: integer("article_id").references(() => articles.id, { onDelete: "cascade" }),
    position: integer("position").default(0),
  },
  (table) => ({
    wallIdx: index("wall_items_wall_id_idx").on(table.wall_id),
  })
);

export type WallItem = typeof wall_items.$inferSelect;
export type InsertWallItem = typeof wall_items.$inferInsert;

// ============================================================================
// MESSAGING & EMAILS
// ============================================================================

export const emails = pgTable(
  "emails",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    from_addr: varchar("from_addr", { length: 320 }).notNull(),
    to_addr: varchar("to_addr", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 512 }),
    body_text: text("body_text"),
    expires_at: timestamp("expires_at").notNull(),
    status: emailStatusEnum("status").default("sent"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("emails_user_id_idx").on(table.user_id),
    expiresIdx: index("emails_expires_at_idx").on(table.expires_at),
  })
);

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    from_user: integer("from_user").notNull().references(() => users.id, { onDelete: "cascade" }),
    to_user: integer("to_user").notNull().references(() => users.id, { onDelete: "cascade" }),
    body_text: text("body_text").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    expires_at: timestamp("expires_at").notNull(),
  },
  (table) => ({
    fromIdx: index("messages_from_user_idx").on(table.from_user),
    toIdx: index("messages_to_user_idx").on(table.to_user),
    expiresIdx: index("messages_expires_at_idx").on(table.expires_at),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================================================
// COMMENTS & INTERACTIONS
// ============================================================================

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body_text: text("body_text").notNull(),
    status: varchar("status", { length: 64 }).default("active"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    purchase_type: commentPurchaseTypeEnum("purchase_type"),
  },
  (table) => ({
    articleIdx: index("comments_article_id_idx").on(table.article_id),
    userIdx: index("comments_user_id_idx").on(table.user_id),
  })
);

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const stars = pgTable(
  "stars",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    active: boolean("active").default(true),
  },
  (table) => ({
    userArticleIdx: uniqueIndex("stars_user_article_idx").on(table.user_id, table.article_id),
    userIdx: index("stars_user_id_idx").on(table.user_id),
  })
);

export type Star = typeof stars.$inferSelect;
export type InsertStar = typeof stars.$inferInsert;

export const pins = pgTable(
  "pins",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    expires_at: timestamp("expires_at").notNull(),
    cost_usd: decimal("cost_usd", { precision: 10, scale: 2 }).default("0.10"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("pins_user_id_idx").on(table.user_id),
    expiresIdx: index("pins_expires_at_idx").on(table.expires_at),
  })
);

export type Pin = typeof pins.$inferSelect;
export type InsertPin = typeof pins.$inferInsert;

export const boosts = pgTable(
  "boosts",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    article_id: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    minutes_added: integer("minutes_added").notNull(),
    cost_usd: decimal("cost_usd", { precision: 10, scale: 2 }).default("0.10"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    articleIdx: index("boosts_article_id_idx").on(table.article_id),
    createdIdx: index("boosts_created_at_idx").on(table.created_at),
  })
);

export type Boost = typeof boosts.$inferSelect;
export type InsertBoost = typeof boosts.$inferInsert;

// ============================================================================
// SUBSCRIPTIONS & BILLING
// ============================================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    addon_type: addonTypeEnum("addon_type").notNull(),
    status: subscriptionStatusEnum("status").default("active"),
    started_at: timestamp("started_at").defaultNow().notNull(),
    renewed_at: timestamp("renewed_at").defaultNow().notNull(),
    expires_at: timestamp("expires_at").notNull(),
    meta: jsonb("meta"),
  },
  (table) => ({
    userIdx: index("subscriptions_user_id_idx").on(table.user_id),
    expiresIdx: index("subscriptions_expires_at_idx").on(table.expires_at),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const wallets = pgTable(
  "wallets",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    oct_balance: decimal("oct_balance", { precision: 20, scale: 8 }).default("0"),
    usdt_address: varchar("usdt_address", { length: 256 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("wallets_user_id_idx").on(table.user_id),
  })
);

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export const wallet_tx = pgTable(
  "wallet_tx",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: walletTxKindEnum("kind").notNull(),
    amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(), // "OCT", "USDT"
    tx_ref: varchar("tx_ref", { length: 256 }),
    status: walletTxStatusEnum("status").default("pending"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("wallet_tx_user_id_idx").on(table.user_id),
    createdIdx: index("wallet_tx_created_at_idx").on(table.created_at),
  })
);

export type WalletTx = typeof wallet_tx.$inferSelect;
export type InsertWalletTx = typeof wallet_tx.$inferInsert;

export const payouts = pgTable(
  "payouts",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    period_start: timestamp("period_start").notNull(),
    period_end: timestamp("period_end").notNull(),
    views: integer("views").default(0),
    rate_per_1k: decimal("rate_per_1k", { precision: 10, scale: 2 }).default("1.00"),
    amount: decimal("amount", { precision: 10, scale: 2 }).default("0"),
    status: payoutStatusEnum("status").default("pending"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("payouts_user_id_idx").on(table.user_id),
    periodIdx: index("payouts_period_start_idx").on(table.period_start),
  })
);

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

// ============================================================================
// FILTERS & PERSONALIZATION
// ============================================================================

export const filters = pgTable(
  "filters",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    mode: filterModeEnum("mode").default("block"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("filters_user_id_idx").on(table.user_id),
  })
);

export type Filter = typeof filters.$inferSelect;
export type InsertFilter = typeof filters.$inferInsert;

export const filter_rules = pgTable(
  "filter_rules",
  {
    id: serial("id").primaryKey(),
    filter_id: integer("filter_id").notNull().references(() => filters.id, { onDelete: "cascade" }),
    type: filterTypeEnum("type").notNull(),
    value: varchar("value", { length: 512 }).notNull(),
    action: filterActionEnum("action").notNull(),
  },
  (table) => ({
    filterIdx: index("filter_rules_filter_id_idx").on(table.filter_id),
  })
);

export type FilterRule = typeof filter_rules.$inferSelect;
export type InsertFilterRule = typeof filter_rules.$inferInsert;

export const filter_usage = pgTable(
  "filter_usage",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    filter_id: integer("filter_id").notNull().references(() => filters.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 64 }).notNull(),
    ref: varchar("ref", { length: 256 }),
    applied_at: timestamp("applied_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("filter_usage_user_id_idx").on(table.user_id),
  })
);

export type FilterUsage = typeof filter_usage.$inferSelect;
export type InsertFilterUsage = typeof filter_usage.$inferInsert;

// ============================================================================
// USER RANKING & STATS
// ============================================================================

export const user_ranks = pgTable(
  "user_ranks",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    window_start: timestamp("window_start").notNull(),
    window_end: timestamp("window_end").notNull(),
    views_wall_30d: integer("views_wall_30d").default(0),
    comments_30d: integer("comments_30d").default(0),
    rank: integer("rank").default(0),
  },
  (table) => ({
    userIdx: index("user_ranks_user_id_idx").on(table.user_id),
  })
);

export type UserRank = typeof user_ranks.$inferSelect;
export type InsertUserRank = typeof user_ranks.$inferInsert;

// ============================================================================
// CACHING & REPORTS
// ============================================================================

export const cache_config = pgTable(
  "cache_config",
  {
    id: serial("id").primaryKey(),
    module: varchar("module", { length: 256 }).notNull().unique(),
    ttl_seconds: integer("ttl_seconds").default(900), // 15 minutes default
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    moduleIdx: uniqueIndex("cache_config_module_idx").on(table.module),
  })
);

export type CacheConfig = typeof cache_config.$inferSelect;
export type InsertCacheConfig = typeof cache_config.$inferInsert;

export const cache_artifacts = pgTable(
  "cache_artifacts",
  {
    id: serial("id").primaryKey(),
    key_hash: varchar("key_hash", { length: 64 }).notNull().unique(),
    path: text("path").notNull(),
    page_type: varchar("page_type", { length: 64 }).notNull(),
    identifier: varchar("identifier", { length: 256 }),
    params_hash: varchar("params_hash", { length: 64 }),
    generated_at: timestamp("generated_at").defaultNow().notNull(),
    ttl_seconds: integer("ttl_seconds").default(86400), // 24 hours default
  },
  (table) => ({
    keyHashIdx: uniqueIndex("cache_artifacts_key_hash_idx").on(table.key_hash),
    pageTypeIdx: index("cache_artifacts_page_type_idx").on(table.page_type),
  })
);

export type CacheArtifact = typeof cache_artifacts.$inferSelect;
export type InsertCacheArtifact = typeof cache_artifacts.$inferInsert;

export const daily_reports = pgTable(
  "daily_reports",
  {
    id: serial("id").primaryKey(),
    report_date: varchar("report_date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
    s3_pdf_url: text("s3_pdf_url"),
    s3_image_url: text("s3_image_url"),
    metrics_json: jsonb("metrics_json"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: uniqueIndex("daily_reports_report_date_idx").on(table.report_date),
  })
);

export type DailyReport = typeof daily_reports.$inferSelect;
export type InsertDailyReport = typeof daily_reports.$inferInsert;

// ============================================================================
// API & DEVELOPER
// ============================================================================

export const api_usage = pgTable(
  "api_usage",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    endpoint: varchar("endpoint", { length: 256 }).notNull(),
    units: integer("units").default(1),
    cost_usd: decimal("cost_usd", { precision: 10, scale: 2 }).default("0.01"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("api_usage_user_id_idx").on(table.user_id),
    createdIdx: index("api_usage_created_at_idx").on(table.created_at),
  })
);

export type ApiUsage = typeof api_usage.$inferSelect;
export type InsertApiUsage = typeof api_usage.$inferInsert;

