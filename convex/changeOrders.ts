import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

async function nextCONumber(ctx: any, userId: string, projectId: string) {
    const cos = await ctx.db.query("changeOrders").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    const num = cos.length + 1;
    return `CO-${String(num).padStart(3, "0")}`;
}

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db.query("changeOrders").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect();
    },
});

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        description: v.string(),
        amount: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const coNumber = await nextCONumber(ctx, userId, args.projectId);
        return await ctx.db.insert("changeOrders", { ...args, userId, coNumber, status: "draft" });
    },
});

export const update = mutation({
    args: {
        id: v.id("changeOrders"),
        description: v.optional(v.string()),
        amount: v.optional(v.number()),
        status: v.optional(v.string()),
        submittedAt: v.optional(v.number()),
        approvedAt: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...fields }) => {
        await ctx.db.patch(id, fields);
        // If approved, update project budget
        if (fields.status === "approved") {
            const co = await ctx.db.get(id);
            if (co) {
                const project = await ctx.db.get(co.projectId);
                if (project) {
                    const currentBudget = project.estimatedBudget ?? 0;
                    await ctx.db.patch(co.projectId, { estimatedBudget: currentBudget + co.amount });
                }
            }
        }
    },
});

export const remove = mutation({
    args: { id: v.id("changeOrders") },
    handler: async (ctx, { id }) => {
        await ctx.db.delete(id);
    },
});
