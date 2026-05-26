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
        return await ctx.db.query("subcontractors").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    },
});

export const get = query({
    args: { id: v.id("subcontractors") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        trade: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        licenseNumber: v.optional(v.string()),
        insuranceExpiry: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("subcontractors", { ...args, userId });
    },
});

export const update = mutation({
    args: {
        id: v.id("subcontractors"),
        name: v.optional(v.string()),
        trade: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        licenseNumber: v.optional(v.string()),
        insuranceExpiry: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("subcontractors") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
