import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

// Virtual notifications derived from data (not stored separately)
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);

        const reads = await ctx.db.query("notificationReads").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const readKeys = new Set(reads.map((r: any) => r.key));

        const notifications: any[] = [];

        // Overdue invoices
        const invoices = await ctx.db.query("invoices").withIndex("by_user", (q: any) => q.eq("userId", userId)).filter((q: any) => q.eq(q.field("status"), "overdue")).collect();
        for (const inv of invoices) {
            const key = `overdue_invoice_${inv._id}`;
            notifications.push({
                key,
                title: "Overdue Invoice",
                message: `Invoice ${inv.invoiceNumber} is overdue.`,
                createdAt: inv._creationTime,
                read: readKeys.has(key),
            });
        }

        // New intake requests
        const intakeProjects = await ctx.db.query("projects").withIndex("by_user", (q: any) => q.eq("userId", userId)).filter((q: any) => q.eq(q.field("fromIntake"), true)).collect();
        for (const proj of intakeProjects) {
            const key = `intake_project_${proj._id}`;
            notifications.push({
                key,
                title: "New Quote Request",
                message: `New quote request received: "${proj.title}"`,
                createdAt: proj._creationTime,
                read: readKeys.has(key),
            });
        }

        return notifications.sort((a, b) => b.createdAt - a.createdAt);
    },
});

export const markRead = mutation({
    args: { key: v.string() },
    handler: async (ctx, { key }) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.query("notificationReads").withIndex("by_user_key", (q: any) => q.eq("userId", userId).eq("key", key)).unique();
        if (!existing) {
            await ctx.db.insert("notificationReads", { userId, key });
        }
    },
});
