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
        return await ctx.db.query("events").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        start: v.number(),
        end: v.optional(v.number()),
        type: v.string(),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        projectId: v.optional(v.id("projects")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("events", { ...args, userId });
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        start: v.optional(v.number()),
        end: v.optional(v.number()),
        type: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
