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

  // ✅ New wallet table
  wallets: defineTable({
    userId: v.id("users"),      // Link to authenticated user
    address: v.string(),
    publicKey: v.string(),
    privateKey: v.string(),     // You may want to encrypt this in the future
    createdAt: v.number(),
  }).index("userId", ["userId"]),
});
