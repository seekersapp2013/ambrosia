import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Create a new article
export const createArticle = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    contentHtml: v.string(),
    contentDelta: v.optional(v.any()),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    isSensitive: v.boolean(),
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    sellerAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate required fields
    if (!args.title.trim()) {
      throw new Error("Article title is required");
    }
    
    if (!args.contentHtml || !args.contentHtml.trim()) {
      throw new Error("Article content is required");
    }

    // Validate contentHtml format
    if (typeof args.contentHtml !== 'string') {
      throw new Error("Article content must be a string");
    }

    // Log article creation for debugging
    console.log("Creating article:", {
      userId,
      title: args.title,
      contentHtmlLength: args.contentHtml.length,
      hasValidHTML: args.contentHtml.includes('<p>') || args.contentHtml.includes('<br>'),
      contentPreview: args.contentHtml.substring(0, 100) + '...'
    });

    // Generate slug from title
    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = args.contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    const articleId = await ctx.db.insert("articles", {
      authorId: userId,
      title: args.title,
      subtitle: args.subtitle,
      slug,
      contentHtml: args.contentHtml,
      contentDelta: args.contentDelta,
      coverImage: args.coverImage,
      readTimeMin,
      tags: args.tags,
      status: "PUBLISHED",
      publishedAt: Date.now(),
      isSensitive: args.isSensitive,
      isGated: args.isGated,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      sellerAddress: args.sellerAddress,
      views: 0,
      createdAt: Date.now(),
    });

    console.log("Article created successfully:", articleId);

    // Notify followers about new content
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();

    // Create notifications for all followers
    for (const follow of followers) {
      await ctx.runMutation(internal.notifications.createNotificationEvent, {
        type: 'NEW_CONTENT',
        recipientUserId: follow.followerId,
        actorUserId: userId,
        relatedContentType: 'article',
        relatedContentId: articleId,
      });
    }

    return articleId;
  },
});

// Publish an article
export const publishArticle = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    if (article.authorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.articleId, {
      status: "PUBLISHED",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.articleId;
  },
});

// Increment article view count
export const incrementViews = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");

    await ctx.db.patch(args.articleId, {
      views: article.views + 1,
      updatedAt: Date.now(),
    });

    return args.articleId;
  },
});

// Get article by ID
export const getArticleById = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) {
      console.log("Article not found:", args.articleId);
      return null;
    }

    // Validate article data
    if (!article.contentHtml) {
      console.warn("Article missing contentHtml:", args.articleId);
    }

    // Get author info
    const author = await ctx.db.get(article.authorId);
    const profile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), article.authorId))
      .first();

    const result = {
      ...article,
      author: {
        id: author?._id,
        name: author?.name || profile?.name,
        username: profile?.username,
        avatar: profile?.avatar,
      },
    };

    console.log("Retrieved article:", {
      id: result._id,
      title: result.title,
      hasContentHtml: !!result.contentHtml,
      contentLength: result.contentHtml?.length || 0,
      status: result.status
    });

    return result;
  },
});

// Get article by slug
export const getArticleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!article) {
      console.log("Article not found by slug:", args.slug);
      return null;
    }

    // Validate article data
    if (!article.contentHtml) {
      console.warn("Article missing contentHtml (by slug):", args.slug, article._id);
    }

    // Get author info
    const author = await ctx.db.get(article.authorId);
    const profile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), article.authorId))
      .first();

    const result = {
      ...article,
      author: {
        id: author?._id,
        name: author?.name || profile?.name,
        username: profile?.username,
        avatar: profile?.avatar,
      },
    };

    console.log("Retrieved article by slug:", {
      slug: args.slug,
      id: result._id,
      title: result.title,
      hasContentHtml: !!result.contentHtml,
      contentLength: result.contentHtml?.length || 0,
      status: result.status
    });

    return result;
  },
});

// List articles for feed
export const listFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .order("desc")
      .take(limit);

    // Get author info for each article
    const articlesWithAuthors = await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), article.authorId))
          .first();

        return {
          ...article,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return articlesWithAuthors;
  },
});

// Get articles by author
export const getArticlesByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .order("desc")
      .collect();

    return articles;
  },
});

// Set gating for an article
export const setGating = mutation({
  args: {
    articleId: v.id("articles"),
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    sellerAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    if (article.authorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.articleId, {
      isGated: args.isGated,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      sellerAddress: args.sellerAddress,
      updatedAt: Date.now(),
    });

    return args.articleId;
  },
});

// Search articles
export const searchArticles = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "PUBLISHED"),
          q.or(
            q.eq(q.field("title"), args.query),
            q.eq(q.field("title"), args.query)
          )
        )
      )
      .take(20);

    // Get author info for each article
    const articlesWithAuthors = await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), article.authorId))
          .first();

        return {
          ...article,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return articlesWithAuthors;
  },
});

// Migration function to add seller addresses to existing gated articles
export const addSellerAddressesToGatedArticles = mutation({
  handler: async (ctx) => {
    console.log('Starting migration to add seller addresses to gated articles...');

    // Get all gated articles without seller addresses
    const gatedArticles = await ctx.db
      .query("articles")
      .filter((q) => q.eq(q.field("isGated"), true))
      .collect();

    console.log(`Found ${gatedArticles.length} gated articles`);

    let updated = 0;
    let skipped = 0;

    for (const article of gatedArticles) {
      // Skip if already has seller address
      if (article.sellerAddress) {
        skipped++;
        continue;
      }

      // Get author's profile to find wallet address
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", article.authorId))
        .first();

      if (profile?.walletAddress) {
        try {
          await ctx.db.patch(article._id, {
            sellerAddress: profile.walletAddress,
          });
          updated++;
          console.log(`Updated article ${article._id} with seller address`);
        } catch (error) {
          console.error(`Error updating article ${article._id}:`, error);
        }
      } else {
        console.log(`No wallet address found for author of article ${article._id}`);
        skipped++;
      }
    }

    console.log(`Migration complete: ${updated} articles updated, ${skipped} skipped`);
    return { updated, skipped, total: gatedArticles.length };
  },
});