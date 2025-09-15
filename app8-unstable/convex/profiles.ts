import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if username is available
export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    return { available: !existingProfile };
  },
});

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
    username: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    seedPhrase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      console.error('createOrUpdateProfile: No authenticated user');
      throw new Error("Not authenticated");
    }

    console.log('createOrUpdateProfile called:', { userId, args });

    try {
      // Check if username is already taken by another user
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
        .first();

      console.log('Existing profile check:', { existingProfile, userId });

      if (existingProfile && existingProfile.userId !== userId) {
        console.error('Username already taken:', args.username);
        throw new Error("Username already taken");
      }

      // Check if profile exists for this user
      const userProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      console.log('User profile check:', { userProfile });

      if (userProfile) {
        // Update existing profile
        console.log('Updating existing profile:', userProfile._id);
        await ctx.db.patch(userProfile._id, {
          username: args.username.toLowerCase(),
          name: args.name,
          bio: args.bio,
          avatar: args.avatar,
          phoneNumber: args.phoneNumber,
          walletAddress: args.walletAddress,
          privateKey: args.privateKey,
          seedPhrase: args.seedPhrase,
          updatedAt: Date.now(),
        });
        console.log('Profile updated successfully');
        return userProfile._id;
      } else {
        // Create new profile
        console.log('Creating new profile for user:', userId);
        const profileData = {
          userId,
          username: args.username.toLowerCase(),
          name: args.name,
          bio: args.bio,
          avatar: args.avatar,
          phoneNumber: args.phoneNumber,
          walletAddress: args.walletAddress,
          privateKey: args.privateKey,
          seedPhrase: args.seedPhrase,
          createdAt: Date.now(),
        };
        console.log('Profile data to insert:', profileData);

        const profileId = await ctx.db.insert("profiles", profileData);
        console.log('Profile created successfully:', profileId);
        
        // Create notification for wallet creation if wallet address is provided
        if (args.walletAddress) {
          await ctx.db.insert("notifications", {
            userId,
            type: "wallet_created",
            title: "🎉 Wallet Created!",
            message: `Your crypto wallet has been successfully created. Address: ${args.walletAddress.slice(0, 6)}...${args.walletAddress.slice(-4)}`,
            isRead: false,
            category: "system",
            priority: "medium",
            relatedContentType: "wallet",
            relatedContentId: args.walletAddress,
            deliveryChannels: ["in_app"],
            deliveryStatus: {
              in_app: {
                delivered: true,
                deliveredAt: Date.now(),
                viewed: false
              }
            },
            createdAt: Date.now(),
          });
        }
        
        return profileId;
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      throw error;
    }
  },
});

// Get user profile by username
export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);

    // Get article count
    const articleCount = await ctx.db
      .query("articles")
      .withIndex("by_author", (q) => q.eq("authorId", profile.userId))
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .collect()
      .then(articles => articles.length);

    // Get reel count
    const reelCount = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", profile.userId))
      .collect()
      .then(reels => reels.length);

    // Get follow counts
    const followersCount = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", profile.userId))
      .collect()
      .then(follows => follows.length);

    const followingCount = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", profile.userId))
      .collect()
      .then(follows => follows.length);

    return {
      ...profile,
      user,
      stats: {
        articles: articleCount,
        reels: reelCount,
        followers: followersCount,
        following: followingCount,
      },
    };
  },
});

// Get current user's profile
export const getMyProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const user = await ctx.db.get(userId);

    if (!profile) {
      return {
        userId,
        user,
        username: null,
        name: user?.name,
        bio: null,
        avatar: null,
        stats: {
          articles: 0,
          reels: 0,
          followers: 0,
          following: 0,
        },
      };
    }

    // Get stats
    const articleCount = await ctx.db
      .query("articles")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .collect()
      .then(articles => articles.length);

    const reelCount = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect()
      .then(reels => reels.length);

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    const followersCount = followers.length;

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    const followingCount = following.length;

    console.log('Profile stats for user:', userId, {
      articleCount,
      reelCount,
      followersCount,
      followingCount,
      followersData: followers,
      followingData: following
    });

    return {
      ...profile,
      user,
      stats: {
        articles: articleCount,
        reels: reelCount,
        followers: followersCount,
        following: followingCount,
      },
    };
  },
});

