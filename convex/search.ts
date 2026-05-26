import { query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const globalSearch = query({
    args: { query: v.string() },
    handler: async (ctx, { query: q }) => {
        const userId = await getUserId(ctx);
        const lq = q.toLowerCase();

        const [projects, clients, quotes, invoices] = await Promise.all([
            ctx.db.query("projects").withIndex("by_user", (idx: any) => idx.eq("userId", userId)).collect(),
            ctx.db.query("clients").withIndex("by_user", (idx: any) => idx.eq("userId", userId)).collect(),
            ctx.db.query("quotes").withIndex("by_user", (idx: any) => idx.eq("userId", userId)).collect(),
            ctx.db.query("invoices").withIndex("by_user", (idx: any) => idx.eq("userId", userId)).collect(),
        ]);

        return {
            projects: projects.filter((p: any) =>
                p.title?.toLowerCase().includes(lq) ||
                p.siteAddress?.toLowerCase().includes(lq)
            ).slice(0, 5),
            clients: clients.filter((c: any) =>
                c.name?.toLowerCase().includes(lq) ||
                c.email?.toLowerCase().includes(lq)
            ).slice(0, 5),
            quotes: quotes.filter((q: any) =>
                q.quoteNumber?.toLowerCase().includes(lq)
            ).slice(0, 5),
            invoices: invoices.filter((i: any) =>
                i.invoiceNumber?.toLowerCase().includes(lq)
            ).slice(0, 5),
        };
    },
});
