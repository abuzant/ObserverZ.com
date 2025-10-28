import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { z } from "zod";
import { eq, desc, and, gte, lte, ilike, inArray, sql } from "drizzle-orm";
import {
  users,
  tags,
  articles,
  article_tags,
  sources,
  source_metrics_30d,
  click_events,
  journals,
  journal_tags,
  walls,
  wall_items,
  stars,
  pins,
  boosts,
  comments,
  subscriptions,
  wallets,
  wallet_tx,
  filters,
  filter_rules,
  images,
  image_rollups,
  related_tags_cache,
  geo_rollups,
  daily_reports,
  user_ranks,
  messages,
  emails,
  payouts,
  api_usage,
  graphs,
  graph_nodes,
  graph_edges,
} from "../drizzle/schema";

// ============================================================================
// TAGS ROUTER
// ============================================================================

const tagsRouter = router({
  trending: publicProcedure
    .input(z.object({ window: z.enum(["24h", "72h", "7d"]).default("72h"), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select({
          id: tags.id,
          slug: tags.slug,
          display: tags.display,
          is_trending: tags.is_trending,
        })
        .from(tags)
        .where(eq(tags.is_trending, true))
        .limit(input.limit);

      return result;
    }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(tags).where(eq(tags.slug, input.slug)).limit(1);
    return result[0] || null;
  }),

  feed: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        sort: z.enum(["hot", "new"]).default("hot"),
        window: z.enum(["7d", "30d"]).default("7d"),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const tag = await db.select().from(tags).where(eq(tags.slug, input.slug)).limit(1);
      if (!tag.length) return [];

      const windowDays = input.window === "7d" ? 7 : 30;
      const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      // Get articles with this tag, ordered by hot score
      const result = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image_url: articles.image_url,
          author: articles.author,
          published_at: articles.published_at,
          created_at: articles.created_at,
        })
        .from(articles)
        .innerJoin(article_tags, eq(articles.id, article_tags.article_id))
        .where(
          and(eq(article_tags.tag_id, tag[0].id), gte(articles.created_at, cutoffDate), eq(articles.status, "active"))
        )
        .orderBy(desc(articles.created_at))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  related: publicProcedure.input(z.object({ q: z.string(), limit: z.number().default(25) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    // Check cache first
    const cached = await db
      .select()
      .from(related_tags_cache)
      .where(eq(related_tags_cache.q, input.q.toLowerCase()))
      .limit(1);

    if (cached.length && cached[0].result_json) {
      return cached[0].result_json as any;
    }

    // Simple algorithm: find tags that appear together with the query tag
    const queryTag = await db
      .select()
      .from(tags)
      .where(ilike(tags.slug, `%${input.q}%`))
      .limit(1);

    if (!queryTag.length) return [];

    // Find articles with the query tag
    const articlesWithTag = await db
      .selectDistinct({ article_id: article_tags.article_id })
      .from(article_tags)
      .where(eq(article_tags.tag_id, queryTag[0].id))
      .limit(100);

    if (!articlesWithTag.length) return [];

    // Find other tags in those articles
    const relatedTagIds = await db
      .selectDistinct({ tag_id: article_tags.tag_id })
      .from(article_tags)
      .where(
        and(
          inArray(
            article_tags.article_id,
            articlesWithTag.map((a) => a.article_id)
          ),
          sql`${article_tags.tag_id} != ${queryTag[0].id}`
        )
      )
      .limit(input.limit);

    const relatedTags = await db
      .select()
      .from(tags)
      .where(inArray(tags.id, relatedTagIds.map((r) => r.tag_id)));

    // Cache the result
    await db.insert(related_tags_cache).values({
      q: input.q.toLowerCase(),
      result_json: relatedTags,
      computed_at: new Date(),
    });

    return relatedTags;
  }),

  create: protectedProcedure
    .input(z.object({ slug: z.string(), display: z.string(), type: z.string().default("general") }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .insert(tags)
        .values({
          slug: input.slug.toLowerCase(),
          display: input.display,
          type: input.type,
        })
        .returning();

      return result[0];
    }),
});

// ============================================================================
// ARTICLES ROUTER
// ============================================================================