export const getProfileForUser = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();
    },
});

// Search profiles by username
export const searchProfiles = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("username"), args.query.toLowerCase()))
      .take(20);

    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user,
        };
      })
    );

    return profilesWithUsers.filter(p => p.user);
  },
});

// Debug function to check profile creation
export const debugProfile = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    console.log('Debug profile for user:', userId);

    // Check if user exists
    const user = await ctx.db.get(userId);
    console.log('User data:', user);

    // Check if profile exists
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    console.log('Profile data:', profile);

    // Try to create a basic profile
    if (!profile) {
      console.log('Creating basic profile...');
      try {
        const userName = user?.name || 'User';
        let username = userName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // If the cleaned username is empty, use a fallback
        if (!username) {
          username = 'user';
        }

        // Ensure username is unique
        let counter = 1;
        let finalUsername = username;
        while (true) {
          const existingUsernameProfile = await ctx.db
            .query("profiles")
            .withIndex("by_username", (q) => q.eq("username", finalUsername))
            .first();

          if (!existingUsernameProfile) break;

          finalUsername = `${username}${counter}`;
          counter++;
        }

        const profileId = await ctx.db.insert("profiles", {
          userId,
          username: finalUsername,
          name: userName,
          createdAt: Date.now(),
        });
        console.log('Basic profile created:', profileId);
        return { success: true, profileId, message: 'Profile created', username: finalUsername };
      } catch (error) {
        console.error('Error creating basic profile:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } else {
      return { success: true, profile, message: 'Profile already exists' };
    }
  },
});

// Get user's articles
export const getMyArticles = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .order("desc")
      .collect();

    return articles;
  },
});

// Get user's followers
export const getMyFollowers = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();

    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", follow.followerId))
          .first();

        return {
          _id: follow._id,
          userId: follow.followerId,
          user,
          profile,
          createdAt: follow.createdAt,
        };
      })
    );

    return followers.filter(f => f.user);
  },
});

// Get users I'm following
export const getMyFollowing = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", follow.followingId))
          .first();

        return {
          _id: follow._id,
          userId: follow.followingId,
          user,
          profile,
          createdAt: follow.createdAt,
        };
      })
    );

    return following.filter(f => f.user);
  },
});

// Migration function to create profiles for existing users
export const createProfilesForExistingUsers = mutation({
  handler: async (ctx) => {
    console.log('Starting migration to create profiles for existing users...');

    // Get all users
    const users = await ctx.db.query("users").collect();
    console.log(`Found ${users.length} users`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if profile already exists
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();

      if (existingProfile) {
        skipped++;
        continue;
      }

      // Create username from name
      const userName = user.name || 'User';
      let username = userName.toLowerCase().replace(/[^a-z0-9]/g, '');

      // If the cleaned username is empty, use a fallback
      if (!username) {
        username = 'user';
      }

      // Ensure username is unique
      let counter = 1;
      let finalUsername = username;
      while (true) {
        const existingUsernameProfile = await ctx.db
          .query("profiles")
          .withIndex("by_username", (q) => q.eq("username", finalUsername))
          .first();

        if (!existingUsernameProfile) break;

        finalUsername = `${username}${counter}`;
        counter++;
      }

      try {
        await ctx.db.insert("profiles", {
          userId: user._id,
          username: finalUsername,
          name: userName,
          createdAt: Date.now(),
        });
        created++;
        console.log(`Created profile for user ${user._id}: ${finalUsername}`);
      } catch (error) {
        console.error(`Error creating profile for user ${user._id}:`, error);
      }
    }

    console.log(`Migration complete: ${created} profiles created, ${skipped} skipped`);
    return { created, skipped, total: users.length };
  },
});