import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            if (
                user.name !== identity.name ||
                user.email !== identity.email ||
                user.image !== identity.pictureUrl
            ) {
                await ctx.db.patch(user._id, {
                    name: identity.name,
                    email: identity.email,
                    image: identity.pictureUrl,
                });
            }
            return user._id;
        }

        // Access control is currently handled by Clerk's allowlist.
        // When Stripe is set up, check the allowedEmails table here instead.

        return await ctx.db.insert("users", {
            name: identity.name,
            email: identity.email,
            image: identity.pictureUrl,
            tokenIdentifier: identity.tokenIdentifier,
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();
    },
});
