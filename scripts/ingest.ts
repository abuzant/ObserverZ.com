#!/usr/bin/env node

/**
 * ObserverZ Content Ingestion Script
 * 
 * This script fetches content from URLs, extracts metadata, and stores it in the database.
 * Usage: npx ts-node scripts/ingest.ts <url> [tags...]
 */

import { getDb } from "../server/db";
import { articles, sources, article_tags, tags, images } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

interface FetchedContent {
  title: string;
  excerpt: string;
  author?: string;
  image_url?: string;
  published_at?: Date;
  lang: string;
}

/**
 * Fetch and parse HTML content from a URL
 */
async function fetchContent(url: string): Promise<FetchedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('meta[property="og:title"]').attr("content") || $("title").text() || "Untitled";
    const excerpt =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $("p").first().text().substring(0, 200) ||
      "";

    const image_url = $('meta[property="og:image"]').attr("content") || undefined;
    const author = $('meta[name="author"]').attr("content") || undefined;
    const published_at = $('meta[property="article:published_time"]').attr("content")
      ? new Date($('meta[property="article:published_time"]').attr("content")!)
      : undefined;

    // Detect language (simple heuristic)
    const lang = $('html').attr("lang") || "en";

    return {
      title: title.trim(),
      excerpt: excerpt.trim(),
      author,
      image_url,
      published_at,
      lang: lang.substring(0, 2),
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Extract keywords from text using simple NLP
 */
function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction: split by spaces, filter stop words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
  ]);

  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Count word frequencies
  const freq: Record<string, number> = {};
  words.forEach((word) => {
    freq[word] = (freq[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Ingest a single URL
 */
async function ingestUrl(url: string, tagSlugs: string[] = []): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  console.log(`Ingesting: ${url}`);

  try {
    // Fetch content
    const content = await fetchContent(url);
    console.log(`✓ Fetched: ${content.title}`);

    // Get or create source
    const urlObj = new URL(url);
    const domain = urlObj.hostname || "unknown";

    let source = await db.select().from(sources).where(eq(sources.domain, domain)).limit(1);

    if (!source.length) {
      const inserted = await db
        .insert(sources)
        .values({
          url: url,
          name: domain,
          domain: domain,
          type: "news",
          allowed: true,
        })
        .returning();
      source = inserted;
      console.log(`✓ Created source: ${domain}`);
    }

    // Create article
    const article = await db
      .insert(articles)
      .values({
        source_id: source[0].id,
        canonical_url: url,
        title: content.title,
        excerpt: content.excerpt,
        author: content.author,
        image_url: content.image_url,
        lang: content.lang,
        published_at: content.published_at,
        is_public: true,
        status: "active",
      })
      .returning();

    console.log(`✓ Created article: ${article[0].id}`);

    // Extract keywords from title and excerpt
    const keywords = extractKeywords(`${content.title} ${content.excerpt}`);
    console.log(`✓ Extracted keywords: ${keywords.join(", ")}`);

    // Get or create tags and link them
    for (const keyword of keywords) {
      const slug = keyword.toLowerCase().replace(/\s+/g, "-");

      let tag = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);

      if (!tag.length) {
        const inserted = await db
          .insert(tags)
          .values({
            slug: slug,
            display: keyword,
            type: "keyword",
            is_trending: false,
          })
          .returning();
        tag = inserted;
      }

      // Link tag to article
      await db
        .insert(article_tags)
        .values({
          article_id: article[0].id,
          tag_id: tag[0].id,
          weight: 1,
        })
        .catch(() => {
          // Ignore duplicate key errors
        });
    }

    // Link provided tags
    for (const tagSlug of tagSlugs) {
      const tag = await db.select().from(tags).where(eq(tags.slug, tagSlug.toLowerCase())).limit(1);

      if (tag.length) {
        await db
          .insert(article_tags)
          .values({
            article_id: article[0].id,
            tag_id: tag[0].id,
            weight: 2, // Higher weight for manually specified tags
          })
          .catch(() => {
            // Ignore duplicate key errors
          });
      }
    }

    console.log(`✓ Successfully ingested: ${url}\n`);
  } catch (error) {
    console.error(`✗ Failed to ingest ${url}:`, error);
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx ts-node scripts/ingest.ts <url> [tags...]");
    console.log("Example: npx ts-node scripts/ingest.ts https://example.com/article crypto bitcoin");
    process.exit(1);
  }

  const url = args[0];
  const tags = args.slice(1);

  try {
    await ingestUrl(url, tags);
    console.log("✓ Ingestion complete");
    process.exit(0);
  } catch (error) {
    console.error("✗ Ingestion failed:", error);
    process.exit(1);
  }
}

main();

