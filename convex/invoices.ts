import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

async function nextInvoiceNumber(ctx: any, userId: string) {
    const invoices = await ctx.db.query("invoices").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    const num = invoices.length + 1;
    return `INV-${String(num).padStart(4, "0")}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const invoices = await ctx.db.query("invoices").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(invoices.map(async (inv: any) => {
            const client = await ctx.db.get(inv.clientId);
            const project = inv.projectId ? await ctx.db.get(inv.projectId) : null;
            return { ...inv, client, project };
        }));
    },
});

export const get = query({
    args: { id: v.id("invoices") },
    handler: async (ctx, { id }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) return null;
        const client = await ctx.db.get(invoice.clientId);
        const project = invoice.projectId ? await ctx.db.get(invoice.projectId) : null;
        return { ...invoice, client, project };
    },
});

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("invoices").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        clientId: v.id("clients"),
        projectId: v.optional(v.id("projects")),
        quoteId: v.optional(v.id("quotes")),
        date: v.number(),
        dueDate: v.optional(v.number()),
        amount: v.number(),
        invoiceType: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
            fromOrderId: v.optional(v.id("orders")),
        }))),
        credits: v.optional(v.array(v.object({
            description: v.string(),
            amount: v.number(),
        }))),
        retainagePercent: v.optional(v.number()),
        retainageAmount: v.optional(v.number()),
        taxRate: v.optional(v.number()),
        orderIds: v.optional(v.array(v.id("orders"))),
        invoiceNumber: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const { invoiceNumber: customNumber, ...rest } = args;
        const invoiceNumber = customNumber?.trim() || await nextInvoiceNumber(ctx, userId);
        return await ctx.db.insert("invoices", { ...rest, userId, invoiceNumber, status: "pending" });
    },
});

export const update = mutation({
    args: {
        id: v.id("invoices"),
        date: v.optional(v.number()),
        dueDate: v.optional(v.number()),
        amount: v.optional(v.number()),
        status: v.optional(v.string()),
        invoiceType: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
            fromOrderId: v.optional(v.id("orders")),
        }))),
        credits: v.optional(v.array(v.object({
            description: v.string(),
            amount: v.number(),
        }))),
        retainagePercent: v.optional(v.number()),
        retainageAmount: v.optional(v.number()),
        retainageReleased: v.optional(v.boolean()),
        taxRate: v.optional(v.number()),
        paidAt: v.optional(v.number()),
        invoiceStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const markPaid = mutation({
    args: { id: v.id("invoices"), paymentMethod: v.optional(v.string()) },
    handler: async (ctx, { id, paymentMethod }) => {
        await ctx.db.patch(id, { status: "paid", paidAt: Date.now(), paymentMethod });
    },
});

export const markOverdue = mutation({
    args: { id: v.id("invoices") },
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, { status: "overdue" });
    },
});

export const remove = mutation({
    args: { id: v.id("invoices") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
