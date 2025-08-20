// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Auth tables (accounts, sessions, etc.)
  ...authTables,

  // User profiles
  profiles: defineTable({
    userId: v.string(),                       // identity.subject
    username: v.string(),                     // normalized in mutations
    profilePicture: v.optional(v.string()),
    createdAt: v.number(),                    // Date.now()
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),

  // Posts
  posts: defineTable({
    userId: v.string(),                       // identity.subject
    title: v.string(),
    content: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  // Likes: one per (userId, postId). Enforce uniqueness in code via the composite index.
  likes: defineTable({
    userId: v.string(),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Comments
  comments: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_userId", ["userId"]),

  // Comment likes: one per (userId, commentId)
  commentLikes: defineTable({
    userId: v.string(),
    commentId: v.id("comments"),
    createdAt: v.number(),
  })
    .index("by_commentId", ["commentId"])
    .index("by_user_comment", ["userId", "commentId"]),
});
