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
        const projects = await ctx.db.query("projects").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(projects.map(async (p: any) => {
            const client = await ctx.db.get(p.clientId);
            return { ...p, client };
        }));
    },
});

export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, { id }) => {
        const project = await ctx.db.get(id);
        if (!project) return null;
        const client = await ctx.db.get(project.clientId);
        const changeOrders = await ctx.db.query("changeOrders").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        const permits = await ctx.db.query("permits").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        const invoices = await ctx.db.query("invoices").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        const timeEntries = await ctx.db.query("timeEntries").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        const materials = await ctx.db.query("materials").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        const assets = await ctx.db.query("assets").withIndex("by_project", (q: any) => q.eq("projectId", id)).collect();
        return { ...project, client, changeOrders, permits, invoices, timeEntries, materials, assets };
    },
});

export const listByStatus = query({
    args: { status: v.string() },
    handler: async (ctx, { status }) => {
        const userId = await getUserId(ctx);
        const projects = await ctx.db.query("projects").withIndex("by_status", (q: any) => q.eq("status", status)).filter((q: any) => q.eq(q.field("userId"), userId)).collect();
        return await Promise.all(projects.map(async (p: any) => {
            const client = await ctx.db.get(p.clientId);
            return { ...p, client };
        }));
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        siteAddress: v.optional(v.string()),
        siteCity: v.optional(v.string()),
        sitePostcode: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        estimatedBudget: v.optional(v.number()),
        quoteId: v.optional(v.id("quotes")),
        purchaseOrderNumber: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
        fromIntake: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("projects", { ...args, userId, progress: 0, actualCost: 0 });
    },
});

export const update = mutation({
    args: {
        id: v.id("projects"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.string()),
        siteAddress: v.optional(v.string()),
        siteCity: v.optional(v.string()),
        sitePostcode: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        estimatedBudget: v.optional(v.number()),
        actualCost: v.optional(v.number()),
        progress: v.optional(v.number()),
        subcontractorIds: v.optional(v.array(v.id("subcontractors"))),
        photoIds: v.optional(v.array(v.id("_storage"))),
        purchaseOrderNumber: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const updateStatus = mutation({
    args: { id: v.id("projects"), status: v.string() },
    handler: async (ctx, { id, status }) => {
        await ctx.db.patch(id, { status });
    },
});

export const listBySubcontractor = query({
    args: { subcontractorId: v.id("subcontractors") },
    handler: async (ctx, { subcontractorId }) => {
        const userId = await getUserId(ctx);
        const projects = await ctx.db.query("projects").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const filtered = projects.filter((p: any) => Array.isArray(p.subcontractorIds) && p.subcontractorIds.includes(subcontractorId));
        return await Promise.all(filtered.map(async (p: any) => {
            const client = await ctx.db.get(p.clientId);
            return { ...p, client };
        }));
    },
});

export const remove = mutation({
    args: { id: v.id("projects") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
