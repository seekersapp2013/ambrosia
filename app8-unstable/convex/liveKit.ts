"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";
import { Doc, Id } from "./_generated/dataModel";

// Generate LiveKit access token
export const generateLiveKitToken = action({
  args: {
    streamId: v.id("liveStreams"),
    role: v.string(), // 'broadcaster' | 'viewer'
  },
  handler: async (ctx, args): Promise<{ token: string; roomName: string }> => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const userId = user.subject as Id<"users">;

    const stream: Doc<"liveStreams"> | null = await ctx.runQuery(internal.liveStreams.getLiveStreamInternal, { streamId: args.streamId });
    if (!stream) {
      throw new Error("Stream not found");
    }

    // Check access for gated streams
    if (stream.isGated && args.role === "viewer") {
      const hasAccess = await ctx.runQuery(internal.payments.hasAccessInternal, {
        userId,
        contentType: "liveStream",
        contentId: args.streamId,
      });
      if (!hasAccess) {
        throw new Error("Access denied - payment required");
      }
    }

    // Get user profile for display name
    const profile: Doc<"profiles"> | null = await ctx.runQuery(internal.profiles.getProfileForUser, { userId });

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("LiveKit credentials not configured");
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: profile?.name || profile?.username || "Anonymous",
    });

    at.addGrant({
      room: stream.roomName,
      roomJoin: true,
      canPublish: args.role === "broadcaster",
      canSubscribe: true,
      canPublishData: true,
    });

    const token: string = await at.toJwt();

    // Record participant
    await ctx.runMutation(internal.liveStreams.insertParticipant, {
      streamId: args.streamId,
      userId,
      role: args.role,
    });

    return { token, roomName: stream.roomName };
  },
});