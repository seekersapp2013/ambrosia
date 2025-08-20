// convex/comments.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject as string;
}

/** Create a comment on a post */
export const createComment = mutation({
  args: { postId: v.id("posts"), content: v.string() },
  handler: async (ctx, { postId, content }) => {
    const userId = await getUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");
    if (!content.trim()) throw new Error("Empty comment");
    await ctx.db.insert("comments", {
      postId,
      userId,
      content: content.trim(),
      createdAt: Date.now(),
    });
  },
});

/** Toggle like on a comment (1 per user) */
export const toggleCommentLike = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_comment", (q: any) =>
        q.eq("userId", userId).eq("commentId", commentId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      const c = await ctx.db.get(commentId);
      if (!c) throw new Error("Comment not found");
      await ctx.db.insert("commentLikes", { userId, commentId, createdAt: Date.now() });
      return { liked: true };
    }
  },
});

/** List comments for a post, newest first, with likeCount/likedByMe and usernames */
export const listForPost = query({
  args: { postId: v.id("posts"), limit: v.optional(v.number()) },
  handler: async (ctx, { postId, limit }) => {
    const viewerId = (await ctx.auth.getUserIdentity())?.subject ?? undefined;
    const n = Math.min(Math.max(limit ?? 50, 1), 200);

    const comments: Doc<"comments">[] = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q: any) => q.eq("postId", postId))
      .order("desc")
      .take(n);

    const enriched = await Promise.all(
      comments.map(async (c) => {
        const likes = await ctx.db
          .query("commentLikes")
          .withIndex("by_commentId", (q: any) => q.eq("commentId", c._id))
          .collect();

        const likeCount = likes.length;
        const likedByMe = !!viewerId && likes.some((l: Doc<"commentLikes">) => l.userId === viewerId);

        let username: string | null = null;
        try {
          const prof = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q: any) => q.eq("userId", c.userId))
            .unique();
          username = prof?.username ?? null;
        } catch {
          username = null;
        }

        return { ...c, username, likeCount, likedByMe };
      })
    );

    return enriched;
  },
});
