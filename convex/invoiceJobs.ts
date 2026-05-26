import { internalMutation } from "./_generated/server";

export const markOverdueInvoices = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const pending = await ctx.db
            .query("invoices")
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "pending"),
                    q.neq(q.field("dueDate"), undefined)
                )
            )
            .collect();

        for (const invoice of pending) {
            if (invoice.dueDate && invoice.dueDate < now) {
                await ctx.db.patch(invoice._id, { status: "overdue" });
            }
        }
    },
});
