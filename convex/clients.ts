import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        return await ctx.db.query("clients").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    },
});

export const get = query({
    args: { id: v.id("clients") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        type: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("clients", { ...args, userId });
    },
});

export const update = mutation({
    args: {
        id: v.id("clients"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        type: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("clients") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
