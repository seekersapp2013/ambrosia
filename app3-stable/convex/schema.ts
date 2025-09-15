import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { vEmailId } from "@convex-dev/resend";

export default defineSchema({
  ...authTables,

  emails: defineTable({
    userId: v.id("users"),
    emailId: vEmailId,
  }).index("userId", ["userId"]),

  // ✅ Existing wallet table
  wallets: defineTable({
    userId: v.id("users"),      // Link to authenticated user
    address: v.string(),
    publicKey: v.string(),
    privateKey: v.string(),     // You may want to encrypt this in the future
    createdAt: v.number(),
  }).index("userId", ["userId"]),

  // ✅ Extended user profiles
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()), // storage id
    walletAddress: v.optional(v.string()),
    walletSeedEnc: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  }).index("by_username", ["username"]).index("by_wallet", ["walletAddress"]).index("by_userId", ["userId"]),

  // ✅ Articles table
  articles: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    contentHtml: v.string(),
    contentDelta: v.optional(v.any()),
    coverImage: v.optional(v.string()), // storage id
    readTimeMin: v.number(),
    tags: v.array(v.string()),
    status: v.string(), // DRAFT | PUBLISHED | ARCHIVED
    publishedAt: v.optional(v.number()),
    isSensitive: v.boolean(),
    // Gating with custom token
    isGated: v.boolean(),
    priceToken: v.optional(v.string()), // e.g., "USD"
    priceAmount: v.optional(v.number()),
    views: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  }).index("by_slug", ["slug"]).index("by_author", ["authorId"]).index("by_tag", ["tags"]).index("by_status", ["status"]).index("by_created", ["createdAt"]),

  // ✅ Reels table
  reels: defineTable({
    authorId: v.id("users"),
    video: v.string(), // storage id
    poster: v.optional(v.string()), // storage id
    durationS: v.optional(v.number()),
    caption: v.optional(v.string()),
    tags: v.array(v.string()),
    isSensitive: v.boolean(),
    // Gating with custom token
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    views: v.number(),
    createdAt: v.number()
  }).index("by_author", ["authorId"]).index("by_created", ["createdAt"]),

  // ✅ Comments table
  comments: defineTable({
    articleId: v.optional(v.id("articles")),
    reelId: v.optional(v.id("reels")),
    authorId: v.id("users"),
    parentId: v.optional(v.id("comments")),
    content: v.string(),
    createdAt: v.number()
  }).index("by_article", ["articleId"]).index("by_reel", ["reelId"]),

  // ✅ Likes table
  likes: defineTable({
    userId: v.id("users"),
    articleId: v.optional(v.id("articles")),
    reelId: v.optional(v.id("reels")),
    createdAt: v.number()
  }).index("by_user_article", ["userId", "articleId"]).index("by_user_reel", ["userId", "reelId"]),

  // ✅ Claps table (per-user clap counts per article)
  claps: defineTable({
    userId: v.id("users"),
    articleId: v.id("articles"),
    count: v.number(), // 0..100 per user per article
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  }).index("by_user_article", ["userId", "articleId"]).index("by_article", ["articleId"]),

  // ✅ Reads table (tracks if a user has opened an article)
  reads: defineTable({
    userId: v.id("users"),
    articleId: v.id("articles"),
    createdAt: v.number(),
  }).index("by_user_article", ["userId", "articleId"]).index("by_article", ["articleId"]),

  // ✅ Bookmarks table
  bookmarks: defineTable({
    userId: v.id("users"),
    articleId: v.optional(v.id("articles")),
    reelId: v.optional(v.id("reels")),
    createdAt: v.number()
  }).index("by_user", ["userId"]).index("by_user_article", ["userId", "articleId"]).index("by_user_reel", ["userId", "reelId"]),

  // ✅ Follows table
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number()
  }).index("by_follower", ["followerId"]).index("by_following", ["followingId"]),

  // ✅ Payments audit trail (on-chain tx metadata)
  payments: defineTable({
    payerId: v.id("users"),
    contentType: v.string(), // 'article' | 'reel'
    contentId: v.union(v.id("articles"), v.id("reels")),
    token: v.string(),
    amount: v.number(),
    network: v.string(), // e.g., 'celo'
    txHash: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_content", ["contentType", "contentId"]).index("by_payer", ["payerId"]).index("by_token", ["token"]).index("by_user_content", ["payerId", "contentType", "contentId"])
});
