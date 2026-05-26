import { query } from "./_generated/server";

async function getUserId(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return identity.tokenIdentifier;
}

export const overview = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);

        const invoices = await ctx.db.query("invoices").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const projects = await ctx.db.query("projects").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const quotes = await ctx.db.query("quotes").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const orders = await ctx.db.query("orders").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();

        const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + i.amount, 0);
        const pendingRevenue = invoices.filter((i: any) => i.status === "pending").reduce((sum: number, i: any) => sum + i.amount, 0);
        const overdueRevenue = invoices.filter((i: any) => i.status === "overdue").reduce((sum: number, i: any) => sum + i.amount, 0);
        const totalOrders = orders.reduce((sum: number, o: any) => sum + o.amount, 0);

        const activeProjects = projects.filter((p: any) => !["completed", "closed"].includes(p.status)).length;
        const completedProjects = projects.filter((p: any) => p.status === "completed").length;
        const pendingQuotes = quotes.filter((q: any) => ["draft", "sent"].includes(q.status)).length;
        const approvedQuotes = quotes.filter((q: any) => q.status === "approved").length;

        // Monthly revenue (last 12 months)
        const now = Date.now();
        const monthlyRevenue: { month: string; revenue: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
            const revenue = invoices
                .filter((inv: any) => inv.status === "paid" && inv.paidAt && inv.paidAt >= monthStart && inv.paidAt <= monthEnd)
                .reduce((sum: number, inv: any) => sum + inv.amount, 0);
            monthlyRevenue.push({ month: label, revenue });
        }

        return {
            totalRevenue,
            pendingRevenue,
            overdueRevenue,
            totalOrders,
            activeProjects,
            completedProjects,
            pendingQuotes,
            approvedQuotes,
            totalProjects: projects.length,
            totalInvoices: invoices.length,
            monthlyRevenue,
        };
    },
});
