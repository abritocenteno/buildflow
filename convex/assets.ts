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
        return await ctx.db.query("assets").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    },
});

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("assets").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        projectId: v.optional(v.id("projects")),
        name: v.string(),
        category: v.string(),
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("assets", { ...args, userId });
    },
});

export const remove = mutation({
    args: { id: v.id("assets") },
    handler: async (ctx, { id }) => {
        const asset = await ctx.db.get(id);
        if (asset) {
            await ctx.storage.delete(asset.storageId);
            await ctx.db.delete(id);
        }
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, { storageId }) => {
        return await ctx.storage.getUrl(storageId);
    },
});
