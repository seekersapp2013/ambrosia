import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new reel
export const createReel = mutation({
  args: {
    video: v.string(), // storage id
    poster: v.optional(v.string()), // storage id
    durationS: v.optional(v.number()),
    caption: v.optional(v.string()),
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

    const reelId = await ctx.db.insert("reels", {
      authorId: userId,
      video: args.video,
      poster: args.poster,
      durationS: args.durationS,
      caption: args.caption,
      tags: args.tags,
      isSensitive: args.isSensitive,
      isGated: args.isGated,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      sellerAddress: args.sellerAddress,
      views: 0,
      createdAt: Date.now(),
    });

    return reelId;
  },
});

// Get reel by ID
export const getReel = query({
  args: { reelId: v.id("reels") },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) return null;

    // Get author info
    const author = await ctx.db.get(reel.authorId);
    const profile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), reel.authorId))
      .first();

    return {
      ...reel,
      author: {
        id: author?._id,
        name: author?.name || profile?.name,
        username: profile?.username,
        avatar: profile?.avatar,
      },
    };
  },
});

// List reels for feed
export const listReels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const reels = await ctx.db
      .query("reels")
      .order("desc")
      .take(limit);

    // Get author info for each reel
    const reelsWithAuthors = await Promise.all(
      reels.map(async (reel) => {
        const author = await ctx.db.get(reel.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), reel.authorId))
          .first();

        return {
          ...reel,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return reelsWithAuthors;
  },
});

// Get reels by author
export const getReelsByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const reels = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .collect();

    return reels;
  },
});

// Set gating for a reel
export const setGating = mutation({
  args: {
    reelId: v.id("reels"),
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    sellerAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("Reel not found");
    if (reel.authorId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.reelId, {
      isGated: args.isGated,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      sellerAddress: args.sellerAddress,
    });

    return args.reelId;
  },
});

// Search reels
export const searchReels = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const reels = await ctx.db
      .query("reels")
      .filter((q) => 
        q.eq(q.field("caption"), args.query)
      )
      .take(20);

    // Get author info for each reel
    const reelsWithAuthors = await Promise.all(
      reels.map(async (reel) => {
        const author = await ctx.db.get(reel.authorId);
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("userId"), reel.authorId))
          .first();

        return {
          ...reel,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return reelsWithAuthors;
  },
});

// Migration function to add seller addresses to existing gated reels
export const addSellerAddressesToGatedReels = mutation({
  handler: async (ctx) => {
    console.log('Starting migration to add seller addresses to gated reels...');

    // Get all gated reels without seller addresses
    const gatedReels = await ctx.db
      .query("reels")
      .filter((q) => q.eq(q.field("isGated"), true))
      .collect();

    console.log(`Found ${gatedReels.length} gated reels`);

    let updated = 0;
    let skipped = 0;

    for (const reel of gatedReels) {
      // Skip if already has seller address
      if (reel.sellerAddress) {
        skipped++;
        continue;
      }

      // Get author's profile to find wallet address
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", reel.authorId))
        .first();

      if (profile?.walletAddress) {
        try {
          await ctx.db.patch(reel._id, {
            sellerAddress: profile.walletAddress,
          });
          updated++;
          console.log(`Updated reel ${reel._id} with seller address`);
        } catch (error) {
          console.error(`Error updating reel ${reel._id}:`, error);
        }
      } else {
        console.log(`No wallet address found for author of reel ${reel._id}`);
        skipped++;
      }
    }

    console.log(`Migration complete: ${updated} reels updated, ${skipped} skipped`);
    return { updated, skipped, total: gatedReels.length };
  },
});