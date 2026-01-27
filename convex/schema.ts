import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  emailLogs: defineTable({
    messageId: v.string(),
    to: v.string(),
    subject: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    provider: v.string(), // "brevo", "notificationapi", etc.
    timestamp: v.string(), // ISO 8601 format
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"]),

  apiKeys: defineTable({
    name: v.string(),
    key: v.string(),
    isActive: v.boolean(),
    createdAt: v.string(), // ISO 8601 format
    lastUsed: v.optional(v.string()), // ISO 8601 format
    usageCount: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_active", ["isActive"]),
});
