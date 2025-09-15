import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Create a new live stream
export const createLiveStream = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    isSensitive: v.boolean(),
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile for seller address
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Generate unique room name
    const roomName = `stream_${userId}_${Date.now()}`;

    const streamId = await ctx.db.insert("liveStreams", {
      authorId: userId,
      title: args.title,
      description: args.description,
      roomName,
      status: "preparing",
      viewerCount: 0,
      maxViewers: 0,
      tags: args.tags,
      isSensitive: args.isSensitive,
      isGated: args.isGated,
      priceToken: args.priceToken,
      priceAmount: args.priceAmount,
      sellerAddress: args.isGated ? profile?.walletAddress : undefined,
      createdAt: Date.now(),
    });

    return { streamId, roomName };
  },
});

export const insertParticipant = internalMutation({
    args: {
        streamId: v.id("liveStreams"),
        userId: v.id("users"),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("liveStreamParticipants", {
            streamId: args.streamId,
            userId: args.userId,
            role: args.role as "broadcaster" | "viewer",
            joinedAt: Date.now(),
        });
    },
});



// Join live stream as viewer
export const joinLiveStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stream = await ctx.db.get(args.streamId);
    if (!stream) throw new Error("Stream not found");
    if (stream.status !== "live") throw new Error("Stream is not live");

    // Check access for gated streams
    if (stream.isGated) {
      const hasAccess = await ctx.runQuery(internal.payments.hasAccessInternal, {
        userId,
        contentType: "liveStream",
        contentId: args.streamId,
      });
      if (!hasAccess) throw new Error("Access denied - payment required");
    }

    // Update viewer count
    await ctx.db.patch(args.streamId, {
      viewerCount: stream.viewerCount + 1,
      maxViewers: Math.max(stream.maxViewers, stream.viewerCount + 1),
    });

    return args.streamId;
  },
});

// Leave live stream
export const leaveLiveStream = mutation({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stream = await ctx.db.get(args.streamId);
    if (!stream) throw new Error("Stream not found");

    // Update viewer count
    if (stream.viewerCount > 0) {
      await ctx.db.patch(args.streamId, {
        viewerCount: stream.viewerCount - 1,
      });
    }

    // Update participant record
    const participant = await ctx.db
      .query("liveStreamParticipants")
      .withIndex("by_stream_user", (q) => 
        q.eq("streamId", args.streamId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("leftAt"), undefined))
      .first();

    if (participant) {
      const leftAt = Date.now();
      await ctx.db.patch(participant._id, {
        leftAt,
        duration: leftAt - participant.joinedAt,
      });
    }

    return args.streamId;
  },
});

// Get live stream by ID
export const getLiveStream = query({
  args: { streamId: v.id("liveStreams") },
  handler: async (ctx, args) => {
    const stream = await ctx.db.get(args.streamId);
    if (!stream) return null;

    // Get author info
    const author = await ctx.db.get(stream.authorId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", stream.authorId))
      .first();

    return {
      ...stream,
      author: {
        id: author?._id,
        name: author?.name || profile?.name,
        username: profile?.username,
        avatar: profile?.avatar,
      },
    };
  },
});

export const getLiveStreamInternal = internalQuery({
    args: { streamId: v.id("liveStreams") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.streamId);
    },
});

// List active live streams
export const listActiveLiveStreams = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .order("desc")
      .take(limit);

    // Get author info for each stream
    const streamsWithAuthors = await Promise.all(
      streams.map(async (stream) => {
        const author = await ctx.db.get(stream.authorId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", stream.authorId))
          .first();

        return {
          ...stream,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return streamsWithAuthors;
  },
});

export const getAllLiveStreams = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const streams = await ctx.db
      .query("liveStreams")
      .order("desc")
      .take(limit);

    // Get author info for each stream
    const streamsWithAuthors = await Promise.all(
      streams.map(async (stream) => {
        const author = await ctx.db.get(stream.authorId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", stream.authorId))
          .first();

        return {
          ...stream,
          author: {
            id: author?._id,
            name: author?.name || profile?.name,
            username: profile?.username,
            avatar: profile?.avatar,
          },
        };
      })
    );

    return streamsWithAuthors;
  },
});

export const getStreamPerformanceMetrics = query({
  handler: async (ctx) => {
    const allStreams = await ctx.db.query("liveStreams").collect();
    const allParticipants = await ctx.db.query("liveStreamParticipants").collect();

    const totalStreams = allStreams.length;
    const liveStreams = allStreams.filter(s => s.status === "live").length;
    const endedStreams = allStreams.filter(s => s.status === "ended").length;

    let totalDuration = 0;
    let peakConcurrentViewers = 0;
    const uniqueBroadcasters = new Set<string>();

    allStreams.forEach(stream => {
      if (stream.status === "ended" && stream.startedAt && stream.endedAt) {
        totalDuration += (stream.endedAt - stream.startedAt);
      }
      if (stream.maxViewers) {
        peakConcurrentViewers = Math.max(peakConcurrentViewers, stream.maxViewers);
      }
      uniqueBroadcasters.add(stream.authorId);
    });

    const averageStreamDuration = totalStreams > 0 ? totalDuration / totalStreams : 0;

    return {
      totalStreams,
      liveStreams,
      endedStreams,
      averageStreamDuration: averageStreamDuration / (1000 * 60), // in minutes
      peakConcurrentViewers,
      uniqueBroadcasters: uniqueBroadcasters.size,
    };
  },
});

// Get live streams by author
export const getLiveStreamsByAuthor = query({
  args: { authorId: v.id("users") },
  handler: async (ctx, args) => {
    const streams = await ctx.db
      .query("liveStreams")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .collect();

    return streams;
  },
});