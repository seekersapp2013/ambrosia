import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Like/Unlike Article
export const likeArticle = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_article", (q) => 
        q.eq("userId", userId).eq("articleId", args.articleId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId,
        articleId: args.articleId,
        createdAt: Date.now(),
      });
      return { liked: true };
    }
  },
});

// Like/Unlike Reel
export const likeReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_reel", (q) => 
        q.eq("userId", userId).eq("reelId", args.reelId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId,
        reelId: args.reelId,
        createdAt: Date.now(),
      });
      return { liked: true };
    }
  },
});

// Bookmark/Unbookmark Article
export const bookmarkArticle = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already bookmarked
    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("articleId"), args.articleId))
      .first();

    if (existingBookmark) {
      // Remove bookmark
      await ctx.db.delete(existingBookmark._id);
      return { bookmarked: false };
    } else {
      // Add bookmark
      await ctx.db.insert("bookmarks", {
        userId,
        articleId: args.articleId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Bookmark/Unbookmark Reel
export const bookmarkReel = mutation({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already bookmarked
    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("reelId"), args.reelId))
      .first();

    if (existingBookmark) {
      // Remove bookmark
      await ctx.db.delete(existingBookmark._id);
      return { bookmarked: false };
    } else {
      // Add bookmark
      await ctx.db.insert("bookmarks", {
        userId,
        reelId: args.reelId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Comment on Article
export const commentArticle = mutation({
  args: {
    articleId: v.id("articles"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const commentId = await ctx.db.insert("comments", {
      articleId: args.articleId,
      authorId: userId,
      parentId: args.parentId,
      content: args.content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Comment on Reel
export const commentReel = mutation({
  args: {
    reelId: v.id("reels"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const commentId = await ctx.db.insert("comments", {
      reelId: args.reelId,
      authorId: userId,
      parentId: args.parentId,
      content: args.content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Get comments for article
export const getArticleComments = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_article", (q) => q.eq("articleId", args.articleId))
      .order("desc")
      .collect();

    // Get author info for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), comment.authorId))
          .first();

        return {
          ...comment,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return commentsWithAuthors;
  },
});

// Get comments for reel
export const getReelComments = query({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_reel", (q) => q.eq("reelId", args.reelId))
      .order("desc")
      .collect();

    // Get author info for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), comment.authorId))
          .first();

        return {
          ...comment,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return commentsWithAuthors;
  },
});

// Get user's bookmarks
export const getUserBookmarks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Get content details for each bookmark
    const bookmarksWithContent = await Promise.all(
      bookmarks.map(async (bookmark) => {
        if (bookmark.articleId) {
          const article = await ctx.db.get(bookmark.articleId);
          if (!article) return null;
          
          const author = await ctx.db.get(article.authorId);
          const profile = await ctx.db
            .query("profiles")
            .filter((q) => q.eq(q.field("userId"), article.authorId))
            .first();

          return {
            ...bookmark,
            type: 'article' as const,
            content: {
              ...article,
              author: {
                id: author?._id,
                name: author?.name || profile?.name,
                username: profile?.username,
                avatar: profile?.avatar,
              },
            },
          };
        } else if (bookmark.reelId) {
          const reel = await ctx.db.get(bookmark.reelId);
          if (!reel) return null;
          
          const author = await ctx.db.get(reel.authorId);
          const profile = await ctx.db
            .query("profiles")
            .filter((q) => q.eq(q.field("userId"), reel.authorId))
            .first();

          return {
            ...bookmark,
            type: 'reel' as const,
            content: {
              ...reel,
              author: {
                id: author?._id,
                name: author?.name || profile?.name,
                username: profile?.username,
                avatar: profile?.avatar,
              },
            },
          };
        }
        return null;
      })
    );

    return bookmarksWithContent.filter(b => b !== null);
  },
});

// Check if user has bookmarked content
export const isBookmarked = query({
  args: {
    contentType: v.string(), // 'article' | 'reel'
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    if (args.contentType === 'article') {
      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("articleId"), args.contentId as any))
        .first();
      return !!bookmark;
    } else if (args.contentType === 'reel') {
      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("reelId"), args.contentId as any))
        .first();
      return !!bookmark;
    }
    return false;
  },
});

// Check if user has liked content
export const isLiked = query({
  args: {
    contentType: v.string(), // 'article' | 'reel'
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    if (args.contentType === 'article') {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_user_article", (q) => 
          q.eq("userId", userId).eq("articleId", args.contentId as any)
        )
        .first();
      return !!like;
    } else if (args.contentType === 'reel') {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_user_reel", (q) => 
          q.eq("userId", userId).eq("reelId", args.contentId as any)
        )
        .first();
      return !!like;
    }
    return false;
  },
});

// Add claps to an article (0..100 per user)
export const clapArticle = mutation({
  args: { articleId: v.id("articles"), delta: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Optional: require access for gated articles
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new Error("Article not found");
    if (article.isGated) {
      // Use payments.hasAccess to verify
      const hasAccess = await ctx.runQuery(api.payments.hasAccess, { contentType: "article", contentId: args.articleId });
      if (!hasAccess) throw new Error("Access required to clap");
    }

    // Require that the user has read the article at least once
    const read = await ctx.db
      .query("reads")
      .withIndex("by_user_article", (q) => q.eq("userId", userId).eq("articleId", args.articleId))
      .first();
    if (!read) throw new Error("Read the article before clapping");

    const existing = await ctx.db
      .query("claps")
      .withIndex("by_user_article", (q) => q.eq("userId", userId).eq("articleId", args.articleId))
      .first();

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    if (existing) {
      const newCount = clamp((existing.count || 0) + args.delta, 0, 100);
      await ctx.db.patch(existing._id, { count: newCount, updatedAt: Date.now() });
      return { count: newCount };
    } else {
      const newCount = clamp(args.delta, 0, 100);
      const id = await ctx.db.insert("claps", {
        userId,
        articleId: args.articleId,
        count: newCount,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const row = await ctx.db.get(id);
      return { count: row?.count ?? newCount };
    }
  },
});

// Get current user's clap count for an article
export const myClapsForArticle = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const existing = await ctx.db
      .query("claps")
      .withIndex("by_user_article", (q) => q.eq("userId", userId).eq("articleId", args.articleId))
      .first();
    return existing?.count ?? 0;
  },
});

// Get total clap count for an article (sum of per-user counts)
export const totalClapsForArticle = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("claps")
      .withIndex("by_article", (q) => q.eq("articleId", args.articleId))
      .collect();
    return rows.reduce((sum, r) => sum + (r.count || 0), 0);
  },
});

// Record that a user has read an article
export const recordArticleRead = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const existing = await ctx.db
      .query("reads")
      .withIndex("by_user_article", (q) => q.eq("userId", userId).eq("articleId", args.articleId))
      .first();
    if (existing) return existing._id;
    const id = await ctx.db.insert("reads", { userId, articleId: args.articleId, createdAt: Date.now() });
    return id;
  },
});

// Check if current user has read an article
export const hasReadArticle = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("reads")
      .withIndex("by_user_article", (q) => q.eq("userId", userId).eq("articleId", args.articleId))
      .first();
    return !!existing;
  },
});

// Get like count for reels (simple count of likes)
export const getReelLikeCount = query({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .filter((q) => q.eq(q.field("reelId"), args.reelId))
      .collect();
    return likes.length;
  },
});

