import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("permits").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        type: v.string(),
        permitNumber: v.optional(v.string()),
        appliedAt: v.optional(v.number()),
        issuedAt: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("permits", { ...args, userId, status: "pending" });
    },
});

export const update = mutation({
    args: {
        id: v.id("permits"),
        type: v.optional(v.string()),
        permitNumber: v.optional(v.string()),
        status: v.optional(v.string()),
        appliedAt: v.optional(v.number()),
        issuedAt: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("permits") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
