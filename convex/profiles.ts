// convex/profiles.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Normalize usernames (lowercase, trimmed) */
function normalize(u: string) {
  return u.trim().toLowerCase();
}

/** Regex: 3–20 chars, a–z 0–9 and underscores */
const USERNAME_OK = /^[a-z0-9_]{3,20}$/;

/** Check if a username is available */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const u = normalize(username);
    if (!USERNAME_OK.test(u)) return { ok: false, reason: "invalid" };

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", u))
      .unique();

    // ok = true if nothing found
    return { ok: !existing, reason: existing ? "taken" : undefined };
  },
});

/** Create/update my profile with a unique username */
export const setMyUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const u = normalize(username);
    if (!USERNAME_OK.test(u)) throw new Error("Invalid username");

    // Is the username used by someone else?
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", u))
      .unique();

    if (taken && taken.userId !== userId) {
      throw new Error("Username already in use");
    }

    // Upsert by userId
    const mine = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (mine) {
      await ctx.db.patch(mine._id, { username: u });
      return mine._id;
    }

    return await ctx.db.insert("profiles", {
      userId,
      username: u,
      createdAt: Date.now(),
    });
  },
});

/** Minimal current-user profile (safe to use in nav) */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const mine = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    return mine ? { username: mine.username } : null;
  },
});

/** Full current-user profile */
export const getMyProfile = query({
  args: {}, // <- REQUIRED so Convex registers this function
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

/** (Optional) Lookup by username */
export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const u = normalize(username);
    if (!USERNAME_OK.test(u)) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", u))
      .unique();
  },
});
