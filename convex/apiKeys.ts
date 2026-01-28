import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Note: API key hashing happens on the server-side (in Next.js API routes)
// before being sent to Convex. This keeps Convex functions browser-compatible.

export const getApiKeys = query({
  async handler(ctx) {
    const keys = await ctx.db.query("apiKeys").collect();
    return keys;
  },
});

export const getApiKeyByKey = query({
  args: {
    key: v.string(),
  },
  async handler(ctx, args) {
    // args.key is already hashed by the caller
    const keys = await ctx.db.query("apiKeys").collect();
    return keys.find((k) => k.key === args.key) || null;
  },
});

export const getApiKeyByKeyId = query({
  args: {
    keyId: v.string(),
  },
  async handler(ctx, args) {
    const keys = await ctx.db.query("apiKeys").collect();
    return keys.find((k) => k.keyId === args.keyId) || null;
  },
});

export const createApiKey = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    keyId: v.string(),
  },
  async handler(ctx, args) {
    // args.key is already hashed by the caller
    const id = await ctx.db.insert("apiKeys", {
      keyId: args.keyId,
      name: args.name,
      key: args.key,
      isActive: true,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    });
    return id;
  },
});

export const deleteApiKey = mutation({
  args: {
    id: v.id("apiKeys"),
  },
  async handler(ctx, args) {
    await ctx.db.delete(args.id);
    return true;
  },
});

export const toggleApiKeyStatus = mutation({
  args: {
    id: v.id("apiKeys"),
  },
  async handler(ctx, args) {
    const key = await ctx.db.get(args.id);
    if (!key) {
      throw new Error("API key not found");
    }
    await ctx.db.patch(args.id, { isActive: !key.isActive });
    return true;
  },
});

export const updateApiKey = mutation({
  args: {
    id: v.id("apiKeys"),
    name: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    await ctx.db.patch(args.id, updates);
    return true;
  },
});

export const rotateApiKey = mutation({
  args: {
    id: v.id("apiKeys"),
    newHashedKey: v.string(),
  },
  async handler(ctx, args) {
    const key = await ctx.db.get(args.id);
    if (!key) {
      throw new Error("API key not found");
    }
    // Rotate the key but keep the keyId the same
    await ctx.db.patch(args.id, { 
      key: args.newHashedKey,
      lastUsed: new Date().toISOString(),
    });
    return true;
  },
});

export const incrementUsageCount = mutation({
  args: {
    key: v.string(),
  },
  async handler(ctx, args) {
    // args.key is already hashed by the caller
    const keys = await ctx.db.query("apiKeys").collect();
    const apiKey = keys.find((k) => k.key === args.key);
    if (!apiKey) {
      throw new Error("API key not found");
    }
    await ctx.db.patch(apiKey._id, {
      usageCount: apiKey.usageCount + 1,
      lastUsed: new Date().toISOString(),
    });
  },
});
