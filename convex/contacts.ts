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
        return await ctx.db.query("contacts").withIndex("by_client", (q: any) => q.eq("clientId", clientId)).collect();
    },
});

export const listBySupplier = query({
    args: { supplierId: v.id("suppliers") },
    handler: async (ctx, { supplierId }) => {
        return await ctx.db.query("contacts").withIndex("by_supplier", (q: any) => q.eq("supplierId", supplierId)).collect();
    },
});

export const listBySubcontractor = query({
    args: { subcontractorId: v.id("subcontractors") },
    handler: async (ctx, { subcontractorId }) => {
        return await ctx.db.query("contacts").withIndex("by_subcontractor", (q: any) => q.eq("subcontractorId", subcontractorId)).collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        subcontractorId: v.optional(v.id("subcontractors")),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("contacts", { ...args, userId });
    },
});

export const update = mutation({
    args: {
        id: v.id("contacts"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("contacts") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
