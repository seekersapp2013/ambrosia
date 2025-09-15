import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { vEmailId } from "@convex-dev/resend";

export default defineSchema({
  ...authTables,

  emails: defineTable({
    userId: v.id("users"),
    emailId: vEmailId,
    notificationId: v.optional(v.id("notifications")), // Link to notification if this is a notification email
    batchId: v.optional(v.string()), // For batch notification emails
  }).index("userId", ["userId"])
    .index("emailId", ["emailId"])
    .index("notificationId", ["notificationId"]),

  // ✅ Existing wallet table
  wallets: defineTable({
    userId: v.id("users"),      // Link to authenticated user
    address: v.string(),
    publicKey: v.string(),
    privateKey: v.string(),     // You may want to encrypt this in the future
    mnemonic: v.string(),       // Recovery phrase
    createdAt: v.number(),
  }).index("userId", ["userId"]),

  // ✅ Extended user profiles
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()), // storage id
    phoneNumber: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    seedPhrase: v.optional(v.string()),
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
    sellerAddress: v.optional(v.string()), // wallet address for payments
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
    sellerAddress: v.optional(v.string()), // wallet address for payments
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
    contentType: v.string(), // 'article' | 'reel' | 'liveStream'
    contentId: v.union(v.id("articles"), v.id("reels"), v.id("liveStreams")),
    token: v.string(),
    amount: v.number(),
    network: v.string(), // e.g., 'celo'
    txHash: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_content", ["contentType", "contentId"]).index("by_payer", ["payerId"]).index("by_token", ["token"]).index("by_user_content", ["payerId", "contentType", "contentId"]),

  // ✅ Enhanced Notifications table
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),

    // Enhanced fields
    category: v.optional(v.string()), // 'engagement' | 'social' | 'content' | 'system'
    priority: v.optional(v.string()), // 'low' | 'medium' | 'high'

    // Related content
    relatedContentType: v.optional(v.string()), // 'article' | 'reel' | 'comment' | 'user'
    relatedContentId: v.optional(v.string()),
    relatedId: v.optional(v.string()), // Legacy field for backward compatibility

    // Actor information (who triggered the notification)
    actorUserId: v.optional(v.id("users")),

    // Batching
    batchId: v.optional(v.union(v.string(), v.id("notificationBatches"))),
    batchCount: v.optional(v.number()),
    batchedInto: v.optional(v.id("notifications")), // If this notification was batched into a summary notification
    hiddenFromFeed: v.optional(v.boolean()), // Hide individual notifications that are part of a batch

    // Delivery tracking
    deliveryChannels: v.optional(v.array(v.string())),
    deliveryStatus: v.optional(v.object({
      in_app: v.optional(v.object({
        delivered: v.boolean(),
        deliveredAt: v.optional(v.number()),
        viewed: v.optional(v.boolean()),
        viewedAt: v.optional(v.number()),
        clicked: v.optional(v.boolean()),
        clickedAt: v.optional(v.number()),
        dismissed: v.optional(v.boolean()),
        dismissedAt: v.optional(v.number()),
        error: v.optional(v.string()),
        errorAt: v.optional(v.number()),
        retryCount: v.optional(v.number())
      })),
      email: v.optional(v.object({
        delivered: v.boolean(),
        deliveredAt: v.optional(v.number()),
        messageId: v.optional(v.string()),
        opened: v.optional(v.boolean()),
        openedAt: v.optional(v.number()),
        clicked: v.optional(v.boolean()),
        clickedAt: v.optional(v.number()),
        sentAt: v.optional(v.number()),
        error: v.optional(v.string()),
        errorAt: v.optional(v.number()),
        retryCount: v.optional(v.number()),
        batchId: v.optional(v.string())
      })),
      whatsapp: v.optional(v.object({
        delivered: v.boolean(),
        deliveredAt: v.optional(v.number()),
        messageId: v.optional(v.string()),
        error: v.optional(v.string()),
        errorAt: v.optional(v.number()),
        retryCount: v.optional(v.number())
      })),
      sms: v.optional(v.object({
        delivered: v.boolean(),
        deliveredAt: v.optional(v.number()),
        messageId: v.optional(v.string()),
        error: v.optional(v.string()),
        errorAt: v.optional(v.number()),
        retryCount: v.optional(v.number())
      }))
    })),

    createdAt: v.number(),
    scheduledFor: v.optional(v.number()), // For delayed delivery
    expiresAt: v.optional(v.number())
  }).index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_batch", ["batchId"])
    .index("by_actor", ["actorUserId"])
    .index("by_created", ["createdAt"]),

  // ✅ User notification settings
  notificationSettings: defineTable({
    userId: v.id("users"),
    notificationType: v.string(),
    enabled: v.boolean(),
    channels: v.object({
      in_app: v.boolean(),
      email: v.boolean(),
      whatsapp: v.boolean(),
      sms: v.boolean(),
      push: v.boolean()
    }),
    quietHours: v.optional(v.object({
      enabled: v.boolean(),
      startTime: v.string(), // "22:00"
      endTime: v.string(), // "08:00"
      timezone: v.string()
    })),
    batchingPreference: v.string(), // 'immediate' | 'batched' | 'digest'
    updatedAt: v.number()
  }).index("by_user", ["userId"])
    .index("by_user_type", ["userId", "notificationType"]),

  // ✅ Notification batches for grouping similar notifications
  notificationBatches: defineTable({
    userId: v.id("users"),
    type: v.string(), // Notification type being batched
    notifications: v.array(v.id("notifications")), // Array of notification IDs in this batch
    batchCount: v.number(),
    category: v.string(),
    priority: v.string(),
    batchingMode: v.string(), // 'batched' | 'digest'
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    summaryNotificationId: v.optional(v.id("notifications")), // The summary notification created from this batch
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_processed", ["processed"])
    .index("by_created", ["createdAt"]),

  // ✅ User activity tracking for intelligent timing
  userActivity: defineTable({
    userId: v.id("users"),
    lastActiveAt: v.number(),
    sessionCount: v.number(),
    averageSessionDuration: v.number(), // in milliseconds
    preferredActiveHours: v.array(v.number()), // Hours of day when user is typically active (0-23)
    timezone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user", ["userId"])
    .index("by_last_active", ["lastActiveAt"]),

  // ✅ Notification events for detailed analytics tracking
  notificationEvents: defineTable({
    notificationId: v.id("notifications"),
    userId: v.id("users"),
    channel: v.string(), // 'in_app' | 'email' | 'whatsapp' | 'sms' | 'push'
    event: v.string(), // 'delivered' | 'viewed' | 'opened' | 'clicked' | 'dismissed' | 'failed'
    timestamp: v.number(),
    metadata: v.object({
      messageId: v.optional(v.string()),
      error: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      source: v.optional(v.string()), // 'notification_center' | 'email' | 'push'
      duration: v.optional(v.number()), // Time spent viewing
      clickTarget: v.optional(v.string()), // What was clicked
      batchId: v.optional(v.string())
    })
  }).index("by_notification", ["notificationId"])
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_channel", ["channel"])
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"]),

  // ✅ Live Streams table
  liveStreams: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    roomName: v.string(), // LiveKit room identifier
    status: v.string(), // 'preparing' | 'live' | 'ended' | 'error'
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    viewerCount: v.number(),
    maxViewers: v.number(),
    tags: v.array(v.string()),
    isSensitive: v.boolean(),
    isGated: v.boolean(),
    priceToken: v.optional(v.string()),
    priceAmount: v.optional(v.number()),
    sellerAddress: v.optional(v.string()),
    recordingUrl: v.optional(v.string()), // If saved as reel
    egressId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // ✅ Live Stream Participants table
  liveStreamParticipants: defineTable({
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    role: v.string(), // 'broadcaster' | 'viewer'
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    duration: v.optional(v.number()),
  }).index("by_stream", ["streamId"])
    .index("by_user", ["userId"])
    .index("by_stream_user", ["streamId", "userId"])
});
