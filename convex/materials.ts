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
        return await ctx.db.query("materials").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    },
});

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("materials").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        projectId: v.optional(v.id("projects")),
        name: v.string(),
        description: v.optional(v.string()),
        sku: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.number(),
        unit: v.optional(v.string()),
        unitCost: v.optional(v.number()),
        reorderThreshold: v.optional(v.number()),
        supplier: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("materials", { ...args, userId });
    },
});

export const update = mutation({
    args: {
        id: v.id("materials"),
        projectId: v.optional(v.id("projects")),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        sku: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.optional(v.number()),
        unit: v.optional(v.string()),
        unitCost: v.optional(v.number()),
        reorderThreshold: v.optional(v.number()),
        supplier: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("materials") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
