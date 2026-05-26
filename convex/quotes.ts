import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

async function nextQuoteNumber(ctx: any, userId: string) {
    const quotes = await ctx.db.query("quotes").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    const num = quotes.length + 1;
    return `QT-${String(num).padStart(4, "0")}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const quotes = await ctx.db.query("quotes").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(quotes.map(async (q: any) => {
            const client = await ctx.db.get(q.clientId);
            return { ...q, client };
        }));
    },
});

export const get = query({
    args: { id: v.id("quotes") },
    handler: async (ctx, { id }) => {
        const quote = await ctx.db.get(id);
        if (!quote) return null;
        const client = await ctx.db.get(quote.clientId);
        return { ...quote, client };
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        date: v.number(),
        expiryDate: v.optional(v.number()),
        items: v.optional(v.array(v.object({
            category: v.string(),
            description: v.string(),
            quantity: v.number(),
            unitPrice: v.number(),
            markup: v.optional(v.number()),
        }))),
        taxRate: v.optional(v.number()),
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const quoteNumber = await nextQuoteNumber(ctx, userId);
        return await ctx.db.insert("quotes", { ...args, userId, quoteNumber, status: "draft" });
    },
});

export const update = mutation({
    args: {
        id: v.id("quotes"),
        clientId: v.optional(v.id("clients")),
        date: v.optional(v.number()),
        expiryDate: v.optional(v.number()),
        status: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            category: v.string(),
            description: v.string(),
            quantity: v.number(),
            unitPrice: v.number(),
            markup: v.optional(v.number()),
        }))),
        taxRate: v.optional(v.number()),
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
        sentAt: v.optional(v.number()),
        approvedAt: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const convertToProject = mutation({
    args: {
        id: v.id("quotes"),
        title: v.string(),
        siteAddress: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, { id, title, siteAddress, startDate, endDate }) => {
        const userId = await getUserId(ctx);
        const quote = await ctx.db.get(id);
        if (!quote) throw new Error("Quote not found");

        // Calculate total from items
        const total = (quote.items ?? []).reduce((sum: number, item: any) => {
            const lineTotal = item.quantity * item.unitPrice;
            const markup = item.markup ? lineTotal * (item.markup / 100) : 0;
            return sum + lineTotal + markup;
        }, 0);

        const projectId = await ctx.db.insert("projects", {
            userId,
            clientId: quote.clientId,
            title,
            status: "planning",
            siteAddress,
            startDate,
            endDate,
            estimatedBudget: total,
            quoteId: id,
            progress: 0,
            actualCost: 0,
        });

        await ctx.db.patch(id, { status: "converted", convertedToProjectId: projectId });
        return projectId;
    },
});

export const remove = mutation({
    args: { id: v.id("quotes") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
