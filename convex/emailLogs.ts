import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getEmailLogs = query({
  args: {
    limit: v.number(),
    offset: v.number(),
  },
  async handler(ctx, args) {
    const allLogs = await ctx.db
      .query("emailLogs")
      .order("desc")
      .collect();

    const logs = allLogs.slice(args.offset, args.offset + args.limit);
    return logs;
  },
});

export const getEmailLogCount = query({
  async handler(ctx) {
    const logs = await ctx.db.query("emailLogs").collect();
    return logs.length;
  },
});

export const createEmailLog = mutation({
  args: {
    messageId: v.string(),
    to: v.string(),
    subject: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    provider: v.string(),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  async handler(ctx, args) {
    const id = await ctx.db.insert("emailLogs", {
      ...args,
      timestamp: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteEmailLog = mutation({
  args: {
    id: v.id("emailLogs"),
  },
  async handler(ctx, args) {
    await ctx.db.delete(args.id);
    return true;
  },
});

export const getEmailLogsByStatus = query({
  args: {
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    hours: v.number(),
  },
  async handler(ctx, args) {
    const cutoffTime = new Date(Date.now() - args.hours * 60 * 60 * 1000).toISOString();
    const allLogs = await ctx.db.query("emailLogs").collect();
    const filtered = allLogs.filter(
      (log) => log.status === args.status && log.timestamp >= cutoffTime
    );
    return filtered;
  },
});
