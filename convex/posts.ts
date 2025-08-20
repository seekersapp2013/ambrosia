// convex/posts.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel"; // ✅ use Convex-generated types

// Helper to get current user's id
async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject as string;
}

/** Create post */
export const createPost = mutation({
  args: { title: v.string(), content: v.string(), image: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    await ctx.db.insert("posts", {
      userId,
      title: args.title,
      content: args.content,
      image: args.image,
      createdAt: Date.now(),
    });
  },
});

/** Update post */
export const updatePost = mutation({
  args: { postId: v.id("posts"), title: v.string(), content: v.string(), image: v.optional(v.string()) },
  handler: async (ctx, { postId, title, content, image }) => {
    const userId = await getUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post || post.userId !== userId) throw new Error("Unauthorized or post not found");
    const patch: { title: string; content: string; image?: string } = { title, content };
    if (image !== undefined) patch.image = image;
    await ctx.db.patch(postId, patch);
  },
});

/** Delete post (+ cascade likes) */
export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const userId = await getUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post || post.userId !== userId) throw new Error("Unauthorized or post not found");
    await ctx.db.delete(postId);

    const likes: Doc<"likes">[] = await ctx.db
      .query("likes")
      .withIndex("by_postId", (q: any) => q.eq("postId", postId)) // 👈 annotate q
      .collect();
    await Promise.all(likes.map((l) => ctx.db.delete(l._id)));
  },
});

/** Toggle like: if liked -> unlike; otherwise like */
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const userId = await getUserId(ctx);

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", postId)) // 👈 annotate q
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("likes", { userId, postId, createdAt: Date.now() });
      return { liked: true };
    }
  },
});

/** Helper to enrich posts with likeCount + likedByMe + username */
async function enrichPosts(ctx: any, posts: Doc<"posts">[], viewerUserId?: string) {
  // Build like info per post
  const likeInfoByPost = new Map<Id<"posts">, { count: number; likedByMe: boolean }>();
  for (const p of posts) {
    const postLikes: Doc<"likes">[] = await ctx.db
      .query("likes")
      .withIndex("by_postId", (q: any) => q.eq("postId", p._id)) // 👈 annotate q
      .collect();

    const likedByMe = !!viewerUserId && postLikes.some((l: Doc<"likes">) => l.userId === viewerUserId); // 👈 type l
    likeInfoByPost.set(p._id, { count: postLikes.length, likedByMe });
  }

  // Join username via profiles.by_userId
  const enriched = await Promise.all(
    posts.map(async (p) => {
      let username: string | null = null;
      try {
        const prof: Doc<"profiles"> | null = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", p.userId)) // 👈 annotate q
          .unique();
        username = prof?.username ?? null;
      } catch {
        username = null;
      }
      const likeInfo = likeInfoByPost.get(p._id) ?? { count: 0, likedByMe: false };
      return { ...p, username, likeCount: likeInfo.count, likedByMe: likeInfo.likedByMe };
    })
  );

  enriched.sort((a, b) => b._creationTime - a._creationTime);
  return enriched;
}

/** My posts with likes info */
export const getMyPosts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const mine: Doc<"posts">[] = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId)) // 👈 annotate q
      .collect();
    return await enrichPosts(ctx, mine, userId);
  },
});

/** All posts with likes info */
export const getAllPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const viewerId = (await ctx.auth.getUserIdentity())?.subject ?? undefined;
    const n = Math.min(Math.max(limit ?? 100, 1), 200);
    const posts: Doc<"posts">[] = await ctx.db.query("posts").order("desc").take(n);
    return await enrichPosts(ctx, posts, viewerId);
  },
});
