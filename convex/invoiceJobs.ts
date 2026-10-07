import { internalMutation } from "./_generated/server";
import { resolveTimeZone, todayDay } from "../lib/dates";

export const markOverdueInvoices = internalMutation({
    args: {},
    handler: async (ctx) => {
        const pending = await ctx.db
            .query("invoices")
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "pending"),
                    q.neq(q.field("dueDate"), undefined)
                )
            )
            .collect();

        // An invoice is overdue once its due day has passed in the owner's time zone.
        const todayByUser = new Map<string, number>();
        for (const invoice of pending) {
            let today = todayByUser.get(invoice.userId);
            if (today === undefined) {
                const settings = await ctx.db
                    .query("settings")
                    .withIndex("by_user", (q: any) => q.eq("userId", invoice.userId))
                    .unique();
                today = todayDay(resolveTimeZone(settings?.timeZone));
                todayByUser.set(invoice.userId, today);
            }
            if (invoice.dueDate !== undefined && invoice.dueDate < today) {
                await ctx.db.patch(invoice._id, { status: "overdue" });
            }
        }
    },
});
