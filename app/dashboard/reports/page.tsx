"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Clock, FolderKanban, ClipboardList, ShoppingBag, AlertCircle } from "lucide-react";

function KpiCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-sm text-zinc-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const reports = useQuery(api.reports.overview);

    if (!reports) {
        return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Financial and project analytics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard label="Total Revenue" value={formatCurrency(reports.totalRevenue)} sub="Paid invoices" icon={TrendingUp} color="bg-emerald-500" />
                <KpiCard label="Pending Revenue" value={formatCurrency(reports.pendingRevenue)} icon={Clock} color="bg-amber-500" />
                <KpiCard label="Overdue" value={formatCurrency(reports.overdueRevenue)} icon={AlertCircle} color="bg-red-500" />
                <KpiCard label="Total Orders" value={formatCurrency(reports.totalOrders)} sub="Supplier purchases" icon={ShoppingBag} color="bg-blue-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Active Projects", value: reports.activeProjects, color: "text-orange-600" },
                    { label: "Completed", value: reports.completedProjects, color: "text-emerald-600" },
                    { label: "Open Quotes", value: reports.pendingQuotes, color: "text-blue-600" },
                    { label: "Approved Quotes", value: reports.approvedQuotes, color: "text-purple-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-5 text-center">
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-6">Monthly Revenue (last 12 months)</h2>
                <div className="flex items-end gap-2 h-48">
                    {reports.monthlyRevenue.map((m: any, i: number) => {
                        const max = Math.max(...reports.monthlyRevenue.map((x: any) => x.revenue), 1);
                        const pct = max > 0 ? (m.revenue / max) * 100 : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full">
                                    <div className="absolute bottom-0 w-full bg-orange-500 rounded-t-md transition-all group-hover:bg-orange-600" style={{ height: `${Math.max(pct, 2)}%`, minHeight: "4px" }} />
                                </div>
                                <div
                                    className="w-full bg-orange-500 rounded-t-md hover:bg-orange-600 transition-colors cursor-default"
                                    style={{ height: `${Math.max(pct, 2) / 100 * 192}px` }}
                                    title={`${m.month}: ${formatCurrency(m.revenue)}`}
                                />
                                <span className="text-[9px] text-zinc-400 writing-mode-vertical hidden sm:block">{m.month}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-end gap-2 mt-2">
                    {reports.monthlyRevenue.map((m: any, i: number) => (
                        <div key={i} className="flex-1 text-center">
                            <span className="text-[9px] text-zinc-400">{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