const articlesRouter = router({
  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
    return result[0] || null;
  }),

  search: publicProcedure
    .input(z.object({ q: z.string(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(articles)
        .where(
          and(ilike(articles.title, `%${input.q}%`), eq(articles.status, "active"), eq(articles.is_public, true))
        )
        .orderBy(desc(articles.created_at))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  ingest: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        title: z.string(),
        excerpt: z.string().optional(),
        author: z.string().optional(),
        image_url: z.string().optional(),
        tags: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get or create source from URL
      const urlObj = new URL(input.url);
      const domain = urlObj.hostname;

      let source = await db.select().from(sources).where(eq(sources.domain, domain)).limit(1);

      if (!source.length) {
        const inserted = await db
          .insert(sources)
          .values({
            url: input.url,
            name: domain,
            domain: domain,
            type: "news",
          })
          .returning();
        source = inserted;
      }

      // Create article
      const article = await db
        .insert(articles)
        .values({
          source_id: source[0].id,
          canonical_url: input.url,
          title: input.title,
          excerpt: input.excerpt,
          author: input.author,
          image_url: input.image_url,
          is_public: true,
          status: "active",
        })
        .returning();

      // Add tags
      if (input.tags && input.tags.length > 0) {
        await db.insert(article_tags).values(
          input.tags.map((tag_id) => ({
            article_id: article[0].id,
            tag_id,
            weight: 1,
          }))
        );
      }

      return article[0];
    }),

  geo: publicProcedure
    .input(z.object({ id: z.number(), window: z.enum(["7d", "24h"]).default("7d") }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(geo_rollups)
        .where(
          and(
            eq(geo_rollups.scope, "article"),
            eq(geo_rollups.ref_id, input.id),
            eq(geo_rollups.window, input.window)
          )
        );

      return result;
    }),
});

// ============================================================================
// SOURCES ROUTER
// ============================================================================

const sourcesRouter = router({
  rank: publicProcedure.input(z.object({ domain: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const source = await db.select().from(sources).where(eq(sources.domain, input.domain)).limit(1);

    if (!source.length) return null;

    const metrics = await db
      .select()
      .from(source_metrics_30d)
      .where(eq(source_metrics_30d.source_id, source[0].id))
      .limit(1);

    return {
      domain: source[0].domain,
      articles_30d: metrics[0]?.articles_30d || 0,
      clicks_30d: metrics[0]?.clicks_30d || 0,
      rank_30d: metrics[0]?.rank_30d || 0,
    };
  }),

  top: publicProcedure.input(z.object({ limit: z.number().default(100) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: sources.id,
        domain: sources.domain,
        name: sources.name,
        rank_30d: source_metrics_30d.rank_30d,
        articles_30d: source_metrics_30d.articles_30d,
        clicks_30d: source_metrics_30d.clicks_30d,
      })
      .from(sources)
      .leftJoin(source_metrics_30d, eq(sources.id, source_metrics_30d.source_id))
      .orderBy(desc(source_metrics_30d.rank_30d))
      .limit(input.limit);

    return result;
  }),
});

// ============================================================================
// STARS ROUTER
// ============================================================================

const starsRouter = router({
  create: protectedProcedure.input(z.object({ article_id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const result = await db
      .insert(stars)
      .values({
        user_id: ctx.user!.id,
        article_id: input.article_id,
        active: true,
      })
      .onConflictDoUpdate({
        target: [stars.user_id, stars.article_id],
        set: { active: true },
      })
      .returning();

    return result[0];
  }),

  delete: protectedProcedure.input(z.object({ article_id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const result = await db
      .update(stars)
      .set({ active: false })
      .where(and(eq(stars.user_id, ctx.user!.id), eq(stars.article_id, input.article_id)))
      .returning();

    return result[0];
  }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image_url: articles.image_url,
          created_at: articles.created_at,
        })
        .from(stars)
        .innerJoin(articles, eq(stars.article_id, articles.id))
        .where(and(eq(stars.user_id, ctx.user!.id), eq(stars.active, true)))
        .orderBy(desc(stars.created_at))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),
});

// ============================================================================
// JOURNALS ROUTER
// ============================================================================

const journalsRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string(), description: z.string().optional(), is_public: z.boolean().default(false) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .insert(journals)
        .values({
          user_id: ctx.user!.id,
          title: input.title,
          description: input.description,
          is_public: input.is_public,
        })
        .returning();

      return result[0];
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db.select().from(journals).where(eq(journals.user_id, ctx.user!.id));

    return result;
  }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const journal = await db.select().from(journals).where(eq(journals.id, input.id)).limit(1);

    if (!journal.length || !journal[0].is_public) return null;

    const journalTags = await db
      .select()
      .from(journal_tags)
      .innerJoin(tags, eq(journal_tags.tag_id, tags.id))
      .where(eq(journal_tags.journal_id, input.id));

    return {
      ...journal[0],
      tags: journalTags.map((jt) => jt.tags),
    };
  }),

  addTag: protectedProcedure
    .input(z.object({ journal_id: z.number(), tag_id: z.number(), priority: z.number().default(0) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const journal = await db.select().from(journals).where(eq(journals.id, input.journal_id)).limit(1);
      if (!journal.length || journal[0].user_id !== ctx.user!.id) throw new Error("Unauthorized");

      const result = await db
        .insert(journal_tags)
        .values({
          journal_id: input.journal_id,
          tag_id: input.tag_id,
          priority: input.priority,
        })
        .returning();

      return result[0];
    }),
});

// ============================================================================
// WALLET & BILLING ROUTER
// ============================================================================

const walletRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    let wallet = await db.select().from(wallets).where(eq(wallets.user_id, ctx.user!.id)).limit(1);

    if (!wallet.length) {
      const created = await db
        .insert(wallets)
        .values({
          user_id: ctx.user!.id,
          oct_balance: "0",
        })
        .returning();
      wallet = created;
    }

    return wallet[0];
  }),

  transactions: protectedProcedure
    .input(z.object({ window: z.enum(["7d", "30d"]).default("30d"), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const windowDays = input.window === "7d" ? 7 : 30;
      const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      const result = await db
        .select()
        .from(wallet_tx)
        .where(and(eq(wallet_tx.user_id, ctx.user!.id), gte(wallet_tx.created_at, cutoffDate)))
        .orderBy(desc(wallet_tx.created_at))
        .limit(input.limit);

      return result;
    }),

  buyOCT: protectedProcedure
    .input(z.object({ amount: z.string(), currency: z.enum(["USDT", "USD"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create transaction record
      const tx = await db
        .insert(wallet_tx)
        .values({
          user_id: ctx.user!.id,
          kind: "buy_oct",
          amount: input.amount,
          currency: input.currency,
          status: "pending",
        })
        .returning();

      return tx[0];
    }),
});

// ============================================================================
// FILTERS ROUTER
// ============================================================================

const filtersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db.select().from(filters).where(eq(filters.user_id, ctx.user!.id));

    return result;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string(), mode: z.enum(["block", "allow", "mixed"]).default("block") }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .insert(filters)
        .values({
          user_id: ctx.user!.id,
          name: input.name,
          mode: input.mode,
        })
        .returning();

      return result[0];
    }),

  addRule: protectedProcedure
    .input(
      z.object({
        filter_id: z.number(),
        type: z.enum(["source", "keyword", "author"]),
        value: z.string(),
        action: z.enum(["block", "allow", "notify"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify filter ownership
      const filter = await db.select().from(filters).where(eq(filters.id, input.filter_id)).limit(1);
      if (!filter.length || filter[0].user_id !== ctx.user!.id) throw new Error("Unauthorized");

      const result = await db
        .insert(filter_rules)
        .values({
          filter_id: input.filter_id,
          type: input.type,
          value: input.value,
          action: input.action,
        })
        .returning();

      return result[0];
    }),
});

// ============================================================================
// GALLERIES ROUTER
// ============================================================================

const galleriesRouter = router({
  byTag: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        window: z.enum(["7d", "30d"]).default("7d"),
        limit: z.number().default(25),
        page: z.number().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const tag = await db.select().from(tags).where(eq(tags.slug, input.slug)).limit(1);
      if (!tag.length) return [];

      const offset = (input.page - 1) * input.limit;
      const windowDays = input.window === "7d" ? 7 : 30;

      const result = await db
        .select()
        .from(image_rollups)
        .where(
          and(
            eq(image_rollups.scope, "tag"),
            eq(image_rollups.ref_id, tag[0].id),
            eq(image_rollups.window, input.window)
          )
        )
        .orderBy(desc(image_rollups.score))
        .limit(input.limit)
        .offset(offset);

      return result;
    }),

  search: publicProcedure
    .input(z.object({ q: z.string(), window: z.enum(["7d", "30d"]).default("7d"), limit: z.number().default(25), page: z.number().default(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const offset = (input.page - 1) * input.limit;

      const result = await db
        .select()
        .from(images)
        .where(ilike(images.url, `%${input.q}%`))
        .orderBy(desc(images.created_at))
        .limit(input.limit)
        .offset(offset);

      return result;
    }),
});

// ============================================================================
// REPORTS ROUTER
// ============================================================================

const reportsRouter = router({
  latest: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(daily_reports).orderBy(desc(daily_reports.report_date)).limit(1);

    return result[0] || null;
  }),

  byDate: publicProcedure.input(z.object({ date: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(daily_reports).where(eq(daily_reports.report_date, input.date)).limit(1);

    return result[0] || null;
  }),

  list: publicProcedure
    .input(z.object({ limit: z.number().default(30), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(daily_reports)
        .orderBy(desc(daily_reports.report_date))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),
});

// ============================================================================
// SYSTEM ROUTER
// ============================================================================

const systemRouter2 = router({
  geo: publicProcedure.input(z.object({ window: z.enum(["24h"]).default("24h") })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(geo_rollups)
      .where(and(eq(geo_rollups.scope, "system"), eq(geo_rollups.window, input.window)));

    return result;
  }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tags: tagsRouter,
  articles: articlesRouter,
  sources: sourcesRouter,
  stars: starsRouter,
  journals: journalsRouter,
  wallet: walletRouter,
  filters: filtersRouter,
  galleries: galleriesRouter,
  reports: reportsRouter,
  systemGeo: systemRouter2,
});

export type AppRouter = typeof appRouter;

