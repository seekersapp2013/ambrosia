import { components, internal } from "./_generated/api";
import { Resend, vEmailEvent, vEmailId } from "@convex-dev/resend";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
  onEmailEvent: internal.emails.handleEmailEvent,
});

export const sendEmail = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const me = await ctx.db.get(userId);
    if (!me) throw new Error("User not found");

    const emailId = await resend.sendEmail(ctx, {
      from: `${me.name ?? "Me"} <${me.email}>`,
      to: args.to,
      subject: args.subject,
      text: args.body,
    });
    await ctx.db.insert("emails", {
      userId,
      emailId,
    });
  },
});

export const listMyEmailsAndStatuses = query({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const emails = await ctx.db
      .query("emails")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    const emailAndStatuses = await Promise.all(
      emails.map(async (email) => {
        const emailData = await resend.get(ctx, email.emailId);
        return {
          emailId: email.emailId,
          sentAt: email._creationTime,
          to: emailData?.to ?? "<Deleted>",
          subject: emailData?.subject ?? "<Deleted>",
          status: emailData?.status,
          errorMessage: emailData?.errorMessage,
          opened: emailData?.opened,
          complained: emailData?.complained,
        };
      }),
    );

    return emailAndStatuses;
  },
});

export const handleEmailEvent = internalMutation({
  args: {
    id: vEmailId,
    event: vEmailEvent,
  },
  handler: async (_ctx, args) => {
    console.log("Email event:", args.id, args.event);
    // Probably do something with the event if you care about deliverability!
  },
});
