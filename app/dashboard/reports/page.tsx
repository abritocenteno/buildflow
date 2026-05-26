"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Clock, FolderKanban, ShoppingBag, AlertCircle, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    planning: "bg-zinc-100 text-zinc-600",
    permitting: "bg-blue-100 text-blue-700",
    in_progress: "bg-orange-100 text-orange-700",
    punch_list: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    closed: "bg-zinc-200 text-zinc-500",
};

function KpiCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
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
    const profitability = useQuery(api.reports.projectProfitability) ?? [];
    const clientRevenue = useQuery(api.reports.clientRevenue) ?? [];

    if (!reports) {
        return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" /></div>;
    }

    const maxRevenue = Math.max(...reports.monthlyRevenue.map((m: any) => m.revenue), 1);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Financial and project analytics</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard label="Total Revenue" value={formatCurrency(reports.totalRevenue)} sub="Paid invoices" icon={TrendingUp} color="bg-emerald-500" />
                <KpiCard label="Pending Revenue" value={formatCurrency(reports.pendingRevenue)} sub="Awaiting payment" icon={Clock} color="bg-amber-500" />
                <KpiCard label="Overdue" value={formatCurrency(reports.overdueRevenue)} sub="Requires action" icon={AlertCircle} color="bg-red-500" />
                <KpiCard label="Total Orders" value={formatCurrency(reports.totalOrders)} sub="Supplier purchases" icon={ShoppingBag} color="bg-blue-500" />
            </div>

            {/* Project counts */}
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

            {/* Monthly revenue chart */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-bold text-zinc-900 mb-6">Monthly Revenue (last 12 months)</h2>
                <div className="flex items-end gap-1 h-48">
                    {reports.monthlyRevenue.map((m: any, i: number) => {
                        const barHeight = Math.max((m.revenue / maxRevenue) * 192, m.revenue > 0 ? 6 : 2);
                        return (
                            <div key={i} className="flex-1 flex items-end justify-center group cursor-default"
                                title={`${m.month}: ${formatCurrency(m.revenue)}`}>
                                <div className="w-full bg-orange-400 group-hover:bg-orange-500 rounded-t-md transition-colors"
                                    style={{ height: `${barHeight}px` }} />
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-1 mt-2">
                    {reports.monthlyRevenue.map((m: any, i: number) => (
                        <div key={i} className="flex-1 text-center">
                            <span className="text-[9px] text-zinc-400">{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project profitability */}
            {profitability.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-bold text-zinc-900">Project Profitability</h2>
                        <FolderKanban size={16} className="text-zinc-400" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Project</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Budget</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoiced</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Collected</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {profitability.map((p: any) => {
                                    const pct = p.invoiced > 0 ? Math.round((p.paid / p.invoiced) * 100) : 0;
                                    return (
                                        <tr key={p._id} className="hover:bg-zinc-50/50 transition-colors group">
                                            <td className="px-6 py-3">
                                                <Link href={`/dashboard/projects/${p._id}`} className="font-semibold text-zinc-900 group-hover:text-orange-500 transition-colors flex items-center gap-1">
                                                    {p.title}
                                                    <ChevronRight size={13} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                <p className="text-xs text-zinc-400">{p.clientName}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", STATUS_COLORS[p.status] ?? "bg-zinc-100 text-zinc-500")}>
                                                    {p.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-zinc-700 font-medium">
                                                {p.estimatedBudget > 0 ? formatCurrency(p.estimatedBudget) : <span className="text-zinc-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-zinc-700 font-medium">
                                                {p.invoiced > 0 ? formatCurrency(p.invoiced) : <span className="text-zinc-300">—</span>}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {p.invoiced > 0 && (
                                                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                            <div className={cn("h-1.5 rounded-full", pct >= 100 ? "bg-emerald-500" : pct > 50 ? "bg-orange-400" : "bg-amber-400")}
                                                                style={{ width: `${Math.min(pct, 100)}%` }} />
                                                        </div>
                                                    )}
                                                    <span className={cn("text-sm font-bold", p.paid > 0 ? "text-emerald-600" : "text-zinc-400")}>
                                                        {p.paid > 0 ? formatCurrency(p.paid) : "—"}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Client revenue */}
            {clientRevenue.length > 0 && (
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-bold text-zinc-900">Revenue by Client</h2>
                        <TrendingUp size={16} className="text-zinc-400" />
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {clientRevenue.map((c: any, i: number) => {
                            const total = c.paid + c.outstanding;
                            const maxTotal = (clientRevenue[0] as any).paid + (clientRevenue[0] as any).outstanding;
                            const barPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                            return (
                                <div key={c._id} className="flex items-center gap-4 px-6 py-4">
                                    <div className="w-5 text-xs font-bold text-zinc-300 shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
                                            <p className="text-sm font-bold text-zinc-900 shrink-0 ml-4">{formatCurrency(total)}</p>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                            <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${barPct}%` }} />
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs text-emerald-600 font-medium">{formatCurrency(c.paid)} paid</span>
                                            {c.outstanding > 0 && <span className="text-xs text-amber-600">{formatCurrency(c.outstanding)} outstanding</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
