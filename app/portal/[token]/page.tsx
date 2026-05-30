"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Building2, FileText, ClipboardList, FolderKanban } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    planning: "bg-zinc-100 text-zinc-600",
    permitting: "bg-blue-100 text-blue-700",
    in_progress: "bg-sky-100 text-sky-700",
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

export default function ClientPortalPage() {
    const { token } = useParams<{ token: string }>();
    const data = useQuery(api.portal.getByToken, { token });

    if (data === undefined) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (data === null) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Portal Not Found</h1>
                    <p className="text-sm text-zinc-500">This portal link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    const { client, projects, invoices, quotes } = data;

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                            <span className="font-black text-white text-base">B</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">Build<span className="text-sky-500">Flow</span></span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-900">{client?.name}</p>
                        <p className="text-xs text-zinc-500">Client Portal</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Welcome, {client?.name?.split(" ")[0]}</h1>
                    <p className="text-sm text-zinc-500 mt-1">Here&apos;s an overview of your projects and invoices.</p>
                </div>

                {/* Projects */}
                {projects.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                            <FolderKanban size={18} className="text-sky-500" /> Projects
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {projects.map((project: any) => (
                                <div key={project._id} className="bg-white rounded-2xl border border-zinc-200 p-5">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-semibold text-zinc-900 text-sm">{project.title}</h3>
                                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0", STATUS_COLORS[project.status] ?? "bg-zinc-100 text-zinc-500")}>
                                            {STATUS_LABELS[project.status] ?? project.status}
                                        </span>
                                    </div>
                                    {project.siteAddress && (
                                        <p className="text-xs text-zinc-500 mb-3">{project.siteAddress}</p>
                                    )}
                                    {project.progress !== undefined && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-zinc-400">Progress</span>
                                                <span className="text-xs font-medium text-zinc-600">{project.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-zinc-100 rounded-full">
                                                <div className="h-2 bg-sky-500 rounded-full" style={{ width: `${project.progress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quotes awaiting approval */}
                {quotes.filter((q: any) => q.status === "sent").length > 0 && (
                    <div className="space-y-4">
                        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                            <ClipboardList size={18} className="text-blue-500" /> Quotes Awaiting Your Approval
                        </h2>
                        <div className="space-y-3">
                            {quotes.filter((q: any) => q.status === "sent").map((quote: any) => {
                                const items = quote.items ?? [];
                                const subtotal = items.reduce((s: number, i: any) => {
                                    const line = i.quantity * i.unitPrice;
                                    const markup = i.markup ? line * (i.markup / 100) : 0;
                                    return s + line + markup;
                                }, 0);
                                const tax = quote.taxRate ? subtotal * (quote.taxRate / 100) : 0;
                                const total = subtotal + tax;
                                return (
                                    <div key={quote._id} className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-zinc-900 font-mono">{quote.quoteNumber}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">Expires {quote.expiryDate ? formatDate(quote.expiryDate) : "—"}</p>
                                            </div>
                                            <p className="text-lg font-bold text-blue-700">{formatCurrency(total)}</p>
                                        </div>
                                        {quote.notes && <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{quote.notes}</p>}
                                        <p className="text-xs text-blue-600 mt-3 font-medium">Please contact us to approve or discuss this quote.</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Invoices */}
                {invoices.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                            <FileText size={18} className="text-zinc-500" /> Invoices
                        </h2>
                        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                            {invoices.map((inv: any) => (
                                <div key={inv._id} className="flex items-center justify-between px-5 py-4">
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 font-mono">{inv.invoiceNumber}</p>
                                        <p className="text-xs text-zinc-500">{formatDate(inv.date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-zinc-900">{formatCurrency(inv.amount)}</p>
                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
