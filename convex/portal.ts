import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const getOrCreate = mutation({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.query("clientPortals").withIndex("by_client", (q: any) => q.eq("clientId", clientId)).unique();
        if (existing) return existing.token;
        const token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
        await ctx.db.insert("clientPortals", { clientId, userId, token });
        return token;
    },
});

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        const portal = await ctx.db.query("clientPortals").withIndex("by_token", (q: any) => q.eq("token", token)).unique();
        if (!portal) return null;
        const client = await ctx.db.get(portal.clientId);
        const projects = await ctx.db.query("projects").withIndex("by_client", (q: any) => q.eq("clientId", portal.clientId)).collect();
        const invoices = await ctx.db.query("invoices").withIndex("by_client", (q: any) => q.eq("clientId", portal.clientId)).collect();
        const quotes = await ctx.db.query("quotes").withIndex("by_client", (q: any) => q.eq("clientId", portal.clientId)).filter((q: any) => q.neq(q.field("status"), "draft")).collect();
        return { client, projects, invoices, quotes };
    },
});
