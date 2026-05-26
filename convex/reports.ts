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

export const projectProfitability = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const projects = await ctx.db.query("projects").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        return await Promise.all(
            projects.filter((p: any) => p.status !== "closed").map(async (p: any) => {
                const client = await ctx.db.get(p.clientId);
                const invoices = await ctx.db.query("invoices").withIndex("by_project", (q: any) => q.eq("projectId", p._id)).collect();
                const invoiced = invoices.reduce((s: number, i: any) => s + i.amount, 0);
                const paid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
                return { _id: p._id, title: p.title, status: p.status, estimatedBudget: p.estimatedBudget ?? 0, actualCost: p.actualCost ?? 0, invoiced, paid, clientName: (client as any)?.name ?? "—" };
            })
        );
    },
});

export const clientRevenue = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const clients = await ctx.db.query("clients").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
        const results = await Promise.all(clients.map(async (c: any) => {
            const invoices = await ctx.db.query("invoices").withIndex("by_client", (q: any) => q.eq("clientId", c._id)).collect();
            const paid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
            const outstanding = invoices.filter((i: any) => !["paid", "cancelled"].includes(i.status)).reduce((s: number, i: any) => s + i.amount, 0);
            return { _id: c._id, name: c.name, paid, outstanding };
        }));
        return results.filter((c) => c.paid + c.outstanding > 0).sort((a, b) => (b.paid + b.outstanding) - (a.paid + a.outstanding));
    },
});
