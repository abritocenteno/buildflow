import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function assertAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");
    return identity;
}

const NAME_CHANGE_LIMIT = 1;

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db.query("settings").withIndex("by_user", (q: any) => q.eq("userId", identity.tokenIdentifier)).unique();
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
            const nameChanged = args.companyName !== existing.companyName;
            const currentCount = existing.companyNameChangeCount ?? 0;
            if (nameChanged && currentCount >= NAME_CHANGE_LIMIT) {
                throw new Error("Company name change limit reached");
            }
            await ctx.db.patch(existing._id, {
                ...args,
                companyNameChangeCount: nameChanged ? currentCount + 1 : currentCount,
            });
        } else {
            await ctx.db.insert("settings", { ...args, userId, companyNameChangeCount: 0 });
        }
    },
});

export const requestNameChange = mutation({
    args: { requestedName: v.string() },
    handler: async (ctx, { requestedName }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        const userId = identity.tokenIdentifier;
        const settings = await ctx.db.query("settings").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
        if (!settings) throw new Error("Settings not found");

        // cancel any existing pending request first
        const existing = await ctx.db.query("nameChangeRequests")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .collect();
        for (const r of existing.filter((r: any) => r.status === "pending")) {
            await ctx.db.patch(r._id, { status: "cancelled" });
        }

        await ctx.db.insert("nameChangeRequests", {
            userId,
            userEmail: identity.email ?? "",
            currentName: settings.companyName,
            requestedName,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const isAdmin = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;
        return identity.email === process.env.ADMIN_EMAIL;
    },
});

export const getCompanyStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.email !== process.env.ADMIN_EMAIL) return null;

        const [projects, invoices, clients] = await Promise.all([
            ctx.db.query("projects").collect(),
            ctx.db.query("invoices").collect(),
            ctx.db.query("clients").collect(),
        ]);

        const stats: Record<string, { projects: number; invoices: number; clients: number }> = {};
        const bump = (userId: string, key: "projects" | "invoices" | "clients") => {
            if (!stats[userId]) stats[userId] = { projects: 0, invoices: 0, clients: 0 };
            stats[userId][key]++;
        };
        for (const r of projects) bump(r.userId, "projects");
        for (const r of invoices) bump(r.userId, "invoices");
        for (const r of clients) bump(r.userId, "clients");
        return stats;
    },
});

// Admin-only queries and mutations

export const getAllSettings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.email !== process.env.ADMIN_EMAIL) return null;
        return await ctx.db.query("settings").collect();
    },
});

export const getPendingNameChangeRequests = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.email !== process.env.ADMIN_EMAIL) return null;
        return await ctx.db.query("nameChangeRequests")
            .withIndex("by_status", (q: any) => q.eq("status", "pending"))
            .collect();
    },
});

export const resolveNameChangeRequest = mutation({
    args: {
        requestId: v.id("nameChangeRequests"),
        approve: v.boolean(),
    },
    handler: async (ctx, { requestId, approve }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

        const request = await ctx.db.get(requestId);
        if (!request || request.status !== "pending") throw new Error("Request not found or already resolved");

        await ctx.db.patch(requestId, {
            status: approve ? "approved" : "rejected",
            resolvedAt: Date.now(),
            resolvedBy: identity.email,
        });

        if (approve) {
            const settings = await ctx.db.query("settings")
                .withIndex("by_user", (q: any) => q.eq("userId", request.userId))
                .unique();
            if (settings) {
                await ctx.db.patch(settings._id, {
                    companyName: request.requestedName,
                    companyNameChangeCount: 0, // reset so they get one free change again
                });
            }
        }
    },
});

export const getMyNameChangeRequest = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const requests = await ctx.db.query("nameChangeRequests")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .collect();
        return requests.find((r: any) => r.status === "pending") ?? null;
    },
});

export const getAllowedEmails = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.email !== process.env.ADMIN_EMAIL) return null;
        return await ctx.db.query("allowedEmails").collect();
    },
});

export const addAllowedEmail = mutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const identity = await assertAdmin(ctx);
        const normalised = email.trim().toLowerCase();
        const existing = await ctx.db.query("allowedEmails")
            .withIndex("by_email", (q: any) => q.eq("email", normalised))
            .unique();
        if (existing) return; // already there
        await ctx.db.insert("allowedEmails", {
            email: normalised,
            addedAt: Date.now(),
            addedBy: identity.email ?? "",
        });
    },
});

export const removeAllowedEmail = mutation({
    args: { id: v.id("allowedEmails") },
    handler: async (ctx, { id }) => {
        await assertAdmin(ctx);
        await ctx.db.delete(id);
    },
});
