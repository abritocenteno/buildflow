import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const get = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        return await ctx.db.query("settings").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
    },
});

export const upsert = mutation({
    args: {
        companyName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        contactEmail: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        registrationNumber: v.optional(v.string()),
        vatNumber: v.optional(v.string()),
        defaultTaxRate: v.optional(v.number()),
        bankAccounts: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        language: v.optional(v.string()),
        currency: v.optional(v.string()),
        emailSenderName: v.optional(v.string()),
        invoiceEmailSubject: v.optional(v.string()),
        invoiceEmailIntro: v.optional(v.string()),
        quoteEmailSubject: v.optional(v.string()),
        quoteEmailIntro: v.optional(v.string()),
        overdueEmailSubject: v.optional(v.string()),
        overdueEmailIntro: v.optional(v.string()),
        projectReadyEmailSubject: v.optional(v.string()),
        projectReadyEmailIntro: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.query("settings").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("settings", { ...args, userId });
        }
    },
});
