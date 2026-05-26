"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
    FolderKanban,
    FileText,
    ClipboardList,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Building2,
    Clock,
} from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, color }: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
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

const STATUS_COLORS: Record<string, string> = {
    planning: "bg-zinc-100 text-zinc-600",
    permitting: "bg-blue-100 text-blue-700",
    in_progress: "bg-orange-100 text-orange-700",
    punch_list: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    closed: "bg-zinc-200 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
    planning: "Planning",
    permitting: "Permitting",
    in_progress: "In Progress",
    punch_list: "Punch List",
    completed: "Completed",
    closed: "Closed",
};

export default function DashboardPage() {
    const reports = useQuery(api.reports.overview);
    const projects = useQuery(api.projects.list) ?? [];
    const invoices = useQuery(api.invoices.list) ?? [];

    const activeProjects = projects.filter((p) => !["completed", "closed"].includes(p.status)).slice(0, 5);
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").slice(0, 5);

    if (!reports) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-1">Overview of your construction business</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(reports.totalRevenue)}
                    sub="Paid invoices"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    label="Pending Revenue"
                    value={formatCurrency(reports.pendingRevenue)}
                    sub={`+ ${formatCurrency(reports.overdueRevenue)} overdue`}
                    icon={Clock}
                    color="bg-amber-500"
                />
                <StatCard
                    label="Active Projects"
                    value={String(reports.activeProjects)}
                    sub={`${reports.completedProjects} completed`}
                    icon={FolderKanban}
                    color="bg-orange-500"
                />
                <StatCard
                    label="Open Quotes"
                    value={String(reports.pendingQuotes)}
                    sub={`${reports.approvedQuotes} approved`}
                    icon={ClipboardList}
                    color="bg-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Projects */}
                <div className="bg-white rounded-2xl border border-zinc-200">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-semibold text-zinc-900">Active Projects</h2>
                        <Link href="/dashboard/projects" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {activeProjects.length === 0 && (
                            <div className="px-6 py-8 text-center text-sm text-zinc-400">
                                No active projects yet
                            </div>
                        )}
                        {activeProjects.map((project: any) => (
                            <Link
                                key={project._id}
                                href={`/dashboard/projects/${project._id}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Building2 size={18} className="text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900 truncate">{project.title}</p>
                                    <p className="text-xs text-zinc-500 truncate">{project.client?.name} · {project.siteAddress}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                                        {STATUS_LABELS[project.status] ?? project.status}
                                    </span>
                                    {project.progress !== undefined && (
                                        <span className="text-xs text-zinc-400">{project.progress}%</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Overdue Invoices */}
                <div className="bg-white rounded-2xl border border-zinc-200">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-semibold text-zinc-900">Overdue Invoices</h2>
                        <Link href="/dashboard/invoices" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {overdueInvoices.length === 0 && (
                            <div className="px-6 py-8 text-center text-sm text-zinc-400">
                                No overdue invoices
                            </div>
                        )}
                        {overdueInvoices.map((invoice: any) => (
                            <Link
                                key={invoice._id}
                                href={`/dashboard/invoices/${invoice._id}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={18} className="text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900">{invoice.invoiceNumber}</p>
                                    <p className="text-xs text-zinc-500">{invoice.client?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-red-600">{formatCurrency(invoice.amount)}</p>
                                    {invoice.dueDate && (
                                        <p className="text-xs text-zinc-400">Due {formatDate(invoice.dueDate)}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">Monthly Revenue</h2>
                <div className="flex items-end gap-1 h-32">
                    {reports.monthlyRevenue.map((m: any, i: number) => {
                        const max = Math.max(...reports.monthlyRevenue.map((x: any) => x.revenue), 1);
                        const height = Math.max((m.revenue / max) * 128, m.revenue > 0 ? 4 : 2);
                        return (
                            <div key={i} className="flex-1 flex items-end justify-center group cursor-default"
                                title={`${m.month}: ${formatCurrency(m.revenue)}`}>
                                <div className="w-full bg-orange-400 group-hover:bg-orange-500 rounded-t-md transition-colors"
                                    style={{ height: `${height}px` }} />
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
        </div>
    );
}
