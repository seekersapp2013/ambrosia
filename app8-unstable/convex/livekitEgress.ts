"use node";

import { v } from "convex/values";
import { internalMutation, action } from "./_generated/server";


import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { EgressClient } from "livekit-server-sdk";
import { Id } from "./_generated/dataModel";

// Start live stream (broadcaster only)
export const startLiveStream = action({
  args: { 
    streamId: v.id("liveStreams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Call the internal query to get the stream
    const stream = await ctx.runQuery(internal.streams.getLiveStream, {
      streamId: args.streamId,
    });
    if (!stream) throw new Error("Stream not found");
    if (stream.authorId !== userId) throw new Error("Not authorized");

    const egressClient = new EgressClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
  }
});