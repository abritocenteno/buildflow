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
        const entries = await ctx.db.query("timeEntries").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(entries.map(async (e: any) => {
            const project = await ctx.db.get(e.projectId);
            return { ...e, project };
        }));
    },
});

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("timeEntries").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        date: v.number(),
        durationMinutes: v.number(),
        description: v.optional(v.string()),
        billable: v.boolean(),
        hourlyRate: v.optional(v.number()),
        workerName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        return await ctx.db.insert("timeEntries", { ...args, userId, invoiced: false });
    },
});

export const update = mutation({
    args: {
        id: v.id("timeEntries"),
        date: v.optional(v.number()),
        durationMinutes: v.optional(v.number()),
        description: v.optional(v.string()),
        billable: v.optional(v.boolean()),
        hourlyRate: v.optional(v.number()),
        workerName: v.optional(v.string()),
        invoiced: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const listUnbilledByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const entries = await ctx.db.query("timeEntries").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
        return entries.filter((e: any) => e.billable && !e.invoiced);
    },
});

export const importToInvoice = mutation({
    args: {
        invoiceId: v.id("invoices"),
        entryIds: v.array(v.id("timeEntries")),
    },
    handler: async (ctx, { invoiceId, entryIds }) => {
        const invoice = await ctx.db.get(invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        const entries = await Promise.all(entryIds.map((id) => ctx.db.get(id)));
        const newItems = entries
            .filter(Boolean)
            .map((e: any) => {
                const hours = Math.round((e.durationMinutes / 60) * 100) / 100;
                return {
                    name: e.workerName ? `Labor — ${e.workerName}` : "Labor",
                    description: e.description || "Billable time",
                    remark: new Date(e.date).toLocaleDateString("en-IE"),
                    amount: Math.max(1, Math.round(hours)),
                    unitPrice: e.hourlyRate ?? 0,
                };
            });

        const existing = (invoice as any).items ?? [];
        await ctx.db.patch(invoiceId, { items: [...existing, ...newItems] });
        await Promise.all(entryIds.map((id) => ctx.db.patch(id, { invoiced: true })));
    },
});

export const remove = mutation({
    args: { id: v.id("timeEntries") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
