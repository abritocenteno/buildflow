import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        return await ctx.db.query("communications").withIndex("by_client", (q: any) => q.eq("clientId", clientId)).collect();
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        type: v.string(),
        notes: v.string(),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("communications", { ...args, userId });
    },
});

export const remove = mutation({
    args: { id: v.id("communications") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
