import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

async function nextOrderNumber(ctx: any, userId: string) {
    const orders = await ctx.db.query("orders").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
    const num = orders.length + 1;
    return `PO-${String(num).padStart(4, "0")}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const orders = await ctx.db.query("orders").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(orders.map(async (o: any) => {
            const supplier = await ctx.db.get(o.supplierId);
            const project = o.projectId ? await ctx.db.get(o.projectId) : null;
            return { ...o, supplier, project };
        }));
    },
});

export const get = query({
    args: { id: v.id("orders") },
    handler: async (ctx, { id }) => {
        const order = await ctx.db.get(id);
        if (!order) return null;
        const supplier = await ctx.db.get(order.supplierId);
        const project = order.projectId ? await ctx.db.get(order.projectId) : null;
        return { ...order, supplier, project };
    },
});

export const create = mutation({
    args: {
        supplierId: v.id("suppliers"),
        projectId: v.optional(v.id("projects")),
        date: v.number(),
        amount: v.number(),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const orderNumber = await nextOrderNumber(ctx, userId);
        return await ctx.db.insert("orders", { ...args, userId, orderNumber, status: "pending" });
    },
});

export const update = mutation({
    args: {
        id: v.id("orders"),
        supplierId: v.optional(v.id("suppliers")),
        projectId: v.optional(v.id("projects")),
        date: v.optional(v.number()),
        amount: v.optional(v.number()),
        status: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: { id: v.id("orders") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
