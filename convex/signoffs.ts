import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

function makeToken() {
    return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export const create = mutation({
    args: {
        projectId: v.id("projects"),
        clientEmail: v.string(),
        clientName: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const token = makeToken();
        const id = await ctx.db.insert("signoffs", {
            projectId: args.projectId,
            userId,
            token,
            status: "pending",
            clientEmail: args.clientEmail,
            clientName: args.clientName,
            sentAt: Date.now(),
        });
        return { id, token };
    },
});

// Public — no auth required, token is the key
export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        const signoff = await ctx.db
            .query("signoffs")
            .withIndex("by_token", (q) => q.eq("token", token))
            .unique();
        if (!signoff) return null;
        const project = await ctx.db.get(signoff.projectId);
        if (!project) return null;
        const client = await ctx.db.get(project.clientId);
        return { signoff, project, client };
    },
});

export const listByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        return await ctx.db
            .query("signoffs")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .order("desc")
            .collect();
    },
});

// Public — token acts as auth
export const complete = mutation({
    args: {
        token: v.string(),
        supervisorName: v.string(),
        workDescription: v.optional(v.string()),
        checkIn: v.optional(v.string()),
        checkOut: v.optional(v.string()),
        signatureData: v.string(),
        photoIds: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const signoff = await ctx.db
            .query("signoffs")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();
        if (!signoff) throw new Error("Sign-off not found");
        if (signoff.status === "completed") throw new Error("This sign-off has already been completed");
        await ctx.db.patch(signoff._id, {
            status: "completed",
            supervisorName: args.supervisorName,
            workDescription: args.workDescription,
            checkIn: args.checkIn,
            checkOut: args.checkOut,
            signatureData: args.signatureData,
            photoIds: args.photoIds,
            completedAt: Date.now(),
        });
        return { success: true };
    },
});
