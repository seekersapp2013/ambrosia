import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getLiveStream = internalQuery({
  args: {
    streamId: v.id("liveStreams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.streamId);
  },
});